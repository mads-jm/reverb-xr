// Remove the circular imports at the top
// import { FileState } from "./FileState.js";
// import { MicrophoneState } from "./MicrophoneState.js";
// import { NetworkStreamState } from "./NetworkStreamState.js";

/**
 * Base audio state that handles common functionality and state transitions.
 * All specific audio state implementations should extend this class.
 */
export class InitializedState {
  constructor(audioContext, analyser) {
    this.audioContext = audioContext;
    this.analyser = analyser;
    this.source = null;
    
    // Create a gain node by default for all audio states
    this.gainNode = this.audioContext.createGain();
    // Default to full volume
    this.gainNode.gain.value = 1.0;
    
    // Connect analyzer to gain node by default
    // Child classes should use this.gainNode in their setup
    try {
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
    } catch (e) {
      console.error('Error setting up default gain node:', e);
    }
  }

  /**
   * Sets the volume for this audio state
   * @param {number} volume - Volume level between 0 and 1
   */
  setVolume(volume) {
    if (!this.gainNode) {
      this.gainNode = this.audioContext.createGain();
      
      try {
        // Reconnect if needed
        this.analyser.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
      } catch (e) {
        console.error('Error setting up gain node in setVolume:', e);
      }
    }
    
    // Use square root scaling for more natural volume control
    // This gives more audible range at low volume settings, while still allowing for fine control
    const scaledVolume = Math.sqrt(volume);
    
    // Set the gain value - ensure 0 is actually 0, otherwise use scaled value
    this.gainNode.gain.value = volume === 0 ? 0 : scaledVolume;
    
    console.log('Base state volume set to:', volume, 'Scaled volume:', scaledVolume);
  }

  /**
   * Initializes microphone input
   * @returns {Promise<MicrophoneState>} Promise that resolves to new state
   */
  async initMicrophone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);
      
      // Use dynamic import to avoid circular dependency
      const { MicrophoneState } = await import('./MicrophoneState.js');
      return new MicrophoneState(this.audioContext, this.analyser, source, stream);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      return this;
    }
  }

  /**
   * Initializes audio from a file
   * @param {File} file - The audio file to play
   * @returns {Promise<FileState>} Promise that resolves to new state
   */
  async initFile(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Use dynamic import to avoid circular dependency
      const { FileState } = await import('./FileState.js');
      return new FileState(this.audioContext, this.analyser, audioBuffer);
    } catch (error) {
      console.error("Error loading audio file:", error);
      return this;
    }
  }

  /**
   * Initializes audio from a network stream
   * @param {string} streamUrl - URL of the stream to play
   * @returns {Promise<NetworkStreamState>} Promise that resolves to new state
   */
  async initNetworkStream(streamUrl) {
    try {
      // Use dynamic import to avoid circular dependency
      const { NetworkStreamState } = await import('./NetworkStreamState.js');
      return new NetworkStreamState(this.audioContext, this.analyser, streamUrl);
    } catch (error) {
      console.error("Error initializing network stream:", error);
      return this;
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
