import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import CarBackground3D from '../components/layout/HeroSection/CarBackground3D.js';
import { loadCarModel } from './modelCache.js';

jest.mock('three/examples/jsm/controls/OrbitControls.js', () => ({ OrbitControls: jest.fn().mockImplementation(() => Object.assign(new (jest.requireActual('three').EventDispatcher)(), { update: jest.fn(), dispose: jest.fn() })) }));

jest.mock('./modelCache.js', () => ({ loadCarModel: jest.fn() }));
jest.mock('three', () => ({
  ...jest.requireActual('three'),
  WebGLRenderer: jest.fn()
}));

let root, container, renderer, desktop, ready, nextFrame, observerCallback, body, rim, cabin, glass, model, door;
beforeEach(() => {
  OrbitControls.mockImplementation(() => Object.assign(new (jest.requireActual('three').EventDispatcher)(), { update: jest.fn(), dispose: jest.fn() }));
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  renderer = { shadowMap: {}, setPixelRatio: jest.fn(), setSize: jest.fn(), render: jest.fn(), dispose: jest.fn() };
  THREE.WebGLRenderer.mockImplementation(() => renderer);
  desktop = { matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() };
  window.matchMedia = jest.fn(query => query.includes('min-width') ? desktop : { matches: false, addEventListener() {}, removeEventListener() {} });
  global.ResizeObserver = class { observe() {} disconnect() {} };
  global.IntersectionObserver = class { constructor(callback) { observerCallback = callback; } observe() {} disconnect() {} };
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ width: 700, height: 500, left: 0, top: 0 });
  jest.spyOn(performance, 'now').mockReturnValue(0);
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { nextFrame = callback; return 1; });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  ready = jest.fn(); model = new THREE.Group();
  body = new THREE.MeshStandardMaterial({ name: 'MAT_Body_Paint', color: '#ffffff' });
  rim = new THREE.MeshStandardMaterial({ name: 'MAT_Rim', color: '#111111' });
  cabin = new THREE.MeshStandardMaterial({ name: 'leather_color', color: '#164b98' });
  glass = new THREE.MeshStandardMaterial({ name: 'glass_light', color: '#333333', transparent: true });
  [body, rim, cabin, glass].forEach(material => model.add(new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 2), material)));
  door = new THREE.Group(); door.name = 'Pivot_FL'; model.add(door);
  loadCarModel.mockResolvedValue({ scene: model });
});
afterEach(async () => {
  await act(async () => root.unmount()); container.remove(); jest.restoreAllMocks();
  delete window.matchMedia; delete global.ResizeObserver; delete global.IntersectionObserver;
});
const render = async props => { await act(async () => root.render(<CarBackground3D onReadyChange={ready} {...props} />)); };
const frames = () => { for (let time = 100; time <= 3000; time += 100) nextFrame(time); };

test('paint, wheel and cabin finishes change only their dedicated materials', async () => {
  const originalGlass = glass.color.clone();
  await render({ paintColour: '#9d172d', wheelFinish: '#9c7649', interiorAccent: '#a56435', motionEnabled: false });
  expect(ready).toHaveBeenLastCalledWith(true);
  frames();
  expect(body.color.getHexString()).toBe('9d172d');
  expect(rim.color.getHexString()).toBe('9c7649');
  expect(cabin.color.getHexString()).toBe('a56435');
  expect(glass.color.equals(originalGlass)).toBe(true);
});

test('interior preview opens the front-door pivot and leaving it closes the door', async () => {
  await render({ previewPart: 'interior', motionEnabled: false }); frames();
  expect(door.rotation.y).toBeLessThan(-.9);
  await render({ previewPart: 'paint', motionEnabled: false });
  // Continue the frame clock from the previous call.
  for (let time = 3100; time <= 6000; time += 100) nextFrame(time);
  expect(Math.abs(door.rotation.y)).toBeLessThan(.002);
});

test('unsupported WebGL keeps the readable fallback without reporting the model ready', async () => {
  THREE.WebGLRenderer.mockImplementationOnce(() => { throw new Error('WebGL unavailable'); });
  await render({});
  expect(ready).toHaveBeenLastCalledWith(false);
  expect(container.querySelector('.is-ready')).toBeNull();
});

