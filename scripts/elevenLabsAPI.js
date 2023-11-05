var api_key = ""
export var all_Voices;
var answer;
var isKeyOwner = false;
var allowKeySharing = false;
var voiceID;
var voiceText;
var subscriptionInfo;
var button;

export async function Initialize_Main() {
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

export function Play_Sound(message) {
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

export async function runPlaySound(chunks) {
    let blob = new Blob(chunks, {type: 'audio/mpeg'})
    let url = window.URL.createObjectURL(blob)
    AudioHelper.play({src: url, volume: 1.0, loop: false}, false)
}

async function Get_Voices() {
    await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
            'accept': 'application/json',
            'xi-api-key': api_key
        }
    }).then(response => response.text()).then(text => all_Voices = JSON.parse(text))

}

export async function Text_To_Speech(voiceID, text) {
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

