document.addEventListener("DOMContentLoaded", () => {
  const visualizer = document.querySelector("#audio-visualizer");
  console.log("A-Frame script loaded");

  window.addEventListener("message", (event) => {
    if (event.data.type === "frequencyData") {
      console.log("Frequency data received:", event.data.data);
      updateParticles(event.data.data);
    }
  });

  function createParticles() {
    const particles = document.querySelector("#particles");
    const sphereRadius = 4;
    const divisions = 100;

    for (let i = 0; i <= divisions; i++) {
      const phi = (Math.PI * i) / divisions;
      for (let j = 0; j <= divisions * 2; j++) {
        const theta = (2 * Math.PI * j) / divisions;
        const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
        const y = sphereRadius * Math.sin(phi) * Math.sin(theta);
        const z = sphereRadius * Math.cos(phi);

        const particle = document.createElement("a-sphere");
        particle.setAttribute("radius", 0.03);
        particle.setAttribute("color", "#FFFFFF");
        particle.setAttribute("position", { x, y, z });
        particle.setAttribute("initial-position", { x, y, z });

        particles.appendChild(particle);
      }
    }
  }

  function updateParticles(frequencyData) {
    frequencyData = smoothData(frequencyData);

    const particles = document.querySelector("#particles");
    const particleElements = particles.children;
    const buffer = 0.95;

    for (let i = 0; i < particleElements.length; i++) {
      const particle = particleElements[i];
      const scale = (frequencyData[i % frequencyData.length] / 255.0) * buffer;
      const initialPosition = particle.getAttribute("initial-position");

      // This moves the particles based on frequency data
      particle.setAttribute("position", {
        x: initialPosition.x * (1 + scale),
        y: initialPosition.y * (1 + scale),
        z: initialPosition.z * (1 + scale),
      });

      const hue = (i / particleElements.length) * 360;
      const [r, g, b] = hsvToRgb(hue / 360);
      const hexColor = rgbToHex(r, g, b);
      particle.setAttribute("color", hexColor);
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

  createParticles();
  setInterval(() => {
    // a placeholder, the particles will be updated through the updateParticles function with event listener
  }, 100);
});
