document.addEventListener('DOMContentLoaded', () => {
  const audioProcessor = new AudioProcessor();

  const micOption = document.getElementById('mic-option');
  const fileOption = document.getElementById('file-option');
  const startMicButton = document.getElementById('start-mic');
  const fileInput = document.getElementById('file-input');
  const dataOutput = document.getElementById('data-output');
  const aframeIframe = document.getElementById('aframe-iframe');
  const debugCanvas = document.getElementById('debug-canvas');

  micOption.addEventListener('change', () => {
    if (micOption.checked) {
      startMicButton.disabled = false;
      fileInput.disabled = true;
      audioProcessor.stopCurrentSource();
      dataOutput.textContent = '';
    }
  });

  fileOption.addEventListener('change', () => {
    if (fileOption.checked) {
      fileInput.disabled = false;
      startMicButton.disabled = true;
      audioProcessor.stopCurrentSource();
      dataOutput.textContent = '';
    }
  });

  startMicButton.addEventListener('click', () => {
    audioProcessor.initMicrophone();
  });

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      audioProcessor.initFile(file);
    }
  });

  function sendAudioDataToAFrame() {
    const frequencyData = audioProcessor.getFrequencyDataForAPI();
    aframeIframe.contentWindow.postMessage({ type: 'frequencyData', data: frequencyData }, '*');
    requestAnimationFrame(sendAudioDataToAFrame);
  }

  sendAudioDataToAFrame();
});
