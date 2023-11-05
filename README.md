Introduction

This module facilitates the integration of Foundry VTT with Inworld and Elevenlabs APIs, enabling characters in your game to interact with the Inworld AI and utilize Elevenlabs' text-to-speech capabilities. The codebase incorporates a class InworldIntegration to manage the integration seamlessly.

This module was developed with inspiration from Vex Florez's Elevenlabs module (licensed under GPL) which provided the foundation for text-to-speech functionality. Thanks to Vex Florez for making the Elevenlabs module available to the community.

Features

Connects to Inworld API to facilitate interactions with characters.
Maps Foundry VTT tokens to Inworld characters based on their names.
Sends text messages to Inworld and receives responses.
Broadcasts received messages in the chat and using speech bubbles.
Utilizes Elevenlabs API for text-to-speech functionality, enabling characters to "speak" the text messages.
Provides a settings interface for users to configure their API keys and other preferences.

Pre-requisites
Foundry VTT version 11 or later.
Inworld account (up to 5000 interactions per month for free).
Elevenlabs account (if you want audio speech capabilities).
Installation

Download the module and place it in your Modules folder within your Foundry VTT installation.
Launch Foundry VTT and navigate to the game world where you want to install this module.
Go to the Game Settings tab, then Manage Modules and enable the Inworld Integration module.

Configuration
Once installed, you'll need to configure the module with your Inworld and Elevenlabs API credentials.

Go to the Game Settings tab, then Module Settings.
Under Inworld Integration, enter your Inworld Workspace ID, API Key, End User ID, Given Name, and Active Character.
Under Elevenlabs for Foundry, enter your API-Key.

Usage
Upon configuration, the module will automatically map tokens to Inworld characters based on their names. When a chat message is created, it will be sent to Inworld for processing. The response from Inworld will then be broadcasted in the chat and, if Elevenlabs is configured, spoken aloud using text-to-speech.

Text-to-speech commands:

/playsound [Voice Name] Text to be spoken - Play a sound with a specified voice.
/play - Initiates the text-to-speech window where you can select a voice and enter text to be spoken.
Support
For support or to report any issues with this module, please open an issue on the GitHub repository.

License
This module is licensed under the MIT License.

Acknowledgements
Special thanks to Vex Florez for the Elevenlabs module which greatly aided in implementing the text-to-speech functionality in this module.
