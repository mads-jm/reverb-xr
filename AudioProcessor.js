class AudioProcessor {
  constructor() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 4096;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.source = null;
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
  }

  processAudioBuffer(audioBuffer) {
    this.stopCurrentSource();
    this.source = this.audioCtx.createBufferSource();
    this.source.buffer = audioBuffer;
    this.source.connect(this.analyser);
    this.source.start();
  }

  stopCurrentSource() {
    if (this.source) {
      this.source.disconnect();
    }
  }
// Checks to see if audio context is suspended -- on initial startup
  resumeAudioContext() {
    if (this.audioCtx.state === 'suspended') {
      return this.audioCtx.resume();
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
}