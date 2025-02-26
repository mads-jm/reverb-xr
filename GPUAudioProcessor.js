class GPUAudioProcessor {
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
    
    updateTextureData() {
      this.analyser.getFloatFrequencyData(this.frequencyData);
      this.analyser.getFloatTimeDomainData(this.timeDomainData);
      
      this.frequencyDataTexture.needsUpdate = true;
      this.timeDomainDataTexture.needsUpdate = true;
    }
    
    connectSource(source, connectToDestination = true) {
      source.connect(this.analyser);
      if (connectToDestination) {
        this.analyser.connect(this.audioCtx.destination);
      }
    }

    disconnectSource(source) {
      source.disconnect(this.analyser);
      this.analyser.disconnect(this.audioCtx.destination);
    }

    getFrequencyData() {
      return this.frequencyData;
    }

    getTimeDomainData() {
      return this.timeDomainData; 
    }

    getFrequencyDataTexture() {
      return this.frequencyDataTexture;
    }

    getTimeDomainDataTexture() {
      return this.timeDomainDataTexture;
    }

    dispose() {
      // Clean up WebGL resources
      this.frequencyDataTexture.dispose();
      this.timeDomainDataTexture.dispose();
      
      // Clean up Web Audio resources
      this.analyser.disconnect();
      this.audioCtx.close();
    }

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
    
    stopCurrentSource() {
      if (this.currentSource) {
        this.currentSource.stop && this.currentSource.stop(0);
        this.disconnectSource(this.currentSource);
        this.currentSource = null;
      }
      
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop());
        this.currentStream = null;
      }
    }
    
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
      
      // Convert from Float32 to Uint8 with improved normalization
      for (let i = 0; i < this.frequencyBinCount; i++) {
        // dB range from analyzer is typically -100 to 0
        // We need to normalize this to 0-255 range
        // But ensure we have a reasonable dynamic range
        
        // Adjust these thresholds based on your audio sources
        const minDB = -90;  // Treat anything below -90dB as silence
        const maxDB = -30;  // Treat -30dB as maximum loudness (adjust as needed)
        
        // Clamp the value to our desired range
        const dbValue = Math.max(minDB, Math.min(maxDB, this.frequencyData[i]));
        
        // Normalize to 0-1 range
        const normalizedValue = (dbValue - minDB) / (maxDB - minDB);
        
        // Convert to 0-255 range
        uint8Array[i] = Math.round(normalizedValue * 255);
      }
      
      // Debug converted values
      if (this.debugMode && uint8Array.length > 0) {
        console.log("Converted frequency data sample:", 
          Array.from(uint8Array.slice(0, 5))
        );
      }
      
      return uint8Array;
    }
    
    getTimeDomainDataForAPI() {
      // Update data from analyzer
      this.analyser.getFloatTimeDomainData(this.timeDomainData);
      
      const uint8Array = new Uint8Array(this.frequencyBinCount);
      
      // Convert from Float32 to Uint8
      for (let i = 0; i < this.frequencyBinCount; i++) {
        // Time domain data is in -1 to 1 range
        // Map -1.0 to 1.0 to 0-255 range
        const normalizedValue = (this.timeDomainData[i] + 1) / 2;
        uint8Array[i] = Math.floor(Math.max(0, Math.min(255, normalizedValue * 255)));
      }
      
      return uint8Array;
    }
    
    // Add a debug toggle method
    setDebugMode(enabled) {
      this.debugMode = enabled;
    }

    connectExternalAnalyser(analyser) {
      this.analyser = analyser;
      console.log('Connected external analyzer');
    }
}