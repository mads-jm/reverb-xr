import { AudioProcessor } from '../audio/AudioProcessor.js';

document.addEventListener('DOMContentLoaded', () => {
	const audioProcessor = AudioProcessor.getInstance();

	const micOption = document.getElementById('mic-option');
	const fileOption = document.getElementById('file-option');
	const startMicButton = document.getElementById('start-mic');
	const selectFileButton = document.getElementById('select-file');

	const fileInput = document.getElementById('file-input');
	const aframeIframe = document.getElementById('aframe-iframe');

	function playPause() {
		if (count % 2 === 0) {
			count++;
			audioProcessor.play();
		} else audioProcessor.pause();
	}

	// PlayPauseBTN.addEventListener('click', () => {
	// 	if (count % 2 === 0) {
	// 		count++;
	// 		audioProcessor.play();
	// 	} else audioProcessor.pause();
	// });

	micOption.addEventListener('change', () => {
		if (micOption.checked) {
			startMicButton.disabled = false;
			selectFileButton.disabled = true;
			console.log('startMicButton.disabled startMicButton.disabled');
			audioProcessor.stop();
		}
	});

	fileOption.addEventListener('change', () => {
		if (fileOption.checked) {
			selectFileButton.disabled = false;
			startMicButton.disabled = true;
			audioProcessor.stop();
		}
	});

	startMicButton.addEventListener('click', () => {
		audioProcessor.initMicrophone();
	});

	selectFileButton.addEventListener('click', () => {
		fileInput.click();
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
