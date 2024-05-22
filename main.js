document.addEventListener('DOMContentLoaded', () => {
  const audioProcessor = new AudioProcessor();

  const micOption = document.getElementById('mic-option');
  const fileOption = document.getElementById('file-option');
  const startMicButton = document.getElementById('start-mic');
  const fileInput = document.getElementById('file-input');
  const dataOutput = document.getElementById('data-output');
  const aframeIframe = document.getElementById('aframe-iframe');
  const debugCanvas = document.getElementById('debug-canvas');
  const debugCtx = debugCanvas.getContext('2d');

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

    debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
    debugCtx.fillStyle = 'rgb(40, 44, 52)';
    debugCtx.fillRect(0, 0, debugCanvas.width, debugCanvas.height);

    const barWidth = (debugCanvas.width / frequencyData.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      barHeight = frequencyData[i] / 255.0 * debugCanvas.height;
      const hue = (i / frequencyData.length) * 360;
      const [r, g, b] = hsvToRgb(hue / 360);
      debugCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      debugCtx.fillRect(x, debugCanvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }

    dataOutput.textContent = `Frequency Data: ${frequencyData.join(', ')}`;
    
    requestAnimationFrame(sendAudioDataToAFrame);
  }

  function hsvToRgb(h) {
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const q = 1 - f;
    const t = f;

    switch (i % 6) {
      case 0:
        r = 1, g = t, b = 0;
        break;
      case 1:
        r = q, g = 1, b = 0;
        break;
      case 2:
        r = 0, g = 1, b = t;
        break;
      case 3:
        r = 0, g = q, b = 1;
        break;
      case 4:
        r = t, g = 0, b = 1;
        break;
      case 5:
        r = 1, g = 0, b = q;
        break;
    }

    return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
  }

  sendAudioDataToAFrame();
});
