document.addEventListener("DOMContentLoaded", () => {
  const visualizer = document.querySelector("#audio-visualizer");
  let active = false;
  let binCount = 256;
  console.log("Bars script loaded");

  window.addEventListener("message", (event) => {
    if (event.data.type === "frequencyData") {
      if (!active) {
        active = true;
        createCircularBars(event.data.data, binCount);
      }
      console.log("Frequency data received:", event.data.data);
      updateBars(event.data.data);
    }
  });
  // window.addEventListener("message", (event) => {
  //   if (event.data.type === "binCount") {
  //     console.log("binCount data received:", event.data.data);
  //     binCount = event.data.data;
  //   }
  // });

function createCircularBars() {
	const visualizer = document.getElementById('audio-visualizer');
	const numberOfBars = binCount; // Adjust the number of bars to create a gap
	const radius = binCount / Math.PI; // Adjust the radius as needed
	const gap = 0.05;

	for (let i = 0; i < numberOfBars; i++) {
		const bar = document.createElement('a-box');
		const angle = (i / numberOfBars) * Math.PI * 2; // Calculate the angle for each bar

		bar.setAttribute('width', 2);
		bar.setAttribute('depth', 0.5 + (radius / numberOfBars));
		bar.setAttribute('height', 2);
		bar.setAttribute('position', {
			x: radius * Math.cos(angle),
			y: 0.5,
			z: radius * Math.sin(angle),
		});
		bar.setAttribute('rotation', {
			x: 0,
			y: -angle * (180 / Math.PI), // Rotate the bar to face the center
			z: 0,
		});
		bar.setAttribute('metalness', 0.2);
		visualizer.appendChild(bar);
	}
  console.log('Bars initialized');
}
  function updateBars(frequencyData) {
    frequencyData = smoothData(frequencyData);
    //frequencyData = compressData(frequencyData);

    const bars = visualizer.children;
    const buffer = 0.95;
    const hueRange = 180;

    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i];
      const scaleY = (frequencyData[i] / 255.0) * 10 * buffer;
      const hue = (i / frequencyData.length) * hueRange;
      const [r, g, b] = hsvToRgb(hue / hueRange);
      const hexColor = rgbToHex(r, g, b);
      bar.setAttribute("scale", {
        x: 1,
        y: scaleY,
        z: 1,
      });
      bar.setAttribute("color", hexColor);
    }
  }

function hsvToRgb(h, s = 1, v = 1) {
	let r, g, b;
	let i = Math.floor(h * 6);
	let f = h * 6 - i;
	let p = v * (1 - s);
	let q = v * (1 - f * s);
	let t = v * (1 - (1 - f) * s);
	switch (i % 6) {
		case 0:
			(r = v), (g = t), (b = p);
			break;
		case 1:
			(r = q), (g = v), (b = p);
			break;
		case 2:
			(r = p), (g = v), (b = t);
			break;
		case 3:
			(r = p), (g = q), (b = v);
			break;
		case 4:
			(r = t), (g = p), (b = v);
			break;
		case 5:
			(r = v), (g = p), (b = q);
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

  
  // setInterval(updateBars, 100);
});
