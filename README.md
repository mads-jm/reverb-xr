# Reverb VR: Audio Visualizer Prototype

Reverb VR is an audio visualizer prototype built using A-Frame and Web Audio API. This project demonstrates two different audio visualizations in separate scenes and lays the groundwork for more complex visualizations.

[Main Release](https://reverb-xr.vercel.app/)
[Indev](https://reverb-xr-indev.vercel.app/)
[Prototype](https://reverb-proto.vercel.app/)

## Project Structure

### html

- `index.html`: Main entry point with options to choose audio input (microphone or file) and an iframe to load A-Frame scenes.
- `aframe.html`: A-Frame scene containing the initial setup for a white room with interactive buttons to switch between visualizations.
- `stage-bars.html`: A-Frame scene for the bar visualizer.
- `stage-wave.html`: A-Frame scene for the waveform visualizer.

### JavaScript

- `AudioProcessor.js`: Handles audio processing using Web Audio API.
- `aframe-script.js`: Custom A-Frame components for main menu
- `bars-script.js` : Handles logic and Data flow for bar visualization
- `wave-script.js` : Handles logic and Data flow for wave visualization

## File Descriptions

TODO

## Contributors
```
CS410 - Team SIMMA
Joseph Madigan
Emma Melkumian
Shayn Shahla
Evan Ingalls
Brant Anderson
```
