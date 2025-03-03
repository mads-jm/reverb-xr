import sinon from 'sinon';
import { MockAnalyser } from './MockAnalyser.js';
import { MockAudioBuffer } from './MockAudioBuffer.js';
import { MockAudioBufferSourceNode } from './MockAudioBufferSourceNode.js';

export class MockAudioContext {
	constructor() {
		this.destination = new MockAudioBufferSourceNode();
		this.createAnalyser = sinon.stub().returns(new MockAnalyser());
		this.decodeAudioData = sinon.stub().returns(new Promise((resolve) => resolve(new MockAudioBuffer())));
		this.createBufferSource = sinon.stub().returns(new MockAudioBufferSourceNode());
		this.resume = sinon.stub().returns(true);
		this.stop = sinon.stub().returns(true);
	}
}

// Mock global AudioContext and webkitAudioContext
global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;
