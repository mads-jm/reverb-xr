import { InitializedState } from "./InitializedState.js";

/**
 * State for handling microphone input
 * Extends the base InitializedState to inherit common functionality
 */
export class MicrophoneState extends InitializedState {
  /**
   * @param {AudioContext} audioContext - The audio context
   * @param {AnalyserNode} analyser - The analyzer node
   * @param {MediaStream} stream - The microphone media stream
   */
  constructor(audioContext, analyser, stream) {
    super(audioContext, analyser);
    this.stream = stream;
    this.source = audioContext.createMediaStreamSource(stream);
    this.source.connect(this.analyser);
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
