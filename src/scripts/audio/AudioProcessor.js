import { InitializedState } from './InitializedState.js';

export class AudioProcessor {
	constructor(options = {}) {
		// limit to one instance for whole scope
		if (AudioProcessor.instance) {
			return AudioProcessor.instance;
		}
		this.audioContext = new (window.AudioContext ||
			window.webkitAudioContext)();
		this.analyser = this.audioContext.createAnalyser();
		this.analyser.fftSize = 2048;
		this.analyser.smoothingTimeConstant = 0.8;
		this.bufferLength = this.analyser.frequencyBinCount;
		this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
		this.state = new InitializedState(this.audioContext, this.analyser);
		this.isActive = false;
		this.isPlaying = true;
		this.source = null;
		this.startTime = null;
		this.debugMode = options.debugMode || false;
		AudioProcessor.instance = this;
	}

	static getInstance() {
		if (!AudioProcessor.instance) {
			AudioProcessor.instance = new AudioProcessor();
		}
		return AudioProcessor.instance;
	}

	async play() {
		this.isPlaying = true;
		this.audioContext.resume();
	}

	async pause() {
		this.isPlaying = false;
		this.audioContext.suspend();
	}

	async initMicrophone() {
		if (!this.isActive) {
			this.state = await this.state.initMicrophone();
			this.isActive = true;
			this.audioContext.resume();
			if (this.debugMode) {
				console.log('initMicrophone');
			}
		} else {
			if (this.debugMode) {
				console.log('already active');
			}
		}
	}

	async initFile(file) {
		if (!this.isActive) {
			this.state = await this.state.initFile(file);
			this.isActive = true;
			this.audioContext.resume();
			if (this.debugMode) {
				console.log('initFile:', file.name);
			}
		} else {
			if (this.debugMode) {
				console.log('already active');
			}
		}
	}

	initMockData() {
		if (!this.isActive) {
			this.state = this.state.initMockData();
			this.isActive = true;
			this.audioContext.resume();
			if (this.debugMode) {
				console.log('initMockData');
			}
		} else {
			if (this.debugMode) {
				console.log('already active');
			}
		}
	}

	stop() {
		if (this.isActive) {
			this.state = this.state.stop();
			this.isActive = false;
			if (this.debugMode) {
				console.log('Audio processing stopped');
			}
		} else {
			if (this.debugMode) {
				console.log('already inactive');
			}
		}
	}

	/**
	 * Set debug mode for the audio processor
	 * Controls logging, analyzer settings, and processing behavior
	 * 
	 * @param {boolean} enabled - Whether debug mode should be enabled
	 */
	setDebugMode(enabled) {
		// Store the previous value to detect changes
		const previousMode = this.debugMode;
		
		// Update the flag
		this.debugMode = enabled;
		
		// If this is a mode change, log it
		if (previousMode !== enabled) {
			console.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
			
			// Adjust analyzer settings for debug mode
			if (enabled) {
				// In debug mode, use more precise settings for better diagnostic data
				this.analyser.smoothingTimeConstant = 0.5; // Less smoothing for more responsive debugging
				
				// Log current state
				console.log('Audio processor state:', {
					isActive: this.isActive,
					isPlaying: this.isPlaying,
					fftSize: this.analyser.fftSize,
					smoothingTimeConstant: this.analyser.smoothingTimeConstant,
					bufferLength: this.bufferLength
				});
			} else {
				// In production mode, optimize for performance
				this.analyser.smoothingTimeConstant = 0.8; // More smoothing for better visual quality
			}
		}
		
		// If we have an active connection, logging information about it
		if (this.isActive && enabled) {
			console.log('Active audio connection with current state:', this.state);
		}
	}

	// TODO: Check if active for below functions
	getFrequencyData() {
		this._normalizeFrequencyData(this.state.getFrequencyData(this.dataArray));
		return this.dataArray;
	}

	getTimeDomainData() {
		this._normalizeTimeDomainData(this.state.getTimeDomainData(this.dataArray));
		return this.dataArray;
	}

	getFrequencyDataForAPI() {
		this._normalizeFrequencyData(this.getFrequencyData(), this.dataArray);
		return this.dataArray.slice();
	}

	getTimeDomainDataForAPI() {
		this._normalizeTimeDomainData(this.getTimeDomainData(), this.dataArray);
		return this.dataArray.slice();
	}

	getFrequencyBinCount() {
		return this.analyser.frequencyBinCount;
	}

	/**
	 * Helper function to normalize frequency data from dB (-100 to 0) to 0-255 range
	 * @param {Float32Array} sourceData - Raw frequency data (typically -100 to 0 dB)
	 * @param {Uint8Array} targetArray - Target array for normalized values
	 * @private
	 */
	_normalizeFrequencyData(sourceData, targetArray) {
		for (let i = 0; i < sourceData.length; i++) {
			// Frequency data is typically in -100 to 0 dB range
			// Map to 0-255 range, where -100dB = 0 and 0dB = 255
			const normalizedValue = (sourceData[i] + 100) / 100;
			targetArray[i] = Math.floor(Math.max(0, Math.min(255, normalizedValue * 255)));
		}
	}

	/**
	 * Helper function to normalize time domain data from -1,1 to 0-255 range
	 * @param {Float32Array} sourceData - Raw time domain data (-1 to 1)
	 * @param {Uint8Array} targetArray - Target array for normalized values
	 * @private
	 */
	_normalizeTimeDomainData(sourceData, targetArray) {
		for (let i = 0; i < sourceData.length; i++) {
			// Time domain data is in -1 to 1 range
			// Map -1.0 to 1.0 to 0-255 range
			const normalizedValue = (sourceData[i] + 1) / 2;
			targetArray[i] = Math.floor(Math.max(0, Math.min(255, normalizedValue * 255)));
		}
	}
}
