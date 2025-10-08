import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';

// GSAP global is available via CDN script tag
gsap.registerPlugin(ScrollTrigger);

// DOM
const canvas = document.getElementById('webgl');
const loaderBar = document.querySelector('#loader .fill');
const loaderWrap = document.getElementById('loader');
const tagline = document.getElementById('tagline');
const audioToggle = document.getElementById('audio-toggle');

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Scene and Camera
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(4.2, 2.2, 6.4);
scene.add(camera);
const cameraTarget = new THREE.Vector3(0, 1.0, 0);

// Controls (dev only; disabled by default)
const controls = new OrbitControls(camera, canvas);
controls.enabled = false;

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);
const dir = new THREE.DirectionalLight(0xffffff, 1.1);
dir.position.set(4, 8, 6);
dir.castShadow = true;
dir.shadow.mapSize.set(1024, 1024);
dir.shadow.camera.near = 1;
dir.shadow.camera.far = 30;
dir.shadow.camera.left = -8;
dir.shadow.camera.right = 8;
dir.shadow.camera.top = 8;
dir.shadow.camera.bottom = -8;
scene.add(dir);

// Ground (receive shadows)
const ground = new THREE.Mesh(
	new THREE.PlaneGeometry(100, 100),
	new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95, metalness: 0.0 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.001;
ground.receiveShadow = true;
scene.add(ground);

// Groups for scenes
const grpForest = new THREE.Group(); // Scene 1
const grpCutting = new THREE.Group(); // Scene 2
const grpMill = new THREE.Group(); // Scene 3
const grpAssembly = new THREE.Group(); // Scene 4
const grpFinish = new THREE.Group(); // Scene 5
const grpReveal = new THREE.Group(); // Scene 6
scene.add(grpForest, grpCutting, grpMill, grpAssembly, grpFinish, grpReveal);

// Placeholder geometry assets (will be replaced/upgraded progressively)
function createTreePlaceholder() {
	const trunk = new THREE.Mesh(
		new THREE.CylinderGeometry(0.15, 0.4, 3.2, 12, 1, true),
		new THREE.MeshStandardMaterial({ color: 0x6b4f3b, roughness: 0.9, metalness: 0.0 })
	);
	trunk.position.y = 1.6;
	trunk.castShadow = true;

	const branchMaterial = new THREE.MeshStandardMaterial({ color: 0x5a4536, roughness: 0.95 });
	for (let i = 0; i < 10; i++) {
		const len = 0.6 + Math.random() * 0.6;
		const radius = 0.05 + Math.random() * 0.05;
		const branch = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.6, len, 8), branchMaterial);
		branch.position.y = 0.4 + Math.random() * 2.2;
		branch.rotation.z = (Math.random() - 0.5) * 0.8;
		branch.rotation.y = Math.random() * Math.PI * 2;
		branch.castShadow = true;
		trunk.add(branch);
	}

	const group = new THREE.Group();
	group.add(trunk);
	return group;
}

function createLog(radius = 0.3, length = 2.2, color = 0x7a5a3f) {
	const mesh = new THREE.Mesh(
		new THREE.CylinderGeometry(radius, radius, length, 16, 1, true),
		new THREE.MeshStandardMaterial({ color, roughness: 0.85 })
	);
	mesh.rotation.z = Math.PI / 2;
	mesh.castShadow = true;
	return mesh;
}

function createPlank(width = 0.22, height = 0.03, length = 1.8) {
	const mesh = new THREE.Mesh(
		new THREE.BoxGeometry(width, height, length),
		new THREE.MeshStandardMaterial({ color: 0x9c7a54, roughness: 0.6, metalness: 0.05 })
	);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	return mesh;
}

// Scene 1: Forest with dry tree and dust
const tree = createTreePlaceholder();
grpForest.add(tree);

const dustParticles = (() => {
	const count = 700;
	const geo = new THREE.BufferGeometry();
	const positions = new Float32Array(count * 3);
	for (let i = 0; i < count; i++) {
		positions[i * 3 + 0] = (Math.random() - 0.5) * 12;
		positions[i * 3 + 1] = Math.random() * 4 + 0.2;
		positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
	}
	geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.01, transparent: true, opacity: 0.16, depthWrite: false });
	const pts = new THREE.Points(geo, mat);
	grpForest.add(pts);
	return pts;
})();

