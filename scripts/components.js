AFRAME.registerComponent('button', {
	schema: {
		position: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
		text: { type: 'string', default: 'Click Me' },
		clickAction: { type: 'string', default: '' },
	},

	init: function () {
		console.log('Initializing button component...');

		const button = document.createElement('a-entity');

		// Create the box
		const box = document.createElement('a-box');
		box.setAttribute('width', '1');
		box.setAttribute('height', '1');
		box.setAttribute('depth', '0.2');
		box.setAttribute('color', '#7D7B7B');

		// Create the text
		const buttonText = document.createElement('a-text');
		buttonText.setAttribute('value', this.data.text);
		buttonText.setAttribute('align', 'center');
		buttonText.setAttribute('position', '0 0 0.1'); // Adjust position as needed
		buttonText.setAttribute('scale', '0.7 0.7 1');
		buttonText.setAttribute('color', 'white');
		buttonText.setAttribute('align', 'center');
		// Append box and text to the button entity
		button.appendChild(box);
		button.appendChild(buttonText);

		// Set the position of the button
		button.setAttribute('position', this.data.position);

		// Append the button entity to the component's element
		this.el.appendChild(button);

		// Add interaction listeners
		this.addInteractionListeners(button, box);

		console.log('Button appended to:', this.el);
	},

	addInteractionListeners: function (button, box) {
		const el = this.el;

		el.addEventListener('mouseenter', function () {
			box.setAttribute('color', 'white');
		});

		el.addEventListener('mouseleave', function () {
			box.setAttribute('color', '#7D7B7B');
		});

		el.addEventListener('click', function () {
			button.setAttribute('animation', {
				property: 'scale',
				to: '1.1 1.1 1.1',
				dur: 300,
				easing: 'easeInCubic',
			});

			button.addEventListener('animationcomplete', function () {
				button.setAttribute('animation', {
					property: 'scale',
					to: '1 1 1',
					dur: 200,
					easing: 'easeOutCubic',
				});
			});

			if (el.dataset.clickAction) {
				el.emit(el.dataset.clickAction);
			}
		});
	},

	update: function () {
		// Do something when component's data is updated.
	},
});

AFRAME.registerComponent('point-light', {
	init: function () {
		const light = document.createElement('a-light');
		light.setAttribute('type', 'point');
		light.setAttribute('intensity', '2');
		light.setAttribute('color', 'white');
		light.setAttribute('castShadow', 'true');
		this.el.appendChild(light);
	},
});

AFRAME.registerComponent('custom-camera', {
	init: function () {
		// Create camera entity
		const camera = document.createElement('a-camera');
		camera.setAttribute('wasd-controls', 'fly: true');

		// Create cursor entity
		const cursor = document.createElement('a-cursor');
		cursor.setAttribute('id', 'cursor');
		cursor.setAttribute(
			'animation__click',
			'property: scale; from: 0.1 0.1 0.1; to: 0.5 0.5 0.5; easing: easeInCubic; dur: 150; startEvents: click'
		);
		cursor.setAttribute(
			'animation__clickreset',
			'property: scale; to: 0.1 0.1 0.1; dur: 1; startEvents: animationcomplete__click'
		);
		cursor.setAttribute(
			'animation__fusing',
			'property: scale; from: 1 1 1; to: 0.5 0.5 0.5; easing: easeInCubic; dur: 150; startEvents: fusing'
		);

		// Append cursor to camera
		camera.appendChild(cursor);

		// Append camera to the current entity
		this.el.appendChild(camera);
	},
});
