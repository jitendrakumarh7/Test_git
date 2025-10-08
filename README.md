From Nature to Comfort — Scroll 3D Journey

An immersive, scroll-interactive WebGL experience crafted with Three.js and GSAP ScrollTrigger. It tells the story of a bed made from nature to product through six cinematic scenes.

Quick start

- Open `index.html` directly in a modern browser (Chrome, Edge, Safari). Or run a static server:
  - Python: `python3 -m http.server 8080`
  - Node (serve): `npx serve -l 8080`
- Visit `http://localhost:8080`.
- Click the speaker button to enable audio (required by browser autoplay policies).

Scenes

1. Dry tree in a moody forest with dust motes and breeze.
2. Cutting: cinematic blade action, sparks; the tree falls.
3. Milling: logs become planks, sawdust bursts, machine SFX.
4. Assembly: parts align, bolts tighten into the frame.
5. Finishing: glossy coat, bloom, warm light cones.
6. Reveal: pull back into a cozy minimal bedroom and tagline.

Technology

- Three.js for 3D, with ACES tone mapping and PBR materials
- GSAP + ScrollTrigger for scroll-scrubbed storytelling
- Post-processing: Unreal Bloom (auto-disabled on small/mobile)
- Particles for dust, sparks, and sawdust
- Audio with WebAudio (ambient + SFX, scroll-synced tone color)

Replace with realistic assets (recommended)

This repo ships with procedural placeholders for the tree and bed to keep the demo lightweight. To reach photoreal quality:

- Tree: Use a high-quality GLTF/GLB dead/dry tree model (2–20 MB) with bark normal/roughness maps.
- Bed: Use a GLTF/GLB bed with proper UVs and wood/fabric textures.
- Textures: Prefer CC0/royalty-free PBR packs (albedo/normal/roughness/AO). Good sources include Poly Haven and ambientCG.

How to integrate

- Place your files under `public/models/` and `public/textures/` (create folders).
- In `src/main.js`, swap the procedural tree/bed creators with loaded GLTF scenes. Set `castShadow = true` and `receiveShadow = true` where appropriate.
- For wood/fabric, load textures via `THREE.TextureLoader` and set `colorSpace = SRGBColorSpace` for baseColor maps.

Example snippet

```js
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const gltfLoader = new GLTFLoader();

gltfLoader.load('/public/models/dry_tree.glb', (gltf) => {
  const treeReal = gltf.scene;
  treeReal.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  grpForest.add(treeReal);
});
```

Performance

- Adaptive pixel ratio adjusts to maintain ~45–60 FPS.
- Post-processing auto-disables on small screens/high DPR.
- Prefer textures ≤ 2K, compressed where possible.

Audio

- Click the speaker icon to fade audio in/out.
- Ambient background starts on unmute; saw/machine loops gate in scenes 2–3.
- Scroll position influences a low-pass filter to subtly change the tone.

Customization tips

- Edit timing and transitions in the GSAP master timeline inside `src/main.js`.
- Tweak lighting: `DirectionalLight` and `PointLight` intensities/positions.
- Particle counts can be lowered for mobile performance.

License

- Code: MIT (adapt as needed). Asset links are placeholders; ensure you have rights to any models/audio you add.

