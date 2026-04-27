// CarBackground3D.js — vanilla Three.js background car for the Hero section
// Mouse follow on desktop · Scroll-driven rotation · Fades in when model is ready
// Part-filtering logic ported directly from RegisterVehicleTab.js (CarViewer)
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { loadCarModel } from '../../../utils/modelCache.js';

// ── Same hide-lists used in RegisterVehicleTab ────────────────────────────────
const HIDE_KEYWORDS = [
  'turntable', 'platform', 'ground', 'floor', 'shadow', 'spoon',
  'highpoly', 'lowpoly',
  '2262a6d3f82749',
  'wheel.obj.cleaner.materialmerger.gles',
];
const HIDE_OBJECT_RE    = /^object_([2-9]|10)$/i;   // BBS mesh parts
const HIDE_ROOTNODE_RE  = /^rootnode\.\d{3,}$/i;    // download artifacts

const CarBackground3D = () => {
  const canvasRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Desktop only
    if (window.innerWidth < 900) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    // ── Renderer (same settings as CarViewer) ─────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // ── Scene (transparent bg so gradient behind shows through) ──────────
    const scene = new THREE.Scene();
    // No scene.background — keep alpha: true transparent

    // ── Camera — mirrored from CarViewer, shifted right for hero layout ───
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(4, 1.5, 4);
    camera.lookAt(0, 0.4, 0);

    // ── Lighting — exact same setup as CarViewer ──────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));

    const key = new THREE.DirectionalLight(0xfff5e0, 4);
    key.position.set(4, 5, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xe0eeff, 1.5);
    fill.position.set(-5, 3, 3);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 2);
    rim.position.set(0, 4, -5);
    scene.add(rim);

    // ── Car group — offset right so it sits beside the CTA text ──────────
    const carGroup = new THREE.Group();
    carGroup.position.set(1.6, 0.3, 0);
    scene.add(carGroup);

    // ── Interaction state ─────────────────────────────────────────────────
    let modelReady = false;
    const target  = { rotY: 0, rotX: 0 };
    const current = { rotY: 0, rotX: 0 };
    const BASE_Y  = -0.35;   // front-quarter angle
    let scrollY   = window.scrollY;
    let animId;

    // ── Load & filter model ───────────────────────────────────────────────
    loadCarModel(null)
      .then(gltf => {
        const car = gltf.scene;

        // Measure overall bounding box to detect oversized flat meshes
        const carBox  = new THREE.Box3().setFromObject(car);
        const carSize = new THREE.Vector3();
        carBox.getSize(carSize);

        car.traverse(node => {
          if (!node.isMesh) return;

          const nameLower = node.name.toLowerCase();
          const matName   = (Array.isArray(node.material)
            ? node.material[0]?.name
            : node.material?.name) || '';
          const matLower  = matName.toLowerCase();

          // 1. Hide by keyword / regex (same rules as CarViewer)
          if (
            HIDE_KEYWORDS.some(k => nameLower.includes(k) || matLower.includes(k)) ||
            HIDE_OBJECT_RE.test(node.name) ||
            HIDE_ROOTNODE_RE.test(node.name)
          ) {
            node.visible = false;
            return;
          }

          // 2. Hide large flat discs near ground (turntable fallback)
          const meshBox    = new THREE.Box3().setFromObject(node);
          const meshSize   = new THREE.Vector3();
          const meshCenter = new THREE.Vector3();
          meshBox.getSize(meshSize);
          meshBox.getCenter(meshCenter);
          const isWide = meshSize.x > carSize.x * 0.7 || meshSize.z > carSize.z * 0.7;
          const isFlat = meshSize.y < 0.25;
          const isLow  = meshCenter.y < 0.15;
          if (isWide && isFlat && isLow) {
            node.visible = false;
            return;
          }

          // 3. Shadows
          node.castShadow    = true;
          node.receiveShadow = true;
        });

        carGroup.add(car);
        modelReady = true;
        carGroup.rotation.y = BASE_Y;
        setVisible(true);
      })
      .catch(() => { /* silent — gradient background stays */ });

    // ── Event handlers ────────────────────────────────────────────────────
    const onMouseMove = e => {
      const nx = (e.clientX / window.innerWidth)  * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      target.rotY = nx *  0.52;   // ±30° yaw
      target.rotX = ny * -0.10;   // ±6° pitch
    };

    const onScroll = () => { scrollY = window.scrollY; };

    const onResize = () => {
      const nW = window.innerWidth;
      const nH = window.innerHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll',    onScroll,    { passive: true });
    window.addEventListener('resize',    onResize);

    // ── Render loop ───────────────────────────────────────────────────────
    const lerp = (a, b, t) => a + (b - a) * t;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (modelReady) {
        current.rotY = lerp(current.rotY, target.rotY, 0.04);
        current.rotX = lerp(current.rotX, target.rotX, 0.04);

        const scrollRot = scrollY * 0.0012;
        carGroup.rotation.y = BASE_Y + current.rotY + scrollRot;
        carGroup.rotation.x = current.rotX;

        // Subtle camera lift on scroll
        camera.position.y = lerp(camera.position.y, 1.5 + scrollY * 0.0005, 0.06);
      }

      renderer.render(scene, camera);
    };

    animate();

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll',    onScroll);
      window.removeEventListener('resize',    onResize);
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`hero-3d-canvas${visible ? ' hero-3d-canvas--on' : ''}`}
      aria-hidden="true"
    />
  );
};

export default CarBackground3D;
