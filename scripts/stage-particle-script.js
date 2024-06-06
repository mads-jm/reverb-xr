document.addEventListener("DOMContentLoaded", () => {
  const visualizer = document.querySelector("#audio-visualizer");
  const active = false;
  console.log("Bars script loaded");

  window.addEventListener("message", (event) => {
    if (event.data.type === "frequencyData") {
      console.log("Frequency data received:", event.data.data);
      updateParticles(event.data.data);
    }
  });

  function createParticles() {
    const particleGeometry = new THREE.SphereGeometry(0.03, 10, 10);
    const particleMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
    });
    const particles = new THREE.Group();
    const sphereRadius = 5;
    const divisions = 100;
    for (let i = 0; i <= divisions; i++) {
      const phi = (Math.PI * i) / divisions;
      for (let j = 0; j <= divisions * 2; j++) {
        const theta = (2 * Math.PI * j) / divisions;
        const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
        const y = sphereRadius * Math.sin(phi) * Math.sin(theta);
        const z = sphereRadius * Math.cos(phi);
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.set(x, y, z);
        particle.userData.initialPosition = { x, y, z }; //stores initial position
        particles.add(particle);
      }
    }

    scene.add(particles);
  }

  function updateParticles(frequencyData) {
    frequencyData = smoothData(frequencyData);

    const particles = scene.children.find((child) => child.type === "Group");
    const buffer = 0.95;

    for (let i = 0; i < particles.children.length; i++) {
      const particle = particles.children[i];
      const scale = (frequencyData[i % frequencyData.length] / 255.0) * buffer;
      const initialPosition = particle.userData.initialPosition;

      //this moves the particles based on frequency data
      particle.position.set(
        initialPosition.x * (1 + scale),
        initialPosition.y * (1 + scale),
        initialPosition.z * (1 + scale)
      );

      const hue = (i / particles.children.length) * 360;
      const [r, g, b] = hsvToRgb(hue / 360);
      const hexColor = rgbToHex(r, g, b);
      particle.material.color.set(hexColor);
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
    //a placeholder,the particles will be updated through the updateParticles function with event listener
  }, 100);
});

//create the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 10;

//lighting
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

//mouse movement
let mouseX = 0;
let mouseY = 0;

document.addEventListener("mousemove", (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

  camera.position.x = mouseX * 10;
  camera.position.y = mouseY * 10;
  camera.lookAt(scene.position);
});
