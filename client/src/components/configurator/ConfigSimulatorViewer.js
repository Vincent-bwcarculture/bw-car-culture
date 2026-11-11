// 3D viewer for the Config Simulator. Fitted parts take on their product finish and slide into
// place, the camera turns to the part being shown (inside the cabin for interior parts), and a
// picture of each product is rendered from the model for the parts list.
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadCarModel } from '../../utils/modelCache.js';
import { computePartView, computeThumbnailView, partGroup } from '../../utils/partCamera.js';
import './ConfigSimulatorViewer.css';

const HOME_CAMERA = new THREE.Vector3(4.2, 1.6, 4.2);
const HOME_TARGET = new THREE.Vector3(0, 0.4, 0);
const HIDE_KEYWORDS = ['turntable', 'platform', 'ground', 'floor', 'shadow', 'spoon', 'highpoly', 'lowpoly',
  '2262a6d3f82749', 'wheel.obj.cleaner.materialmerger.gles', 'stand'];
const HIDE_OBJECT_RE = /^object_([2-9]|10)$/i;
const HIDE_ROOTNODE_RE = /^rootnode\.\d{3,}$/i;
const THUMB_W = 280;
const THUMB_H = 200;

const nameOf = node => `${node.name} ${node.parent?.name || ''}`;
const isPartNode = (node, fragments = []) => fragments.some(f => nameOf(node).includes(f));
const rulesFor = (node, part) => (part.appearance || [])
  .filter(r => !r.match || nameOf(node).toLowerCase().includes(r.match.toLowerCase()));
const eachMaterial = (mat, fn) => (Array.isArray(mat) ? mat.map(fn) : fn(mat));
const disposeMaterial = mat => eachMaterial(mat, m => m.dispose());
const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOut = t => 1 - Math.pow(1 - t, 3);

// The product finish for one mesh, as a clone of its stock material.
const styledMaterial = (stock, rules) => eachMaterial(stock, source => {
  const m = source.clone();
  for (const rule of rules) {
    if (rule.color && m.color) m.color.set(rule.color);
    if (rule.metalness != null && 'metalness' in m) m.metalness = rule.metalness;
    if (rule.roughness != null && 'roughness' in m) m.roughness = rule.roughness;
    if (rule.opacity != null) {
      m.transparent = true;
      m.opacity = rule.opacity;
      if (m.transmission) m.transmission = Math.max(0, 1 - rule.opacity);
    }
    if (rule.emissive && m.emissive) {
      m.emissive.set(rule.emissive);
      m.emissiveIntensity = rule.emissiveIntensity ?? 1;
    }
  }
  m.needsUpdate = true;
  return m;
});

const ghostMaterial = base => eachMaterial(base, source => {
  const m = source.clone();
  m.transparent = true;
  m.opacity = 0.12;
  m.depthWrite = false;
  return m;
});

// Base material = what the mesh shows when not see-through (stock or product finish).
const getBase = node => node.userData.preReveal || node.material;
const setBase = (node, material) => {
  if (node.userData.preReveal) {
    disposeMaterial(node.material);
    node.userData.preReveal = material;
    node.material = ghostMaterial(material);
  } else {
    node.material = material;
  }
};

