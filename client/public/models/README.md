# Homepage vehicle preview

hero-golf.glb preserves the full vehicle mesh and original textures from the
existing golf_r_configurator.glb asset hosted on i3wcarculture-images S3.
Only hidden scene props and unused alternate parts have been pruned.

The previous simplified preview has been replaced. No simplification, welding,
quantization or texture resizing is applied. EXT_meshopt_compression encodes the
original attributes losslessly; Three.js supplies its bundled MeshoptDecoder.
Verification compares all 546 vertex attribute arrays, 622,418 triangles (allowing
cyclic index rotation with identical winding), and 34 texture images against the
original: all match exactly. Model size: 13,280,676 bytes, versus 28,093,200 bytes
for the original scene including unused props. Door pivots and materials remain.

The original 900 CSS pixel breakpoint is retained for rendering and preload.
Below 900 pixels the hero model and animated process are hidden and not loaded.
