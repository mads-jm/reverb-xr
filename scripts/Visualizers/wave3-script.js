// BoxWave Ring Visualizer
// This script creates a circular waveform visualization as a ring around the user
// Using direct THREE.js lines instead of canvas textures for better performance

document.addEventListener('DOMContentLoaded', () => {
	// Wait for A-Frame to load
	if (typeof AFRAME === 'undefined') {
		console.error('wave3 script: A-Frame not loaded');
		return;
	}

	// Register a component for the wave3 system
	AFRAME.registerComponent('wave3-visualizer', {
		/**
		 * Component schema definition
		 */
		schema: {
			audioProcessor: { type: 'selector', default: '#audio-processor' },
			width: { type: 'number', default: 4 },        // Width/length of the visualization lines
			height: { type: 'number', default: 3 },       // Height of the visualization
			radius: { type: 'number', default: 10 },      // Radius of the ring
			segments: { type: 'number', default: 64 },    // Number of segments in the ring
			lineWidth: { type: 'number', default: 4 },    // Line width for the waveform
			colorStart: { type: 'color', default: '#ff3232' },  // Start color
			colorMiddle: { type: 'color', default: '#32ffff' }, // Middle color
			colorEnd: { type: 'color', default: '#3232ff' },    // End color
			breathingEffect: { type: 'boolean', default: true }, // Enable breathing/pulsing effect
			breathingSpeed: { type: 'number', default: 0.5 },    // Speed of breathing effect
			breathingIntensity: { type: 'number', default: 0.2 }, // Intensity of breathing/pulsing
			rotation: { type: 'boolean', default: true },        // Enable rotation of the entire ring
			rotationSpeed: { type: 'number', default: 0.1 },     // Rotation speed
			colorShift: { type: 'boolean', default: true },      // Dynamic color shifting with audio
			colorShiftIntensity: { type: 'number', default: 0.5 }, // Intensity of color shifting
			responsiveness: { type: 'number', default: 0.8 }     // How responsive to audio (0.1-1.0)
		},
		
		/**
		 * Initialize the component
		 */
		init: function() {
			// Create ring visualization with THREE.js lines
			this.createRingVisualization();
			
			// Reference to our rendering group
			this.group = this.el.getObject3D('mesh');
			
			// Store previous data for smooth transitions
			this.prevData = null;
			this.smoothingFactor = 0.3; // Lower = smoother transitions
			
			// Initialize animation variables
			this.animationTime = 0;
			this.bassPower = 0;
			this.treblePower = 0;
			this.breathingPhase = 0;
			this.originalRadius = this.data.radius;
			this.colorPhase = 0;
			
			// Bind event handlers properly to maintain "this" context
			this.boundUpdateVisualization = this.updateVisualization.bind(this);
			this.boundAnimationLoop = this.animationLoop.bind(this);
			
			// Set up event listeners
			this.setupEventListeners();
			
			// Force the first render to ensure visibility
			this.forceRender();
			
			// Set up animation loop if using dynamic effects
			if (this.data.breathingEffect || this.data.rotation || this.data.colorShift) {
				this.animationFrame = requestAnimationFrame(this.boundAnimationLoop);
			}
		},
		
		/**
		 * Helper function to clamp a value between min and max
		 */
		clamp: function(value, min, max) {
			return Math.min(Math.max(value, min), max);
		},
		
		/**
		 * Set up event listeners for audio data
		 */
		setupEventListeners: function() {
			// Listen for audio data
			if (this.data.audioProcessor) {
				this.data.audioProcessor.addEventListener('audiodata-updated', this.boundUpdateVisualization);
			} else {
				console.warn('wave3: No audio processor specified');
			}
			
			// Also listen for direct window messages (for back compatibility)
			this.messageHandler = (event) => {
				if (event.data && event.data.type === 'timeDomainData') {
					this.updateVisualization({
						detail: { timeDomainData: event.data.data }
					});
				}
			};
			window.addEventListener('message', this.messageHandler);
		},
		
		/**
		 * Force immediate render with dummy data for initial visibility
		 */
		forceRender: function() {
			const initialData = new Uint8Array(128);
			for (let i = 0; i < initialData.length; i++) {
				initialData[i] = 128 + Math.sin(i / 10) * 64;
			}
			
			this.updateVisualization({
				detail: { timeDomainData: initialData }
			});
		},
		
		/**
		 * Create the ring visualization using THREE.js lines
		 */
		createRingVisualization: function() {
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
				const verticalResolution = 20;  // Number of points in each line
				
				// Initial straight line
				for (let j = 0; j < verticalResolution; j++) {
					const y = (j / (verticalResolution - 1)) * height - height/2;
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
					opacity: 0.8
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
		},
		
		/**
		 * Get a color for a position in the ring (0-1)
		 */
		getColorForPosition: function(position) {
			// Convert position (0-1) to one of three color sections
			if (position < 0.33) {
				// Blend from start to middle
				const t = position / 0.33;
				return this.lerpColor(this.data.colorStart, this.data.colorMiddle, t);
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
		lerpColor: function(colorA, colorB, t) {
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
		updateVisualization: function(event) {
			// Ensure we have data and lines to update
			if (!event.detail || !event.detail.timeDomainData || !this.lines || !this.lines.length) {
				console.warn('wave3: Missing data for update');
				return;
			}
			
			try {
				const timeDomainData = event.detail.timeDomainData;
				const lines = this.lines;
				const segments = this.data.segments;
				const height = this.data.height;
				
				// Apply responsiveness factor based on settings
				const responsivenessFactor = this.data.responsiveness;
				this.smoothingFactor = 0.3 * responsivenessFactor;
				
				// Apply smoothing if we have previous data
				let dataToUse = timeDomainData;
				if (this.prevData && this.prevData.length === timeDomainData.length) {
					dataToUse = new Uint8Array(timeDomainData.length);
					for (let i = 0; i < timeDomainData.length; i++) {
						dataToUse[i] = this.prevData[i] * (1 - this.smoothingFactor) + 
									   timeDomainData[i] * this.smoothingFactor;
					}
				}
				this.prevData = dataToUse.slice(0); // Keep a copy for next frame
				
				// Analyze audio to extract bass and treble power for expressive effects
				this.analyzeAudioPower(dataToUse);
				
				// Update each line with audio data
				for (let i = 0; i < segments; i++) {
					const line = this.lines[i];
					if (!line || !line.geometry) continue;
					
					// Get audio data for this segment
					const dataIndex = Math.floor((i / segments) * dataToUse.length);
					const value = dataToUse[dataIndex] / 128.0 - 1.0; // Convert to -1.0 to 1.0
					
					// Get position attributes
					const positions = line.geometry.getAttribute('position');
					
					// Update position attributes with more expressive movement
					for (let j = 0; j < positions.count; j++) {
						// Calculate y position (from -height/2 to height/2)
						const y = (j / (positions.count - 1)) * height - height/2;
						
						// Calculate displacement based on sine wave and audio data
						const normalizedY = (j / (positions.count - 1)) * 2 - 1; // -1 to 1
						
						// Add more expressive movement based on audio characteristics
						let displacement = Math.sin(normalizedY * Math.PI) * value * this.data.width * 0.5;
						
						// Add bass effect to make low frequencies more prominent
						if (this.bassPower > 0.6 && Math.abs(normalizedY) < 0.3) {
							displacement *= 1.0 + (this.bassPower - 0.6) * 3.0;
						}
						
						// Update position
						positions.setXYZ(j, displacement, y, 0);
					}
					
					// Mark for update
					positions.needsUpdate = true;
					
					// Apply color effects
					let lineColor;
					
					if (this.data.colorShift) {
						// Create more dynamic color based on audio levels and position
						const positionColor = this.getColorForPosition(i / segments);
						const bassFactor = Math.min(1.0, this.bassPower * 2);
						const trebleFactor = Math.min(1.0, this.treblePower * 2);
						
						// Add wave effect to color
						const waveOffset = Math.sin(i / segments * Math.PI * 6 + this.colorPhase * 3) * 0.5 + 0.5;
						const intensityFactor = this.data.colorShiftIntensity * waveOffset;
						
						// Modify color based on audio using our own clamp function
						const color = new THREE.Color(positionColor);
						color.r = this.clamp(color.r + (bassFactor * 0.3 - 0.15) * intensityFactor, 0, 1);
						color.g = this.clamp(color.g + (trebleFactor * 0.3 - 0.15) * intensityFactor, 0, 1);
						color.b = this.clamp(color.b + (waveOffset * 0.3 - 0.15) * intensityFactor, 0, 1);
						
						lineColor = color;
					} else {
						// Use standard color
						lineColor = this.getColorForPosition(i / segments);
					}
					
					// Update line material
					line.material.color = lineColor;
					
					// Dynamic opacity based on audio value and bass power
					const bassPowerFactor = 1.0 + this.bassPower * 0.5;
					line.material.opacity = 0.3 + Math.abs(value) * 0.7 * bassPowerFactor;
				}
			} catch (error) {
				console.error('wave3: Error updating visualization:', error);
			}
		},
		
		/**
		 * Analyze audio data to extract frequency characteristics
		 */
		analyzeAudioPower: function(audioData) {
			if (!audioData || audioData.length < 32) return;
			
			// Extract bass (low frequencies) - roughly the first 1/5 of samples
			let bassSum = 0;
			const bassRange = Math.floor(audioData.length / 5);
			for (let i = 0; i < bassRange; i++) {
				bassSum += Math.abs(audioData[i] / 128.0 - 1.0);
			}
			
			// Extract treble (high frequencies) - roughly the last 1/3 of samples
			let trebleSum = 0;
			const trebleStart = Math.floor(audioData.length * 2 / 3);
			for (let i = trebleStart; i < audioData.length; i++) {
				trebleSum += Math.abs(audioData[i] / 128.0 - 1.0);
			}
			
			// Normalize and smooth
			const newBassPower = Math.min(1.0, bassSum / bassRange * 2.0);
			const newTreblePower = Math.min(1.0, trebleSum / (audioData.length - trebleStart) * 2.0);
			
			// Smooth values
			this.bassPower = this.bassPower * 0.8 + newBassPower * 0.2;
			this.treblePower = this.treblePower * 0.8 + newTreblePower * 0.2;
		},
		
		/**
		 * Animation loop for dynamic effects
		 */
		animationLoop: function(timestamp) {
			// Update animation time
			this.animationTime = timestamp || 0;
			this.breathingPhase += this.data.breathingSpeed * 0.01;
			this.colorPhase += 0.005;
			
			// Apply breathing effect
			if (this.data.breathingEffect && this.group) {
				const breathingFactor = 1.0 + Math.sin(this.breathingPhase) * this.data.breathingIntensity;
				this.group.scale.set(breathingFactor, breathingFactor, breathingFactor);
			}
			
			// Apply rotation effect
			if (this.data.rotation && this.group) {
				this.group.rotation.y += this.data.rotationSpeed * 0.01;
			}
			
			// Apply color shifting if enabled (base colors will be modified in updateVisualization)
			
			// Continue animation loop
			this.animationFrame = requestAnimationFrame(this.boundAnimationLoop);
		},
		
		/**
		 * Cleanup on component removal
		 */
		remove: function() {
			// Cancel animation frame if it exists
			if (this.animationFrame) {
				cancelAnimationFrame(this.animationFrame);
				this.animationFrame = null;
			}
			
			// Remove event listeners
			if (this.data.audioProcessor) {
				this.data.audioProcessor.removeEventListener('audiodata-updated', this.boundUpdateVisualization);
			}
			
			// Remove window message listener
			if (this.messageHandler) {
				window.removeEventListener('message', this.messageHandler);
				this.messageHandler = null;
			}
			
			// Dispose of THREE.js resources
			if (this.lines) {
				this.lines.forEach(line => {
					if (line.geometry) line.geometry.dispose();
					if (line.material) line.material.dispose();
				});
				this.lines = [];
			}
			
			// Remove the object3D
			if (this.el.getObject3D('mesh')) {
				this.el.removeObject3D('mesh');
			}
		}
	});
});
