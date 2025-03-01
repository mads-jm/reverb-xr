// scripts/visualizer.js

/**
 * Audio visualizer component for A-Frame
 * Processes audio data and displays it as visual effects
 */
AFRAME.registerComponent('audio-visualizer', {
    schema: {
      analyserNode: { type: 'selector' },
      visualizationType: { type: 'string', default: 'frequency' },
      fftSize: { type: 'int', default: 2048 },
      smoothingTimeConstant: { type: 'number', default: 0.8 },
      colorScheme: { type: 'string', default: 'rainbow' },
      geometryWidth: { type: 'number', default: 1 },
      geometryHeight: { type: 'number', default: 1 },
      widthSegments: { type: 'int', default: 64 },
      heightSegments: { type: 'int', default: 64 },
      adaptiveQuality: { type: 'boolean', default: true },
      qualityThreshold: { type: 'number', default: 60 } // Target FPS
    },
    
    init: function() {
      // Create a data texture for audio data if not using GPU processor
      this.audioDataArray = new Float32Array(this.data.fftSize / 2);
      
      // Make sure texture format is compatible with all browsers
      this.audioDataTexture = new THREE.DataTexture(
        this.audioDataArray,
        this.audioDataArray.length,
        1,
        THREE.RedFormat || THREE.LuminanceFormat, // Fallback format for compatibility
        THREE.FloatType
      );
      this.audioDataTexture.needsUpdate = true;
      
      // Create a custom shader material with error handling
      try {
        const vertexShader = this.getVertexShader();
        const fragmentShader = this.getFragmentShader();
        
        console.log("Initializing shader material");
        
        this.material = new THREE.ShaderMaterial({
          uniforms: {
            audioData: { value: this.audioDataTexture },
            dataLength: { value: this.audioDataArray.length },
            time: { value: 0 },
            colorScheme: { value: this.getColorSchemeValue() }
          },
          vertexShader: vertexShader,
          fragmentShader: fragmentShader
        });
        
        // Set up FPS monitoring for adaptive quality
        this.frameCount = 0;
        this.lastTime = 0;
        this.fps = 0;
        this.adaptiveQualityEnabled = this.data.adaptiveQuality;
        
        // Create or update the geometry
        this.updateGeometry();
        
        // Apply material to the entity's mesh
        const mesh = this.el.getOrCreateObject3D('mesh');
        mesh.material = this.material;
        
        // Initialize the analyzer if provided
        this.initAnalyser();
      } catch (error) {
        console.error("Error creating shader material:", error);
        
        // Fallback to basic material if shader fails
        this.material = new THREE.MeshBasicMaterial({ 
          color: 0x00ff00,
          wireframe: true 
        });
        
        const mesh = this.el.getOrCreateObject3D('mesh');
        mesh.material = this.material;
      }
    },
    
    update: function(oldData) {
      // Handle component updates
      this.updateGeometry();
      
      // If the analyzer node reference changed, reinitialize
      if (oldData.analyserNode !== this.data.analyserNode) {
        this.initAnalyser();
      }
      
      // Update shader if visualization type changed
      if (oldData.visualizationType !== this.data.visualizationType) {
        this.material.fragmentShader = this.getFragmentShader();
        this.material.needsUpdate = true;
      }
      
      // Update color scheme uniform if it changed
      if (oldData.colorScheme !== this.data.colorScheme) {
        this.material.uniforms.colorScheme.value = this.getColorSchemeValue();
      }
      
      // Update geometry if relevant properties changed
      if (oldData.geometryWidth !== this.data.geometryWidth ||
          oldData.geometryHeight !== this.data.geometryHeight ||
          oldData.widthSegments !== this.data.widthSegments ||
          oldData.heightSegments !== this.data.heightSegments) {
        this.updateGeometry();
      }
      
      // Update adaptive quality setting
      if (oldData.adaptiveQuality !== this.data.adaptiveQuality) {
        this.adaptiveQualityEnabled = this.data.adaptiveQuality;
        // Reset segments to default if adaptive quality was just enabled
        if (this.adaptiveQualityEnabled && !oldData.adaptiveQuality) {
          this.currentWidthSegments = this.data.widthSegments;
          this.currentHeightSegments = this.data.heightSegments;
          this.updateGeometry();
        }
      }
      
      // Update quality threshold
      if (oldData.qualityThreshold !== this.data.qualityThreshold) {
        this.qualityThreshold = this.data.qualityThreshold;
      }
    },
    
    tick: function(time, deltaTime) {
      // Only log occasionally to avoid flooding the console
      // if (time % 1000 < 16) { // Log roughly once per second
      //   console.log('Visualizer tick at time:', time);
      // }
      
      if (!this.analyser && !this.audioProcessor) {
        if (time % 1000 < 16) {
          console.warn('No analyser or audioProcessor available');
        }
        return;
      }
      
      if (this.gpuProcessor) {
        // If using GPU processor, update its textures
        this.gpuProcessor.updateTextureData();
        
        // Update the shader uniform with the appropriate texture
        if (this.data.visualizationType === 'frequency') {
          this.material.uniforms.audioData.value = this.gpuProcessor.getFrequencyDataTexture();
        } else {
          this.material.uniforms.audioData.value = this.gpuProcessor.getTimeDomainDataTexture();
        }
      } else if (this.analyser) {
        // Update audio data the standard way
        if (this.data.visualizationType === 'frequency') {
          this.analyser.getFloatFrequencyData(this.audioDataArray);
        } else {
          this.analyser.getFloatTimeDomainData(this.audioDataArray);
        }
        
        // Update the data texture
        this.audioDataTexture.needsUpdate = true;
      }
      
      // Update time uniform
      this.material.uniforms.time.value = time * 0.001; // Convert to seconds
      
      // Calculate FPS for adaptive quality
      this.frameCount++;
      if (time > this.lastTime + 1000) { // Update every second
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastTime = time;
        
        // Log FPS
        // console.log('Current FPS:', this.fps);
        
        // Adjust geometry resolution based on performance
        if (this.adaptiveQualityEnabled) {
          this.adjustGeometryResolution();
        }
      }
    },
    
    // Initialize the audio analyzer
    initAnalyser: function() {
      console.log('Initializing audio analyser...');
      if (!this.data.analyserNode) {
        console.warn('No analyser node provided');
        return;
      }
      
      console.log('Analyser node found:', this.data.analyserNode);
      
      // Get the analyzer from the provided element
      if (this.data.analyserNode.components && this.data.analyserNode.components.audioProcessor) {
        console.log('Using audioProcessor component analyser');
        this.analyser = this.data.analyserNode.components.audioProcessor.analyser;
      } else if (this.data.analyserNode.gpuAudioProcessor) {
        // Use the GPUAudioProcessor if available
        console.log('Using gpuAudioProcessor');
        this.gpuProcessor = this.data.analyserNode.gpuAudioProcessor;
        this.analyser = this.gpuProcessor.analyser;
        
        // Use the texture data directly from the GPU processor
        if (this.data.visualizationType === 'frequency') {
          this.material.uniforms.audioData.value = this.gpuProcessor.getFrequencyDataTexture();
        } else {
          this.material.uniforms.audioData.value = this.gpuProcessor.getTimeDomainDataTexture();
        }
      } else if (this.data.analyserNode.analyser) {
        console.log('Using direct analyser property');
        this.analyser = this.data.analyserNode.analyser;
      } else if (this.data.analyserNode.components && this.data.analyserNode.components['audio-processor']) {
        console.log('Using audio-processor component');
        // Add support for our custom audio-processor component
        const audioProcessor = this.data.analyserNode.components['audio-processor'];
        
        // Set up event listener for audio data updates
        this.data.analyserNode.addEventListener('audiodata-updated', this.handleAudioDataUpdate.bind(this));
        
        // Store reference to the audio processor
        this.audioProcessor = audioProcessor;
        console.log('Audio processor component found and event listener added');
      } else {
        console.warn('No compatible audio analyzer found on the provided node');
      }
      
      // Configure the analyzer if we found one
      if (this.analyser) {
        console.log('Configuring analyser with fftSize:', this.data.fftSize);
        this.analyser.fftSize = this.data.fftSize;
        this.analyser.smoothingTimeConstant = this.data.smoothingTimeConstant;
        
        // Update the uniform with the data length
        this.material.uniforms.dataLength.value = this.analyser.frequencyBinCount;
      }
    },
    
    // Add a new method to handle audio data updates from our custom audio-processor
    handleAudioDataUpdate: function(event) {
      // console.log('Audio data updated event received');
      
      // Get the data from the event
      const { frequencyData, timeDomainData } = event.detail;
      
      // Update our audio data array based on visualization type
      if (this.data.visualizationType === 'frequency') {
        // console.log('Updating frequency data, length:', frequencyData.length);
        
        // Convert Uint8Array to Float32Array and normalize values
        for (let i = 0; i < Math.min(this.audioDataArray.length, frequencyData.length); i++) {
          // Convert from 0-255 to -100-0 dB range (approximate)
          this.audioDataArray[i] = (frequencyData[i] / 255.0 * 100.0) - 100.0;
        }
      } else {
        // console.log('Updating time domain data, length:', timeDomainData.length);
        
        // Convert Uint8Array to Float32Array and normalize values
        for (let i = 0; i < Math.min(this.audioDataArray.length, timeDomainData.length); i++) {
          // Convert from 0-255 to -1.0-1.0 range
          this.audioDataArray[i] = (timeDomainData[i] / 128.0) - 1.0;
        }
      }
      
      // Update the data texture
      this.audioDataTexture.needsUpdate = true;
    },
    
    // Create or update the geometry for the visualization
    updateGeometry: function() {
      // Initialize current segments if not set
      if (!this.currentWidthSegments) {
        this.currentWidthSegments = this.data.widthSegments;
      }
      if (!this.currentHeightSegments) {
        this.currentHeightSegments = this.data.heightSegments;
      }
      
      // Create geometry with current resolution
      const geometry = new THREE.PlaneGeometry(
        this.data.geometryWidth,
        this.data.geometryHeight,
        this.currentWidthSegments,
        this.currentHeightSegments
      );
      
      // Apply the geometry to the mesh
      const mesh = this.el.getOrCreateObject3D('mesh');
      if (mesh.geometry) mesh.geometry.dispose();
      mesh.geometry = geometry;
      
      // Log the current resolution if debugging
      console.debug(`Visualizer geometry updated: ${this.currentWidthSegments}x${this.currentHeightSegments} segments`);
    },
    
    // Adaptively adjust geometry resolution based on performance
    adjustGeometryResolution: function() {
      const targetFPS = this.data.qualityThreshold;
      const currentFPS = this.fps;
      const tolerance = 5; // FPS tolerance before making adjustments
      
      // Only adjust if FPS is significantly different from target
      if (Math.abs(currentFPS - targetFPS) > tolerance) {
        let geometryChanged = false;
        
        if (currentFPS < targetFPS - tolerance) {
          // Performance is too low, reduce resolution
          if (this.currentWidthSegments > 8) {
            this.currentWidthSegments = Math.max(8, Math.floor(this.currentWidthSegments * 0.75));
            geometryChanged = true;
          }
          if (this.currentHeightSegments > 8) {
            this.currentHeightSegments = Math.max(8, Math.floor(this.currentHeightSegments * 0.75));
            geometryChanged = true;
          }
        } else if (currentFPS > targetFPS + tolerance * 2) {
          // Performance is good, we can increase resolution up to the configured maximum
          if (this.currentWidthSegments < this.data.widthSegments) {
            this.currentWidthSegments = Math.min(this.data.widthSegments, Math.ceil(this.currentWidthSegments * 1.25));
            geometryChanged = true;
          }
          if (this.currentHeightSegments < this.data.heightSegments) {
            this.currentHeightSegments = Math.min(this.data.heightSegments, Math.ceil(this.currentHeightSegments * 1.25));
            geometryChanged = true;
          }
        }
        
        // Update geometry if resolution changed
        if (geometryChanged) {
          this.updateGeometry();
        }
      }
    },
    
    // Utility methods to generate shaders based on visualization type
    getVertexShader: function() {
      const vertexShader = `
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;
      
      console.log("Vertex shader:", vertexShader);
      return vertexShader;
    },
    
    getFragmentShader: function() {
      let shader;
      
      if (this.data.visualizationType === 'frequency') {
        shader = this.getSimplifiedFrequencyFragmentShader();
      } else {
        shader = this.getSimplifiedWaveformFragmentShader();
      }
      
      console.log("Fragment shader:", shader);
      return shader;
    },
    
    getSimplifiedFrequencyFragmentShader: function() {
      return `
        varying vec2 vUv;
        uniform sampler2D audioData;
        uniform float time;
        uniform int colorScheme;
        uniform float dataLength;
        
        // Function to convert HSL to RGB
        vec3 hsl2rgb(in vec3 hsl) {
          vec3 rgb = clamp(abs(mod(hsl.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
          return hsl.z + hsl.y * (rgb-0.5)*(1.0-abs(2.0*hsl.z-1.0));
        }
        
        // Get a color based on the scheme and value
        vec3 getColor(float value, float position) {
          if (colorScheme == 0) { // Rainbow
            return hsl2rgb(vec3(position, 0.8, 0.5));
          } else if (colorScheme == 1) { // Spectrum
            return hsl2rgb(vec3(value * 0.8, 0.8, 0.5));
          } else if (colorScheme == 2) { // Heatmap
            return hsl2rgb(vec3(0.0 + (1.0 - value) * 0.15, 0.8, value * 0.8));
          } else if (colorScheme == 3) { // Grayscale
            return vec3(value);
          } else { // White
            return vec3(1.0);
          }
        }
        
        void main() {
          // Calculate the position in the audio data array
          float index = vUv.x * dataLength;
          
          // Map the UV to a position in the texture
          vec2 audioPos = vec2(index / dataLength, 0.5);
          
          // Get audio data value, mapping from -100.0 - 0.0 dB range to 0.0 - 1.0
          float audioValue = (texture2D(audioData, audioPos).r + 100.0) / 100.0;
          
          // Normalize to ensure it's in 0-1 range
          audioValue = clamp(audioValue, 0.0, 1.0);
          
          // Height threshold based on v coordinate
          float threshold = 1.0 - vUv.y;
          
          // Set color based on whether we're above the threshold
          vec3 color;
          if (audioValue > threshold) {
            // Get brighter color based on distance above threshold
            float intensity = (audioValue - threshold) / (1.0 - threshold);
            color = getColor(audioValue, vUv.x);
            
            // Add time-based pulse
            float pulse = sin(time * 3.0 + vUv.x * 10.0) * 0.05 + 0.95;
            color *= pulse;
          } else {
            // Darker color below threshold
            color = getColor(audioValue, vUv.x) * 0.2;
          }
          
          // Add time-based shimmer
          float shimmer = sin(time * 2.0 + vUv.x * 20.0) * 0.03 + 0.97;
          color *= shimmer;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `;
    },
    
    getSimplifiedWaveformFragmentShader: function() {
      return `
        varying vec2 vUv;
        uniform sampler2D audioData;
        uniform float time;
        uniform int colorScheme;
        uniform float dataLength;
        
        // Function to convert HSL to RGB
        vec3 hsl2rgb(in vec3 hsl) {
          vec3 rgb = clamp(abs(mod(hsl.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
          return hsl.z + hsl.y * (rgb-0.5)*(1.0-abs(2.0*hsl.z-1.0));
        }
        
        // Get a color based on the scheme and value
        vec3 getColor(float value, float position) {
          if (colorScheme == 0) { // Rainbow
            return hsl2rgb(vec3(position, 0.8, 0.5));
          } else if (colorScheme == 1) { // Spectrum
            return hsl2rgb(vec3(value * 0.8 + 0.1, 0.8, 0.5));
          } else if (colorScheme == 2) { // Heatmap
            return hsl2rgb(vec3(0.0 + (1.0 - value) * 0.15, 0.8, value * 0.5 + 0.3));
          } else if (colorScheme == 3) { // Grayscale
            return vec3(value);
          } else { // White
            return vec3(1.0);
          }
        }
        
        void main() {
          // Calculate the position in the audio data array
          float index = vUv.x * dataLength;
          
          // Map the UV to a position in the texture
          vec2 audioPos = vec2(index / dataLength, 0.5);
          
          // Get audio data value (typically -1.0 to 1.0)
          float audioValue = texture2D(audioData, audioPos).r;
          
          // Calculate distance from the waveform
          float centerLine = 0.5;
          float waveAmplitude = audioValue * 0.4; // Scale the amplitude
          float waveY = centerLine + waveAmplitude;
          float distFromWave = abs(vUv.y - waveY);
          
          // Create a glow effect around the wave
          float glow = 0.02 / (distFromWave + 0.02);
          
          // Base color on position and audio value
          vec3 color = getColor(abs(audioValue), vUv.x);
          
          // Apply glow and fade with distance
          color = color * glow;
          
          // Add time-based motion
          float timeEffect = sin(time * 2.0 + vUv.x * 10.0) * 0.05;
          
          // Add a subtle background
          float backgroundIntensity = 0.05;
          vec3 backgroundColor = getColor(abs(sin(vUv.x * 3.14159 + time)), vUv.x) * backgroundIntensity;
          
          // Combine colors
          color = max(color, backgroundColor);
          
          // Apply time-based shimmer
          color *= 0.95 + sin(time * 3.0 + vUv.x * 20.0) * 0.05;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `;
    },
    
    // Convert color scheme string to numeric value for the shader
    getColorSchemeValue: function() {
      const schemes = {
        'rainbow': 0,
        'spectrum': 1,
        'heatmap': 2,
        'grayscale': 3,
        'white': 4
      };
      return schemes[this.data.colorScheme] !== undefined ? schemes[this.data.colorScheme] : 0;
    },
    
    // Clean up resources when the component is removed
    remove: function() {
      if (this.material) {
        this.material.dispose();
      }
      
      if (this.audioDataTexture) {
        this.audioDataTexture.dispose();
      }
      
      const mesh = this.el.getObject3D('mesh');
      if (mesh && mesh.geometry) {
        mesh.geometry.dispose();
      }
    }
});