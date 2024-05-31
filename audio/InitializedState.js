import { MicrophoneState } from './MicrophoneState.js';
import { FileState } from './FileState.js';

export class InitializedState {
	constructor(audioContext, analyser) {
		this.audioContext = audioContext;
		this.analyser = analyser;
	}

	async initMicrophone() {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: false,
		});
		return new MicrophoneState(this.audioContext, this.analyser, stream);
	}
	catch(err) {
		console.log('Error accessing microphone', err);
		throw err;
	}

	async initFile(file) {
		try {
			const arrayBuffer = await file.arrayBuffer();
			const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
			return new FileState(this.audioContext, this.analyser, audioBuffer);
		} catch (err) {
			console.log('Error processing audio file', err);
			throw err;
		}
	}

	stop() {
		if(this.source){
			this.source.disconnect();
			if(this.source.stop){
				this.source.stop(0);
			}
			console.log('Audio source stopped');
		}
	}

	getFrequencyData(dataArray) {
		console.log('No Audio source initialized');
	}

	getTimeDomainData(dataArray) {
		console.log('No Audio source initialized');
	}
}
