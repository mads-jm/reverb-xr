import { FileState } from "./FileState.js";
import { MicrophoneState } from "./MicrophoneState.js";
import { NetworkStreamState } from "./NetworkStreamState.js";

/**
 * Base audio state that handles common functionality and state transitions.
 * All specific audio state implementations should extend this class.
 */
export class InitializedState {
  constructor(audioContext, analyser) {
    this.audioContext = audioContext;
    this.analyser = analyser;
    this.source = null;
  }

  /**
   * Transitions to microphone input state
   * @returns {Promise<MicrophoneState>} A new state for microphone input
   */
  async initMicrophone() {
    try {
      // Clean up current source if it exists
      this.stop();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      return new MicrophoneState(this.audioContext, this.analyser, stream);
    } catch(err) {
      console.log("Error accessing microphone", err);
      throw err;
    }
  }

  /**
   * Transitions to file input state
   * @param {File} file - The audio file to process
   * @returns {Promise<FileState>} A new state for file input
   */
  async initFile(file) {
    try {
      // Clean up current source if it exists
      this.stop();
      
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      return new FileState(this.audioContext, this.analyser, audioBuffer);
    } catch (err) {
      console.log("Error processing audio file", err);
      throw err;
    }
  }

  /**
   * Transitions to network stream state
   * @param {string} streamUrl - URL of the audio stream to play
   * @returns {NetworkStreamState} A new state for network streaming
   */
  initNetworkStream(streamUrl) {
    try {
      // Clean up current source if it exists
      this.stop();
      
      return new NetworkStreamState(this.audioContext, this.analyser, streamUrl);
    } catch (err) {
      console.log("Error initializing network stream", err);
      throw err;
    }
  }

  /**
   * Creates mock audio data for testing
   * @returns {InitializedState} This state with mock data
   */
  initMockData() {
    // Clean up current source if it exists
    this.stop();
    
    this.source = this.audioContext.createBufferSource();
    const buffer = this.audioContext.createBuffer(
      1,
      this.audioContext.sampleRate * 3,
      this.audioContext.sampleRate
    );
    const data = buffer.getChannelData(0);

    // Generate mock data (e.g., sine wave or random data)
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1; // Random data between -1 and 1
    }

    this.source.buffer = buffer;
    this.source.loop = true;
    this.source.connect(this.analyser);
    this.source.start();
    console.log("Mock data initialized");
    return this;
  }

  /**
   * Stops and cleans up the current audio source
   */
  stop() {
    if (this.source) {
      this.source.disconnect();
      if (this.source.stop) {
        this.source.stop(0);
      }
      this.source = null;
      console.log("Audio source stopped");
    }
  }

  /**
   * Gets frequency data from the analyzer
   * @param {Uint8Array} dataArray - Array to store frequency data
   */
  getFrequencyData(dataArray) {
    this.analyser.getByteFrequencyData(dataArray);
  }

  /**
   * Gets time domain data from the analyzer
   * @param {Uint8Array} dataArray - Array to store time domain data
   */
  getTimeDomainData(dataArray) {
    this.analyser.getByteTimeDomainData(dataArray);
  }
}
