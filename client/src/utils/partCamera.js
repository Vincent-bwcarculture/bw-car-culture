import * as THREE from 'three';

// Hidden for interior parts so the cabin can be seen from above (cut-away view).
export const CUTAWAY_PARTS = ['Roof', 'Sunroof', 'Windshield', 'Ext_Body_Window', 'Int_Body_Window', 'Window_Rear', 'Pillar', 'Sun_Visor'];

export const isCutawayMesh = name => CUTAWAY_PARTS.some(f => name.includes(f));

/**
 * Where to put the camera to show a part.
 * meshes:  [{ name, box: THREE.Box3 }] for the visible car meshes (world space)
 * camera:  { position: THREE.Vector3, fov: degrees }
 * part:    { meshMatch: string[], view: 'interior' | 'top' | 'corner' | 'exterior' }
 * Returns { target, position } or null when the part has no matching mesh.
 */
export const computePartView = ({ meshes, camera, part }) => {
  const interior = part.view === 'interior';
  const visible = interior ? meshes.filter(m => !isCutawayMesh(m.name)) : meshes;
  const carBox = visible.reduce((b, m) => b.union(m.box), new THREE.Box3());
  const matches = visible.filter(m => part.meshMatch.some(f => m.name.includes(f)));
  if (!matches.length || carBox.isEmpty()) return null;

  const carCenter = carBox.getCenter(new THREE.Vector3());
  const carSize = carBox.getSize(new THREE.Vector3());
  const carMax = Math.max(carSize.x, carSize.y, carSize.z);
  const centerOf = m => m.box.getCenter(new THREE.Vector3());

  // Parts fitted at several corners: show the corner nearest the current view.
  let group = matches;
  const union = matches.reduce((b, m) => b.union(m.box), new THREE.Box3()).getSize(new THREE.Vector3());
  if (!interior && Math.max(union.x, union.z) > carMax * 0.5) {
    const nearest = matches.reduce((best, m) =>
      centerOf(m).distanceTo(camera.position) < centerOf(best).distanceTo(camera.position) ? m : best);
    const anchor = centerOf(nearest);
    group = matches.filter(m => centerOf(m).distanceTo(anchor) < carMax * 0.3);
  }

  const partBox = group.reduce((b, m) => b.union(m.box), new THREE.Box3());
  const target = partBox.getCenter(new THREE.Vector3());
  const partSize = partBox.getSize(new THREE.Vector3());
  let radius = Math.max(partSize.length() / 2, carMax * 0.06);
  // Wheel-corner parts modelled as one piece across the axle: aim at the end nearest the viewer.
  if (part.view === 'corner' && partSize.x > carSize.x * 0.5) {
    const side = camera.position.x >= carCenter.x ? 1 : -1;
    target.x = carCenter.x + side * (partSize.x / 2) * 0.85;
    radius = Math.max(partSize.y, partSize.z, carMax * 0.06);
  }
  const fit = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov) / 2) * 1.15;
  const distance = THREE.MathUtils.clamp(fit, carMax * 0.28, carMax * 1.3);
  const horizontal = camera.position.clone().sub(carCenter).setY(0).normalize();

  let position;
  if (interior || part.view === 'top') {
    position = target.clone()
      .addScaledVector(horizontal, carMax * 0.15)
      .add(new THREE.Vector3(0, Math.max(carSize.y * 1.2, distance * 0.9), 0));
  } else {
    const outward = target.clone().sub(carCenter).setY(0);
    const dir = outward.length() > carMax * 0.05 ? outward.normalize() : horizontal;
    dir.y = 0.45;
    dir.normalize();
    position = target.clone().addScaledVector(dir, distance);
    position.y = Math.max(position.y, carBox.min.y + carSize.y * 0.25);
  }
  return { target, position, carBox };
};
