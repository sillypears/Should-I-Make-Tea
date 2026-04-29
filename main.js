import * as THREE from 'three';

const GOLD = new THREE.Color(0xd4af37);
const ORANGE = new THREE.Color(0xff6b35);
const BLUE = new THREE.Color(0x4a90d9);
const WHITE = new THREE.Color(0xf5f5f5);

let scene, camera, renderer, particles, particleGeometry, particleMaterial;
let animationId;
let isLoading = false;
let stars = [];
let mouseX = 0;
let mouseY = 0;
let targetMouseX = 0;
let targetMouseY = 0;

function init() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a0f, 0.002);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 50;
  camera.position.x = 0;
  camera.position.y = 0;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x0a0a0f, 1);
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  createParticles();
  createStars();

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);
  animate();

  setTimeout(() => {
    document.getElementById('ui').classList.add('visible');
  }, 500);
}

function createParticles() {
  const particleCount = 2000;
  particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 150;
    positions[i3 + 1] = (Math.random() - 0.5) * 150;
    positions[i3 + 2] = (Math.random() - 0.5) * 150;

    const color = Math.random() > 0.5 ? GOLD : ORANGE;
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;

    sizes[i] = Math.random() * 2 + 0.5;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  particleMaterial = new THREE.PointsMaterial({
    size: 0.3,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);
}

function createStars() {
  const starGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

  for (let i = 0; i < 300; i++) {
    const star = new THREE.Mesh(starGeometry, starMaterial.clone());
    const x = (Math.random() - 0.5) * 200;
    const y = (Math.random() - 0.5) * 200;
    const z = (Math.random() - 0.5) * 200;
    star.position.set(x, y, z);
    star.userData = {
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
      baseOpacity: Math.random() * 0.5 + 0.3,
      originalPos: { x, y, z }
    };
    stars.push(star);
    scene.add(star);
  }
}

function animate() {
  animationId = requestAnimationFrame(animate);

  const time = Date.now() * 0.001;

  mouseX += (targetMouseX - mouseX) * 0.05;
  mouseY += (targetMouseY - mouseY) * 0.05;

  if (particles) {
    particles.rotation.y += 0.0003;
    particles.rotation.x += 0.0001;

    particles.position.x = mouseX * 3;
    particles.position.y = -mouseY * 3;

    const positions = particleGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += Math.sin(time + i) * 0.01;
    }
    particleGeometry.attributes.position.needsUpdate = true;
  }

  stars.forEach(star => {
    const depth = (star.userData.originalPos.z + 100) / 200;
    star.position.x = star.userData.originalPos.x + mouseX * 10 * depth;
    star.position.y = star.userData.originalPos.y - mouseY * 10 * depth;
    
    const twinkle = Math.sin(time * star.userData.twinkleSpeed * 60 + star.userData.twinklePhase);
    star.material.opacity = star.userData.baseOpacity + twinkle * 0.2;
    star.material.transparent = true;
  });

  if (isLoading) {
    camera.position.x += Math.sin(time * 2) * 2;
    camera.position.y += Math.cos(time * 2) * 2;
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(e) {
  targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
}

function triggerResult(isYes) {
  isLoading = false;
  document.getElementById('loading').classList.remove('visible');
  document.getElementById('btn-decide').disabled = false;
  document.getElementById('ui').classList.remove('visible');

  const resultText = document.getElementById('result-text');
  const resultSubtitle = document.getElementById('result-subtitle');
  const resultContainer = document.getElementById('result');
  const teaCup = document.getElementById('tea-cup');

  if (isYes) {
    resultText.textContent = 'YES';
    resultText.className = 'result-text yes';
    resultSubtitle.textContent = 'TIME TO MAKE TEA';
    explodeParticles(GOLD, ORANGE);
    teaCup.classList.add('fancier');
  } else {
    resultText.textContent = 'NO';
    resultText.className = 'result-text no';
    resultSubtitle.textContent = 'NOT TODAY';
    explodeParticles(BLUE, new THREE.Color(0x67b8e3));
    teaCup.classList.add('boring');
  }

  setTimeout(() => {
    resultContainer.classList.add('visible');
    teaCup.classList.add('visible');
  }, 300);

  setTimeout(() => {
    document.getElementById('btn-again').classList.add('visible');
  }, 1000);
}

function explodeParticles(color1, color2) {
  const positions = particleGeometry.attributes.position.array;
  const colors = particleGeometry.attributes.color.array;
  const particleCount = positions.length / 3;

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.5 + 0.2;
    const direction = new THREE.Vector3(
      Math.cos(angle) * speed,
      (Math.random() - 0.5) * speed,
      Math.sin(angle) * speed
    );

    const color = Math.random() > 0.5 ? color1 : color2;
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;

    animateParticle(i3, direction);
  }

  particleGeometry.attributes.color.needsUpdate = true;
}

function animateParticle(i3, direction) {
  const positions = particleGeometry.attributes.position.array;
  
  const startX = positions[i3];
  const startY = positions[i3 + 1];
  const startZ = positions[i3 + 2];

  const duration = 2000;
  const startTime = Date.now();

  function step() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    positions[i3] = startX + direction.x * eased * 30;
    positions[i3 + 1] = startY + direction.y * eased * 30;
    positions[i3 + 2] = startZ + direction.z * eased * 30;

    particleGeometry.attributes.position.needsUpdate = true;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

function makeDecision() {
  if (isLoading) return;
  
  isLoading = true;
  document.getElementById('btn-decide').disabled = true;
  document.getElementById('loading').classList.add('visible');
  
  document.querySelector('.title').classList.add('shift-up');
  document.querySelector('.subtitle').classList.add('fade-out');
  document.getElementById('btn-decide').classList.add('shift-down');
  document.getElementById('ui').classList.add('animating');

  setTimeout(() => {
    const isYes = Math.random() < 0.5;
    triggerResult(isYes);
  }, 1500);
}

function reset() {
  document.getElementById('result').classList.remove('visible');
  document.getElementById('btn-again').classList.remove('visible');
  document.getElementById('tea-cup').classList.remove('visible', 'fancier', 'boring');
  
  createParticles();
  
  document.getElementById('ui').classList.remove('animating');
  document.querySelector('.title').classList.remove('shift-up');
  document.querySelector('.subtitle').classList.remove('fade-out');
  document.getElementById('btn-decide').classList.remove('shift-down');
  
  setTimeout(() => {
    document.getElementById('ui').classList.add('visible');
  }, 300);
}

document.getElementById('btn-decide').addEventListener('click', makeDecision);
document.getElementById('btn-again').addEventListener('click', () => {
  document.getElementById('ui').classList.remove('visible');
  setTimeout(reset, 500);
});

init();