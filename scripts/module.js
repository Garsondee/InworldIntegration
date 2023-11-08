class inworldintegration {
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
        game.settings.register('inworldintegration', 'workspaceId', {
            name: 'Workspace ID',
            hint: 'Enter the Workspace ID - You can find that here: https://studio.inworld.ai/workspaces',
            scope: 'world',
            config: true,
            type: String,
            default: '',
        });

        game.settings.register('inworldintegration', 'apiKey', {
            name: 'Inworld API Key',
            hint: 'Enter your API key - you can find this in the integration button on the left and you can use the "Copy Base64 Button" to grab the key.',
            scope: 'world',
            config: true,
            type: String,
            default: '',
        });


        game.settings.register('inworldintegration', 'endUserId', {
            name: 'End User ID',
            hint: 'Enter the End User ID - Does not do anything currently.',
            scope: 'world',
            config: true,
            type: String,
            default: '12345',
        });

        game.settings.register('inworldintegration', 'givenName', {
            name: 'Given Name',
            hint: 'Enter the name of the character who will be interacting with the AI',
            scope: 'world',
            config: true,
            type: String,
            default: 'Sherlock',
        });

        game.settings.register('inworldintegration', 'activeCharacter', {
            name: 'Active Character',
            hint: 'Enter the name of the character within Inworld - lowercase letters only - be aware that if you change the name of the character later it currently stays with the old name for this purpose.',
            scope: 'world',
            config: true,
            type: String,
            default: 'susan',
        });

        game.settings.register("inworldintegration", "xi-api-key", {
            name: "Elevenlabs API-Key (optional)",
            hint: "Your Elevenlabs API Key",
            scope: "world",
            config: true,
            type: String,
            onChange: value => {
                Initialize_Main()
            }
        });
        Initialize_Main();

        game.settings.register('inworldintegration', 'elevenlabsVoice', {
            name: 'Elevenlabs Voice (optional)',
            hint: 'Enter the voice ID for Elevenlabs to be used',
            scope: 'world',
            config: true,
            type: String,
            default: 'Roshni', // Set the default voice to Roshni
        });
    }


    async onReady() {
        const activeCharacter = game.settings.get('inworldintegration', 'activeCharacter');
        this.sessionData = await this.openSession(activeCharacter);
        this.session_id = this.sessionData.name;
        this.character_id = this.sessionData.sessionCharacters[0].character;
        await this.listTokenNames();
        await this.compareNames(this.sessionData);

        game.settings.register('inworldintegration', 'elevenlabsVoice', {
            name: 'Elevenlabs Voice',
            hint: 'Select the voice for Elevenlabs to be used',
            scope: 'world',
            config: true,
            type: String,
            default: '',
            choices: {},
            onChange: value => {}
        });

        async function populateVoiceDropdown() {
            console.log("Fetching voices...");
            const voices = await Get_Voices(); // Make sure this function returns the list of voices

            if (!voices || voices.length === 0) {
                console.error('No voices were returned from the Get_Voices function.');
                return; // Exit the function if no voices are available
            }

            const voiceChoices = {};
            voices.forEach(voice => {
                voiceChoices[voice.voice_id] = voice.name; // Map voice_id to voice name
            });

            console.log("Voice choices to populate:", voiceChoices);

            // Update the choices for the setting
            game.settings.register('inworldintegration', 'elevenlabsVoice', {
                name: 'Elevenlabs Voice',
                hint: 'Select the voice for Elevenlabs to be used',
                scope: 'world',
                config: true,
                type: String,
                default: '',
                choices: voiceChoices, // Populate the choices with the fetched voices
                onChange: value => {
                    // Handle the change if needed, for example:
                    console.log(`Voice selection changed to: ${value}`);
                }
            });

            // Refresh the settings menu to show the new choices
            if (game.settings.sheet) {
                game.settings.sheet.render(true);
                console.log("Settings sheet rendered with new choices.");
            }
        }

        await populateVoiceDropdown(); // Make sure to await this function
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
        let WORKSPACE_ID = game.settings.get('inworldintegration', 'workspaceId');
        let YOUR_KEY_HERE = game.settings.get('inworldintegration', 'apiKey');
        let END_USER_ID = game.settings.get('inworldintegration', 'endUserId');
        let GIVEN_NAME = game.settings.get('inworldintegration', 'givenName');

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
        const WORKSPACE_ID = game.settings.get('inworldintegration', 'workspaceId');
        const YOUR_KEY_HERE = game.settings.get('inworldintegration', 'apiKey');
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

            // Concatenate the messages into a single string separated by spaces
            // Change starts here
            const concatenatedMessages = data.textList.join(" "); // Join messages with space

            // Assuming we have only one inworld character per session for simplicity
            for (let inworldCharacter of sessionData.sessionCharacters) {
                let token = this.characterTokenMap[inworldCharacter.character];
                if (token) {
                    // Modified broadcastMessages to handle a single concatenated string
                    this.broadcastMessages(token, [concatenatedMessages]);
                }
            }
            // Change ends here
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

    async textToSpeech(text) {
        // Retrieve the selected voice ID directly from settings
        let voiceID = game.settings.get('inworldintegration', 'elevenlabsVoice');

        // Check if the selected voice ID is in the list of voices
        if (all_Voices && all_Voices.voices) {
            const voiceData = all_Voices.voices.find(voice => voice.voice_id === voiceID);
            if (!voiceData) {
                console.error(`Voice ID ${voiceID} not found in the stored voices list.`);
                return;
            }
        } else {
            console.error('Voices list is not loaded. Make sure to run Get_Voices() first.');
            return;
        }

        // Now voiceID is set to the ID from the settings, or the error is logged if not found
        // Continue with the existing functionality to perform text-to-speech
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceID}`;
        const headers = {
            'accept': 'audio/mpeg',
            'xi-api-key': game.settings.get("inworldintegration", "xi-api-key"),
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
            game.socket.emit('module.inworldintegration', {container: chunks});
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
const inworldintegration = new inworldintegration();


let api_key = ""
let all_Voices;
let answer;
let isKeyOwner = false;
let allowKeySharing = false;
let voiceID;
let voiceText;
let subscriptionInfo;
let button;


Hooks.on('chatMessage', (log, message) => {
    try {
        return Play_Sound(message)
    } catch {
    }
})
Hooks.on("ready", () => {
    game.socket.on('module.inworldintegration', ({testarg, container}) => {
        runPlaySound(container)

    })

})

async function Initialize_Main() {
    api_key = game.settings.get("inworldintegration", "xi-api-key")
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
    try {
        console.log('Sending request to fetch voices...');
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
            headers: {
                'accept': 'application/json',
                'xi-api-key': api_key
            }
        });
        console.log('Response received:', response);

        if (response.ok) {
            const jsonData = await response.json();
            console.log('JSON data parsed:', jsonData);
            all_Voices = jsonData;
            return jsonData.voices; // Return the voices array
        } else {
            console.error('Failed to get voices from ElevenLabs API:', response.statusText);
            return []; // Return an empty array if the request fails
        }
    } catch (error) {
        console.error('Error occurred while getting voices:', error);
        return []; // Return an empty array in case of an error
    }
}

async function textToSpeech(text) {
    // Retrieve the voice name from settings
    const voiceName = game.settings.get('inworldintegration', 'elevenlabsVoice');
    let voiceID;

    // Assuming Get_Voices has already populated all_Voices
    if (all_Voices && all_Voices.voices) {
        const voiceData = all_Voices.voices.find(voice => voice.name === voiceName);
        if (voiceData) {
            voiceID = voiceData.voice_id;
        } else {
            console.error(`Voice ${voiceName} not found in the stored voices list.`);
            return;
        }
    } else {
        console.error('Voices list is not loaded. Make sure to run Get_Voices() first.');
        return;
    }

    // Proceed with the Text-to-Speech request using the found voice ID
    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceID}`, {
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
        });

        // Handle response and play audio
        if (response.ok) {
            let reader = response.body.getReader();
            let chunks = [];
            while (true) {
                const {done, value} = await reader.read();
                if (done) break;
                chunks.push(value);
            }
            game.socket.emit('module.inworldintegration', {container: chunks});
            let blob = new Blob(chunks, {type: 'audio/mpeg'});
            let url = window.URL.createObjectURL(blob);
            AudioHelper.play({src: url, volume: 1.0, loop: false}, false);
        } else {
            throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error in Text_To_Speech:', error);
    }
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
    game.settings.set("inworldintegration", "xi-api-key", api_key)
    Get_Voices()
}