// Scene 2: Cutting — saw blade placeholder and log (revealed later)
const cuttingLog = createLog(0.32, 2.8);
cuttingLog.position.set(0, 0.35, 0);
cuttingLog.visible = false;
grpCutting.add(cuttingLog);

const sawBlade = new THREE.Mesh(
	new THREE.CylinderGeometry(0.6, 0.6, 0.04, 32),
	new THREE.MeshStandardMaterial({ color: 0xb0b0b0, roughness: 0.3, metalness: 0.9 })
);
sawBlade.rotation.x = Math.PI / 2;
sawBlade.position.set(-1.4, 0.7, 0);
grpCutting.add(sawBlade);

// Scene 3: Mill — planks emitted
const millPlanks = [];
for (let i = 0; i < 6; i++) {
	const plank = createPlank();
	plank.position.set(0.4 * i - 1.0, 0.25 + 0.06 * (i % 2), -0.2 * i);
	grpMill.add(plank);
	millPlanks.push(plank);
}

// Scene 4: Assembly — make a simple bed frame from planks
const assembly = new THREE.Group();
grpAssembly.add(assembly);
const frameParts = {
	legFL: createPlank(0.08, 0.5, 0.08),
	legFR: createPlank(0.08, 0.5, 0.08),
	legBL: createPlank(0.08, 0.5, 0.08),
	legBR: createPlank(0.08, 0.5, 0.08),
	railL: createPlank(0.08, 0.08, 1.9),
	railR: createPlank(0.08, 0.08, 1.9),
	head: createPlank(1.1, 0.08, 0.08),
	foot: createPlank(1.1, 0.08, 0.08),
};
Object.values(frameParts).forEach(p => assembly.add(p));

// Initial positions (exploded)
frameParts.legFL.position.set(-0.55, 0.25, 0.95);
frameParts.legFR.position.set(0.55, 0.25, 0.95);
frameParts.legBL.position.set(-0.55, 0.25, -0.95);
frameParts.legBR.position.set(0.55, 0.25, -0.95);
frameParts.railL.position.set(-0.55, 0.45, 0);
frameParts.railR.position.set(0.55, 0.45, 0);
frameParts.head.position.set(0, 0.45, 0.95);
frameParts.foot.position.set(0, 0.45, -0.95);

// Bolts (tighten in Scene 4)
function createBolt() {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 10), new THREE.MeshStandardMaterial({ color: 0x9aa3a7, roughness: 0.4, metalness: 0.9 }));
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), new THREE.MeshStandardMaterial({ color: 0xb8c1c4, roughness: 0.3, metalness: 1.0 }));
    head.position.y = 0.07;
    const g = new THREE.Group();
    g.add(shaft, head);
    g.castShadow = true;
    return g;
}
const bolts = [];
for (let i = 0; i < 6; i++) {
    const b = createBolt();
    const z = i < 3 ? 0.9 : -0.9;
    const x = (i % 3) * 0.5 - 0.5;
    b.position.set(x, 0.8, z);
    b.userData.targetY = 0.5;
    assembly.add(b);
    bolts.push(b);
}

// Scene 5: Finish — reflective clear coat placeholder
const finishCoat = new THREE.Mesh(
	new THREE.BoxGeometry(1.2, 0.05, 2.1),
	new THREE.MeshPhysicalMaterial({ color: 0xd7b493, roughness: 0.25, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.1 })
);
finishCoat.position.set(0, 0.52, 0);
finishCoat.visible = false;
grpFinish.add(finishCoat);

// Scene 6: Reveal — minimal bedroom box and soft light
const bedroom = new THREE.Group();
const roomMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 8), roomMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
const wall = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), roomMat);
wall.position.set(0, 1.5, -4);
bedroom.add(floor, wall);
grpReveal.add(bedroom);
const warmReveal = new THREE.PointLight(0xffddb1, 0.0, 12, 1.8);
warmReveal.position.set(1.2, 2.2, 2.2);
grpReveal.add(warmReveal);

// Environment (HDRI optional)
const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
new RGBELoader(loadingManager).setDataType(THREE.HalfFloatType)
	.setPath('https://assets.pmnd.rs/hdris/')
	.load('studio_small_09_2k.hdr', (hdr) => {
		const envMap = pmrem.fromEquirectangular(hdr).texture;
		scene.environment = envMap;
		hdr.dispose();
		pmrem.dispose();
	});

