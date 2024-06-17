import { InitializedState } from './InitializedState.js';

export class AudioProcessor {
	constructor() {
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
			console.log('initMicrophone');
		} else {
			console.log('already active');
		}
	}

	async initFile(file) {
		if (!this.isActive) {
			this.state = await this.state.initFile(file);
			this.isActive = true;
			this.audioContext.resume();
		} else {
			console.log('already active');
		}
	}

	initMockData() {
		if (!this.isActive) {
			this.state = this.state.initMockData();
			this.isActive = true;
			this.audioContext.resume();
			console.log('initMockData');
		} else {
			console.log('already active');
		}
	}

	stop() {
		if (this.isActive) {
			this.state = this.state.stop();
			this.isActive = false;
		} else {
			console.log('already inactive');
		}
	}

	// TODO: Check if active for below functions
	getFrequencyData() {
		this.state.getFrequencyData(this.dataArray);
		return this.dataArray;
	}

	getTimeDomainData() {
		this.state.getTimeDomainData(this.dataArray);
		return this.dataArray;
	}

	getFrequencyDataForAPI() {
		this.getFrequencyData();
		return this.dataArray.slice();
	}

	getTimeDomainDataForAPI() {
		this.getTimeDomainData();
		return this.dataArray.slice();
	}

	getFrequencyBinCount() {
		return this.analyser.frequencyBinCount;
	}
}
