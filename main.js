document.addEventListener('DOMContentLoaded', () => {
	const audioProcessor = new AudioProcessor();

	const micOption = document.getElementById('mic-option');
	const fileOption = document.getElementById('file-option');
	const startMicButton = document.getElementById('start-mic');
	const fileInput = document.getElementById('file-input');
	const dataOutput = document.getElementById('data-output');
	const waveformCanvas = document.getElementById('waveform-visualizer');
	const frequencyCanvas = document.getElementById('frequency-visualizer');
	const waveformCtx = waveformCanvas.getContext('2d');
	const frequencyCtx = frequencyCanvas.getContext('2d');

	// Function to resize canvas based on window size
	function resizeCanvas() {
		waveformCanvas.width = waveformCanvas.clientWidth;
		waveformCanvas.height = waveformCanvas.clientHeight;
		frequencyCanvas.width = frequencyCanvas.clientWidth;
		frequencyCanvas.height = frequencyCanvas.clientHeight;
	}

	// Call resizeCanvas initially and whenever the window is resized
	window.addEventListener('resize', resizeCanvas);
	resizeCanvas();

	micOption.addEventListener('change', () => {
		startMicButton.disabled = !micOption.checked;
		fileInput.disabled = micOption.checked;
		dataOutput.textContent = '';
	});

	fileOption.addEventListener('change', () => {
		fileInput.disabled = !fileOption.checked;
		startMicButton.disabled = fileOption.checked;
		dataOutput.textContent = '';
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

	function draw() {
		requestAnimationFrame(draw);

		// Draw the waveform
		const timeDomainData = audioProcessor.getTimeDomainData();
		dataOutput.textContent = timeDomainData.join(', ');

		waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height); // Clear the canvas
		waveformCtx.fillStyle = 'rgb(40, 44, 52)';
		waveformCtx.fillRect(0, 0, waveformCanvas.width, waveformCanvas.height);

		waveformCtx.lineWidth = 2;
		waveformCtx.beginPath();

		const sliceWidth = (waveformCanvas.width * 1.0) / timeDomainData.length;
		let x = 0;

		for (let i = 0; i < timeDomainData.length; i++) {
			const v = timeDomainData[i] / 128.0;
			const y = (v * waveformCanvas.height) / 2;

			const hue = v;
			const [r, g, b] = hsvToRgb(hue);
			waveformCtx.strokeStyle = `rgb(${r}, ${g}, ${b})`;

			if (i === 0) {
				waveformCtx.moveTo(x, y);
			} else {
				waveformCtx.lineTo(x, y);
			}

			x += sliceWidth;
		}

		waveformCtx.lineTo(waveformCanvas.width, waveformCanvas.height / 2);
		waveformCtx.stroke();

		// Draw the frequency spectrum
		const frequencyData = audioProcessor.getFrequencyData();

		frequencyCtx.clearRect(0, 0, frequencyCanvas.width, frequencyCanvas.height);
		frequencyCtx.fillStyle = 'rgb(40, 44, 52)';
		frequencyCtx.fillRect(0, 0, frequencyCanvas.width, frequencyCanvas.height);

		const barWidth = (frequencyCanvas.width / frequencyData.length) * 2.5;
		let barHeight;
		x = 0;

		for (let i = 0; i < frequencyData.length; i++) {
			barHeight = (frequencyData[i] / 255.0) * frequencyCanvas.height;

			const hue = (i / frequencyData.length) * 360;
			const [r, g, b] = hsvToRgb(hue / 360);
			frequencyCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
			frequencyCtx.fillRect(
				x,
				frequencyCanvas.height - barHeight,
				barWidth,
				barHeight
			);

			x += barWidth + 1;
		}
	}

	draw();
});

// Simplified HSV to RGB function
function hsvToRgb(h) {
	let r, g, b;

	const i = Math.floor(h * 6);
	const f = h * 6 - i;
	const q = 1 - f;
	const t = f;

	switch (i % 6) {
		case 0:
			(r = 1), (g = t), (b = 0);
			break;
		case 1:
			(r = q), (g = 1), (b = 0);
			break;
		case 2:
			(r = 0), (g = 1), (b = t);
			break;
		case 3:
			(r = 0), (g = q), (b = 1);
			break;
		case 4:
			(r = t), (g = 0), (b = 1);
			break;
		case 5:
			(r = 1), (g = 0), (b = q);
			break;
	}

	return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
}
