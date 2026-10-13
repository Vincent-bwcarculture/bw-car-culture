# Homepage vehicle preview

`hero-golf.glb` is an optimized derivative of the existing site asset
`https://i3wcarculture-images.s3.amazonaws.com/models/golf_r_configurator.glb`.
No new vehicle model or third-party artwork was introduced.

Source size: 28,093,200 bytes. Output size: 3,257,424 bytes.
Unused scene props and alternate wheels were removed using the same visibility
rules as CarBackground3D. glTF Transform 4.5.1 prune, dedup, weld and simplify
(ratio 0.22, error 0.002), followed by Draco compression, reduced transfer size.
Paint, wheel and seat materials, door pivots and hierarchy are retained for the
animated customization sequence. The browser uses the bundled Draco decoder
from the installed Three.js version; its attribution is in draco/README.md.

The model and decoder are served from this site's own /models/ path. The
showroom is available from 1024 CSS pixels; smaller screens neither render the
journey nor initiate the model download.
