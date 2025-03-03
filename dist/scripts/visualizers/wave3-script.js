// This script creates a circular waveform visualization as a ring around the user
// Using direct THREE.js lines instead of canvas textures for better performance

// Export a function to register the component
// This allows us to control when the component is registered
export function registerWave3Visualizer() {
	console.log('Attempting to register wave3-visualizer component');
	
	// Check if A-Frame is loaded
	if (typeof AFRAME === 'undefined') {
		console.error('A-Frame not loaded, cannot register wave3-visualizer');
		return false;
	}
	
	// Skip if already registered
	if (AFRAME.components['wave3-visualizer']) {
		console.log('wave3-visualizer already registered');
		return true;
	}
	
	// Register a component for the wave3 system
	AFRAME.registerComponent('wave3-visualizer', {
		/**
		 * Component schema definition
		 */
		schema: {
			audioProcessor: { type: 'selector', default: '#audio-processor' },
			width: { type: 'number', default: 4 }, // Width/length of the visualization lines
			height: { type: 'number', default: 10 }, // Height of the visualization
			radius: { type: 'number', default: 20 }, // Radius of the ring
			segments: { type: 'int', default: 128 }, // Number of segments in the ring
			lineWidth: { type: 'number', default: 3 }, // Line width for the waveform
			colorStart: { type: 'color', default: '#ff3232' }, // Start color
			colorMiddle: { type: 'color', default: '#32ffff' }, // Middle color
			colorEnd: { type: 'color', default: '#3232ff' }, // End color
			responsiveness: { type: 'number', default: 1.0 }, // How responsive to audio (0.1-1.0)
			breathingEffect: { type: 'boolean', default: true }, // Enable breathing/pulsing effect
			breathingSpeed: { type: 'number', default: 1.0 }, // Speed of breathing effect
			breathingIntensity: { type: 'number', default: 0.1 }, // Intensity of breathing/pulsing
			rotation: { type: 'boolean', default: true }, // Enable rotation of the entire ring
			rotationSpeed: { type: 'number', default: 1.0 }, // Rotation speed
			frequencyInfluence: { type: 'number', default: 0.3 }
		},

		/**
		 * Initialize the component
		 */
		init: function () {
			console.log('wave3-visualizer init called');
			
			// Initialize frequency analysis properties
			this.frequencyBands = {
				bass: { min: 20, max: 250 },
				midrange: { min: 250, max: 2000 },
				treble: { min: 2000, max: 20000 }
			};
			
			this.bandPowers = {
				bass: 0,
				midrange: 0,
				treble: 0
			};
			
			// Create ring visualization with THREE.js lines
			this.retryCount = 0;
			this.maxRetries = 5;
			this.createRingVisualization();

			// Reference to our rendering group
			this.group = this.el.getObject3D('mesh');

			// Store previous data for smooth transitions
			this.prevData = null;
			this.smoothingFactor = 0.3; // Lower = smoother transitions

			// Initialize animation variables
			this.animationTime = 0;
			this.breathingPhase = 0;
			this.colorPhase = 0;

			// Bind event handlers properly to maintain "this" context
			this.boundUpdateVisualization = this.updateVisualization.bind(this);
			this.boundAnimationLoop = this.animationLoop.bind(this);

			// Set up event listeners
			this.setupEventListeners();

			// Force the first render to ensure visibility
			this.forceRender();

			// Set up animation loop if using dynamic effects
			if (
				this.data.breathingEffect ||
				this.data.rotation
			) {
				this.animationFrame = requestAnimationFrame(
					this.boundAnimationLoop
				);
			}
		},

		/**
		 * Helper function to clamp a value between min and max
		 */
		clamp: function (value, min, max) {
			return Math.min(Math.max(value, min), max);
		},

		/**
		 * Set up event listeners for audio data
		 */
		setupEventListeners: function () {
			// Listen for audio data
			if (this.data.audioProcessor) {
				this.data.audioProcessor.addEventListener(
					'audiodata-updated',
					this.boundUpdateVisualization
				);
			} else {
				console.warn('wave3: No audio processor specified');
			}

			// Also listen for direct window messages (for back compatibility)
			this.messageHandler = (event) => {
				if (event.data && event.data.type === 'timeDomainData') {
					this.updateVisualization({
						detail: { timeDomainData: event.data.data },
					});
				}
			};
			window.addEventListener('message', this.messageHandler);
		},

		/**
		 * Force immediate render with dummy data for initial visibility
		 */
		forceRender: function () {
			const initialData = new Uint8Array(128);
			for (let i = 0; i < initialData.length; i++) {
				initialData[i] = 128 + Math.sin(i / 10) * 64;
			}

			this.updateVisualization({
				detail: { timeDomainData: initialData },
			});
		},

		/**
		 * Create the ring visualization using THREE.js lines
		 */
		createRingVisualization: function () {
			try {
				const { radius, height, segments, lineWidth } = this.data;

				// Create a group to hold all our lines
				const group = new THREE.Group();
				this.lines = [];
				this.lineVertices = [];

				// Create lines around the ring
				for (let i = 0; i < segments; i++) {
					// Calculate angle for this segment
					const angle = (i / segments) * Math.PI * 2;
					const x = Math.cos(angle) * radius;
					const z = Math.sin(angle) * radius;

					// Create line geometry with points for the waveform
					const points = [];
					const verticalResolution = 20; // Number of points in each line

					// Initial straight line
					for (let j = 0; j < verticalResolution; j++) {
						const y = (j / (verticalResolution - 1)) * height - height / 2;
						points.push(new THREE.Vector3(0, y, 0));
					}

					// Create geometry from points
					const geometry = new THREE.BufferGeometry().setFromPoints(points);

					// Create gradient material
					const color = this.getColorForPosition(i / segments);
					const material = new THREE.LineBasicMaterial({
						color: color,
						linewidth: lineWidth,
						transparent: true,
						opacity: 0.8,
					});

					// Create line mesh
					const line = new THREE.Line(geometry, material);

					// Position and rotate around the ring
					line.position.set(x, 0, z);
					line.lookAt(0, 0, 0);

					// Store line and its vertices
					group.add(line);
					this.lines.push(line);
					this.lineVertices.push(points);
				}

				// Set the group as the object3D
				this.el.setObject3D('mesh', group);

				// If successful, reset retry count
				this.retryCount = 0;
				console.log('Wave3 visualization created successfully');
			} catch (error) {
				console.error('Error creating wave3 visualization:', error);

				// If we have retries left, try again after a delay
				if (this.retryCount < this.maxRetries) {
					this.retryCount++;
					console.log(
						`Retrying wave3 visualization creation (${this.retryCount}/${this.maxRetries})...`
					);
					setTimeout(() => this.createRingVisualization(), 500);
				}
			}
		},

		/**
		 * Get a color for a position in the ring (0-1)
		 */
		getColorForPosition: function (position) {
			// Convert position (0-1) to one of three color sections
			if (position < 0.33) {
				// Blend from start to middle
				const t = position / 0.33;
				return this.lerpColor(
					this.data.colorStart,
					this.data.colorMiddle,
					t
				);
			} else if (position < 0.66) {
				// Blend from middle to end
				const t = (position - 0.33) / 0.33;
				return this.lerpColor(this.data.colorMiddle, this.data.colorEnd, t);
			} else {
				// Blend from end back to start
				const t = (position - 0.66) / 0.34;
				return this.lerpColor(this.data.colorEnd, this.data.colorStart, t);
			}
		},

		/**
		 * Linear interpolation between two colors
		 */
		lerpColor: function (colorA, colorB, t) {
			const colorAObj = new THREE.Color(colorA);
			const colorBObj = new THREE.Color(colorB);

			const r = colorAObj.r + (colorBObj.r - colorAObj.r) * t;
			const g = colorAObj.g + (colorBObj.g - colorAObj.g) * t;
			const b = colorAObj.b + (colorBObj.b - colorAObj.b) * t;

			return new THREE.Color(r, g, b);
		},

		/**
		 * Update visualization when audio data is received
		 */
		updateVisualization: function (event) {
			if (!event.detail || !event.detail.timeDomainData || !event.detail.frequencyData || !this.lines || !this.lines.length) {
				console.warn('wave3: Missing data for update');
				return;
			}

				const timeDomainData = event.detail.timeDomainData;
			const frequencyData = event.detail.frequencyData;
				const lines = this.lines;
				const segments = this.data.segments;
				const height = this.data.height;

			// Analyze both time domain and frequency data
			this.analyzeAudioData(timeDomainData, frequencyData);

				// Apply smoothing if we have previous data
			let timeDataToUse = this.smoothData(timeDomainData);
			this.prevData = timeDataToUse.slice(0);

			// Update each line's position and properties
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				const points = line.geometry.attributes.position;
				const lineSegments = points.count;

				for (let j = 0; j < lineSegments; j++) {
					// Get base amplitude from time domain data
					const dataIndex = Math.floor((j / lineSegments) * timeDataToUse.length);
					let amplitude = (timeDataToUse[dataIndex] / 128.0 - 1.0);

					// Modify amplitude based on frequency analysis
					amplitude = this.modifyAmplitudeWithFrequency(amplitude, i, j, lineSegments);

					// Calculate position with modified amplitude
					const angle = (j / lineSegments) * Math.PI * 2;
					const radiusOffset = this.calculateRadiusOffset(i, j, amplitude);
					
					points.array[j * 3] = Math.cos(angle) * (this.data.radius + radiusOffset);
					points.array[j * 3 + 1] = amplitude * height;
					points.array[j * 3 + 2] = Math.sin(angle) * (this.data.radius + radiusOffset);
				}

				// Update colors based on audio characteristics
				this.updateLineColors(line, i);
				
				points.needsUpdate = true;
			}
		},

		analyzeAudioData: function(timeDomainData, frequencyData) {
			// Calculate frequency band powers
			const sampleRate = 44100;
			const binSize = sampleRate / (frequencyData.length * 2);

			Object.keys(this.frequencyBands).forEach(band => {
				const { min, max } = this.frequencyBands[band];
				const minBin = Math.floor(min / binSize);
				const maxBin = Math.ceil(max / binSize);
				let sum = 0;
				
				for (let i = minBin; i < maxBin && i < frequencyData.length; i++) {
					const value = (frequencyData[i] + 100) / 70;
					sum += value;
				}
				
				this.bandPowers[band] = this.bandPowers[band] * 0.8 + 
									  (sum / (maxBin - minBin)) * 0.2;
			});
		},

		modifyAmplitudeWithFrequency: function(amplitude, lineIndex, pointIndex, totalPoints) {
			const { bass, midrange, treble } = this.bandPowers;
			const frequencyInfluence = this.data.frequencyInfluence;
			
			const bassInfluence = bass * Math.sin(pointIndex / totalPoints * Math.PI * 2);
			const midInfluence = midrange * Math.cos(pointIndex / totalPoints * Math.PI);
			const trebleInfluence = treble * Math.sin(pointIndex / totalPoints * Math.PI * 4);
			
			return amplitude * (1 + frequencyInfluence * (bassInfluence + midInfluence + trebleInfluence));
		},

		calculateRadiusOffset: function(lineIndex, pointIndex, amplitude) {
			const { bass, treble } = this.bandPowers;
			
			const bassOffset = bass * Math.sin(pointIndex / this.data.segments * Math.PI * 2) * 2;
			const trebleOffset = treble * Math.cos(pointIndex / this.data.segments * Math.PI * 4) * 1;
			
			return (amplitude * 2) + (bassOffset + trebleOffset) * this.data.frequencyInfluence;
		},

		updateLineColors: function(line, lineIndex) {
			const material = line.material;
			const { bass, midrange, treble } = this.bandPowers;
			
			const startColor = new THREE.Color(this.data.colorStart);
			const middleColor = new THREE.Color(this.data.colorMiddle);
			const endColor = new THREE.Color(this.data.colorEnd);
			
			const color = new THREE.Color();
			const bassWeight = Math.min(1, bass * 1.5);
			const trebleWeight = Math.min(1, treble * 1.5);
			
			color.r = startColor.r * bassWeight + middleColor.r * (1 - bassWeight - trebleWeight) + endColor.r * trebleWeight;
			color.g = startColor.g * bassWeight + middleColor.g * (1 - bassWeight - trebleWeight) + endColor.g * trebleWeight;
			color.b = startColor.b * bassWeight + middleColor.b * (1 - bassWeight - trebleWeight) + endColor.b * trebleWeight;
			
			material.color.copy(color);
		},

		smoothData: function(data) {
			const smoothed = new Uint8Array(data.length);
			const responsivenessFactor = this.data.responsiveness;
			this.smoothingFactor = 0.3 * responsivenessFactor;

			if (this.prevData && this.prevData.length === data.length) {
				for (let i = 0; i < data.length; i++) {
					smoothed[i] = this.prevData[i] * (1 - this.smoothingFactor) +
								data[i] * this.smoothingFactor;
				}
				return smoothed;
			}
			return data;
		},

		/**
		 * Animation loop for dynamic effects
		 */
		animationLoop: function (timestamp) {
			// Update animation time
			this.animationTime = timestamp || 0;
			this.breathingPhase += this.data.breathingSpeed * 0.01;
			this.colorPhase += 0.005;

			// Apply breathing effect
			if (this.data.breathingEffect && this.group) {
				const breathingFactor =
					1.0 +
					Math.sin(this.breathingPhase) * this.data.breathingIntensity;
				this.group.scale.set(
					breathingFactor,
					breathingFactor,
					breathingFactor
				);
			}

			// Apply rotation effect
			if (this.data.rotation && this.group) {
				this.group.rotation.y += this.data.rotationSpeed * 0.01;
			}

			// Continue animation loop
			this.animationFrame = requestAnimationFrame(this.boundAnimationLoop);
		},

		/**
		 * Cleanup on component removal
		 */
		remove: function () {
			// Cancel animation frame if it exists
			if (this.animationFrame) {
				cancelAnimationFrame(this.animationFrame);
				this.animationFrame = null;
			}

			// Remove event listeners
			if (this.data.audioProcessor) {
				this.data.audioProcessor.removeEventListener(
					'audiodata-updated',
					this.boundUpdateVisualization
				);
			}

			// Remove window message listener
			if (this.messageHandler) {
				window.removeEventListener('message', this.messageHandler);
				this.messageHandler = null;
			}

			// Dispose of THREE.js resources
			if (this.lines) {
				this.lines.forEach((line) => {
					if (line.geometry) line.geometry.dispose();
					if (line.material) line.material.dispose();
				});
				this.lines = [];
			}

			// Remove the object3D
			if (this.el.getObject3D('mesh')) {
				this.el.removeObject3D('mesh');
			}
		},
	});

	return true;
};
