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
		this.source = audioContext.createBufferSource();
		this.source.buffer = audioBuffer;
		
		// source -> analyser -> gainNode -> destination
		this.source.connect(this.analyser);
		
		this.source.start(0);
		this.startTime = this.audioContext.currentTime;
		this.isPlaying = true;
		console.log('File playback started');
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
			
			// IMPORTANT: This was the key issue - when resuming playback, we were only
			// connecting source->analyser but not ensuring the analyzer was
			// connected to the gainNode, which is needed for volume control.
			
			// First disconnect any existing connections to ensure clean routing
			try {
				this.analyser.disconnect();
			} catch (e) {
				// Ignore disconnect errors
			}
			
			// Reconnect the full audio path:
			// 1. Connect source to analyzer
			this.source.connect(this.analyser);
			
			// 2. Connect analyzer to gain node
			this.analyser.connect(this.gainNode);
			
			// 3. Ensure gain node is connected to destination
			if (!this.gainNode.numberOfOutputs) {
				this.gainNode.connect(this.audioContext.destination);
			}
			
			// 4. Apply the current volume setting again to ensure it takes effect
			console.log('Reapplying current gain value:', this.gainNode.gain.value);
			
			// Start playback from the saved position
			const offset = this.pauseTime || 0;
			this.source.start(0, offset);
			this.startTime = this.audioContext.currentTime - offset;
			this.isPlaying = true;
			console.log('File playback resumed at', offset, 'seconds');
		}
	}
}
