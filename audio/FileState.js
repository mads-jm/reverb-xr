import { InitializedState } from './InitializedState.js';

export class FileState {
	constructor(audioContext, analyser, audioBuffer) {
		this.audioContext = audioContext;
		this.analyser = analyser;
		this.audioBuffer = audioBuffer;
		this.gainNode = audioContext.createGain();
		this.source = audioContext.createBufferSource();
		this.source.buffer = audioBuffer;
		this.source.connect(this.analyser);
		this.analyser.connect(this.audioContext.destination);
		this.gainNode.connect(this.audioContext.destination);
		this.source.start(0);
		this.startTime = this.audioContext.currentTime;
		console.log('playback started');
	}

	stop() {
		this.source.stop(0);
		this.source.disconnect();
		return new InitializedState(this.audioContext, this.analyser);
	}

	//pause / play / playlist implementation

	getFrequencyData(dataArray) {
		return this.analyser.getByteFrequencyData(dataArray);
	}

	getTimeDomainData(dataArray) {
		return this.analyser.getByteTimeDomainData(dataArray);
	}
}
