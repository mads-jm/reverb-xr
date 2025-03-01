# Reverb XR: Audio Visualizer

Reverb XR is an immersive audio visualization experience built using A-Frame and Web Audio API. This project features multiple audio visualizations in separate scenes and provides a framework for creating complex, responsive audio-reactive environments.

[Live Demo](https://reverb-xr.vercel.app/)

## Project Structure

### HTML

- `index.html`: Main entry point with audio input options (microphone, file, or Spotify) and an iframe to load A-Frame scenes.
- `stages/home.html`: Main menu scene with visualizer selection options.
- `stages/testing/`: Development and experimental visualization scenes.
- `stages/old/`: Original prototype visualizations (for reference).

### JavaScript Files

- `scripts/GPUAudioProcessor.js`: Handles audio processing using Web Audio API with GPU acceleration.
- `scripts/SpotifyProcessor.js`: Handles Spotify integration and audio streaming.
- `main.js`: Core application logic for audio processing and scene management.
- `scripts/visualizer.js`: Core visualization components with shader-based rendering.
- `camera.js`: Custom camera controls for VR/non-VR modes.

## Features

- Real-time audio visualization with multiple visualization modes
- Input from microphone, audio files, or Spotify
- WebXR support for VR headsets
- GPU-accelerated audio processing
- Custom shader-based visualizations
- Adaptive quality settings for consistent performance

## File Descriptions

The codebase is organized to separate core audio processing from visualization rendering:

- Audio processing components capture and analyze audio data
- Visualization components render the processed data using various techniques
- Custom A-Frame components handle scene interactivity and state management

## Origin

This project is a complete rewrite and evolution of the original Reverb VR prototype developed by CS410 Team SIMMA.

## Contributors

### V2 Development
- Joseph Madigan

### Original Prototype (CS410 - Team SIMMA)
- Joseph Madigan
- Emma Melkumian
- Shayan Shahla
