class InworldIntegration {
    constructor() {
        this.session_id = null;
        this.character_id = null;
        this.characterTokenMap = {};
        this.sessionData = null;

        Hooks.once('init', this.registerSettings.bind(this));
        Hooks.once('ready', this.onReady.bind(this));
        Hooks.on("createChatMessage", this.onCreateChatMessage.bind(this));
    }

    registerSettings() {
        game.settings.register("elevenlabs-for-foundry", "xi-api-key", {
            name: "API-Key",
            hint: "Your Elevenlabs API Key",
            scope: "client",
            config: true,
            type: String,
            onChange: value => {
                Initialize_Main()
            }
        });
        Initialize_Main();

        game.settings.register('InworldIntegration', 'workspaceId', {
            name: 'Workspace ID',
            hint: 'Enter the Workspace ID',
            scope: 'world',
            config: true,
            type: String,
            default: 'test-kpc1j',
        });

        game.settings.register('InworldIntegration', 'apiKey', {
            name: 'API Key',
            hint: 'Enter your API key',
            scope: 'world',
            config: true,
            type: String,
            default: '',
        });

        game.settings.register('InworldIntegration', 'endUserId', {
            name: 'End User ID',
            hint: 'Enter the End User ID',
            scope: 'world',
            config: true,
            type: String,
            default: '12345',
        });

        game.settings.register('InworldIntegration', 'givenName', {
            name: 'Given Name',
            hint: 'Enter the Given Name',
            scope: 'world',
            config: true,
            type: String,
            default: 'Sherlock',
        });

        game.settings.register('InworldIntegration', 'activeCharacter', {
            name: 'Active Character',
            hint: 'Enter the name of the active character',
            scope: 'world',
            config: true,
            type: String,
            default: 'susan',
        });
    }

    async onReady() {
        const activeCharacter = game.settings.get('InworldIntegration', 'activeCharacter');
        this.sessionData = await this.openSession(activeCharacter);
        this.session_id = this.sessionData.name;
        this.character_id = this.sessionData.sessionCharacters[0].character;
        await this.listTokenNames();
        await this.compareNames(this.sessionData);
    }

    async compareNames(sessionData) {
        if (!canvas || !canvas.ready) {
            console.error('Canvas is not yet ready');
            return;
        }

        const inworldCharacterNames = sessionData.sessionCharacters.map(char => char.displayName);
        const tokens = canvas.tokens.placeables;
        const tokenNamesSet = new Set(tokens.map(token => token.document.name));
        const matchingNames = inworldCharacterNames.filter(name => tokenNamesSet.has(name));

        console.log("Matching names: ", matchingNames);

        for (let name of matchingNames) {
            let token = tokens.find(token => token.document.name === name);
            let inworldCharacter = sessionData.sessionCharacters.find(char => char.displayName === name);
            if (inworldCharacter) {
                this.characterTokenMap[inworldCharacter.character] = token;
            }
        }
    }

    async listTokenNames() {
        if (!canvas || !canvas.ready) {
            console.error('Canvas is not yet ready');
            return;
        }

        const tokens = canvas.tokens.placeables;
        for (let token of tokens) {
            console.log(token.document.name);
        }
    }

    async openSession(characterName) {
        let WORKSPACE_ID = game.settings.get('InworldIntegration', 'workspaceId');
        let YOUR_KEY_HERE = game.settings.get('InworldIntegration', 'apiKey');
        let END_USER_ID = game.settings.get('InworldIntegration', 'endUserId');
        let GIVEN_NAME = game.settings.get('InworldIntegration', 'givenName');

        const url = `https://studio.inworld.ai/v1/workspaces/${WORKSPACE_ID}/characters/${characterName}:openSession`;
        const headers = {
            'Content-Type': 'application/json',
            'authorization': `Basic ${YOUR_KEY_HERE}`
        };
        const body = {
            name: `workspaces/${WORKSPACE_ID}/characters/${characterName}`,
            user: {
                endUserId: END_USER_ID,
                givenName: GIVEN_NAME,
                gender: "female",
                age: "27",
                role: "detective"
            }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });
            const data = await response.json();
            console.log("Session Data: ", data);
            return data;
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async sendText(text, sessionData) {
        const WORKSPACE_ID = game.settings.get('InworldIntegration', 'workspaceId');
        const YOUR_KEY_HERE = game.settings.get('InworldIntegration', 'apiKey');
        const url = `https://studio.inworld.ai/v1/workspaces/${WORKSPACE_ID}/sessions/${this.session_id}/sessionCharacters/${this.character_id}:sendText`;
        const headers = {
            'Content-Type': 'application/json',
            'authorization': `Basic ${YOUR_KEY_HERE}`,
            'Grpc-Metadata-session-id': this.session_id
        };
        const body = {
            text: text
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });
            const data = await response.json();
            console.log("Integrate Inworld API Module: ", data);

