/* ============================================================
   SCOOP NIRVANA — 3D studio (Three.js r152)
   Drag to rotate · scroll to zoom · auto-spin toggle ·
   scoop color cycling · graceful fallback when WebGL is missing
   ============================================================ */
(() => {
  "use strict";
  const stage = document.getElementById("stage3d");
  const canvas = document.getElementById("c3d");
  const fallback = document.getElementById("c3dFallback");
  if (!stage || !canvas) return;
  if (typeof THREE === "undefined") { showFallback(); return; }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch { showFallback(); return; }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.6, 7.2);

  /* lights */
  scene.add(new THREE.AmbientLight(0xfff0e0, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff8fb3, 0.55); rim.position.set(-4, 2, -3); scene.add(rim);
  const under = new THREE.PointLight(0xffb03a, 0.5, 20); under.position.set(0, -3, 2); scene.add(under);

  /* group */
  const coneGroup = new THREE.Group();
  scene.add(coneGroup);

  /* materials */
  const coneMat = new THREE.MeshStandardMaterial({ color: 0xd9903f, roughness: 0.75, flatShading: true });
  const SCOOP_COLORS = [0xff6b9d, 0xa78bfa, 0xffb03a, 0x7dd3fc, 0x4ade80, 0xf4a460];
  let colorIdx = 0;
  const scoopMat = new THREE.MeshStandardMaterial({ color: SCOOP_COLORS[0], roughness: 0.35 });
  const cherryMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.25 });
  const dripMat = new THREE.MeshStandardMaterial({ color: 0xffe9d6, roughness: 0.4 });

  /* waffle cone — tapered cylinder with flat shading */
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.09, 2.5, 10, 1), coneMat);
  cone.position.y = -1.05;
  coneGroup.add(cone);

  /* waffle lattice: thin torus rings */
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const r = 0.72 - t * 0.63;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.028, 8, 24), coneMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.15 - t * 2.2;
    coneGroup.add(ring);
  }

  /* scoops — stacked icospheres */
  const scoopSpecs = [
    { y: 0.62, s: 0.78 }, { y: 1.28, s: 0.66 }, { y: 1.86, s: 0.54 },
  ];
  scoopSpecs.forEach(({ y, s }) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 3), scoopMat);
    m.position.y = y;
    coneGroup.add(m);
  });

  /* drips on the lowest scoop */
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const d = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.28 + Math.random() * 0.22, 4, 8), dripMat);
    d.position.set(Math.cos(a) * 0.62, 0.32 - Math.random() * 0.12, Math.sin(a) * 0.62);
    coneGroup.add(d);
  }

  /* cherry + stem */
  const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 24), cherryMat);
  cherry.position.y = 2.32;
  coneGroup.add(cherry);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.3, 6), coneMat);
  stem.position.y = 2.5; stem.rotation.z = 0.4;
  coneGroup.add(stem);

  /* sprinkles scattered on scoops */
  const sprMat = new THREE.MeshStandardMaterial({ roughness: 0.4 });
  const SPRINKLE_COLORS = [0xffffff, 0xffd166, 0x38bdf8, 0x4ade80, 0xff5c8a, 0x8b5cf6];
  for (let i = 0; i < 46; i++) {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.07, 2, 6),
      new THREE.MeshStandardMaterial({ color: SPRINKLE_COLORS[i % SPRINKLE_COLORS.length], roughness: 0.4 }));
    const scoop = scoopSpecs[i % 3];
    const a = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = scoop.s * 0.98;
    m.position.set(
      scoop.y === undefined ? 0 : Math.sin(phi) * Math.cos(a) * r,
      scoop.y + Math.cos(phi) * r * 0.9,
      Math.sin(phi) * Math.sin(a) * r
    );
    m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    coneGroup.add(m);
  }

  coneGroup.rotation.x = 0.12;
  coneGroup.position.y = -0.15;

  /* ---------- interaction ---------- */
  let dragging = false, px = 0, py = 0, velX = 0.004, userVel = 0;
  let autoSpin = true;
  stage.addEventListener("pointerdown", (e) => { dragging = true; px = e.clientX; py = e.clientY; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - px, dy = e.clientY - py;
    userVel = dx * 0.005;
    coneGroup.rotation.y += dx * 0.008;
    coneGroup.rotation.x = Math.max(-0.5, Math.min(0.6, coneGroup.rotation.x + dy * 0.005));
    px = e.clientX; py = e.clientY;
  });
  const stopDrag = () => { dragging = false; };
  stage.addEventListener("pointerup", stopDrag);
  stage.addEventListener("pointercancel", stopDrag);
  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    camera.position.z = Math.max(4.5, Math.min(11, camera.position.z + e.deltaY * 0.004));
  }, { passive: false });

  /* UI buttons */
  const colorBtn = document.getElementById("scoopColorBtn");
  const spinBtn = document.getElementById("coneSpinBtn");
  colorBtn?.addEventListener("click", () => {
    colorIdx = (colorIdx + 1) % SCOOP_COLORS.length;
    scoopMat.color.setHex(SCOOP_COLORS[colorIdx]);
  });
  spinBtn?.addEventListener("click", () => {
    autoSpin = !autoSpin;
    spinBtn.textContent = autoSpin ? "🌀 Auto-spin on/off" : "⏸ Auto-spin off";
    spinBtn.classList.toggle("is-active", autoSpin);
  });

  /* wake on slide entry */
  let running = false;
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  function start() {
    if (running) return;
    running = true;
    resize();
    renderer.setAnimationLoop(tick);
  }
  function stop() { running = false; renderer.setAnimationLoop(null); }

  const clock = new THREE.Clock();
  function tick() {
    const t = clock.getElapsedTime();
    if (!dragging) {
      if (autoSpin) coneGroup.rotation.y += velX;
      else if (userVel) { coneGroup.rotation.y += userVel; userVel *= 0.94; if (Math.abs(userVel) < 0.0004) userVel = 0; }
    }
    /* gentle breathing + drip wobble */
    coneGroup.position.y = -0.15 + Math.sin(t * 1.4) * 0.045;
    cherry.scale.setScalar(1 + Math.sin(t * 2.2) * 0.06);
    renderer.render(scene, camera);
  }

  window.addEventListener("slide:3d", () => setTimeout(() => { resize(); start(); }, 60));
  window.addEventListener("resize", () => { if (running) resize(); });
  window.addEventListener("theme:changed", () => {
    const dark = document.documentElement.dataset.theme === "dark";
    renderer.setClearColor(dark ? 0x201216 : 0x000000, 0);
  });

  function showFallback() {
    if (fallback) fallback.hidden = false;
    if (canvas) canvas.style.display = "none";
  }
  /* try starting immediately if stage is visible; else wait for slide event */
  setTimeout(() => { if (stage.offsetParent !== null) { start(); } }, 400);
})();
