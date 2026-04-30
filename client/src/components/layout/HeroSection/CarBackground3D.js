// CarBackground3D.js — vanilla Three.js background car for the Hero section
// Mouse follow · Scroll rotation · Door-open animation on sellMode
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { loadCarModel } from '../../../utils/modelCache.js';

const HIDE_KEYWORDS = [
  'turntable', 'platform', 'ground', 'floor', 'shadow', 'spoon',
  'highpoly', 'lowpoly',
  '2262a6d3f82749',
  'wheel.obj.cleaner.materialmerger.gles',
];
const HIDE_OBJECT_RE   = /^object_([2-9]|10)$/i;
const HIDE_ROOTNODE_RE = /^rootnode\.\d{3,}$/i;

const DOOR_OPEN_ANGLE = Math.PI * 0.30;   // ~54° — feels natural on a hatchback

const CarBackground3D = ({ sellMode = false }) => {
  const canvasRef  = useRef(null);
  const [visible, setVisible] = useState(false);

  // Ref so the animation loop always sees the latest value without re-running the effect
  const sellModeRef = useRef(sellMode);
  useEffect(() => { sellModeRef.current = sellMode; }, [sellMode]);

  useEffect(() => {
    if (window.innerWidth < 900) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping      = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

    // ── Scene ─────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    // ── Camera ────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(4, 1.5, 4);
    camera.lookAt(0, 0.4, 0);

    // ── Lighting (same as CarViewer) ──────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const key = new THREE.DirectionalLight(0xfff5e0, 4);
    key.position.set(4, 5, 4); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe0eeff, 1.5);
    fill.position.set(-5, 3, 3); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 2);
    rim.position.set(0, 4, -5); scene.add(rim);

    // ── Car group ─────────────────────────────────────────────────────────
    const carGroup = new THREE.Group();
    carGroup.position.set(1.6, 0.3, 0);
    scene.add(carGroup);

    // ── State ─────────────────────────────────────────────────────────────
    let modelReady = false;
    const target  = { rotY: 0, rotX: 0 };
    const current = { rotY: 0, rotX: 0 };
    const BASE_Y  = -0.35;
    let scrollY   = window.scrollY;
    let animId;

    // Auto-rotation idle tracking
    let idleTimer = null;
    let isIdle = false;
    let autoRotAngle = 0;
    const IDLE_DELAY = 5000; // 5s
    const AUTO_ROT_SPEED = 0.003; // radians per frame

    const resetIdle = () => {
      isIdle = false;
      autoRotAngle = current.rotY; // sync so rotation doesn't jump
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { isIdle = true; }, IDLE_DELAY);
    };

    // Door nodes discovered after model loads
    // Each entry: { node, openAngle, closedAngle, currentAngle }
    const doorEntries = [];

    // ── Load & filter ─────────────────────────────────────────────────────
    loadCarModel(null)
      .then(gltf => {
        const car = gltf.scene;

        const carBox  = new THREE.Box3().setFromObject(car);
        const carSize = new THREE.Vector3();
        carBox.getSize(carSize);

        // Pass 1: hide unwanted meshes
        car.traverse(node => {
          if (!node.isMesh) return;
          const nameLower = node.name.toLowerCase();
          const matName   = (Array.isArray(node.material)
            ? node.material[0]?.name : node.material?.name) || '';
          const matLower  = matName.toLowerCase();

          if (
            HIDE_KEYWORDS.some(k => nameLower.includes(k) || matLower.includes(k)) ||
            HIDE_OBJECT_RE.test(node.name) ||
            HIDE_ROOTNODE_RE.test(node.name)
          ) { node.visible = false; return; }

          const meshBox  = new THREE.Box3().setFromObject(node);
          const meshSize = new THREE.Vector3();
          const meshCenter = new THREE.Vector3();
          meshBox.getSize(meshSize); meshBox.getCenter(meshCenter);
          if (
            (meshSize.x > carSize.x * 0.7 || meshSize.z > carSize.z * 0.7) &&
            meshSize.y < 0.25 && meshCenter.y < 0.15
          ) { node.visible = false; return; }

          node.castShadow = node.receiveShadow = true;
        });

        // Pass 2: find door Object3D nodes (the pivot parents, not meshes)
        // We walk ALL nodes, look for "door" in the name, skip handles/mirrors/trim
        car.traverse(node => {
          const n = node.name.toLowerCase();
          if (
            n.includes('door') &&
            !n.includes('handle') &&
            !n.includes('mirror') &&
            !n.includes('trim') &&
            !n.includes('sill') &&
            !n.includes('glass')   // glass is a child mesh — rotate the parent
          ) {
            // Log name so we can see what's found
            console.log('[3D door candidate]', node.name, node.type);

            // Determine open direction from world X position
            // Negative X = left side → door swings in -Y rotation (opens to the left)
            // Positive X = right side → door swings in +Y rotation (opens to the right)
            const worldPos = new THREE.Vector3();
            node.getWorldPosition(worldPos);

            const isLeftSide = worldPos.x <= 0;
            // Most Golf R GLTFs have doors with Y as the hinge axis
            // Adjust sign based on which side the door is on
            const openAngle = isLeftSide ? -DOOR_OPEN_ANGLE : DOOR_OPEN_ANGLE;

            doorEntries.push({
              node,
              openAngle,
              closedAngle: node.rotation.y,   // whatever the model's rest pose is
              axisKey: 'y',                   // which rotation axis the hinge is
            });
          }
        });

        console.log('[3D] total door entries found:', doorEntries.length);

        carGroup.add(car);
        modelReady = true;
        carGroup.rotation.y = BASE_Y;
        setVisible(true);
      })
      .catch(() => {});

    // ── Events ────────────────────────────────────────────────────────────
    const onMouseMove = e => {
      resetIdle();
      const nx = (e.clientX / window.innerWidth)  * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      target.rotY = nx *  0.52;
      target.rotX = ny * -0.10;
    };
    const onScroll = () => { scrollY = window.scrollY; resetIdle(); };
    const onResize = () => {
      const nW = window.innerWidth, nH = window.innerHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll',    onScroll,    { passive: true });
    window.addEventListener('resize',    onResize);

    // Start idle countdown immediately on mount
    resetIdle();

    // ── Render loop ───────────────────────────────────────────────────────
    const lerp = (a, b, t) => a + (b - a) * t;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (modelReady) {
        if (isIdle) {
          // Slow auto-rotation — smoothly drift autoRotAngle and lerp current toward it
          autoRotAngle += AUTO_ROT_SPEED;
          current.rotY = lerp(current.rotY, autoRotAngle, 0.012);
          current.rotX = lerp(current.rotX, 0, 0.02);
        } else {
          // Mouse follow
          current.rotY = lerp(current.rotY, target.rotY, 0.04);
          current.rotX = lerp(current.rotX, target.rotX, 0.04);
        }

        carGroup.rotation.y = BASE_Y + current.rotY + scrollY * 0.0012;
        carGroup.rotation.x = current.rotX;
        camera.position.y   = lerp(camera.position.y, 1.5 + scrollY * 0.0005, 0.06);

        // Door animation
        const selling = sellModeRef.current;
        doorEntries.forEach(entry => {
          const targetAngle = selling ? entry.openAngle : entry.closedAngle;
          entry.node.rotation[entry.axisKey] = lerp(
            entry.node.rotation[entry.axisKey],
            targetAngle,
            0.04    // same easing as mouse follow → smooth 1–2s open/close
          );
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // ── WebGL context loss ────────────────────────────────────────────────
    const onContextLost = (e) => {
      e.preventDefault();           // allow restore attempt
      cancelAnimationFrame(animId);
    };
    const onContextRestored = () => {
      animate();                    // restart the loop on restore
    };
    canvas.addEventListener('webglcontextlost',     onContextLost,     false);
    canvas.addEventListener('webglcontextrestored', onContextRestored, false);

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      clearTimeout(idleTimer);
      cancelAnimationFrame(animId);
      canvas.removeEventListener('webglcontextlost',     onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll',    onScroll);
      window.removeEventListener('resize',    onResize);
      renderer.dispose();
    };
  }, []);   // intentionally empty — sellModeRef keeps it in sync

  return (
    <canvas
      ref={canvasRef}
      className={`hero-3d-canvas${visible ? ' hero-3d-canvas--on' : ''}`}
      aria-hidden="true"
    />
  );
};

export default CarBackground3D;