const ConfigSimulatorViewer = ({ color, parts = [], fitted = [], focus = null, onThumbnails }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const modelRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const nodesRef = useRef([]);
  const flightRef = useRef(null);
  const fitAnimsRef = useRef([]);
  const fittedRef = useRef(new Set());
  const hadFocusRef = useRef(false);
  const colorRef = useRef(color);
  colorRef.current = color;
  const [status, setStatus] = useState('loading');
  const [progress, setProgress] = useState(0);

  // ── Scene, camera, controls, model ─────────────────────────────────────────
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 360;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.05, 100);
    camera.position.copy(HOME_CAMERA);
    cameraRef.current = camera;

    const placed = (light, x, y, z) => { light.position.set(x, y, z); return light; };
    const lights = [
      new THREE.AmbientLight(0xffffff, 1.4),
      placed(new THREE.DirectionalLight(0xfff5e0, 4), 4, 5, 4),
      placed(new THREE.DirectionalLight(0xe0eeff, 1.5), -5, 3, 3),
      placed(new THREE.DirectionalLight(0xffffff, 2), 0, 4, -5),
      // Soft light inside the cabin so interior parts are readable from the driver's view.
      placed(new THREE.PointLight(0xffffff, 1.2, 3), 0, 0.9, -0.2)
    ];
    // Layer 1 is used to render product pictures; lights must be on it too.
    lights.forEach(light => { light.layers.enable(1); scene.add(light); });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(HOME_TARGET);
    controls.minDistance = 1.5;
    controls.maxDistance = 12;
    controls.maxPolarAngle = Math.PI / 2;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.update();
    controlsRef.current = controls;
    const cancelFlight = () => { flightRef.current = null; };
    controls.addEventListener('start', cancelFlight);

    let disposed = false;
    loadCarModel(({ percent }) => setProgress(percent))
      .then(gltf => {
        if (disposed) return;
        const car = gltf.scene;
        modelRef.current = car;
        scene.add(car);
        const carBox = new THREE.Box3().setFromObject(car);
        const carSize = carBox.getSize(new THREE.Vector3());
        const nodes = [];
        car.traverse(node => {
          if (!node.isMesh) return;
          const lower = node.name.toLowerCase();
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          const matLower = (mats[0]?.name || '').toLowerCase();
          const meshBox = new THREE.Box3().setFromObject(node);
          const size = meshBox.getSize(new THREE.Vector3());
          const center = meshBox.getCenter(new THREE.Vector3());
          const junk = HIDE_KEYWORDS.some(k => lower.includes(k) || matLower.includes(k)) ||
            HIDE_OBJECT_RE.test(node.name) || HIDE_ROOTNODE_RE.test(node.name) ||
            ((size.x > carSize.x * 0.7 || size.z > carSize.z * 0.7) && size.y < 0.25 && center.y < 0.15);
          if (junk) { node.visible = false; return; }
          mats.forEach(mat => {
            if (mat.name === 'MAT_Body_Paint' || mat.name === 'CarPaint') { mat.color.set(colorRef.current || '#164b98'); }
          });
          node.userData.homePosition = node.position.clone();
          nodes.push(node);
        });
        nodesRef.current = nodes;
        setStatus('ready');
      })
      .catch(() => !disposed && setStatus('error'));

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const now = performance.now();
      const flight = flightRef.current;
      if (flight) {
        const t = Math.min(1, (now - flight.start) / flight.duration);
        const k = easeInOut(t);
        camera.position.lerpVectors(flight.fromPos, flight.toPos, k);
        controls.target.lerpVectors(flight.fromTarget, flight.toTarget, k);
        if (t === 1) flightRef.current = null;
      }
      fitAnimsRef.current = fitAnimsRef.current.filter(anim => {
        const t = Math.max(0, Math.min(1, (now - anim.start) / anim.duration));
        const k = easeOut(t);
        anim.node.position.copy(anim.node.userData.homePosition).addScaledVector(anim.offset, 1 - k);
        if (anim.fade) anim.fade.forEach(({ material, to }) => { material.opacity = 0.05 + (to - 0.05) * k; });
        return t < 1;
      });
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    resizeObserver?.observe(container);
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', onResize);
      controls.removeEventListener('start', cancelFlight);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  // ── Paint colour ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'ready') return;
    nodesRef.current.forEach(node => eachMaterial(getBase(node), mat => {
      if (mat.name === 'MAT_Body_Paint' || mat.name === 'CarPaint') mat.color.set(color);
    }));
  }, [color, status]);

  // ── Helpers over the loaded model ──────────────────────────────────────────
  const partsRef = useRef(parts);
  partsRef.current = parts;
  const focusRef = useRef(focus);
  focusRef.current = focus;
  const onThumbsRef = useRef(onThumbnails);
  onThumbsRef.current = onThumbnails;
  const partsKey = parts.map(p => p.id).join('|');
  const fittedKey = fitted.join('|');
  const focusKey = focus ? String(focus.key) : '';

  const measureMeshes = () => nodesRef.current.filter(n => n.visible)
    .map(node => ({ name: nameOf(node), box: new THREE.Box3().setFromObject(node), node }));

  // Fitting: the part slides in from just outside its place (glass fades in instead).
  const startFitAnimation = (part, nodes) => {
    const meshes = measureMeshes();
    const carBox = meshes.reduce((b, m) => b.union(m.box), new THREE.Box3());
    const carCenter = carBox.getCenter(new THREE.Vector3());
    const carSize = carBox.getSize(new THREE.Vector3());
    const carMax = Math.max(carSize.x, carSize.y, carSize.z);
    const glass = (part.appearance || []).some(r => r.opacity != null);
    const start = performance.now() + 450;
    nodes.forEach(node => {
      node.position.copy(node.userData.homePosition);
      const anim = { node, start, duration: 900, offset: new THREE.Vector3() };
      if (glass && !node.userData.preReveal) {
        const mats = [].concat(getBase(node));
        anim.fade = mats.filter(m => m.transparent).map(material => ({ material, to: material.opacity }));
      } else {
        const center = new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3());
        const worldOffset = part.view === 'interior' || part.view === 'top'
          ? new THREE.Vector3(0, carMax * 0.05, 0)
          : center.clone().sub(carCenter).setY(0).normalize().multiplyScalar(carMax * 0.08);
        const world = node.getWorldPosition(new THREE.Vector3());
        const parent = node.parent;
        anim.offset = parent.worldToLocal(world.clone().add(worldOffset)).sub(parent.worldToLocal(world.clone()));
      }
      fitAnimsRef.current = fitAnimsRef.current.filter(a => a.node !== node).concat(anim);
    });
  };

  // ── Fitted parts: product finish on, stock finish back when removed ────────
  useEffect(() => {
    if (status !== 'ready') return;
    const on = new Set(fitted);
    const before = fittedRef.current;
    for (const part of partsRef.current) {
      const nodes = nodesRef.current.filter(n => isPartNode(n, part.meshMatch));
      const isOn = on.has(part.id);
      const wasOn = before.has(part.id);
      if (isOn && !wasOn) {
        nodes.forEach(node => {
          const rules = rulesFor(node, part);
          if (!node.userData.stockMaterial) node.userData.stockMaterial = getBase(node);
          if (rules.length) setBase(node, styledMaterial(node.userData.stockMaterial, rules));
        });
        startFitAnimation(part, nodes);
      } else if (!isOn && wasOn) {
        fitAnimsRef.current = fitAnimsRef.current.filter(a => !nodes.includes(a.node));
        nodes.forEach(node => {
          node.position.copy(node.userData.homePosition);
          const stock = node.userData.stockMaterial;
          if (!stock) return;
          const current = getBase(node);
          if (current !== stock) { setBase(node, stock); disposeMaterial(current); }
          delete node.userData.stockMaterial;
        });
      }
    }
    fittedRef.current = on;
  }, [fittedKey, partsKey, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Focus: turn the camera to the part; see-through for parts in the way ───
  useEffect(() => {
    const camera = cameraRef.current, controls = controlsRef.current;
    if (status !== 'ready' || !camera || !controls) return;
    const current = focusRef.current;
    const reveal = current?.reveal || [];
    nodesRef.current.forEach(node => {
      const want = reveal.length > 0 && isPartNode(node, reveal) && !isPartNode(node, current.meshMatch);
      if (want && !node.userData.preReveal) {
        node.userData.preReveal = node.material;
        node.material = ghostMaterial(node.material);
      } else if (!want && node.userData.preReveal) {
        disposeMaterial(node.material);
        node.material = node.userData.preReveal;
        delete node.userData.preReveal;
      }
    });

    const fly = (toPos, toTarget, duration) => {
      flightRef.current = { fromPos: camera.position.clone(), toPos, fromTarget: controls.target.clone(), toTarget,
        start: performance.now(), duration };
    };
    if (!current) {
      controls.autoRotate = true;
      controls.minDistance = 1.5;
      camera.near = 0.05;
      camera.updateProjectionMatrix();
      if (hadFocusRef.current) fly(HOME_CAMERA.clone(), HOME_TARGET.clone(), 1200);
      hadFocusRef.current = false;
      return;
    }
    hadFocusRef.current = true;
    controls.autoRotate = false;
    const view = computePartView({ meshes: measureMeshes(), camera, part: current });
    if (!view) return;
    controls.minDistance = view.inside ? 0.05 : 0.6;
    camera.near = view.inside ? 0.01 : 0.05;
    camera.updateProjectionMatrix();
    fly(view.position, view.target, view.inside ? 1500 : 1200);
  }, [focusKey, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Product pictures rendered from the model (part alone, in its product finish) ──
  useEffect(() => {
    if (status !== 'ready' || !partsRef.current.length || !onThumbsRef.current) return undefined;
    let cancelled = false;
    let timer;
    const thumbRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    thumbRenderer.setPixelRatio(1);
    thumbRenderer.setSize(THUMB_W, THUMB_H);
    thumbRenderer.outputColorSpace = THREE.SRGBColorSpace;
    thumbRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    thumbRenderer.toneMappingExposure = 1.25;
    const thumbCamera = new THREE.PerspectiveCamera(35, THUMB_W / THUMB_H, 0.01, 50);
    thumbCamera.layers.set(1);
    const queue = [...partsRef.current];
    const pictures = {};
    const finish = () => {
      thumbRenderer.dispose();
      thumbRenderer.forceContextLoss();
    };
    // One part per task, so the main view never renders with a part isolated or restyled.
    const next = () => {
      if (cancelled) return;
      const part = queue.shift();
      if (!part) { onThumbsRef.current?.(pictures); finish(); return; }
      try {
        const meshes = measureMeshes();
        const group = partGroup({ meshes, camera: { position: HOME_CAMERA, fov: 35 }, part }).map(m => m.node);
        // Glass, lights and badges read better on the car; other parts are shown on their own.
        const onCar = part.pictureContext === 'car';
        const view = onCar
          ? computePartView({ meshes, camera: { position: HOME_CAMERA, fov: 35 }, part })
          : computeThumbnailView({ meshes, part, fov: 35, aspect: THUMB_W / THUMB_H });
        const shown = onCar ? nodesRef.current.filter(n => n.visible) : group;
        const styledNodes = onCar ? nodesRef.current.filter(n => isPartNode(n, part.meshMatch)) : group;
        if (view && group.length) {
          const swaps = [];
          shown.forEach(node => node.layers.enable(1));
          styledNodes.forEach(node => {
            const rules = rulesFor(node, part);
            if (rules.length && !fittedRef.current.has(part.id)) {
              swaps.push([node, node.material]);
              node.material = styledMaterial(getBase(node), rules);
            } else if (node.userData.preReveal) {
              swaps.push([node, node.material]);
              node.material = node.userData.preReveal;
            }
          });
          thumbCamera.position.copy(view.position);
          thumbCamera.lookAt(view.target);
          thumbRenderer.render(sceneRef.current, thumbCamera);
          pictures[part.id] = thumbRenderer.domElement.toDataURL('image/png');
          swaps.forEach(([node, original]) => {
            if (node.material !== node.userData.preReveal) disposeMaterial(node.material);
            node.material = original;
          });
          shown.forEach(node => node.layers.disable(1));
        }
      } catch { /* a picture is optional; skip this part */ }
      timer = setTimeout(next, 0);
    };
    timer = setTimeout(next, 400);
    return () => { cancelled = true; clearTimeout(timer); finish(); };
  }, [partsKey, status]);

  return (
    <div className="csv-viewer" ref={mountRef}>
      {status === 'loading' && (
        <div className="csv-overlay">
          <span className="csv-spinner" />
          <span>{progress > 0 ? `Loading digital twin… ${progress}%` : 'Loading digital twin…'}</span>
        </div>
      )}
      {status === 'error' && <div className="csv-overlay">Could not load the 3D model</div>}
    </div>
  );
};

export default ConfigSimulatorViewer;
