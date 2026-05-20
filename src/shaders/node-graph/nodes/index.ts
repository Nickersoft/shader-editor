// Barrel for the node-graph node library. Each re-export below also runs the
// source module's `register()` side effect, so importing this file populates
// the registry with every node type.
//
// Authors compose graphs using the typed `GraphBuilder.add(new N.Foo({...}))`
// form. A namespace import (`import * as N from ".../nodes"`) sidesteps global
// shadowing of names like `Math`.

// Structural
export { GroupInput } from "./group-input";
export { GroupOutput } from "./group-output";
export { Group } from "./group";
export { Reroute } from "./reroute";

// Input
export { Time } from "./time";
export { Position } from "./texture-coordinate";
export { ScreenUV } from "./screen-uv";
export { Resolution } from "./resolution";
export { Const } from "./value";
export { Mouse } from "./mouse";

// Converter (math)
export { Math } from "./math";
export { MapRange } from "./map-range";
export { Smoothstep } from "./smoothstep";
export { Threshold } from "./threshold";
export { Remap } from "./remap";

// Vector
export { VectorMath } from "./vector-math";
export { CombineXy } from "./combine-xy";
export { SeparateXy } from "./separate-xy";
export { Mapping } from "./mapping";
export { Projection } from "./projection";
export { Normal } from "./normal";
export { Loop } from "./loop";
export { Sampler } from "./sampler";
export { Pixelate } from "./pixelate";
export { Grain } from "./grain";
export { Mask } from "./mask";
export { Sdf } from "./sdf";

// Texture
export { Hash } from "./white-noise-texture";
export { NoiseTexture } from "./noise-texture";
export { VoronoiTexture } from "./voronoi-texture";
export { PlasmaSample } from "./magic-texture";
export { GradientTexture } from "./gradient-texture";
export { GradientDomain } from "./gradient-domain";
export { WaveTexture } from "./wave-texture";
export { BrickTexture } from "./brick-texture";
export { RippleWave } from "./ripple-texture";
export { CellGrid } from "./cell-grid";
export { LatticeMask } from "./lattice-mask";
export { FloatingParticles } from "./floating-particles";
export { Strands } from "./strands";

// Color
export { ColorRamp } from "./color-ramp";
export { MixColor } from "./mix-color";
export { ColorMath } from "./color-math";
export { CombineColor } from "./combine-color";
export { SeparateColor } from "./separate-color";
export { RgbToHsv } from "./rgb-to-hsv";
export { HsvToRgb } from "./hsv-to-rgb";
export { Oscillator } from "./oscillator";

// Effect-source
export { SamplePreviousPass } from "./sample-previous-pass";
export { PrevFrameSample } from "./prev-frame-sample";
export { SampleBackdrop } from "./sample-backdrop";

// Control-flow
export { Iterate } from "./iterate";
