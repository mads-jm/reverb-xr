import { AudioProcessor } from './AudioProcessor.js';
/**
 * GPUAudioProcessor - Audio analysis class with WebGL/THREE.js integration
 * Handles audio input sources and converts audio data to GPU-friendly formats
 */
export class GPUAudioProcessor extends AudioProcessor {
    /**
     * Create a new GPUAudioProcessor
     * @param {Object} options - Configuration options
     * @param {number} [options.fftSize=2048] - FFT size for frequency analysis
     * @param {number} [options.smoothingTimeConstant=0.8] - Smoothing factor for analysis
     * @param {boolean} [options.debugMode=false] - Enable console debugging output
     */
    constructor(options = {}) {
      super(); // Call parent constructor to initialize base state
      
      // Get the audio context and analyzer from the parent class
      this.audioCtx = this.audioContext;
      this.analyser = this.analyser;
      
      // Update analyzer with provided options
      if (options.fftSize) this.analyser.fftSize = options.fftSize;
      if (options.smoothingTimeConstant) this.analyser.smoothingTimeConstant = options.smoothingTimeConstant;
      
      // Create data buffers for GPU-specific formats (Float32 vs Uint8 in base class)
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
      // Get fresh data
      this.analyser.getFloatFrequencyData(this.frequencyData);
      this.analyser.getFloatTimeDomainData(this.timeDomainData);
      
      this.frequencyDataTexture.needsUpdate = true;
      this.timeDomainDataTexture.needsUpdate = true;
    }
    
    /**
     * Initializes microphone input
     * Overrides base class method to add GPU-specific handling
     * @returns {Promise<void>} Promise that resolves when mic is initialized
     */
    async initMicrophone() {
      // Call the base class implementation to handle state transitions
      await super.initMicrophone();
      
      // Get fresh data for our GPU textures
      this.updateTextureData();
      
      if (this.debugMode) {
        console.log('GPU-enhanced microphone initialized');
      }
    }
    
    /**
     * Initializes audio from a file
     * Overrides base class method to add GPU-specific handling
     * @param {File} file - The audio file to play
     * @returns {Promise<void>} Promise that resolves when file is initialized
     */
    async initFile(file) {
      // Call the base class implementation to handle state transitions
      await super.initFile(file);
      
      // Get fresh data for our GPU textures
      this.updateTextureData();
      
      if (this.debugMode) {
        console.log('GPU-enhanced file playback initialized');
      }
    }
    
