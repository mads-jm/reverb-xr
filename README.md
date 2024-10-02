# Reverb VR: Audio Visualizer Prototype

Reverb VR is an audio visualizer prototype built using A-Frame and Web Audio API. This project demonstrates multiple audio visualizations in separate scenes and lays the groundwork for more complex visualizations.

[Main Release](https://reverb-xr.vercel.app/)
[Indev](https://reverb-xr-indev.vercel.app/)
[Prototype](https://reverb-proto.vercel.app/)

## Project Structure

### HTML Files

- **`index.html`**: Main entry point with options to choose audio input (microphone or file) and an iframe to load A-Frame scenes.
- **`settings.html`**: A-Frame scene for configuring settings.
- **`about.html`**: About page in A-Frame.
- **`loading.html`**: Simple loading scene in A-Frame.
- **`aframe.html`**: Main A-Frame scene containing the initial setup for a white room with interactive buttons to switch between visualizations.
- **`stage-bars.html`**: A-Frame scene for the bar visualizer.
- **`stage-wave.html`**: A-Frame scene for the waveform visualizer.
- **`stage-dualwave.html`**: A-Frame scene for the dual waveform visualizer.
- **`stage-boxwave.html`**: A-Frame scene for the box waveform visualizer.
- **`stage-particle.html`**: A-Frame scene for the particle visualizer.

### CSS Files

- **`style.css`**: Contains styling for the main entry point and other HTML elements.

### JavaScript Files

- **`scripts/main.js`**: Handles logic for the main menu and locomotion.
- **`scripts/components.js`**: Custom A-Frame components.
- **`scripts/aframe-script.js`**: Custom A-Frame components for the main menu.
- **`scripts/aframe-menu-script.js`**: Script for handling the menu interactions in A-Frame scenes.
- **`scripts/bars-script.js`**: Handles logic and data flow for bar visualization.
- **`scripts/wave-script.js`**: Handles logic and data flow for wave visualization.
- **`scripts/dualwave-script.js`**: Handles logic and data flow for dual wave visualization.
- **`scripts/boxwave-script.js`**: Handles logic and data flow for box wave visualization.
- **`scripts/particle-script.js`**: Handles initialization and building of the particle visualizer.
- **`scripts/adv-bars-script.js`**: Advanced bar visualization script.
- **`audio/AudioProcessor.js`**: Handles audio processing using Web Audio API.

### Assets

- **`assets/textures`**: Contains texture files such as `sky.jpg` and `groundTexture.png`.
- **`assets/models`**: Contains 3D models like `panel.gltf`.

## Key Functionalities

- **Audio Input Selection**: Choose between microphone input or audio file.
- **Visualizations**: Multiple audio visualizations including bars, waves, dual waves, box waves, and particle effects.
- **Menu Interactions**: Interactive menus for switching between scenes and configurations.
- **Settings**: Adjustable settings for volume and other parameters.
- **Loading Screen**: A loading screen to enhance user experience during scene transitions.

## File Descriptions

### `index.html`

The main entry point for the application. It provides options to select the audio input and controls to play/pause the audio. It also contains an iframe to load the A-Frame scenes.

### `settings.html`

An A-Frame scene that allows users to configure various settings such as volume and other parameters.

### `about.html`

An about page that provides information about the Reverb VR project.

### `loading.html`

A simple loading screen displayed while the main A-Frame scene is being loaded.

### `aframe.html`

The main A-Frame scene that contains the initial setup, including a white room with interactive buttons to switch between different audio visualizations.

### JavaScript Files

#### `main.js`

Handles the main logic for the menu and locomotion within the A-Frame scenes.

#### `components.js`

Defines custom A-Frame components used throughout the project.

#### `aframe-script.js`

Contains custom A-Frame components specifically for the main menu interactions.

#### `aframe-menu-script.js`

Handles the interactions with the menu in the A-Frame scenes.

#### `bars-script.js`, `wave-script.js`, `dualwave-script.js`, `boxwave-script.js`, `particle-script.js`

Each script handles the logic and data flow for their respective visualizations.

#### `AudioProcessor.js`

Responsible for processing the audio input using the Web Audio API, including features such as beat detection and pitch detection.

## Contributors

CS410 - Team SIMMA
- Joseph Madigan
- Emma Melkumian
- Shayan Shahla
- Evan Ingalls
- Brant Anderson
