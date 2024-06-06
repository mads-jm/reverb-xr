// Create the scene, camera, and renderer
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

//particle
const particleGeometry = new THREE.SphereGeometry(0.03, 10, 10);
const particleMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
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
    particles.add(particle);
  }
}

scene.add(particles);

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