// Post-processing (with mobile fallback)
const supportsPost = window.innerWidth >= 420 && window.innerHeight >= 420 && window.devicePixelRatio <= 2.5;
let composer = null;
let bloomPass = null;
if (supportsPost) {
	composer = new EffectComposer(renderer);
	composer.addPass(new RenderPass(scene, camera));
	bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.6, 0.9, 0.2);
	composer.addPass(bloomPass);
}

// Resize
window.addEventListener('resize', () => {
	const w = window.innerWidth; const h = window.innerHeight;
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setSize(w, h);
	camera.aspect = w / h; camera.updateProjectionMatrix();
	if (composer) composer.setSize(w, h);
});

// Audio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let masterGain = audioCtx.createGain();
masterGain.gain.value = 0.0; // start muted until user toggles
const colorFilter = audioCtx.createBiquadFilter();
colorFilter.type = 'lowpass';
colorFilter.frequency.value = 12000;
masterGain.connect(colorFilter).connect(audioCtx.destination);

async function loadAudioBuffer(url) {
	const res = await fetch(url);
	const arr = await res.arrayBuffer();
	return await audioCtx.decodeAudioData(arr);
}

const audio = {
	bg: null,
	bgLoop: null,
	saw: null,
	spark: null,
    machine: null,
};

async function setupAudio() {
	audio.bg = await loadAudioBuffer('https://cdn.jsdelivr.net/gh/jherr/music-snippets@main/ambient-forest-90s.mp3');
	audio.saw = await loadAudioBuffer('https://cdn.jsdelivr.net/gh/jherr/music-snippets@main/saw-loop.mp3');
	audio.spark = await loadAudioBuffer('https://cdn.jsdelivr.net/gh/jherr/music-snippets@main/spark.mp3');
    audio.machine = await loadAudioBuffer('https://cdn.jsdelivr.net/gh/jherr/music-snippets@main/machine-loop.mp3');
}

function playLoop(buffer, gain = 0.6, playbackRate = 1) {
	const source = audioCtx.createBufferSource();
	source.buffer = buffer; source.loop = true; source.playbackRate.value = playbackRate;
	const g = audioCtx.createGain(); g.gain.value = gain; source.connect(g).connect(masterGain);
	source.start(0);
	return { source, gain: g };
}

function playOne(buffer, gain = 0.8, playbackRate = 1) {
	const source = audioCtx.createBufferSource(); source.buffer = buffer; source.playbackRate.value = playbackRate;
	const g = audioCtx.createGain(); g.gain.value = gain; source.connect(g).connect(masterGain);
	source.start(0);
	return { source, gain: g };
}

audioToggle.addEventListener('click', async () => {
	if (audioCtx.state !== 'running') await audioCtx.resume();
	const pressed = audioToggle.getAttribute('aria-pressed') === 'true';
	audioToggle.setAttribute('aria-pressed', String(!pressed));
	gsap.to(masterGain.gain, { value: pressed ? 0.0 : 0.8, duration: 0.6, ease: 'power2.out' });
	if (!pressed && audio.bg && !audio.bgLoop) {
		audio.bgLoop = playLoop(audio.bg, 0.25, 1);
	}
});

// Loading manager (for progress bar)
const loadingManager = new THREE.LoadingManager();
loadingManager.onProgress = (url, loaded, total) => {
	const pct = Math.round((loaded / total) * 100);
	loaderBar.style.width = pct + '%';
};
loadingManager.onLoad = () => {
	gsap.to(loaderWrap, { autoAlpha: 0, duration: 0.6, ease: 'power2.out' });
	gsap.to(tagline, { onStart: () => tagline.classList.add('show') });
};

// Sparks/Sawdust particles (scenes 2 & 3)
function createEmitter({ color = 0xffcc66, size = 0.02, count = 200 }) {
	const positions = new Float32Array(count * 3);
	const velocities = new Float32Array(count * 3);
	for (let i = 0; i < count; i++) {
		positions[i * 3 + 0] = 0;
		positions[i * 3 + 1] = 0;
		positions[i * 3 + 2] = 0;
		velocities[i * 3 + 0] = (Math.random() - 0.5) * 1.5;
		velocities[i * 3 + 1] = Math.random() * 1.6;
		velocities[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
	}
	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
	const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.9, depthWrite: false });
	const points = new THREE.Points(geo, mat);
	points.userData.velocities = velocities;
	return points;
}

