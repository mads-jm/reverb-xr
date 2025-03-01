export class MockAudioBufferSourceNode {
	constructor() {
		this.buffer = null;
		this.loop = false;
		this.playbackRate = { value: 1 };
		this.detune = { value: 0 };
		this.onended = null;
	}

	start(when = 0, offset = 0, duration) {
		// Simulate the start method
		if (this.onended) {
			setTimeout(this.onended, duration || 1000);
		}
	}

	stop(when = 0) {
		// Simulate the stop method
		if (this.onended) {
			this.onended();
		}
	}

	connect(destination) {
		return true;
	}

	disconnect() {
		return true;
	}
}
