/**
 * AudioProcessor - Basic audio analysis class 
 * Handles audio input sources and provides frequency/time domain data
 */
class AudioProcessor {
  /**
   * Create a new AudioProcessor
   */
  constructor() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.source = null;
    this.startTime = null;
  }

  /**
   * Initializes the microphone as audio input
   * @returns {Promise<void>}
   */
  async initMicrophone() {
    try {
      await this.resumeAudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.processAudioStream(stream);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  }

  /**
   * Initializes an audio file as input
   * @param {File} file - The audio file to analyze
   * @returns {Promise<void>}
   */
  async initFile(file) {
    try {
      await this.resumeAudioContext();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
      this.processAudioBuffer(audioBuffer);
    } catch (err) {
      console.error('Error processing audio file:', err);
    }
  }

  /**
   * Sets up analysis for a live audio stream (e.g. microphone)
   * @param {MediaStream} stream - The media stream to analyze
   */
  processAudioStream(stream) {
    this.stopCurrentSource();
    this.source = this.audioCtx.createMediaStreamSource(stream);
    this.source.connect(this.analyser);
    console.log("Microphone stream started");
  }

  /**
   * Sets up analysis for an audio buffer (e.g. from a file)
   * @param {AudioBuffer} audioBuffer - The decoded audio buffer to analyze
   */
  processAudioBuffer(audioBuffer) {
    this.stopCurrentSource();
    this.source = this.audioCtx.createBufferSource();
    this.source.buffer = audioBuffer;
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
    this.source.start(0);
    this.startTime = this.audioCtx.currentTime;
    console.log("Audio playback started");
  }

  /**
   * Stops the current audio source
   */
  stopCurrentSource() {
    if (this.source) {
      this.source.disconnect();
      if (this.source.stop) {
        this.source.stop(0);
      }
      console.log("Audio source stopped");
    }
  }

  /**
   * Ensures the audio context is running
   * @returns {Promise<void>} Resolves when the context is resumed
   */
  resumeAudioContext() {
    if (this.audioCtx.state === 'suspended') {
      return this.audioCtx.resume().then(() => {
        console.log("Audio context resumed");
      });
    }
    return Promise.resolve();
  }

  /**
   * Gets frequency data from the audio analyzer
   * @returns {Uint8Array} Raw frequency data (0-255)
   */
  getFrequencyData() {
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  /**
   * Gets time domain data from the audio analyzer
   * @returns {Uint8Array} Raw waveform data (0-255)
   */
  getTimeDomainData() {
    this.analyser.getByteTimeDomainData(this.dataArray);
    return this.dataArray;
  }

  /**
   * Gets a copy of the frequency data for external API use
   * @returns {Uint8Array} Copy of frequency data
   */
  getFrequencyDataForAPI() {
    this.getFrequencyData();
    return this.dataArray.slice();
  }

  /**
   * Gets a copy of the time domain data for external API use
   * @returns {Uint8Array} Copy of time domain data
   */
  getTimeDomainDataForAPI() {
    this.getTimeDomainData();
    return this.dataArray.slice();
  }
}
