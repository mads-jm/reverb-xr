import { FileState } from "./FileState.js";
import { MicrophoneState } from "./MicrophoneState.js";

export class InitializedState {
  constructor(audioContext, analyser) {
    this.audioContext = audioContext;
    this.analyser = analyser;
  }

  async initMicrophone() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    return new MicrophoneState(this.audioContext, this.analyser, stream);
  }
  catch(err) {
    console.log("Error accessing microphone", err);
    throw err;
  }

  async initFile(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      return new FileState(this.audioContext, this.analyser, audioBuffer);
    } catch (err) {
      console.log("Error processing audio file", err);
      throw err;
    }
  }

  initMockData() {
    this.source = this.audioContext.createBufferSource();
    const buffer = this.audioContext.createBuffer(
      1,
      this.audioContext.sampleRate * 3,
      this.audioContext.sampleRate
    );
    const data = buffer.getChannelData(0);

    // Generate mock data (e.g., sine wave or random data)
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1; // Random data between -1 and 1
    }

    this.source.buffer = buffer;
    this.source.loop = true;
    this.source.connect(this.analyser);
    this.source.start();
    console.log("Mock data initialized");
    return this;
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      if (this.source.stop) {
        this.source.stop(0);
      }
      console.log("Audio source stopped");
    }
  }

  getFrequencyData(dataArray) {
    this.analyser.getByteFrequencyData(dataArray);
  }

  getTimeDomainData(dataArray) {
    this.analyser.getByteTimeDomainData(dataArray);
  }
}