const sparks = createEmitter({ color: 0xffbb66, size: 0.015, count: 180 });
sparks.position.copy(sawBlade.position);
sparks.visible = false;
grpCutting.add(sparks);

const sawdust = createEmitter({ color: 0xcaa36a, size: 0.012, count: 260 });
sawdust.visible = false;
grpMill.add(sawdust);

// Volumetric light cone for finishing/reveal
const lightConeGeo = new THREE.ConeGeometry(0.8, 2.4, 32, 1, true);
const lightConeMat = new THREE.MeshBasicMaterial({ color: 0xfff2cc, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const lightCone = new THREE.Mesh(lightConeGeo, lightConeMat);
lightCone.position.set(0, 1.6, 1.2);
lightCone.rotation.x = -Math.PI / 16;
grpFinish.add(lightCone);

// Master timeline
const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });

// Scene 1 — Forest setup
tl.to(camera.position, { x: 2.6, y: 2.1, z: 5.4, duration: 1.2 })
	.to(dir.position, { x: 3, y: 7, z: 2, duration: 1.2 }, '<')
    .to(tree.rotation, { y: '+=0.6', duration: 1.2 }, '<')
    .to(cameraTarget, { x: 0, y: 1.4, z: 0, duration: 1.2 }, '<');

// Scene 2 — Cutting: blade spins, tree falls
tl.to({}, { duration: 0.3 }) // spacer
    .add(() => { sparks.visible = true; if (audio.saw && !audio._sawLoop) { audio._sawLoop = playLoop(audio.saw, 0.45, 1.05); } })
    .to(sawBlade.rotation, { z: '+=' + Math.PI * 10, duration: 2.0 })
    .to(sawBlade.position, { x: 0.2, duration: 1.4 }, '<')
    .to(tree.rotation, { x: -1.2, duration: 1.4, ease: 'power3.in' }, '<0.4')
    .to(tree.position, { y: -0.2, duration: 1.4, ease: 'power3.in' }, '<')
    .to(cameraTarget, { x: 0.2, y: 1.0, z: -0.4, duration: 1.2 }, '<')
    .add(() => { sparks.visible = false; });

// Scene 3 — Mill: reveal log, planks slide out, sawdust bursts
tl.to({}, { duration: 0.2 })
    .add(() => { cuttingLog.visible = true; if (audio.machine && !audio._machineLoop) { audio._machineLoop = playLoop(audio.machine, 0.35, 1.0); } sawdust.visible = true; if (audio.spark) playOne(audio.spark, 0.45); })
    .to(millPlanks.map(p => p.position), { z: '+=1.2', duration: 1.4, stagger: 0.06 })
    .to(millPlanks.map(p => p.rotation), { x: (i) => (i % 2 === 0 ? 0.04 : -0.04), duration: 1.0, stagger: 0.06 }, '<')
    .add(() => { sawdust.visible = false; });

// Scene 4 — Assembly: parts move into place and bolts tighten
tl.to({}, { duration: 0.2 })
	.to(frameParts.legFL.position, { y: 0.25, duration: 0.6 })
	.to(frameParts.legFR.position, { y: 0.25, duration: 0.6 }, '<')
	.to(frameParts.legBL.position, { y: 0.25, duration: 0.6 }, '<')
	.to(frameParts.legBR.position, { y: 0.25, duration: 0.6 }, '<')
	.to(frameParts.railL.position, { x: -0.55, z: 0, duration: 0.9 }, '<')
	.to(frameParts.railR.position, { x: 0.55, z: 0, duration: 0.9 }, '<')
	.to(frameParts.head.position, { z: 0.95, duration: 0.9 }, '<')
    .to(frameParts.foot.position, { z: -0.95, duration: 0.9 }, '<')
    .to(bolts.map(b => b.position), { y: (i) => bolts[i].userData.targetY, duration: 1.0, stagger: 0.05 }, '<0.2')
    .to(bolts.map(b => b.rotation), { y: '+=' + Math.PI * 2, duration: 1.0, stagger: 0.05 }, '<');

