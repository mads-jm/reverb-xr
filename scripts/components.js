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
		box.setAttribute('width', this.width || '1');
		box.setAttribute('height', this.height || '1');
		box.setAttribute('depth', this.depth || '0.2');
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
		camera.setAttribute('look-controls', 'enabled: true');
		camera.setAttribute('cursor', 'rayOrigin: mouse');
    // No flight in lobby pls :)
		if (window.location.href.includes('aframe.html')) {
			camera.setAttribute('wasd-controls', 'acceleration: 10; fly: false');
		} else {
			camera.setAttribute('wasd-controls', 'acceleration: 100; fly: true');
		}

		const menuItems = [
			{
				position: '-0.33 -0.67 -1.13',
				rotation: '0 8.5 0',
				id: 'hideShow',
				text: 'Hide',
				width: '0.31',
				textwidth: '1.55',
			},
			{
				position: '0 -0.67 -1.155',
				rotation: '0 0 0',
				id: 'playPause',
				text: 'Play',
				width: '0.33',
				textwidth: '1.65',
			},
			{
				position: '0.33 -0.67 -1.13',
				rotation: '0 -8.5 0',
				id: 'menu3',
				text: 'About',
				width: '0.31',
				textwidth: '1.55',
			},
			{
				position: '0.64 -0.67 -1.063',
				rotation: '0 -16.2 0',
				id: 'settings',
				text: 'Rooms',
				width: '0.3',
				textwidth: '1.5',
			},
			{
				position: '-0.64 -0.67 -1.063',
				rotation: '0 16.2 0',
				id: 'menu5',
				text: 'Settings',
				width: '0.3',
				textwidth: '1.5',
			},
			{
				position: '0 -0.35 -0.4',
				rotation: '-45 0 0',
				id: 'show',
				text: '/\\',
				width: '0.02',
				height: '0.06',
				depth: '0.1',
				visible: 'false',
				color: 'white',
			},
		];

		menuItems.forEach((item) => {
			const menuItem = document.createElement('a-entity');
			menuItem.setAttribute('position', item.position);
			menuItem.setAttribute('rotation', item.rotation);
			menuItem.setAttribute('class', 'menuItem');

			const box = document.createElement('a-box');
			box.setAttribute('id', item.id);
			box.setAttribute('position', '0 0 0');
			box.setAttribute('depth', item.depth || '0.033');
			box.setAttribute('height', item.height || '0.16');
			box.setAttribute('width', item.width);
			box.setAttribute('color', 'grey');
			box.setAttribute('shadow', 'cast: false; receive: false;');
			box.setAttribute('material', 'flatShading: false;');
			box.setAttribute('onClick', 'handleClick(this.id)');
			box.setAttribute('onmousedown', 'handleMouseDown(this)');
			box.setAttribute('onmouseup', 'handleMouseUp(this)');
			box.setAttribute('visible', item.visible || 'true');

			const text = document.createElement('a-text');
			text.setAttribute('width', item.textwidth || '1');
			text.setAttribute('value', item.text);
			text.setAttribute('align', 'center');
			text.setAttribute('color', item.color || 'blue');
			text.setAttribute('position', '0 0.015 0.05');

			box.appendChild(text);
			menuItem.appendChild(box);
			camera.appendChild(menuItem);
		});
		const subMenu = [
			{
				position: '-0.33 -0.4 -1.13',
				rotation: '0 8.5 0',
				id: 'sub1',
				text: 'Dual',
				width: '0.31',
			},
			{
				position: '0 -0.4 -1.155',
				rotation: '0 0 0',
				id: 'sub2',
				text: 'Start',
				width: '0.33',
			},
			{
				position: '0.33 -0.4 -1.13',
				rotation: '0 -8.5 0',
				id: 'sub3',
				text: 'subM3',
				width: '0.31',
			},
			{
				position: '0.64 -0.4 -1.063',
				rotation: '0 -16.2 0',
				id: 'sub4',
				text: 'Bars',
				width: '0.3',
			},
			{
				position: '-0.64 -0.4 -1.063',
				rotation: '0 16 0',
				id: 'sub5',
				text: 'Wave',
				width: '0.3',
			},
		];

		subMenu.forEach((item) => {
			const subMenu = document.createElement('a-entity');
			subMenu.setAttribute('position', item.position);
			subMenu.setAttribute('rotation', item.rotation);
			subMenu.setAttribute('class', 'subMenu');

			const box = document.createElement('a-box');
			box.setAttribute('id', item.id);
			box.setAttribute('position', '0 0 0');
			box.setAttribute('depth', '0.033');
			box.setAttribute('height', item.height || '0.16');
			box.setAttribute('width', item.width);
			box.setAttribute('color', 'grey');
			box.setAttribute('shadow', 'cast: false; receive: false;');
			box.setAttribute('material', 'flatShading: false;');
			box.setAttribute('onClick', 'handleClick(this.id)');
			box.setAttribute('onmousedown', 'handleMouseDown(this)');
			box.setAttribute('onmouseup', 'handleMouseUp(this)');
			box.setAttribute('visible', 'false');

			const text = document.createElement('a-text');
			text.setAttribute('width', item.width * 5 || '1');
			text.setAttribute('value', item.text);
			text.setAttribute('align', 'center');
			text.setAttribute('color', this.color || 'blue');
			text.setAttribute('position', '0 0.015 0.05');

			box.appendChild(text);
			subMenu.appendChild(box);
			camera.appendChild(subMenu);
		});

		// Create curved backgrounds
		const curvedImages = [
			{
				id: 'menuBackground',
				src: '../assets/grey.png',
				radius: '2.25',
				thetaLength: '42',
				height: '0.2',
				position: '0 -0.67 1.1',
				rotation: '0 159 0',
			},
			{
				id: 'subMenuBackground1',
				src: '../assets/grey.png',
				radius: '2.25',
				thetaLength: '42',
				height: '0.2',
				position: '0 -0.67 1.1',
				rotation: '0 159 0',
			},
			{
				id: 'subMenuBackground2',
				src: '../assets/grey.png',
				radius: '2.25',
				thetaLength: '42',
				height: '0.2',
				position: '0 -0.67 1.1',
				rotation: '0 159 0',
			},
			{
				id: 'subMenuBackground3',
				src: '../assets/grey.png',
				radius: '2.25',
				thetaLength: '42',
				height: '0.2',
				position: '0 -0.67 1.1',
				rotation: '0 159 0',
			},
			{
				id: 'subMenuBackground4',
				src: '../assets/grey.png',
				radius: '2.25',
				thetaLength: '42',
				height: '0.2',
				position: '0 -0.67 1.1',
				rotation: '0 159 0',
			},
		];

		curvedImages.forEach((image) => {
			const curvedImage = document.createElement('a-curvedimage');
			curvedImage.setAttribute('id', image.id);
			curvedImage.setAttribute('src', image.src);
			curvedImage.setAttribute('radius', image.radius);
			curvedImage.setAttribute('theta-length', image.thetaLength);
			curvedImage.setAttribute('height', image.height);
			curvedImage.setAttribute('position', image.position);
			curvedImage.setAttribute('rotation', image.rotation);

			camera.appendChild(curvedImage);
		});

		// Append camera to the current entity
		this.el.appendChild(camera);
	},
});
