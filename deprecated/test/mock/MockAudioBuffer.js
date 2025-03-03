export class MockAudioBuffer {
	constructor({
		numberOfChannels = 2,
		length = 44100,
		sampleRate = 44100,
	} = {}) {
		this.numberOfChannels = numberOfChannels;
		this.length = length;
		this.duration = length / sampleRate;
		this.sampleRate = sampleRate;
		this.mockData = new Float32Array(length);

		for (let i = 0; i < length; i++) {
			this.mockData[i] = Math.random() * 2 - 1; // Fill with random data for simplicity
		}
	}

	getChannelData(channel) {
		if (channel >= this.numberOfChannels) {
			throw new Error(
				'IndexSizeError: The channel provided exceeds the number of channels present in the AudioBuffer.'
			);
		}
		return this.mockData;
	}
}
