import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { loadCarModel } from '../../../utils/modelCache.js';

const HIDE_KEYWORDS = ['turntable', 'platform', 'ground', 'floor', 'shadow', 'spoon',
  'highpoly', 'lowpoly', '2262a6d3f82749', 'wheel.obj.cleaner.materialmerger.gles'];
const disposeModel = (model) => {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  model.traverse(node => {
    if (node.geometry) geometries.add(node.geometry);
    const list = Array.isArray(node.material) ? node.material : [node.material];
    list.filter(Boolean).forEach(material => {
      materials.add(material);
      Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value); });
    });
  });
  textures.forEach(texture => texture.dispose());
  materials.forEach(material => material.dispose());
  geometries.forEach(geometry => geometry.dispose());
};

const CarBackground3D = ({ sellMode = false, paintColour, wheelFinish, interiorAccent, previewPart, motionEnabled = true, onReadyChange }) => {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const settings = useRef({ sellMode, paintColour, wheelFinish, interiorAccent, previewPart, motionEnabled, onReadyChange });
  useEffect(() => { settings.current = { sellMode, paintColour, wheelFinish, interiorAccent, previewPart, motionEnabled, onReadyChange }; },
    [sellMode, paintColour, wheelFinish, interiorAccent, previewPart, motionEnabled, onReadyChange]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setDesktop(media.matches && !navigator.connection?.saveData);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!desktop) { setVisible(false); settings.current.onReadyChange?.(false); return; }
    const canvas = canvasRef.current, stage = stageRef.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      settings.current.onReadyChange?.(false);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const key = new THREE.DirectionalLight(0xfff4e2, 4);
    key.position.set(4, 5, 4); scene.add(key);
    const fill = new THREE.DirectionalLight(0xdbe9ff, 2);
    fill.position.set(-5, 3, 3); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 3);
    rim.position.set(0, 4, -5); scene.add(rim);
    const group = new THREE.Group(); scene.add(group);
    let disposed = false, model = null, ready = false, inView = true, contextLost = false;
    let frame = null, lastFrame = 0, elapsed = 0, dirty = true;
    const surfaces = {
      paint: { materials: new Set(), target: new THREE.Color(), last: null },
      wheels: { materials: new Set(), target: new THREE.Color(), last: null },
      interior: { materials: new Set(), target: new THREE.Color(), last: null },
    };
    const paintNodes = new Set();
    const doors = [];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const resize = () => {
      const { width, height } = stage.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      // The car is normalized to four units; keep it inside its own stage at every aspect ratio.
      const distance = 7.4 / Math.min(1, camera.aspect / 1.35);
      camera.position.set(distance * 0.68, distance * 0.28, distance * 0.68);
      camera.lookAt(0, 0, 0);
      dirty = true;
    };
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(stage); resize();

    const animate = (now = 0) => {
      frame = requestAnimationFrame(animate);
      if (now - lastFrame < 1000 / 30) return;
      const delta = Math.min((now - lastFrame) / 1000, 0.25); lastFrame = now;
      if (!ready) return;
      const { paintColour, wheelFinish, interiorAccent, previewPart, motionEnabled: motion, sellMode: selling } = settings.current;
      const moving = motion && !reducedMotion.matches;
      let changing = false;
      const colours = { paint: paintColour || '#164b98', wheels: wheelFinish || '#434851', interior: interiorAccent || '#164b98' };
      Object.entries(surfaces).forEach(([part, surface]) => {
        if (colours[part] !== surface.last) {
          surface.target.set(colours[part]); surface.last = colours[part]; dirty = true;
        }
        surface.materials.forEach(material => {
          if (material.color.equals(surface.target)) return;
          const difference = Math.abs(material.color.r - surface.target.r) + Math.abs(material.color.g - surface.target.g) + Math.abs(material.color.b - surface.target.b);
          if (reducedMotion.matches || difference < 0.001) material.color.copy(surface.target);
          else { material.color.lerp(surface.target, 1 - Math.exp(-delta * 4)); changing = true; }
          dirty = true;
        });
      });
      if (moving) elapsed += delta;
      const baseRotation = previewPart === 'wheels' ? -1.1 : -0.35;
      const targetRotation = baseRotation + (moving ? Math.sin(elapsed * 0.18) * 0.18 : 0);
      if (Math.abs(group.rotation.y - targetRotation) > .001) {
        group.rotation.y = reducedMotion.matches ? targetRotation : THREE.MathUtils.lerp(group.rotation.y, targetRotation, 1 - Math.exp(-delta * 2));
        dirty = true;
      }
      doors.forEach(({ node, closed, open, front }) => {
        const target = selling || (previewPart === 'interior' && front) ? open : closed;
        if (Math.abs(node.rotation.y - target) > 0.001) {
          node.rotation.y = reducedMotion.matches ? target : THREE.MathUtils.lerp(node.rotation.y, target, 1 - Math.exp(-delta * 3));
          dirty = true;
        }
      });
      if (dirty || changing) { renderer.render(scene, camera); dirty = false; }
    };
    const updateLoop = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      if (!disposed && inView && !document.hidden && !contextLost) {
        lastFrame = performance.now(); frame = requestAnimationFrame(animate);
      }
    };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; updateLoop(); });
    observer.observe(stage);
    document.addEventListener('visibilitychange', updateLoop);
    const onPreference = () => { dirty = true; };
    reducedMotion.addEventListener('change', onPreference);
    const onContextLost = event => {
      event.preventDefault(); contextLost = true; setVisible(false);
      settings.current.onReadyChange?.(false); updateLoop();
    };
    const onContextRestored = () => {
      contextLost = false; dirty = true; setVisible(ready);
      settings.current.onReadyChange?.(ready); updateLoop();
    };
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    loadCarModel(null).then(gltf => {
      if (disposed) { disposeModel(gltf.scene); return; }
      model = gltf.scene;
      model.traverse(node => {
        if (!node.isMesh) return;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        const names = [node.name, ...materials.map(material => material?.name || '')].join(' ').toLowerCase();
        if (HIDE_KEYWORDS.some(word => names.includes(word)) || /^object_([2-9]|10)$/i.test(node.name) || /^rootnode\.\d{3,}$/i.test(node.name)) {
          node.visible = false; return;
        }
        materials.forEach(material => {
          // Use the dedicated paint material, never broad mesh names such as "body".
          if (material?.color && /paint/i.test(material.name)) { surfaces.paint.materials.add(material); paintNodes.add(node); }
          if (material?.color && material.name === 'MAT_Rim') surfaces.wheels.materials.add(material);
          if (material?.color && material.name === 'leather_color') surfaces.interior.materials.add(material);
        });
      });
      const bounds = new THREE.Box3();
      model.updateMatrixWorld(true);
      // Frame the vehicle body, excluding unused scenery still present in the source GLB.
      if (paintNodes.size) paintNodes.forEach(node => bounds.expandByObject(node));
      else model.traverseVisible(node => { if (node.isMesh) bounds.expandByObject(node); });
      const size = bounds.getSize(new THREE.Vector3());
      const centre = bounds.getCenter(new THREE.Vector3());
      if (bounds.isEmpty() || !Number.isFinite(size.length()) || size.length() === 0) throw new Error('Vehicle bounds unavailable');
      const pivot = new THREE.Group(); pivot.add(model); pivot.position.copy(centre).negate();
      group.add(pivot); group.scale.setScalar(4 / Math.max(size.x, size.y, size.z));
      group.rotation.y = -0.35;
      model.traverse(node => {
        const match = /^Pivot_(FL|FR|RL|RR)$/i.exec(node.name);
        if (!match) return;
        const side = match[1].endsWith('L') ? -1 : 1;
        doors.push({ node, closed: node.rotation.y, open: node.rotation.y + side * Math.PI * 0.3, front: match[1].startsWith('F') });
      });
      surfaces.paint.materials.forEach(material => material.color.set(settings.current.paintColour || '#164b98'));
      ready = true; dirty = true;
      // Reveal the layout only after a frame can actually be displayed.
      renderer.render(scene, camera);
      setVisible(!contextLost); settings.current.onReadyChange?.(!contextLost);
    }).catch(error => {
      if (!disposed) {
        console.warn('Hero vehicle preview unavailable:', error.message);
        settings.current.onReadyChange?.(false);
      }
    });
    updateLoop();

    return () => {
      disposed = true; settings.current.onReadyChange?.(false);
      if (frame !== null) cancelAnimationFrame(frame);
      resizeObserver.disconnect(); observer.disconnect();
      document.removeEventListener('visibilitychange', updateLoop);
      reducedMotion.removeEventListener('change', onPreference);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      if (model) disposeModel(model);
      renderer.dispose();
    };
  }, [desktop]);

  return (
    <div ref={stageRef} className={`bcc-hero-model-stage${visible ? ' is-ready' : ''}`} aria-hidden="true">
      <canvas ref={canvasRef} className={`hero-3d-canvas${visible ? ' hero-3d-canvas--on' : ''}`} />
      {visible && !sellMode && <div className="bcc-hero-model-caption">A vision of what’s possible <span>Explore your own expression.</span></div>}
    </div>
  );
};

export default CarBackground3D;
