import { AudioProcessor } from '../audio/AudioProcessor.js';

document.addEventListener('DOMContentLoaded', () => {
	const audioProcessor = AudioProcessor.getInstance();

	const micOption = document.getElementById('mic-option');
	const fileOption = document.getElementById('file-option');
	const startMicButton = document.getElementById('start-mic');
	const selectFileButton = document.getElementById('select-file');
	const sceneSelect = document.getElementById('scene-select');

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

	// Photo Sensitivity Warning
	const modal = document.getElementById('warning-modal');
	const acceptButton = document.getElementById('accept-button');

	acceptButton.addEventListener('click', function () {
		modal.style.display = 'none';
		aframeIframe.style.display = 'block';
	});

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

	sceneSelect.addEventListener('change', () => {
		if(audioProcessor.isActive) {
			aframeIframe.src = `stage-${sceneSelect.value}.html`;
			document.getElementById('oops').style.display = 'none';
			console.log('switching to scene', sceneSelect.value);
		}else{
			document.getElementById('oops').style.display = 'inline';
			console.log('Attempted to switch scene before initializing audio');
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
	aframeIframe.contentWindow.postMessage(
		{ type: 'binCount', data: audioProcessor.getFrequencyBinCount() },
		'*'
	);
	sendAudioDataToAFrame();
});
