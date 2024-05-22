document.addEventListener('DOMContentLoaded', () => {
  const visualizerPlane = document.getElementById('visualizer-plane');
  const visualizerCanvas = document.getElementById('visualizer-canvas');
  const visualizerCtx = visualizerCanvas.getContext('2d');

  console.log('Canvas and context initialized');
  console.log('Visualizer Canvas:', visualizerCanvas);
  console.log('Visualizer Context:', visualizerCtx);

  // Ensure the canvas is available before setting the attribute
  visualizerPlane.setAttribute('live-canvas', 'src: #visualizer-canvas');

  function waitForComponentInitialization(callback) {
    if (visualizerPlane.components['live-canvas']) {
      callback();
    } else {
      setTimeout(() => waitForComponentInitialization(callback), 100);
    }
  }

  window.addEventListener('message', (event) => {
    if (event.data.type === 'frequencyData') {
      console.log('Frequency data received:', event.data.data);
      updateFrequencyData(event.data.data);
    }
  });

  function updateFrequencyData(frequencyData) {
    console.log('Updating frequency data');
    visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    visualizerCtx.fillStyle = 'rgb(40, 44, 52)';
    visualizerCtx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

    const barWidth = (visualizerCanvas.width / frequencyData.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      barHeight = frequencyData[i] / 255.0 * visualizerCanvas.height;
      const hue = (i / frequencyData.length) * 360;
      const [r, g, b] = hsvToRgb(hue / 360);
      visualizerCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      visualizerCtx.fillRect(x, visualizerCanvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }

    console.log('Canvas updated with frequency data');
    waitForComponentInitialization(() => {
      visualizerPlane.components['live-canvas'].updateTexture();
    });
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
});
