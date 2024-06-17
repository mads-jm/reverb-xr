document.addEventListener("DOMContentLoaded", () => {
  const disk = document.querySelector("#particle-disk");
  const centralSphere = document.querySelector("#central-sphere");
  let latestFrequencyData = [];
  let initialRotation = { x: 0, y: 0, z: 0 }; // Initial rotation values
  let particleRotationSpeeds = [];
  let particleInitialPositions = [];
  let globalRotationDirection = 1; // 1 for clockwise, -1 for counterclockwise

  console.log("Particle script loaded");

  window.addEventListener("message", (event) => {
    if (event.data.type === "frequencyData") {
      console.log("Frequency data received:", event.data.data);
      latestFrequencyData = smoothData(event.data.data);
      updateParticles(latestFrequencyData);
    }
  });

  // Retrieve disk's initial rotation
  disk.object3D.rotation.set(
    THREE.Math.degToRad(initialRotation.x),
    THREE.Math.degToRad(initialRotation.y),
    THREE.Math.degToRad(initialRotation.z)
  );

  function createRandomParticles() {
    const maxParticles = 1000;
    const numParticles = Math.floor(Math.random() * maxParticles) + 1;
    for (let i = 0; i < numParticles; i++) {
      // Generate random spherical coordinates
      const radius = Math.random() * 5;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      const particle = document.createElement("a-sphere");
      particle.setAttribute("radius", 0.03);
      particle.setAttribute("color", "#FFFFFF"); // Set all particles to white
      particle.setAttribute("position", `${x} ${y} ${z}`);
      disk.appendChild(particle);

      // Store the initial position and assign a random rotation speed
      particleInitialPositions.push({ x, y, z });
      const rotationSpeed = (Math.random() - 0.5) * 0.5; // Random speed
      particleRotationSpeeds.push(rotationSpeed);
    }
  }

  function updateParticles(frequencyData) {
    const buffer = 0.95;
    const particles = disk.children;
    for (let i = 0; i < particles.length; i++) {
      const scaleY =
        (frequencyData[i % frequencyData.length] / 255.0) * 6 * buffer;
      const adjustedRotationSpeed =
        (frequencyData[i % frequencyData.length] / 255.0) * 0.1; // Adjust rotation speed based on frequency data
      particleRotationSpeeds[i] = adjustedRotationSpeed;
      particles[i].setAttribute("scale", {
        x: scaleY,
        y: scaleY,
        z: scaleY,
      });
    }
  }

  // Function to animate the particles
  function animate() {
    const particles = disk.children;
    if (latestFrequencyData.length > 0) {
      const avgFrequency =
        latestFrequencyData.reduce((sum, val) => sum + val, 0) /
        latestFrequencyData.length;
      const rotationSpeed = (avgFrequency / 255) * 0.1; // Scale rotation speed based on frequency data
      disk.object3D.rotation.y +=
        THREE.Math.degToRad(rotationSpeed) * globalRotationDirection;

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        const initialPosition = particleInitialPositions[i];
        const angle = particleRotationSpeeds[i];

        // Calculate new position based on rotation
        const x =
          initialPosition.x * Math.cos(angle) -
          initialPosition.z * Math.sin(angle);
        const z =
          initialPosition.x * Math.sin(angle) +
          initialPosition.z * Math.cos(angle);
        particle.setAttribute("position", { x, y: initialPosition.y, z });
        particleInitialPositions[i] = { x, y: initialPosition.y, z };
      }

      const scaleFactor = 1 + avgFrequency / 255;
      centralSphere.setAttribute("scale", {
        x: scaleFactor,
        y: scaleFactor,
        z: scaleFactor,
      });
    }

    requestAnimationFrame(animate);
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

  // Change the global rotation direction
  function changeRotationDirection() {
    globalRotationDirection *= -1;
  }

  createRandomParticles();
  animate();
});
