# Introduction

This module facilitates the integration of Foundry VTT with Inworld and Elevenlabs APIs, enabling characters in your game to interact with the Inworld AI and utilize Elevenlabs' text-to-speech capabilities. The codebase incorporates a class `inworldintegration` to manage the integration seamlessly.

This module was developed with inspiration from Vex Florez's Elevenlabs module (licensed under GPL) which provided the foundation for text-to-speech functionality. Thanks to Vex Florez for making the Elevenlabs module available to the community.

## Features

- Connects to Inworld API to facilitate interactions with characters.
- Maps Foundry VTT tokens to Inworld characters based on their names.
- Sends text messages to Inworld and receives responses.
- Broadcasts received messages in the chat and using speech bubbles.
- Utilizes Elevenlabs API for text-to-speech functionality, enabling characters to "speak" the text messages.
- Provides a settings interface for users to configure their API keys and other preferences.

## Limitations

- While the Inworld Integration module adds robust capabilities to your Foundry VTT experience, enabling dynamic interactions with NPCs and text-to-speech functionalities, there are some current limitations that users should be aware of:
- Single NPC Interaction: At present, the Inworld API integration is limited to facilitating conversation between one NPC and a single designated player character at a time. This means group interactions or having multiple NPCs interacting with the Inworld API simultaneously is not supported.
- One-on-One Conversation: The module is designed for one-on-one conversations. If an NPC is engaged in a conversation with a player character, other players will not be able to initiate a new conversation with that NPC until the current interaction is concluded.
- API Response Times: The response times can vary depending on the Inworld API server load. During peak times, there might be a slight delay in NPCs' responses.
- API Limitations: The free tier of the Inworld account allows up to 5000 interactions per month. Users with a high volume of NPC interactions may need to consider upgrading their Inworld account to accommodate their usage.
- Sequential Processing: Due to the current API constraints, conversations are processed sequentially. This can occasionally lead to delays if multiple requests are sent to the Inworld API in quick succession.
- Improvements on the Horizon: The developers are aware of these limitations and are working on an improved version

## Pre-requisites

- Foundry VTT version 11 or later.
- Inworld account (up to 5000 interactions per month for free).
- Elevenlabs account (if you want audio speech capabilities).

## Installation

1. Download the module and place it in your Modules folder within your Foundry VTT installation.
2. Launch Foundry VTT and navigate to the game world where you want to install this module.
3. Go to the Game Settings tab, then Manage Modules and enable the Inworld Integration module.

## Configuration

Once installed, you'll need to configure the module with your Inworld and Elevenlabs API credentials.

1. Go to the Game Settings tab, then Module Settings.
2. Under Inworld Integration, enter your Inworld Workspace ID, API Key, End User ID, Given Name, and Active Character.
3. Under Elevenlabs for Foundry, enter your API-Key.

## Usage

Upon configuration, the module will automatically map tokens to Inworld characters based on their names. When a chat message is created, it will be sent to Inworld for processing. The response from Inworld will then be broadcasted in the chat and, if Elevenlabs is configured, spoken aloud using text-to-speech.

**Text-to-speech commands:**
- `/playsound [Voice Name] Text to be spoken` - Play a sound with a specified voice.
- `/play` - Initiates the text-to-speech window where you can select a voice and enter text to be spoken.

## Support

For support or to report any issues with this module, please open an issue on the [GitHub repository](https://github.com/Garsondee/inworldintegration).

## License

This module is licensed under the MIT License.

## Acknowledgements

Special thanks to Vex Florez for the Elevenlabs module which greatly aided in implementing the text-to-speech functionality in this module.
