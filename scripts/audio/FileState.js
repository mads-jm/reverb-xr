import { InitializedState } from './InitializedState.js';

/**
 * State for handling audio file playback
 * Extends the base InitializedState to inherit common functionality
 */
export class FileState extends InitializedState {
	/**
	 * @param {AudioContext} audioContext - The audio context
	 * @param {AnalyserNode} analyser - The analyzer node
	 * @param {AudioBuffer} audioBuffer - The decoded audio buffer
	 */
	constructor(audioContext, analyser, audioBuffer) {
		super(audioContext, analyser);
		this.audioBuffer = audioBuffer;
		this.gainNode = audioContext.createGain();
		this.source = audioContext.createBufferSource();
		this.source.buffer = audioBuffer;
		this.source.connect(this.analyser);
		this.analyser.connect(this.audioContext.destination);
		this.gainNode.connect(this.audioContext.destination);
		this.source.start(0);
		this.startTime = this.audioContext.currentTime;
		this.isPlaying = true;
		console.log('playback started');
	}

	/**
	 * Stops audio playback
	 * @returns {FileState} This state instance
	 */
	stop() {
		if (this.source) {
			this.source.stop(0);
			this.source.disconnect();
			this.source = null;
			this.isPlaying = false;
		}
		return this;
	}

	/**
	 * Pauses audio playback
	 */
	pause() {
		if (this.isPlaying && this.source) {
			this.stop();
			// Store current position for resuming later
			this.pauseTime = this.audioContext.currentTime - this.startTime;
			this.isPlaying = false;
		}
	}

	/**
	 * Resumes audio playback from paused position
	 */
	play() {
		if (!this.isPlaying && this.audioBuffer) {
			this.source = this.audioContext.createBufferSource();
			this.source.buffer = this.audioBuffer;
			this.source.connect(this.analyser);
			
			// Start playback from the saved position
			const offset = this.pauseTime || 0;
			this.source.start(0, offset);
			this.startTime = this.audioContext.currentTime - offset;
			this.isPlaying = true;
		}
	}
}
