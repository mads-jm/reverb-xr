import { assert } from 'chai';
import { AudioProcessor} from '../audio/AudioProcessor.js';
import { InitializedState } from '../audio/InitializedState.js';
import { MicrophoneState } from '../audio/MicrophoneState.js';
import { FileState } from '../audio/FileState.js';
import { MockFile} from './mock/MockFile.js';
import { MockAudioContext } from './mock/MockAudioContext.js';

describe('AudioProcessor', () => {
  const audioProcessor = new AudioProcessor(new MockAudioContext());
  // Constructor assertions
  it('should be initialized with the correct state', () => {
    assert.instanceOf(audioProcessor.state, InitializedState);
  });
  it('should be initialized as inactive', () => {
    assert.isFalse(audioProcessor.isActive);
  });

  // init Assertions
  it('should properly initialize the file state', async () => {
    const mockData = ['file content'];
		const mockFile = new MockFile(mockData, 'test.txt', {
				type: 'text/plain',
		});
    await audioProcessor.initFile(mockFile);
    assert.isTrue(audioProcessor.isActive);
    assert.instanceOf(audioProcessor.state, FileState);
  });

  it('should properly stop the file state', async () => {
    audioProcessor.stop();
    assert.isFalse(audioProcessor.isActive);
    assert.instanceOf(audioProcessor.state, InitializedState);
  });

  // it('should properly initialize the microphone state', async () => {
  //   await audioProcessor.initMicrophone();
  // });
});