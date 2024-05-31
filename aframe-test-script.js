import { AudioProcessor } from './audio/AudioProcessor.js';

document.addEventListener('DOMContentLoaded', () => {
	const audioProcessor = AudioProcessor.getInstance();
	audioProcessor.initMockData();

	const scene = document.querySelector('a-scene');
	const visualizer = document.querySelector('#audio-visualizer');

	function createBars() {
		for (let i = -64; i < 64; i++) {
			const bar = document.createElement('a-box');
			bar.setAttribute('width', 0.1);
			bar.setAttribute('depth', 0.1);
			bar.setAttribute('height', 2);
			bar.setAttribute('position', {
				x: (i - 16) * 0.15,
				y: 0.5,
				z: -5,
			});
			visualizer.appendChild(bar);
		}
	}

	function updateBars() {
		const frequencyData = audioProcessor.getFrequencyDataForAPI();
		const bars = visualizer.children;

		for (let i = 0; i < bars.length; i++) {
			const bar = bars[i];
			const scaleY = frequencyData[i] / 255;
			bar.setAttribute('scale', {
				x: 1,
				y: scaleY,
				z: 1,
			});
		}
	}

	createBars();
	setInterval(updateBars, 100);
});
