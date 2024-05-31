import { AudioProcessor } from './audio/AudioProcessor.js';

document.addEventListener('DOMContentLoaded', () => {
	const audioProcessor = AudioProcessor.getInstance();

	const micOption = document.getElementById('mic-option');
	const fileOption = document.getElementById('file-option');
	const startMicButton = document.getElementById('start-mic');
	const fileInput = document.getElementById('file-input');
	const aframeIframe = document.getElementById('aframe-iframe');

	micOption.addEventListener('change', () => {
		if (micOption.checked) {
			startMicButton.disabled = false;
			fileInput.disabled = true;
			audioProcessor.stop();
		}
	});

	fileOption.addEventListener('change', () => {
		if (fileOption.checked) {
			fileInput.disabled = false;
			startMicButton.disabled = true;
			audioProcessor.stop();
		}
	});

	startMicButton.addEventListener('click', () => {
		audioProcessor.initMicrophone();
	});

	fileInput.addEventListener('change', (event) => {
		const file = event.target.files[0];
		if (file) {
			audioProcessor.initFile(file);
		}
	});

  function sendAudioDataToAFrame() {
		if (audioProcessor.isActive) {
			const frequencyData = audioProcessor.getFrequencyDataForAPI();
			const timeDomainData = audioProcessor.getTimeDomainDataForAPI();
			aframeIframe.contentWindow.postMessage(
				{ type: 'frequencyData', data: frequencyData },
				'*'
			);
			aframeIframe.contentWindow.postMessage(
				{ type: 'timeDomainData', data: timeDomainData },
				'*'
			);
		}
		requestAnimationFrame(sendAudioDataToAFrame);
	}
	
	sendAudioDataToAFrame();
});