test('crossing to mobile releases the renderer and model resources', async () => {
  const dispose = jest.spyOn(body, 'dispose');
  await render({});
  const onResize = desktop.addEventListener.mock.calls[0][1];
  desktop.matches = false;
  await act(async () => onResize());
  expect(ready).toHaveBeenLastCalledWith(false);
  expect(renderer.dispose).toHaveBeenCalledTimes(1);
  expect(dispose).toHaveBeenCalledTimes(1);
  expect(container.querySelector('.is-ready')).toBeNull();
});

test('rendering pauses when the hero leaves the viewport', async () => {
  await render({});
  window.cancelAnimationFrame.mockClear();
  observerCallback([{ isIntersecting: false }]);
  expect(window.cancelAnimationFrame).toHaveBeenCalled();
  window.requestAnimationFrame.mockClear();
  observerCallback([{ isIntersecting: true }]);
  expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
});


test('smaller screens never create a renderer or request the model', async () => {
  desktop.matches = false;
  loadCarModel.mockClear(); THREE.WebGLRenderer.mockClear();
  await render({});
  expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 900px)');
  expect(loadCarModel).not.toHaveBeenCalled();
  expect(THREE.WebGLRenderer).not.toHaveBeenCalled();
  expect(ready).toHaveBeenLastCalledWith(false);
});


test('cursor controls pause the journey, constrain zoom, and dispose on unmount', async () => {
  const interaction = jest.fn();
  await render({ onInteraction: interaction });
  const controls = OrbitControls.mock.results.at(-1).value;
  expect(controls.enablePan).toBe(false);
  expect(controls.minDistance).toBeGreaterThan(0);
  expect(controls.maxDistance).toBeGreaterThan(controls.minDistance);
  controls.dispatchEvent({ type: 'start' });
  expect(interaction).toHaveBeenCalledTimes(1);
  await act(async () => root.render(null));
  expect(controls.dispose).toHaveBeenCalledTimes(1);
  controls.dispatchEvent({ type: 'start' });
  expect(interaction).toHaveBeenCalledTimes(1);
});

test('page scroll gently moves the vehicle within its stage', async () => {
  container.className = 'bcc-hero-section';
  Object.defineProperty(container, 'offsetHeight', { value: 800 });
  await render({ motionEnabled: false });
  Element.prototype.getBoundingClientRect.mockReturnValue({ width: 700, height: 500, top: -400 });
  window.dispatchEvent(new Event('scroll'));
  frames();
  const scene = renderer.render.mock.calls.at(-1)[0];
  const group = scene.children.find(node => node.isGroup);
  expect(group.position.y).toBeGreaterThan(.2);
  expect(group.position.y).toBeLessThan(.25);
});


test('only the vehicle silhouette enables controls; empty canvas leaves scrolling free', async () => {
  await render({ motionEnabled: false });
  const controls = OrbitControls.mock.results.at(-1).value;
  const canvas = container.querySelector('canvas');
  expect(controls.enabled).toBe(false);
  canvas.dispatchEvent(new MouseEvent('pointerdown', { clientX: 350, clientY: 250, bubbles: true }));
  expect(controls.enabled).toBe(true);
  canvas.dispatchEvent(new MouseEvent('pointermove', { clientX: 1, clientY: 1, bubbles: true }));
  expect(controls.enabled).toBe(true); // A drag that starts on the car can finish outside it.
  window.dispatchEvent(new Event('pointerup'));
  expect(controls.enabled).toBe(false);
  canvas.dispatchEvent(new WheelEvent('wheel', { clientX: 1, clientY: 1, deltaY: 100 }));
  expect(controls.enabled).toBe(false);
  expect(canvas.style.cursor).toBe('auto');
  canvas.dispatchEvent(new WheelEvent('wheel', { clientX: 350, clientY: 250, deltaY: -100 }));
  expect(controls.enabled).toBe(true);
  expect(canvas.style.cursor).toBe('grab');
  canvas.dispatchEvent(new Event('pointerleave'));
  expect(controls.enabled).toBe(false);
});
