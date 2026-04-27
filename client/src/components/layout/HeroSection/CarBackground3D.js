// CarBackground3D.js — vanilla Three.js background car for the Hero section
// Mouse follow on desktop · Scroll-driven rotation · Fades in when model is ready
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { loadCarModel } from '../../../utils/modelCache.js';

const CarBackground3D = () => {
  const canvasRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Desktop only — skip on narrow screens
    if (window.innerWidth < 900) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Renderer ───────────────────────────────────────────────────────────
    const W = window.innerWidth;
    const H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ── Scene & Camera ─────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
    camera.position.set(0.6, 1.1, 5.8);
    camera.lookAt(0, 0.2, 0);

    // ── Lighting ───────────────────────────────────────────────────────────
    // Soft ambient
    scene.add(new THREE.AmbientLight(0xfff4e6, 0.35));

    // Key light (upper front-left — illuminates the windscreen & hood)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(-4, 7, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    scene.add(keyLight);

    // Fill light (cool blue from right)
    const fillLight = new THREE.DirectionalLight(0x6699cc, 0.9);
    fillLight.position.set(6, 4, 2);
    scene.add(fillLight);

    // Rim / back-light (warm brand-red — traces the roofline)
    const rimLight = new THREE.DirectionalLight(0xff3300, 0.45);
    rimLight.position.set(0, 3, -7);
    scene.add(rimLight);

    // Ground bounce (soft warm underneath)
    const bounceLight = new THREE.PointLight(0x442200, 0.4, 10);
    bounceLight.position.set(0, -1.5, 0);
    scene.add(bounceLight);

    // ── Car group (positioned to right side so it doesn't obscure the CTA) ─
    const carGroup = new THREE.Group();
    carGroup.position.set(1.8, -0.65, 0);
    scene.add(carGroup);

    // ── State for smooth mouse & scroll follow ─────────────────────────────
    let modelReady = false;
    const mouse      = { nx: 0, ny: 0 };            // normalised -1..1
    const target     = { rotY: 0, rotX: 0 };        // desired rotation
    const current    = { rotY: 0, rotX: 0 };        // lerped rotation
    const BASE_ROT_Y = -0.35;                        // initial angle (front-quarter view)
    let   scrollY    = window.scrollY;
    let   animId;

    // ── Load model ─────────────────────────────────────────────────────────
    loadCarModel(null)
      .then(gltf => {
        const car = gltf.scene;

        // Auto-scale to consistent height
        const box     = new THREE.Box3().setFromObject(car);
        const size    = box.getSize(new THREE.Vector3());
        const maxDim  = Math.max(size.x, size.y, size.z);
        const scale   = 3.0 / maxDim;
        car.scale.setScalar(scale);

        // Centre the model at origin
        const center = box.getCenter(new THREE.Vector3());
        car.position.sub(center.multiplyScalar(scale));

        // Enable shadows on every mesh
        car.traverse(node => {
          if (node.isMesh) {
            node.castShadow    = true;
            node.receiveShadow = true;
          }
        });

        carGroup.add(car);
        modelReady = true;

        // Start rotation at the base angle, then the loop takes over
        carGroup.rotation.y = BASE_ROT_Y;

        // Fade the canvas in
        setVisible(true);
      })
      .catch(() => { /* silent — background just stays gradient */ });

    // ── Event handlers ─────────────────────────────────────────────────────
    const onMouseMove = e => {
      mouse.nx = (e.clientX / window.innerWidth)  * 2 - 1;   //  -1 (left) → 1 (right)
      mouse.ny = (e.clientY / window.innerHeight) * 2 - 1;   //  -1 (top)  → 1 (bottom)

      // Mouse drives ±30° yaw, ±6° pitch
      target.rotY = mouse.nx *  0.52;
      target.rotX = mouse.ny * -0.10;
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

    // ── Animation loop ─────────────────────────────────────────────────────
    const lerp = (a, b, t) => a + (b - a) * t;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (modelReady) {
        // Smooth-follow mouse
        current.rotY = lerp(current.rotY, target.rotY, 0.04);
        current.rotX = lerp(current.rotX, target.rotX, 0.04);

        // Scroll adds a gentle continuous rotation (1 full page ≈ +90°)
        const scrollRot = scrollY * 0.0012;

        carGroup.rotation.y = BASE_ROT_Y + current.rotY + scrollRot;
        carGroup.rotation.x = current.rotX;

        // Subtle camera parallax on scroll
        camera.position.y = lerp(camera.position.y, 1.1 - scrollY * 0.0005, 0.06);
      }

      renderer.render(scene, camera);
    };

    animate();

    // ── Cleanup ────────────────────────────────────────────────────────────
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
