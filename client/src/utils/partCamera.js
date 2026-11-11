import * as THREE from 'three';

// Camera placement for the Config Simulator. Pure functions over mesh bounding boxes, so they can
// be checked against the real model outside the browser.
//   meshes: [{ name, box: THREE.Box3 }] for the visible car meshes (world space)
//   part:   { meshMatch: string[], view: 'interior' | 'top' | 'corner' | 'exterior',
//             viewFrom?: [x, y, z] fixed viewing direction, reveal?: meshes made see-through while shown }

const isCabinMesh = name => /Int_/.test(name) && !/Trunk|Back_Shelf/.test(name);

const measure = meshes => {
  const box = meshes.reduce((b, m) => b.union(m.box), new THREE.Box3());
  const size = box.getSize(new THREE.Vector3());
  return { box, size, center: box.getCenter(new THREE.Vector3()), max: Math.max(size.x, size.y, size.z) };
};

// The part's meshes; for parts fitted at several corners, only the corner nearest the viewer.
export const partGroup = ({ meshes, camera, part }) => {
  const matches = meshes.filter(m => part.meshMatch.some(f => m.name.includes(f)));
  if (!matches.length) return [];
  const car = measure(meshes);
  const union = measure(matches).size;
  if (part.view === 'interior') return matches;
  // 'corner' parts (wheels, brakes, mirrors) always show one instance; others only when spread out.
  if (part.view !== 'corner' && Math.max(union.x, union.z) <= car.max * 0.5) return matches;
  const centerOf = m => m.box.getCenter(new THREE.Vector3());
  const nearest = matches.reduce((best, m) =>
    centerOf(m).distanceTo(camera.position) < centerOf(best).distanceTo(camera.position) ? m : best);
  const anchor = centerOf(nearest);
  return matches.filter(m => centerOf(m).distanceTo(anchor) < car.max * 0.3);
};

// Inside the cabin at head height. Anchored on the seats and steering wheel when the model has them:
// front-of-cabin parts are seen from the passenger's head position, the rest from the dashboard
// looking back. Falls back to the cabin's bounding box for models without those landmarks.
const insideView = (meshes, target) => {
  const seats = measure(meshes.filter(m => m.name.includes('Int_Seats')));
  const wheel = measure(meshes.filter(m => m.name.includes('Int_SW')));
  if (!seats.box.isEmpty() && !wheel.box.isEmpty()) {
    const liner = measure(meshes.filter(m => m.name.includes('Roof_Liner')));
    const eyeY = Math.min(seats.box.max.y - 0.1, liner.box.isEmpty() ? Infinity : liner.box.min.y - 0.08);
    const driverSide = Math.sign(wheel.center.x - seats.center.x) || 1;
    const frontZone = target.z >= seats.center.z + seats.size.z * 0.25;
    const position = frontZone
      ? new THREE.Vector3(seats.center.x - driverSide * seats.size.x * 0.18, eyeY, wheel.center.z - 0.36)
      : new THREE.Vector3(seats.center.x, eyeY, wheel.center.z);
    return { target, position, inside: true };
  }
  const cabin = measure(meshes.filter(m => isCabinMesh(m.name)));
  if (cabin.box.isEmpty()) return null;
  const { box, size, center } = cabin;
  const inFront = target.z >= center.z;
  const position = new THREE.Vector3(
    center.x - (target.x - center.x) * 0.6,
    box.min.y + size.y * 0.72,
    inFront ? target.z - size.z * 0.42 : center.z + size.z * 0.3
  );
  const margin = size.clone().multiplyScalar(0.12);
  position.clamp(box.min.clone().add(margin), box.max.clone().sub(margin));
  return { target, position, inside: true };
};

export const computePartView = ({ meshes, camera, part }) => {
  const group = partGroup({ meshes, camera, part });
  if (!group.length) return null;
  const car = measure(meshes);
  const partBox = measure(group);
  const target = partBox.center.clone();

  if (part.view === 'interior') {
    const inside = insideView(meshes, target);
    if (inside) return inside;
  }

  let radius = Math.max(partBox.size.length() / 2, car.max * 0.06);
  // Wheel-corner parts modelled as one piece across the axle: aim at the end nearest the viewer.
  if (part.view === 'corner' && partBox.size.x > car.size.x * 0.5) {
    const side = camera.position.x >= car.center.x ? 1 : -1;
    target.x = car.center.x + side * (partBox.size.x / 2) * 0.85;
    radius = Math.max(partBox.size.y, partBox.size.z, car.max * 0.06);
  }
  const fit = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov) / 2) * 1.15;
  const distance = THREE.MathUtils.clamp(fit, car.max * 0.28, car.max * 1.3);
  const horizontal = camera.position.clone().sub(car.center).setY(0).normalize();

  let position;
  if (part.view === 'top') {
    position = target.clone()
      .addScaledVector(horizontal, car.max * 0.15)
      .add(new THREE.Vector3(0, Math.max(car.size.y * 1.2, distance * 0.9), 0));
  } else {
    const outward = target.clone().sub(car.center).setY(0);
    let dir = outward.length() > car.max * 0.05 ? outward.normalize() : horizontal;
    dir.y = 0.45;
    // viewFrom: a fixed direction for parts that face a particular way (e.g. mirror glass faces
    // backwards); the side (x) follows whichever side of the car the viewer is on.
    if (part.viewFrom) dir = new THREE.Vector3(...part.viewFrom).multiply(new THREE.Vector3(horizontal.x >= 0 ? 1 : -1, 1, 1));
    dir.normalize();
    position = target.clone().addScaledVector(dir, distance);
    position.y = Math.max(position.y, car.box.min.y + car.size.y * 0.25);
  }
  return { target, position, inside: false };
};

// Product picture: the part on its own, framed from a three-quarter angle.
export const computeThumbnailView = ({ meshes, part, fov = 35, aspect = 1.4 }) => {
  const camera = { position: new THREE.Vector3(4, 1.5, 4), fov };
  const group = partGroup({ meshes, camera, part });
  if (!group.length) return null;
  const car = measure(meshes);
  const { center, size } = measure(group);
  const outward = center.clone().sub(car.center).setY(0);
  let dir = outward.length() > car.max * 0.05 ? outward.normalize() : new THREE.Vector3(1, 0, 1).normalize();
  // Turn a little off-axis so flat parts (glass, lights, badges) show some depth.
  dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.5);
  dir.y = 0.35;
  if (part.viewFrom) dir = new THREE.Vector3(...part.viewFrom);
  dir.normalize();
  const radius = Math.max(size.length() / 2, 0.05);
  const vFov = THREE.MathUtils.degToRad(fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const distance = radius / Math.sin(Math.min(vFov, hFov) / 2) * 1.05;
  return { target: center, position: center.clone().addScaledVector(dir, distance) };
};