// Scene 5 — Finish: glossy coat appears
tl.to({}, { duration: 0.2 })
	.add(() => { finishCoat.visible = true; })
	.to(finishCoat.material, { roughness: 0.1, duration: 1.0 })
	.to(dir.position, { x: -2, y: 6, z: 4, duration: 1.0 }, '<')
	.to(lightCone.material, { opacity: 0.35, duration: 1.0 }, '<');

// Scene 6 — Reveal: pull back to bedroom
tl.to({}, { duration: 0.2 })
    .to(camera.position, { x: 0.6, y: 1.5, z: 5.8, duration: 1.4 })
	.to(camera.rotation, { x: 0, y: 0, z: 0, duration: 1.4 }, '<');
tl.to(warmReveal, { intensity: 1.5, duration: 1.2 }, '<0.2');

// Attach ScrollTrigger to timeline
ScrollTrigger.create({
	animation: tl,
	scrub: 0.6,
	trigger: '#scroll-sections',
	start: 'top top',
	end: '+=6000',
	pin: true,
	anticipatePin: 1,
	invalidateOnRefresh: true,
    onUpdate: (self) => {
        // Scroll-synced audio tone color (brighter in cutting/milling, softer elsewhere)
        const t = self.progress; // 0..1
        // Map segments roughly: cutting ~0.2-0.35, mill ~0.35-0.55
        let targetFreq = 6000;
        if (t < 0.18) targetFreq = 5000;
        else if (t < 0.35) targetFreq = 12000;
        else if (t < 0.55) targetFreq = 10000;
        else if (t < 0.8) targetFreq = 7000;
        else targetFreq = 8000;
        colorFilter.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.25);
    }
});

// Animation loop
const clock = new THREE.Clock();
function tick() {
	const dt = Math.min(clock.getDelta(), 0.05);
	// breeze sway on tree
	if (tree) tree.rotation.z = Math.sin(performance.now() * 0.0004) * 0.03;
	// move dust slightly
	if (dustParticles) dustParticles.position.x = Math.sin(performance.now() * 0.0002) * 0.2;
	// update particles physics for sparks/sawdust
	[sparks, sawdust].forEach((emitter) => {
		if (!emitter.visible) return;
		const pos = emitter.geometry.getAttribute('position');
		const vel = emitter.userData.velocities;
		for (let i = 0; i < pos.count; i++) {
			vel[i * 3 + 1] -= 1.6 * dt; // gravity
			pos.array[i * 3 + 0] += vel[i * 3 + 0] * dt;
			pos.array[i * 3 + 1] += vel[i * 3 + 1] * dt;
			pos.array[i * 3 + 2] += vel[i * 3 + 2] * dt;
			// reset when below ground
			if (pos.array[i * 3 + 1] < 0) {
				pos.array[i * 3 + 0] = 0; pos.array[i * 3 + 1] = 0; pos.array[i * 3 + 2] = 0;
				vel[i * 3 + 0] = (Math.random() - 0.5) * 1.5;
				vel[i * 3 + 1] = Math.random() * 1.6;
				vel[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
			}
		}
		pos.needsUpdate = true;
	});

    camera.lookAt(cameraTarget);
    if (composer) composer.render(); else renderer.render(scene, camera);
	requestAnimationFrame(tick);
}
tick();

// Kick off async setup
(async () => {
	await setupAudio();
	// Start ambient bg when user unmutes
})();

// Adaptive pixel ratio (simple)
let fpsSamples = [];
let lastAdjust = performance.now();
function trackPerformance() {
    const now = performance.now();
    const dt = clock.getDelta();
    const fps = 1 / dt;
    fpsSamples.push(fps);
    if (fpsSamples.length > 30) fpsSamples.shift();
    if (now - lastAdjust > 2500) {
        const avg = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length;
        const currentPR = renderer.getPixelRatio();
        let target = currentPR;
        if (avg < 35 && currentPR > 1) target = Math.max(1, currentPR - 0.25);
        if (avg > 55 && currentPR < 2) target = Math.min(2, currentPR + 0.25);
        if (Math.abs(target - currentPR) > 0.05) {
            renderer.setPixelRatio(target);
            if (composer) composer.setPixelRatio?.(target);
        }
        lastAdjust = now;
    }
    requestAnimationFrame(trackPerformance);
}
requestAnimationFrame(trackPerformance);

