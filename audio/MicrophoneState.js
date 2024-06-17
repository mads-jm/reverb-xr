import { InitializedState } from "./InitializedState.js";

export class MicrophoneState {
  constructor(audioContext, analyser, stream) {
    this.audioContext = audioContext;
    this.analyser = analyser;
    this.stream = stream;
    this.source = audioContext.createMediaStreamSource(stream);
    this.source.connect(this.analyser);
  }

  stop() {
    this.source.disconnect();
    return new InitializedState(this.audioContext, this.analyser);
  }

  getFrequencyData(dataArray) {
    this.analyser.getByteFrequencyData(dataArray);
    return this.dataArray;
  }

  getTimeDomainData(dataArray) {
    this.analyser.getByteTimeDomainData(dataArray);
    return this.dataArray;
  }
}
