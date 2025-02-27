/**
 * GPUAudioProcessor - Audio analysis class with WebGL/THREE.js integration
 * Handles audio input sources and converts audio data to GPU-friendly formats
 */
class GPUAudioProcessor {
    /**
     * Create a new GPUAudioProcessor
     * @param {Object} options - Configuration options
     * @param {number} [options.fftSize=2048] - FFT size for frequency analysis
     * @param {number} [options.smoothingTimeConstant=0.8] - Smoothing factor for analysis
     * @param {boolean} [options.debugMode=false] - Enable console debugging output
     */
    constructor(options = {}) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioCtx.createAnalyser();
      
      // Configure analyser
      this.analyser.fftSize = options.fftSize || 2048;
      this.analyser.smoothingTimeConstant = options.smoothingTimeConstant || 0.8;
      
      // Create data buffers
      this.frequencyBinCount = this.analyser.frequencyBinCount;
      this.frequencyData = new Float32Array(this.frequencyBinCount);
      this.timeDomainData = new Float32Array(this.frequencyBinCount);
      
      // For debugging
      this.debugMode = options.debugMode || false;
      
      // Create data textures for WebGL
      this.frequencyDataTexture = this.createDataTexture(this.frequencyData);
      this.timeDomainDataTexture = this.createDataTexture(this.timeDomainData);
    }
    
    /**
     * Creates a THREE.js texture from audio data
     * @param {Float32Array} data - Audio data to convert to texture
     * @returns {THREE.DataTexture} Texture containing the audio data
     */
    createDataTexture(data) {
      const texture = new THREE.DataTexture(
        data,
        data.length,
        1,
        THREE.RedFormat,
        THREE.FloatType
      );
      texture.needsUpdate = true;
      return texture;
    }
    
    /**
     * Updates the internal textures with fresh audio data
     * Called each frame to get new audio analysis
     * Side-effects: Updates frequencyData, timeDomainData, and their textures
     */
    updateTextureData() {
      this.analyser.getFloatFrequencyData(this.frequencyData);
      this.analyser.getFloatTimeDomainData(this.timeDomainData);
      
      this.frequencyDataTexture.needsUpdate = true;
      this.timeDomainDataTexture.needsUpdate = true;
    }
    
    /**
     * Connects an audio source to the analyzer
     * @param {AudioNode} source - The audio source to connect
     * @param {boolean} connectToOutput - Whether to connect to audio output
     */
    connectSource(source, connectToOutput = true) {
      // First connect to the analyzer
      source.connect(this.analyser);
      
      // If connecting to output, check if we have a gain node
      if (connectToOutput) {
        if (this.gainNode) {
          // Connect through the gain node for volume control
          this.analyser.connect(this.gainNode);
          this.gainNode.connect(this.audioCtx.destination);
        } else {
          // Connect directly if no gain node exists
          this.analyser.connect(this.audioCtx.destination);
        }
        this.outputConnected = true;
      } else {
        this.outputConnected = false;
      }
      
      this.outputNode = this.analyser;
      
      if (this.debugMode) {
        console.log('Source connected:', source, 'Output connected:', this.outputConnected);
      }
    }

    /**
     * Disconnects an audio source from the analyzer
     * @param {AudioNode} source - Web Audio API source node to disconnect
     */
    disconnectSource(source) {
      source.disconnect(this.analyser);
      this.analyser.disconnect(this.audioCtx.destination);
    }

    /**
     * Returns raw frequency domain data
     * @returns {Float32Array} Frequency data in decibels (typically -100 to 0 dB)
     */
    getFrequencyData() {
      return this.frequencyData;
    }

    /**
     * Returns raw time domain data
     * @returns {Float32Array} Time domain data (values between -1 and 1)
     */
    getTimeDomainData() {
      return this.timeDomainData; 
    }

    /**
     * Returns the frequency data texture for use in shaders
     * @returns {THREE.DataTexture} Texture containing frequency data
     */
    getFrequencyDataTexture() {
      return this.frequencyDataTexture;
    }

    /**
     * Returns the time domain data texture for use in shaders
     * @returns {THREE.DataTexture} Texture containing time domain data
     */
    getTimeDomainDataTexture() {
      return this.timeDomainDataTexture;
    }

    /**
     * Cleans up all resources used by this processor
     * Should be called when the processor is no longer needed
     */
    dispose() {
      // Clean up WebGL resources
      this.frequencyDataTexture.dispose();
      this.timeDomainDataTexture.dispose();
      
      // Clean up Web Audio resources
      this.analyser.disconnect();
      this.audioCtx.close();
    }

    /**
     * Initializes microphone input
     * Side-effects: Sets currentStream and currentSource properties
     * @returns {Promise<void>} Implicit promise from async operations
     */
    initMicrophone() {
      if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            const source = this.audioCtx.createMediaStreamSource(stream);
            this.currentStream = stream;
            this.currentSource = source;
            this.connectSource(source, false);
          })
          .catch(err => console.error('Error accessing microphone:', err));
      }
    }
    
    /**
     * Initializes audio from a file
     * Side-effects: Sets currentSource property and starts playback
     * @param {File} file - The audio file to play
     */
    initFile(file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        this.audioCtx.decodeAudioData(event.target.result)
          .then(buffer => {
            const source = this.audioCtx.createBufferSource();
            source.buffer = buffer;
            this.currentSource = source;
            this.connectSource(source, true);
            source.start(0);
          })
          .catch(err => console.error('Error decoding audio data:', err));
      };
      reader.readAsArrayBuffer(file);
    }
    
    /**
     * Initializes audio from a URL (for demo or preset audio)
     * Side-effects: Sets currentSource property and starts playback
     * @param {string} url - The URL of the audio file to play
     * @returns {Promise<void>} Promise that resolves when audio starts playing
     */
    initFromUrl(url) {
      return fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.arrayBuffer();
        })
        .then(arrayBuffer => this.audioCtx.decodeAudioData(arrayBuffer))
        .then(buffer => {
          const source = this.audioCtx.createBufferSource();
          source.buffer = buffer;
          this.currentSource = source;
          this.connectSource(source, true);
          source.start(0);
          if (this.debugMode) {
            console.log('Playing audio from URL:', url);
          }
        })
        .catch(err => console.error('Error loading audio from URL:', err));
    }
    
    /**
     * Stops any currently playing audio source and resets connections
     * Side-effects: Sets currentSource and currentStream to null
     */
    stopCurrentSource() {
      // Stop any active audio source
      if (this.currentSource) {
        // For buffer source nodes that have a stop method
        if (typeof this.currentSource.stop === 'function') {
          try {
            this.currentSource.stop(0);
          } catch (e) {
            console.log('Source already stopped');
          }
        }
        
        // Disconnect the source from the analyzer
        try {
          this.disconnectSource(this.currentSource);
        } catch (e) {
          console.log('Source already disconnected');
        }
        
        this.currentSource = null;
      }
      
      // Stop any active media stream
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop());
        this.currentStream = null;
      }
      
      // Reset analyzer connections
      try {
        this.analyser.disconnect();
      } catch (e) {
        console.log('Analyzer already disconnected');
      }
      
      this.outputConnected = false;
      
      // DON'T automatically reconnect analyzer to output
      // This is what was causing the loopback with mic mode
      
      if (this.debugMode) {
        console.log('Audio source stopped and connections reset');
      }
    }
    
    /**
     * Provides frequency data optimized for visualization APIs
     * Converts raw dB values to 0-255 range with improved normalization
     * @returns {Uint8Array} Normalized frequency data in 0-255 range
     */
    getFrequencyDataForAPI() {
      // Update data from analyzer
      this.analyser.getFloatFrequencyData(this.frequencyData);
      
      const uint8Array = new Uint8Array(this.frequencyBinCount);
      
      // Debug first few values
      if (this.debugMode && this.frequencyData.length > 0) {
        console.log("Raw frequency data sample:", 
          this.frequencyData.slice(0, 5).map(v => v.toFixed(2))
        );
      }
      
      // Convert raw frequency data to normalized values
      this._normalizeFrequencyData(this.frequencyData, uint8Array);
      
      // Debug converted values
      if (this.debugMode && uint8Array.length > 0) {
        console.log("Converted frequency data sample:", 
          Array.from(uint8Array.slice(0, 5))
        );
      }
      
      return uint8Array;
    }
    
    /**
     * Helper function to normalize frequency data from dB to 0-255 range
     * @param {Float32Array} sourceData - Raw frequency data in dB
     * @param {Uint8Array} targetArray - Target array for normalized values
     * @private
     */
    _normalizeFrequencyData(sourceData, targetArray) {
      const minDB = -90;  // Treat anything below -90dB as silence
      const maxDB = -30;  // Treat -30dB as maximum loudness (adjust as needed)
      
      for (let i = 0; i < this.frequencyBinCount; i++) {
        // Clamp the value to our desired range
        const dbValue = Math.max(minDB, Math.min(maxDB, sourceData[i]));
        
        // Normalize to 0-1 range
        const normalizedValue = (dbValue - minDB) / (maxDB - minDB);
        
        // Convert to 0-255 range
        targetArray[i] = Math.round(normalizedValue * 255);
      }
    }
    
    /**
     * Provides time domain data optimized for visualization APIs
     * Converts -1 to 1 float values to 0-255 range
     * @returns {Uint8Array} Normalized time domain data in 0-255 range
     */
    getTimeDomainDataForAPI() {
      // Update data from analyzer
      this.analyser.getFloatTimeDomainData(this.timeDomainData);
      
      const uint8Array = new Uint8Array(this.frequencyBinCount);
      
      // Convert time domain data to normalized values
      this._normalizeTimeDomainData(this.timeDomainData, uint8Array);
      
      return uint8Array;
    }
    
    /**
     * Helper function to normalize time domain data from -1,1 to 0-255 range
     * @param {Float32Array} sourceData - Raw time domain data (-1 to 1)
     * @param {Uint8Array} targetArray - Target array for normalized values
     * @private
     */
    _normalizeTimeDomainData(sourceData, targetArray) {
      for (let i = 0; i < this.frequencyBinCount; i++) {
        // Time domain data is in -1 to 1 range
        // Map -1.0 to 1.0 to 0-255 range
        const normalizedValue = (sourceData[i] + 1) / 2;
        targetArray[i] = Math.floor(Math.max(0, Math.min(255, normalizedValue * 255)));
      }
    }
    
    /**
     * Enables or disables debug output to console
     * @param {boolean} enabled - Whether debug mode should be enabled
     */
    setDebugMode(enabled) {
      this.debugMode = enabled;
    }

    /**
     * Connects an external analyzer node instead of the internal one
     * @param {AnalyserNode} analyser - Web Audio analyzer node to use
     */
    connectExternalAnalyser(analyser) {
      this.analyser = analyser;
      console.log('Connected external analyzer');
    }

    /**
     * Pauses the current audio source
     * Side-effects: Pauses playback if possible
     */
    pauseCurrentSource() {
      if (this.audioCtx && this.audioCtx.state === 'running') {
        this.audioCtx.suspend();
        if (this.debugMode) {
          console.log('Audio context suspended');
        }
      }
    }
    
    /**
     * Resumes the current audio source
     * Side-effects: Resumes playback if possible
     */
    resumeCurrentSource() {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
        if (this.debugMode) {
          console.log('Audio context resumed');
        }
      }
    }

    /**
     * Sets the volume of the audio output
     * @param {number} volume - Volume level between 0 and 1
     */
    setVolume(volume) {
      if (!this.gainNode) {
        // Create a gain node if it doesn't exist
        this.gainNode = this.audioCtx.createGain();
        
        // Insert the gain node between the current output and the destination
        if (this.outputNode) {
          this.outputNode.disconnect();
          this.outputNode.connect(this.gainNode);
          this.gainNode.connect(this.audioCtx.destination);
        }
      }
      
      // Set the volume
      this.gainNode.gain.value = volume;
      
      // Store the current volume value
      this.volume = volume;
      
      if (this.debugMode) {
        console.log('Volume set to:', volume);
      }
    }

    /**
     * Ensures the audio context is in the running state
     * @returns {Promise<void>} Promise that resolves when the context is running
     */
    async ensureAudioContext() {
      // If the context is suspended, try to resume it
      if (this.audioCtx.state === 'suspended') {
        try {
          await this.audioCtx.resume();
          if (this.debugMode) {
            console.log('Audio context resumed');
          }
        } catch (err) {
          console.error('Error resuming audio context:', err);
        }
      }
      
      // If the context is closed, create a new one
      if (this.audioCtx.state === 'closed') {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.setupAnalyser();
        if (this.debugMode) {
          console.log('Created new audio context');
        }
      }
    }

    /**
     * Set up the analyzer node with current settings
     */
    setupAnalyser() {
      // Create a new analyzer
      this.analyser = this.audioCtx.createAnalyser();
      
      // Configure it with our current settings
      this.analyser.fftSize = this.fftSize || 2048;
      this.analyser.smoothingTimeConstant = this.smoothingTimeConstant || 0.8;
      
      // Update our data buffers
      this.frequencyBinCount = this.analyser.frequencyBinCount;
      this.frequencyData = new Float32Array(this.frequencyBinCount);
      this.timeDomainData = new Float32Array(this.frequencyBinCount);
      
      // Create fresh data textures
      if (this.frequencyDataTexture) {
        this.frequencyDataTexture.dispose();
      }
      if (this.timeDomainDataTexture) {
        this.timeDomainDataTexture.dispose();
      }
      
      this.frequencyDataTexture = this.createDataTexture(this.frequencyData);
      this.timeDomainDataTexture = this.createDataTexture(this.timeDomainData);
      
      // If we have a gain node, connect the analyzer to it
      if (this.gainNode) {
        this.analyser.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);
      }
    }

    /**
     * Ensures proper reconnection when switching audio sources
     * @param {boolean} connectToOutput - Whether to connect analyzer to output
     */
    reconnectAnalyzer(connectToOutput = true) {
      try {
        // First disconnect everything
        this.analyser.disconnect();
        
        // Then reconnect based on parameter
        if (connectToOutput) {
          if (this.gainNode) {
            this.analyser.connect(this.gainNode);
            this.gainNode.connect(this.audioCtx.destination);
          } else {
            this.analyser.connect(this.audioCtx.destination);
          }
          this.outputConnected = true;
        } else {
          this.outputConnected = false;
        }
        
        if (this.debugMode) {
          console.log('Analyzer reconnected, output connected:', this.outputConnected);
        }
      } catch (e) {
        console.error('Error reconnecting analyzer:', e);
      }
    }
}