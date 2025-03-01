import { InitializedState } from "./InitializedState.js";

/**
 * State for handling microphone input
 * Extends the base InitializedState to inherit common functionality
 */
export class MicrophoneState extends InitializedState {
  /**
   * @param {AudioContext} audioContext - The audio context
   * @param {AnalyserNode} analyser - The analyzer node
   * @param {MediaStreamAudioSourceNode} source - The audio source node
   * @param {MediaStream} stream - The microphone media stream
   */
  constructor(audioContext, analyser, source, stream) {
    super(audioContext, analyser);
    this.stream = stream;
    this.source = source;
    
    // For microphone input, we need to break the output connection
    // to prevent feedback loops (the mic picking up its own output)
    
    // First disconnect any existing connections from analyzer to prevent feedback
    try {
      this.analyser.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    
    // For visualization only: reconnect analyzer to gain node, but keep gain at 0
    // This ensures we can visualize the audio without creating feedback
    if (this.gainNode) {
      this.analyser.connect(this.gainNode);
      // Set gain to 0 to prevent any sound output and feedback
      this.gainNode.gain.value = 0;
    }
  }
  
  /**
   * Override setVolume to prevent accidental unmuting of microphone
   * For microphone input, we always keep the gain at 0 to prevent feedback
   * @param {number} volume - Volume level (ignored for mic input)
   */
  setVolume(volume) {
    // Always keep mic input volume at 0 to prevent feedback
    if (this.gainNode) {
      this.gainNode.gain.value = 0;
    }
    console.log('Microphone input volume is always muted to prevent feedback');
  }

  /**
   * Stops microphone input and returns to initialized state
   * @returns {InitializedState} Base initialized state
   */
  stop() {
    if (this.source) {
      this.source.disconnect();
    }
    
    // Stop all tracks in the stream
    if (this.stream && this.stream.getTracks) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    
    // No need to create a new InitializedState since we already extend it
    this.source = null;
    return this;
  }
}
