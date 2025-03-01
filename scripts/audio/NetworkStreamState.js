import { InitializedState } from './InitializedState.js';

/**
 * State for handling network audio streaming
 * Extends the base InitializedState to inherit common functionality
 */
export class NetworkStreamState extends InitializedState {
  /**
   * @param {AudioContext} audioContext - The audio context
   * @param {AnalyserNode} analyser - The analyzer node
   * @param {string} streamUrl - URL of the audio stream
   */
  constructor(audioContext, analyser, streamUrl) {
    super(audioContext, analyser);
    this.streamUrl = streamUrl;
    this.isPlaying = false;
    this.initStream();
  }

  /**
   * Initialize the audio stream
   * @private
   */
  async initStream() {
    try {
      // Create an audio element to fetch and decode the stream
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.src = this.streamUrl;
      this.audioElement.load();
      
      // Connect the audio element to the audio context
      this.source = this.audioContext.createMediaElementSource(this.audioElement);
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      
      console.log('Network stream initialized');
    } catch (err) {
      console.error('Error initializing network stream', err);
      throw err;
    }
  }

  /**
   * Start playing the network stream
   */
  play() {
    if (!this.isPlaying && this.audioElement) {
      this.audioElement.play()
        .then(() => {
          this.isPlaying = true;
          console.log('Network stream playback started');
        })
        .catch(err => {
          console.error('Error playing network stream', err);
        });
    }
  }

  /**
   * Pause the network stream
   */
  pause() {
    if (this.isPlaying && this.audioElement) {
      this.audioElement.pause();
      this.isPlaying = false;
      console.log('Network stream playback paused');
    }
  }

  /**
   * Stop and clean up the network stream
   * @returns {NetworkStreamState} This state instance
   */
  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement.load();
    }
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    this.isPlaying = false;
    console.log('Network stream stopped');
    return this;
  }
} 