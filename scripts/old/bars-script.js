document.addEventListener("DOMContentLoaded", () => {
  const visualizer = document.querySelector("#audio-visualizer");
  const active = false;
  console.log("Bars script loaded");

  window.addEventListener("message", (event) => {
    if (event.data.type === "frequencyData") {
      console.log("Frequency data received:", event.data.data);
      updateBars(event.data.data);
    }
  });

  function createBars() {
    for (let i = -128; i < 129; i++) {
      const bar = document.createElement("a-box");
      bar.setAttribute("width", 0.1);
      bar.setAttribute("depth", 0.5);
      bar.setAttribute("height", 2);
      bar.setAttribute("position", {
        x: (i - 16) * 0.15,
        y: 0.5,
        z: -15,
      });
      bar.setAttribute("metalness", 0.2);
      visualizer.appendChild(bar);
    }
  }

  function updateBars(frequencyData) {
    frequencyData = smoothData(frequencyData);
    //frequencyData = compressData(frequencyData);

    const bars = visualizer.children;
    const buffer = 0.95;

    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i];
      const scaleY = (frequencyData[i] / 255.0) * 6 * buffer;
      const hue = (i / frequencyData.length) * 360;
      const [r, g, b] = hsvToRgb(hue / 360);
      const hexColor = rgbToHex(r, g, b);
      bar.setAttribute("scale", {
        x: 1,
        y: scaleY,
        z: 1,
      });
      bar.setAttribute("color", hexColor);
    }
  }

  function hsvToRgb(h) {
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const q = 1 - f;
    const t = f;

    switch (i % 6) {
      case 0:
        (r = 1), (g = t), (b = 0);
        break;
      case 1:
        (r = q), (g = 1), (b = 0);
        break;
      case 2:
        (r = 0), (g = 1), (b = t);
        break;
      case 3:
        (r = 0), (g = q), (b = 1);
        break;
      case 4:
        (r = t), (g = 0), (b = 1);
        break;
      case 5:
        (r = 1), (g = 0), (b = q);
        break;
    }

    return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
  }

  function rgbToHex(r, g, b) {
    return (
      "#" +
      ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
    );
  }

  function smoothData(data, windowSize = 1) {
    const smoothedData = [];
    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let count = 0;
      for (
        let j = Math.max(0, i - windowSize);
        j <= Math.min(data.length - 1, i + windowSize);
        j++
      ) {
        sum += data[j];
        count++;
      }
      smoothedData.push(sum / count);
    }
    return smoothedData;
  }

  function compressData(data, threshold = 100, ratio = 2) {
    const compressedData = data.map((value) => {
      if (value > threshold) {
        return threshold + (value - threshold) / ratio;
      }
      return value;
    });
    return compressedData;
  }

  createBars();
  setInterval(updateBars, 100);
});