    /**
     * Initializes audio from a URL (for demo or preset audio)
     * New GPU-specific method not in base class
     * @param {string} url - The URL of the audio file to play
     * @returns {Promise<void>} Promise that resolves when audio starts playing
     */
    async initFromUrl(url) {
      // Fetch and decode the audio data
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        // Create and set up a source using equivalent of initFile
        // This simulates a file being loaded but from a URL
        const file = new File([arrayBuffer], "audio-from-url.mp3", {
          type: "audio/mpeg"
        });
        
        await this.initFile(file);
        
        if (this.debugMode) {
          console.log('Playing audio from URL:', url);
        }
      } catch (err) {
        console.error('Error loading audio from URL:', err);
      }
    }
    
    /**
     * Stops any currently playing audio source
     * Overrides base class method to add GPU-specific cleanup
     */
    stop() {
      // Call the base class implementation to handle state transitions
      super.stop();
      
      // Clear our GPU textures or reset them to default values
      this.frequencyData.fill(0);
      this.timeDomainData.fill(0);
      
      this.frequencyDataTexture.needsUpdate = true;
      this.timeDomainDataTexture.needsUpdate = true;
      
      if (this.debugMode) {
        console.log('GPU audio processing stopped');
      }
    }
    
    /**
     * Pauses the current audio source
     * Overrides base class method
     */
    async pause() {
      // Call the base class implementation
      await super.pause();
      
      if (this.debugMode) {
        console.log('GPU audio processing paused');
      }
    }
    
    /**
     * Resumes the current audio source
     * Overrides base class method
     */
    async play() {
      // Call the base class implementation
      await super.play();
      
      if (this.debugMode) {
        console.log('GPU audio processing resumed');
      }
    }

    /**
     * @deprecated Use stop() instead
     */
    stopCurrentSource() {
      console.warn('stopCurrentSource() is deprecated, use stop() instead');
      this.stop();
    }

    /**
     * @deprecated Use pause() instead
     */
    pauseCurrentSource() {
      console.warn('pauseCurrentSource() is deprecated, use pause() instead');
      this.pause();
    }

    /**
     * @deprecated Use play() instead
     */
    resumeCurrentSource() {
      console.warn('resumeCurrentSource() is deprecated, use play() instead');
      this.play();
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
      // Make sure we have the latest data
      this.analyser.getFloatTimeDomainData(this.timeDomainData);
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
      // First stop any active audio
      this.stop();
      
      // Clean up WebGL resources
      if (this.frequencyDataTexture) {
        this.frequencyDataTexture.dispose();
        this.frequencyDataTexture = null;
      }
      
      if (this.timeDomainDataTexture) {
        this.timeDomainDataTexture.dispose();
        this.timeDomainDataTexture = null;
      }
      
      // The base class manages the AudioContext cleanup
      // so we don't need to close it manually
      
      if (this.debugMode) {
        console.log('GPU audio processor resources disposed');
      }
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
     * Sets the volume of the audio output
     * @param {number} volume - Volume level between 0 and 1
     */
    setVolume(volume) {
      // Get the current state
      const currentState = this.state;
      
      // Use a more moderate scaling curve - square root for more audible range at low volumes
      // This makes lower volume settings more usable while still providing good control
      const scaledVolume = Math.sqrt(volume);
      
      // Store the current volume value for reference
      this.volume = volume;
      
      // Call the state's setVolume method if available
      if (currentState && typeof currentState.setVolume === 'function') {
        // The state will handle all volume implementation
        // Pass the original volume, not the scaled volume, to avoid double-scaling
        currentState.setVolume(volume);
        
        // Log for debugging
        console.log('Volume set via state method:', volume, 'Scaled volume (not used):', scaledVolume);
        
        // We've delegated volume control to the state, so no need to also do it here
        // This prevents double-application of volume changes
        return;
      }
      
      // Fallback: If state doesn't have a setVolume method, handle it here
      if (currentState && currentState.gainNode) {
        // If the state has a gain node, use it
        currentState.gainNode.gain.value = volume === 0 ? 0 : Math.max(0.0001, scaledVolume);
        console.log('Volume set directly on state gain node:', volume, 'Applied gain:', currentState.gainNode.gain.value);
      } else if (this.gainNode) {
        // Use our local gain node as fallback
        this.gainNode.gain.value = volume === 0 ? 0 : Math.max(0.0001, scaledVolume);
        console.log('Volume set on processor gain node:', volume, 'Applied gain:', this.gainNode.gain.value);
      } else {
        // Create a gain node if none exists
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = volume === 0 ? 0 : Math.max(0.0001, scaledVolume);
        
        // Connect through the state system if possible
        if (this.analyser) {
          try {
            this.analyser.disconnect();
            this.analyser.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
            console.log('Created new gain node and set up connections');
          } catch (e) {
            console.error('Error setting up gain node:', e);
          }
        }
        console.log('Created new gain node with volume:', volume, 'Applied gain:', this.gainNode.gain.value);
      }
      
      if (this.debugMode) {
        console.log('Volume set to:', volume, 'Scaled volume:', scaledVolume);
      }
    }

    /**
     * Updates the internal analyzer settings and recreates data buffers
     * Should be called after changing FFT size or other analyzer settings
     */
    updateAnalyzerSettings() {
      // Get the current fft size and smoothing
      const fftSize = this.analyser.fftSize;
      const smoothingTimeConstant = this.analyser.smoothingTimeConstant;
      
      // Store current values to restore after setup
      this.fftSize = fftSize;
      this.smoothingTimeConstant = smoothingTimeConstant;
      
      // Update our data buffers after analyzer settings change
      this.frequencyBinCount = this.analyser.frequencyBinCount;
      this.frequencyData = new Float32Array(this.frequencyBinCount);
      this.timeDomainData = new Float32Array(this.frequencyBinCount);
      
      // Recreate textures with new size
      if (this.frequencyDataTexture) {
        this.frequencyDataTexture.dispose();
      }
      if (this.timeDomainDataTexture) {
        this.timeDomainDataTexture.dispose();
      }
      
      this.frequencyDataTexture = this.createDataTexture(this.frequencyData);
      this.timeDomainDataTexture = this.createDataTexture(this.timeDomainData);
      
      if (this.debugMode) {
        console.log(`Analyzer settings updated: fftSize=${fftSize}, smoothing=${smoothingTimeConstant}`);
      }
    }

    /**
     * Set the FFT size for frequency analysis
     * @param {number} size - Must be a power of 2 between 32 and 32768
     */
    setFFTSize(size) {
      // Ensure size is a valid FFT size (power of 2)
      const validSizes = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
      if (!validSizes.includes(size)) {
        console.error('FFT size must be a power of 2 between 32 and 32768');
        return;
      }
      
      // Set the size on the analyzer
      this.analyser.fftSize = size;
      
      // Update our buffers and textures
      this.updateAnalyzerSettings();
    }

    /**
     * @deprecated Use getFrequencyDataTexture() and getTimeDomainDataTexture() instead
     */
    reconnectAnalyzer(connectToOutput = true) {
      console.warn('reconnectAnalyzer() is deprecated as it may interfere with state management');
      // Legacy implementation maintained for backward compatibility
      try {
        this.analyser.disconnect();
        
        if (connectToOutput) {
          if (this.gainNode) {
            this.analyser.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
          } else {
            this.analyser.connect(this.audioContext.destination);
          }
        }
      } catch (e) {
        console.error('Error in reconnectAnalyzer:', e);
      }
    }

    /**
     * @deprecated Use the state pattern methods instead
     */
    setupAnalyser() {
      console.warn('setupAnalyser() is deprecated as it may interfere with state management');
      this.updateAnalyzerSettings();
    }

    /**
     * @deprecated Use updateAnalyzerSettings() instead
     */
    ensureAudioContext() {
      console.warn('ensureAudioContext() is deprecated. Use updateAnalyzerSettings() instead');
      // Forward to play() which handles resuming the AudioContext
      this.play();
    }

    /**
     * Override the base class getFrequencyDataForAPI method to use our Float32 data
     * @returns {Uint8Array} Normalized frequency data in 0-255 range
     */
    getFrequencyDataForAPI() {
      // Update our Float32 data first
      this.analyser.getFloatFrequencyData(this.frequencyData);
      
      // Then convert to Uint8Array format for API compatibility
      const uint8Array = new Uint8Array(this.frequencyBinCount);
      this._normalizeFrequencyData(this.frequencyData, uint8Array);
      
      if (this.debugMode && uint8Array.length > 0) {
        console.log("Converted frequency data sample:", 
          Array.from(uint8Array.slice(0, 5))
        );
      }
      
      return uint8Array;
    }

    /**
     * Override the base class getTimeDomainDataForAPI method to use our Float32 data
     * @returns {Uint8Array} Normalized time domain data in 0-255 range
     */
    getTimeDomainDataForAPI() {
      // Update our Float32 data first
      this.analyser.getFloatTimeDomainData(this.timeDomainData);
      
      // Then convert to Uint8Array format for API compatibility
      const uint8Array = new Uint8Array(this.frequencyBinCount);
      this._normalizeTimeDomainData(this.timeDomainData, uint8Array);
      
      return uint8Array;
    }

    /**
     * Helper function to normalize frequency data from dB (-100 to 0) to 0-255 range
     * @param {Float32Array} sourceData - Raw frequency data (typically -100 to 0 dB)
     * @param {Uint8Array} targetArray - Target array for normalized values
     * @private
     */
    _normalizeFrequencyData(sourceData, targetArray) {
      for (let i = 0; i < this.frequencyBinCount; i++) {
        // Frequency data is typically in -100 to 0 dB range
        // Map to 0-255 range, where -100dB = 0 and 0dB = 255
        const normalizedValue = (sourceData[i] + 100) / 100;
        targetArray[i] = Math.floor(Math.max(0, Math.min(255, normalizedValue * 255)));
      }
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
     * Initializes mock data for testing
     * Overrides base class method
     */
    initMockData() {
      // Call the base class implementation
      super.initMockData();
      
      // Update our GPU textures
      this.updateTextureData();
      
      if (this.debugMode) {
        console.log('GPU-enhanced mock data initialized');
      }
    }
}