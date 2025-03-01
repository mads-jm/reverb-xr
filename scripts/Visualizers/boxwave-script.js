document.addEventListener('DOMContentLoaded', () => {
	const visualizerPlane = document.getElementById('visualizer-plane');
	const mirroredVisualizerPlaneB = document.getElementById(
		'mirrored-plane-bottom'
	);
	const mirroredVisualizerPlaneF = document.getElementById(
		'mirrored-plane-front'
	);
	const mirroredVisualizerPlaneX = document.getElementById(
		'mirrored-plane-back'
	);
	const visualizerCanvas = document.getElementById('visualizer-canvas');
	const visualizerCtx = visualizerCanvas.getContext('2d');

	console.log('Canvas and context initialized');
	console.log('Visualizer Canvas:', visualizerCanvas);
	console.log('Visualizer Context:', visualizerCtx);

	visualizerPlane.setAttribute('live-canvas', 'src: #visualizer-canvas');

	function waitForComponentInitialization(callback) {
		if (visualizerPlane.components['live-canvas']) {
			callback();
		} else {
			setTimeout(() => waitForComponentInitialization(callback), 100);
		}
	}

	window.addEventListener('message', (event) => {
		if (event.data.type === 'timeDomainData') {
			console.log('Time Domain data received:', event.data.data);
			updateTimeDomainData(event.data.data);
		}
	});

	function updateTimeDomainData(timeDomainData) {
		console.log('Updating Time Domain data');

		visualizerCtx.clearRect(
			0,
			0,
			visualizerCanvas.width,
			visualizerCanvas.height
		);

		visualizerCtx.lineWidth = 2;
		visualizerCtx.beginPath();

		const sliceWidth = (visualizerCanvas.width * 1.0) / timeDomainData.length;
		let x = 0;

		for (let i = 0; i < timeDomainData.length; i++) {
			const v = timeDomainData[i] / 128.0;
			const y = (v * visualizerCanvas.height) / 2;

			const hue = v;
			const [r, g, b] = hsvToRgb(hue);
			visualizerCtx.strokeStyle = `rgb(${r}, ${g}, ${b})`;

			if (i === 0) {
				visualizerCtx.moveTo(x, y);
			} else {
				visualizerCtx.lineTo(x, y);
			}

			x += sliceWidth;
		}

		visualizerCtx.lineTo(visualizerCanvas.width, visualizerCanvas.height / 2);
		visualizerCtx.stroke();

		console.log('Canvas updated with time data');
		const texture = new THREE.CanvasTexture(visualizerCanvas);
		texture.needsUpdate = true;
		document
			.querySelector('#visualizer-plane')
			.getObject3D('mesh').material.map = texture;
		texture.center = new THREE.Vector2(0.5, 0.5);
		texture.rotation = Math.PI;
		texture.flipY = true;
		document
			.querySelector('#mirrored-plane-bottom')
			.getObject3D('mesh').material.map = texture;
		document
			.querySelector('#mirrored-plane-front')
			.getObject3D('mesh').material.map = texture;
		document
			.querySelector('#mirrored-plane-back')
			.getObject3D('mesh').material.map = texture;
		waitForComponentInitialization(() => {
			visualizerPlane.components['live-canvas'].updateTexture();
			mirroredVisualizerPlaneB.components['live-canvas'].updateTexture();
			mirroredVisualizerPlaneF.components['live-canvas'].updateTexture();
			mirroredVisualizerPlaneX.components['live-canvas'].updateTexture();
		});
	}

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
});
