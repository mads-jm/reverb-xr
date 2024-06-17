export class MockAnalyser {
	constructor() {
		this.fftSize = 2048;
		this.smoothingTimeConstant = 0.8;
		this.frequencyBinCount = this.fftSize / 2;
		this.mockData = new Uint8Array(this.frequencyBinCount);
		this.mockData.fill(256); // Fill with some default mock data
	}

	connect(destination) {
		destination.connect(this);
	}

	disconnect(destination) {
		destination.disconnect(this);
	}

	getByteFrequencyData(array) {
		array.set(this.mockData);
	}

	getByteTimeDomainData(array) {
		array.set(this.mockData);
	}
}
