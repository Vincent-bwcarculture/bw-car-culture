import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import CarBackground3D from '../components/layout/HeroSection/CarBackground3D.js';
import { loadCarModel } from './modelCache.js';

jest.mock('./modelCache.js', () => ({ loadCarModel: jest.fn() }));
jest.mock('three', () => ({
  ...jest.requireActual('three'),
  WebGLRenderer: jest.fn()
}));

let root, container, renderer, desktop, ready, nextFrame, observerCallback, body, rim, cabin, glass, model, door;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  renderer = { setPixelRatio: jest.fn(), setSize: jest.fn(), render: jest.fn(), dispose: jest.fn() };
  THREE.WebGLRenderer.mockImplementation(() => renderer);
  desktop = { matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() };
  window.matchMedia = jest.fn(query => query.includes('min-width') ? desktop : { matches: false, addEventListener() {}, removeEventListener() {} });
  global.ResizeObserver = class { observe() {} disconnect() {} };
  global.IntersectionObserver = class { constructor(callback) { observerCallback = callback; } observe() {} disconnect() {} };
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ width: 700, height: 500 });
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
