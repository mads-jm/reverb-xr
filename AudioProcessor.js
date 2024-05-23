class AudioProcessor {
  constructor() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.source = null;
    this.startTime = null;
  }

  async initMicrophone() {
    try {
      await this.resumeAudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.processAudioStream(stream);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  }

  async initFile(file) {
    try {
      await this.resumeAudioContext();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
      this.processAudioBuffer(audioBuffer);
    } catch (err) {
      console.error('Error processing audio file:', err);
    }
  }

  processAudioStream(stream) {
    this.stopCurrentSource();
    this.source = this.audioCtx.createMediaStreamSource(stream);
    this.source.connect(this.analyser);
    console.log("Microphone stream started");
  }

  processAudioBuffer(audioBuffer) {
    this.stopCurrentSource();
    this.source = this.audioCtx.createBufferSource();
    this.source.buffer = audioBuffer;
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
    this.source.start(0);
    this.startTime = this.audioCtx.currentTime;
    console.log("Audio playback started");
  }

  stopCurrentSource() {
    if (this.source) {
      this.source.disconnect();
      if (this.source.stop) {
        this.source.stop(0);
      }
      console.log("Audio source stopped");
    }
  }

  resumeAudioContext() {
    if (this.audioCtx.state === 'suspended') {
      return this.audioCtx.resume().then(() => {
        console.log("Audio context resumed");
      });
    }
    return Promise.resolve();
  }

  getFrequencyData() {
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  getTimeDomainData() {
    this.analyser.getByteTimeDomainData(this.dataArray);
    return this.dataArray;
  }

  getFrequencyDataForAPI() {
    this.getFrequencyData();
    return this.dataArray.slice();
  }

  getTimeDomainDataForAPI() {
    this.getTimeDomainData();
    return this.dataArray.slice();
  }
}
