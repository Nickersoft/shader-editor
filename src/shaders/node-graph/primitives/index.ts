// Side-effect barrel: importing this file registers every primitive. Add a
// new primitive's import here when you author it. Categories mirror Blender's
// shader-node taxonomy (input / texture / color / vector / converter / group).

import "./group-input";
import "./group-output";
import "./group";
import "./reroute";

// Input
import "./time";
import "./texture-coordinate";
import "./screen-uv";
import "./resolution";
import "./value";

// Converter (math)
import "./math";
import "./map-range";
import "./smoothstep";
import "./threshold";
import "./remap";

// Vector
import "./vector-math";
import "./combine-xy";
import "./separate-xy";
import "./mapping";
import "./projection";
import "./normal";
import "./loop";
import "./sampler";
import "./pixelate";
import "./grain";
import "./mask";

// Texture
import "./white-noise-texture";
import "./noise-texture";
import "./voronoi-texture";
import "./magic-texture";
import "./gradient-texture";
import "./linear-gradient-domain";
import "./radial-gradient-domain";
import "./conic-gradient-domain";
import "./diamond-gradient-domain";
import "./wave-texture";
import "./checker-texture";
import "./brick-texture";
import "./ripple-texture";
import "./cell-grid";
import "./grid-lines";
import "./dot-grid";
import "./hex-grid";
import "./floating-particles";
import "./strands";

// Color
import "./color-ramp";
import "./mix-color";
import "./color-math";
import "./combine-color";
import "./separate-color";
import "./rgb-to-hsv";
import "./hsv-to-rgb";

// Effect-source
import "./sample-previous-pass";