            for (let inworldCharacter of sessionData.sessionCharacters) {
                let token = this.characterTokenMap[inworldCharacter.character];
                if (token) {
                    this.broadcastMessages(token, data.textList);
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async broadcastMessages(token, messages, index = 0) {
        if (index >= messages.length) return;  // Stop when all messages have been sent

        canvas.hud.bubbles.broadcast(token.document, messages[index]);

        let chatData = {
            user: game.user._id,
            speaker: {
                actor: token.actor.id,
                token: token.id,
                alias: token.document.name
            },
            content: messages[index]
        };

        // Call the text-to-speech function
        await this.textToSpeech(messages[index]);

        ChatMessage.create(chatData).then(() => {
            setTimeout(() => this.broadcastMessages(token, messages, index + 1), 2000);  // 2-second delay between messages
        });
    }

    async textToSpeech(text, voiceID = "21m00Tcm4TlvDq8ikWAM") {  // Default voiceID is set to the example voice ID from the docs
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceID}`;
        const headers = {
            'accept': 'audio/mpeg',
            'xi-api-key': game.settings.get("elevenlabs-for-foundry", "xi-api-key"),
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            "text": text,
            "model_id": "eleven_monolingual_v1"  // This may not be necessary, remove if it causes any issues
        });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: body
            });
            if (!response.ok) {
                // Log error message if the request fails
                console.error(`Error: ${response.statusText}`);
                return;
            }
            const reader = response.body.getReader();
            let chunks = [];
            while (true) {
                let {done, value} = await reader.read();
                if (done) break;
                chunks.push(value);
            }
            game.socket.emit('module.elevenlabs-for-foundry', {container: chunks});
            this.runPlaySound(chunks);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async runPlaySound(chunks) {
        let blob = new Blob(chunks, {type: 'audio/mpeg'});
        let url = window.URL.createObjectURL(blob);
        AudioHelper.play({src: url, volume: 1.0, loop: false}, false);
    }


















    async onCreateChatMessage(chatMessage) {
        console.log('Chat message created:', chatMessage);  // Debugging line
        if (chatMessage.speaker.actor) return;
        const messageText = chatMessage.content;
        await this.sendText(messageText, this.sessionData);
    }
}

// Instantiate the class once
const inworldIntegration = new InworldIntegration();

//
// BELOW THIS POINT THE CODE IS RELATED TO ELEVENLABS API - Something beyond this point is likely breaking the script.
//



var api_key = ""
var all_Voices;
var answer;
var isKeyOwner = false;
var allowKeySharing = false;
var voiceID;
var voiceText;
var subscriptionInfo;
var button;


Hooks.on('chatMessage', (log, message) => {
    try {
        return Play_Sound(message)
    } catch {
    }
})
Hooks.on("ready", () => {
    game.socket.on('module.elevenlabs-for-foundry', ({testarg, container}) => {
        runPlaySound(container)

    })
})

async function Initialize_Main() {
    api_key = game.settings.get("elevenlabs-for-foundry", "xi-api-key")
    if (api_key) {
        Get_Voices()
        Get_Userdata()
    }
}

async function Get_Userdata() {
    subscriptionInfo = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
        headers: {
            'accept': 'application/json',
            'xi-api-key': api_key
        }
    }).then(response => response.text()).then(text => JSON.parse(text))
}

function Play_Sound(message) {
    if (message.startsWith("/playsound")) {
        if (api_key) {

            let voiceName = message.substring(message.indexOf("[") + 1, message.indexOf("]"))

            let voice = all_Voices.voices.filter(obj => {
                return obj.name === voiceName
            })
            console.log(voice)
            if (voice[0]) {
                Text_To_Speech(voice[0].voice_id, message.substring(message.indexOf("]") + 1))
            }
        } else {
            Set_Key_Window()
        }
        return false;
    } else if (message.startsWith("/play")) {
        if (api_key) {
            doStuff()
        } else {
            Set_Key_Window()
        }
        return false;
    }
}



async function Get_Voices() {
    await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
            'accept': 'application/json',
            'xi-api-key': api_key
        }
    }).then(response => response.text()).then(text => all_Voices = JSON.parse(text))

}

async function Text_To_Speech(voiceID, text) {
    let container = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceID, {
            method: 'POST',
            headers: {
                'accept': 'audio/mpeg',
                'xi-api-key': api_key,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "text": text,
                "model_id": "eleven_monolingual_v1"
            })
        }
    )
    let reader = container.body.getReader()
    let chunks = []
    while (true) {
        let {done, value} = await reader.read()
        if (done) break
        chunks.push(value)
    }
    game.socket.emit('module.elevenlabs-for-foundry', {testarg: "Hello World", container: chunks})
    let blob = new Blob(chunks, {type: 'audio/mpeg'})
    let url = window.URL.createObjectURL(blob)
    AudioHelper.play({src: url, volume: 1.0, loop: false}, false)
}

async function Voice_Field() {
    let allVoices_Voice_Field = "<select name=\"allVoices_Voice_Field\" id=\"allVoices_Voice_Field\">"
    for (let i = (all_Voices.voices.length - 1); i > 0; i--) {
        allVoices_Voice_Field += `<option value=${all_Voices.voices[i].voice_id}>${all_Voices.voices[i].name}</option>`
    }
    allVoices_Voice_Field += "</select>"

    let value = await new Promise((resolve) => {
        new Dialog({
            title: `Send Audio`,
            content: `<table style="width:100%"><tr><th style="width:50%">${allVoices_Voice_Field}</th><td style="width:50%"><input type="text" id="Voice_Field_Input" name="input"/></td></tr></table>`
                + `<td>${subscriptionInfo.character_count}/${subscriptionInfo.character_limit}</td>`
                + `<button id="Voice_Field_Get_Params">Send</button>`,
            buttons: {}
        }).render(true);

    });
    return [voiceID, voiceText];
}

function Send_Text_To_Speech() {
    voiceText = document.getElementById("Voice_Field_Input").value
    document.getElementById("Voice_Field_Input").value = ""
    let select = document.getElementById("allVoices_Voice_Field");
    voiceID = select.options[select.selectedIndex].value;
    Text_To_Speech(voiceID, voiceText)
}

async function doStuff() {
    Create_Window()
    await sleep(20)
    button = document.getElementById("Voice_Field_Get_Params");
    button.addEventListener("click", () => {
        Send_Text_To_Speech()
    })
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function Create_Window() {
    let split = await Voice_Field();
    let voice = split[0]
    let text = split[1]
    Text_To_Speech(voice, text)
}

async function Set_Key() {
    let value = await new Promise((resolve) => {
        new Dialog({
            title: `Set Elevenlabs Key`,
            content: `<table style="width:100%"><tr><th style="width:50%">"Set Your Key"</th><td style="width:50%"><input type="text" name="input"/></td></tr></table>`,
            buttons: {
                Ok: {
                    label: `Send`, callback: (html) => {
                        resolve(html.find("input").val());
                    }
                },
            }
        }).render(true);
    });
    return value;
}

async function Set_Key_Window() {
    api_key = await Set_Key()
    game.settings.set("elevenlabs-for-foundry", "xi-api-key", api_key)
    Get_Voices()
}

