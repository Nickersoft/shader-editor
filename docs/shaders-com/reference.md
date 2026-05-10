# shaders.com Component Reference

Reference data extracted from https://shaders.com/docs/components for code-port purposes. Each entry contains the component's name, slug, category, one-line description, and prop schema.

## Table of Contents

- **Textures**
  - [Aurora](#aurora) (`aurora`)
  - [Beam](#beam) (`beam`)
  - [Blob](#blob) (`blob`)
  - [Checkerboard](#checkerboard) (`checkerboard`)
  - [ConicGradient](#conicgradient) (`conicgradient`)
  - [DiamondGradient](#diamondgradient) (`diamondgradient`)
  - [DOMTexture](#domtexture) (`domtexture`)
  - [DotGrid](#dotgrid) (`dotgrid`)
  - [FallingLines](#fallinglines) (`fallinglines`)
  - [FloatingParticles](#floatingparticles) (`floatingparticles`)
  - [FlowingGradient](#flowinggradient) (`flowinggradient`)
  - [Godrays](#godrays) (`godrays`)
  - [Grid](#grid) (`grid`)
  - [HexGrid](#hexgrid) (`hexgrid`)
  - [ImageTexture](#imagetexture) (`imagetexture`)
  - [LinearGradient](#lineargradient) (`lineargradient`)
  - [MultiPointGradient](#multipointgradient) (`multipointgradient`)
  - [Plasma](#plasma) (`plasma`)
  - [RadialGradient](#radialgradient) (`radialgradient`)
  - [Ripples](#ripples) (`ripples`)
  - [SimplexNoise](#simplexnoise) (`simplexnoise`)
  - [SineWave](#sinewave) (`sinewave`)
  - [SolidColor](#solidcolor) (`solidcolor`)
  - [Spiral](#spiral) (`spiral`)
  - [Strands](#strands) (`strands`)
  - [Stripes](#stripes) (`stripes`)
  - [StudioBackground](#studiobackground) (`studiobackground`)
  - [Swirl](#swirl) (`swirl`)
  - [Truchet](#truchet) (`truchet`)
  - [VideoTexture](#videotexture) (`videotexture`)
  - [Voronoi](#voronoi) (`voronoi`)
  - [Weave](#weave) (`weave`)
  - [WebcamTexture](#webcamtexture) (`webcamtexture`)
- **Shapes**
  - [Circle](#circle) (`circle`)
  - [Crescent](#crescent) (`crescent`)
  - [Cross](#cross) (`cross`)
  - [Ellipse](#ellipse) (`ellipse`)
  - [Flower](#flower) (`flower`)
  - [Polygon](#polygon) (`polygon`)
  - [Ring](#ring) (`ring`)
  - [RoundedRect](#roundedrect) (`roundedrect`)
  - [Star](#star) (`star`)
  - [Trapezoid](#trapezoid) (`trapezoid`)
  - [Vesica](#vesica) (`vesica`)
- **Shape Effects**
  - [Crystal](#crystal) (`crystal`)
  - [Emboss](#emboss) (`emboss`)
  - [Glass](#glass) (`glass`)
  - [Neon](#neon) (`neon`)
  - [SmokeFill](#smokefill) (`smokefill`)
- **Stylize**
  - [Ascii](#ascii) (`ascii`)
  - [ChromaticAberration](#chromaticaberration) (`chromaticaberration`)
  - [ContourLines](#contourlines) (`contourlines`)
  - [CRTScreen](#crtscreen) (`crtscreen`)
  - [Dither](#dither) (`dither`)
  - [DropShadow](#dropshadow) (`dropshadow`)
  - [FilmGrain](#filmgrain) (`filmgrain`)
  - [Glitch](#glitch) (`glitch`)
  - [Glow](#glow) (`glow`)
  - [Halftone](#halftone) (`halftone`)
  - [LensFlare](#lensflare) (`lensflare`)
  - [Paper](#paper) (`paper`)
  - [Pixelate](#pixelate) (`pixelate`)
  - [VHS](#vhs) (`vhs`)
  - [Vignette](#vignette) (`vignette`)
- **Interactive**
  - [ChromaFlow](#chromaflow) (`chromaflow`)
  - [CursorRipples](#cursorripples) (`cursorripples`)
  - [CursorTrail](#cursortrail) (`cursortrail`)
  - [Fog](#fog) (`fog`)
  - [GridDistortion](#griddistortion) (`griddistortion`)
  - [Liquify](#liquify) (`liquify`)
  - [Shatter](#shatter) (`shatter`)
  - [Smoke](#smoke) (`smoke`)
- **Distortions**
  - [Bulge](#bulge) (`bulge`)
  - [ConcentricSpin](#concentricspin) (`concentricspin`)
  - [FlowField](#flowfield) (`flowfield`)
  - [FlutedGlass](#flutedglass) (`flutedglass`)
  - [Form3D](#form3d) (`form3d`)
  - [GlassTiles](#glasstiles) (`glasstiles`)
  - [Kaleidoscope](#kaleidoscope) (`kaleidoscope`)
  - [Mirror](#mirror) (`mirror`)
  - [Perspective](#perspective) (`perspective`)
  - [PolarCoordinates](#polarcoordinates) (`polarcoordinates`)
  - [RectangularCoordinates](#rectangularcoordinates) (`rectangularcoordinates`)
  - [Spherize](#spherize) (`spherize`)
  - [Stretch](#stretch) (`stretch`)
  - [Twirl](#twirl) (`twirl`)
  - [WaveDistortion](#wavedistortion) (`wavedistortion`)
- **Blurs**
  - [AngularBlur](#angularblur) (`angularblur`)
  - [Blur](#blur) (`blur`)
  - [ChannelBlur](#channelblur) (`channelblur`)
  - [DiffuseBlur](#diffuseblur) (`diffuseblur`)
  - [LinearBlur](#linearblur) (`linearblur`)
  - [ProgressiveBlur](#progressiveblur) (`progressiveblur`)
  - [TiltShift](#tiltshift) (`tiltshift`)
  - [ZoomBlur](#zoomblur) (`zoomblur`)
- **Adjustments**
  - [BrightnessContrast](#brightnesscontrast) (`brightnesscontrast`)
  - [Duotone](#duotone) (`duotone`)
  - [Grayscale](#grayscale) (`grayscale`)
  - [HueShift](#hueshift) (`hueshift`)
  - [Invert](#invert) (`invert`)
  - [Posterize](#posterize) (`posterize`)
  - [Saturation](#saturation) (`saturation`)
  - [Sharpness](#sharpness) (`sharpness`)
  - [Solarize](#solarize) (`solarize`)
  - [Tint](#tint) (`tint`)
  - [Tritone](#tritone) (`tritone`)
  - [Vibrance](#vibrance) (`vibrance`)

## Textures

### Aurora (`aurora`) {#aurora}

**Category:** textures  
**Description:** Mesmerizing aurora borealis with layered curtains, vertical rays, and flowing light.

**Props:**

| Name           | Type                                                        | Default           | Notes                                               |
| -------------- | ----------------------------------------------------------- | ----------------- | --------------------------------------------------- |
| `colorA`       | `string`                                                    | `#a533f8`         | Edge color at the curtain base                      |
| `colorB`       | `string`                                                    | `#22ee88`         | Core color in the bright center                     |
| `colorC`       | `string`                                                    | `#1694e8`         | Tip color at the ray ends                           |
| `colorSpace`   | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`          | Color space for color interpolation                 |
| `balance`      | `number`                                                    | `50`              | Shifts color distribution across the curtain height |
| `intensity`    | `number`                                                    | `80`              | Overall aurora brightness                           |
| `curtainCount` | `number`                                                    | `4`               | Number of aurora curtain layers                     |
| `speed`        | `number`                                                    | `5`               | Animation speed                                     |
| `waviness`     | `number`                                                    | `50`              | How much the curtains undulate                      |
| `rayDensity`   | `number`                                                    | `20`              | Density of vertical ray structures                  |
| `height`       | `number`                                                    | `120`             | How tall the aurora extends                         |
| `center`       | `{x: number, y: number}`                                    | `{"x":0.5,"y":0}` | Center position of the aurora                       |
| `seed`         | `number`                                                    | `0`               | Random seed for variation                           |

### Beam (`beam`) {#beam}

**Category:** textures  
**Description:** A beam of light from one point to another.

**Props:**

| Name             | Type                                                        | Default             | Notes                                  |
| ---------------- | ----------------------------------------------------------- | ------------------- | -------------------------------------- |
| `startPosition`  | `{x: number, y: number}`                                    | `{"x":0.2,"y":0.5}` | Starting point of the beam             |
| `endPosition`    | `{x: number, y: number}`                                    | `{"x":0.8,"y":0.5}` | Ending point of the beam               |
| `startThickness` | `number`                                                    | `0.2`               | Thickness at the start of the beam     |
| `endThickness`   | `number`                                                    | `0.2`               | Thickness at the end of the beam       |
| `startSoftness`  | `number`                                                    | `0.5`               | Edge softness at the start of the beam |
| `endSoftness`    | `number`                                                    | `0.5`               | Edge softness at the end of the beam   |
| `insideColor`    | `string`                                                    | `#FF0000`           | Color at the center of the beam        |
| `outsideColor`   | `string`                                                    | `#0000FF`           | Color at the edges of the beam         |
| `colorSpace`     | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`            | Color space for color interpolation    |

### Blob (`blob`) {#blob}

**Category:** textures  
**Description:** Organic animated blob with 3D lighting and gradients

**Props:**

| Name                 | Type                                                        | Default             | Notes                                                                 |
| -------------------- | ----------------------------------------------------------- | ------------------- | --------------------------------------------------------------------- |
| `colorA`             | `string`                                                    | `#ff6b35`           | Primary color of the blob                                             |
| `colorB`             | `string`                                                    | `#e91e63`           | Secondary color of the blob                                           |
| `size`               | `number`                                                    | `0.5`               | Size of the blob                                                      |
| `deformation`        | `number`                                                    | `0.5`               | How organic and blobby the shape is (0 = circle, 1 = very blobby)     |
| `softness`           | `number`                                                    | `0.5`               | Softness of the blob edges (combines edge width and transition curve) |
| `highlightIntensity` | `number`                                                    | `0.5`               | Intensity of specular highlight effect                                |
| `highlightX`         | `number`                                                    | `0.3`               | Light direction X component                                           |
| `highlightY`         | `number`                                                    | `-0.3`              | Light direction Y component                                           |
| `highlightZ`         | `number`                                                    | `0.4`               | Light direction Z component                                           |
| `highlightColor`     | `string`                                                    | `#ffe11a`           | Color of the specular highlight                                       |
| `speed`              | `number`                                                    | `0.5`               | Animation speed                                                       |
| `seed`               | `number`                                                    | `1`                 | Adjusts the starting state, useful for variation                      |
| `center`             | `{x: number, y: number}`                                    | `{"x":0.5,"y":0.5}` | The center point of the blob                                          |
| `colorSpace`         | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`            | Color space for color interpolation                                   |

### Checkerboard (`checkerboard`) {#checkerboard}

**Category:** textures  
**Description:** Classic checkerboard pattern with two alternating colors

**Props:**

| Name         | Type                                                        | Default   | Notes                                                                       |
| ------------ | ----------------------------------------------------------- | --------- | --------------------------------------------------------------------------- |
| `colorA`     | `string`                                                    | `#cccccc` | First color of the checkerboard pattern                                     |
| `colorB`     | `string`                                                    | `#999999` | Second color of the checkerboard pattern                                    |
| `cells`      | `number`                                                    | `8`       | Number of cells along the shortest canvas edge (creates square cells)       |
| `softness`   | `number`                                                    | `0`       | Smoothness of the transition between colors (0 = hard edges, 1 = very soft) |
| `colorSpace` | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`  | Color space for color interpolation                                         |

### ConicGradient (`conicgradient`) {#conicgradient}

**Category:** textures  
**Description:** Colors sweep in a full circle around a center point, like a color wheel

**Props:**

| Name         | Type                                                        | Default             | Notes                                                                                              |
| ------------ | ----------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------- |
| `colorA`     | `string`                                                    | `#FF0080`           | Starting color of the sweep                                                                        |
| `colorB`     | `string`                                                    | `#00BFFF`           | Ending color of the sweep (wraps back to Color A)                                                  |
| `center`     | `{x: number, y: number}`                                    | `{"x":0.5,"y":0.5}` | Center point of the sweep                                                                          |
| `rotation`   | `number`                                                    | `0`                 | Rotation offset in degrees — shifts where Color A begins                                           |
| `repeat`     | `number`                                                    | `1`                 | Number of times the gradient repeats around the circle. Values above 1 create a starburst pattern. |
| `colorSpace` | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `oklch`             | Color space for color interpolation                                                                |

### DiamondGradient (`diamondgradient`) {#diamondgradient}

**Category:** textures  
**Description:** Diamond-shaped gradient radiating from a center point using Manhattan distance

**Props:**

| Name         | Type                                                        | Default             | Notes                                                                                                   |
| ------------ | ----------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------- |
| `colorA`     | `string`                                                    | `#4ffb4a`           | Color at the center of the diamond                                                                      |
| `colorB`     | `string`                                                    | `#4f1238`           | Color at the outer edges of the diamond                                                                 |
| `center`     | `{x: number, y: number}`                                    | `{"x":0.5,"y":0.5}` | Center point of the diamond                                                                             |
| `size`       | `number`                                                    | `0.7`               | Extent of the gradient — controls how far Color A reaches before transitioning to Color B               |
| `rotation`   | `number`                                                    | `0`                 | Rotation in degrees — tilts the diamond into a rhombus                                                  |
| `repeat`     | `number`                                                    | `1`                 | Number of times the gradient repeats outward. Values above 1 create concentric diamond or square bands. |
| `roundness`  | `number`                                                    | `0`                 | Morphs from a sharp diamond (0) to a square (1)                                                         |
| `colorSpace` | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `oklch`             | Color space for color interpolation                                                                     |

### DOMTexture (`domtexture`) {#domtexture}

**Category:** textures  
**Description:** Render live HTML/DOM content as a WebGPU texture layer via the html-in-canvas API. Requires Chrome Canary with chrome://flags/#canvas-draw-element enabled.

**Props:** _(none)_

**Visual notes:** Marked Experimental Component — powered by the WICG html-in-canvas proposal, only available in Chrome Canary behind a feature flag; not suitable for production.

### DotGrid (`dotgrid`) {#dotgrid}

**Category:** textures  
**Description:** Grid of dots with optional twinkling animation

**Props:**

| Name      | Type     | Default   | Notes                                                                                |
| --------- | -------- | --------- | ------------------------------------------------------------------------------------ |
| `color`   | `string` | `#ffffff` | The color of the dot                                                                 |
| `density` | `number` | `30`      | The number of dots on the longest canvas edge                                        |
| `dotSize` | `number` | `0.3`     | The size of each dot, zero (0) being invisible, one (1) filled the grid with no gaps |
| `twinkle` | `number` | `0`       | Intensity of the twinkle effect (0 = off, 1 = full twinkle)                          |

### FallingLines (`fallinglines`) {#fallinglines}

**Category:** textures  
**Description:** Directional falling lines with a leading-to-trailing color fade

**Props:**

| Name            | Type                                                        | Default     | Notes                                                                        |
| --------------- | ----------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------- |
| `colorA`        | `string`                                                    | `#ffffff`   | Color at the leading edge of each line                                       |
| `colorB`        | `string`                                                    | `#ffffff00` | Color at the trailing edge (transparent by default)                          |
| `colorSpace`    | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`    | Color space for interpolation between lead and trail colors                  |
| `angle`         | `number`                                                    | `90`        | Direction of movement in degrees (90=down, 270=up, 0=right, 180=left)        |
| `speed`         | `number`                                                    | `0.5`       | Movement speed                                                               |
| `speedVariance` | `number`                                                    | `0.3`       | Per-line speed variance (0=uniform, 1=high variance)                         |
| `density`       | `number`                                                    | `15`        | Number of line columns across the canvas                                     |
| `trailLength`   | `number`                                                    | `0.35`      | Streak length relative to spacing (0=point, 1=continuous)                    |
| `balance`       | `number`                                                    | `0.5`       | Color mix midpoint (0.5=linear, 0=all trailing/colorB, 1=all leading/colorA) |
| `strokeWidth`   | `number`                                                    | `0.15`      | Line thickness as fraction of column width (0=hairline, 1=full width)        |
| `rounding`      | `number`                                                    | `1`         | Rounds the leading edge (0=flat/square, 1=fully rounded cap)                 |

### FloatingParticles (`floatingparticles`) {#floatingparticles}

**Category:** textures  
**Description:** Animated floating particles with twinkle effects

**Props:**

| Name               | Type     | Default   | Notes                                                                                |
| ------------------ | -------- | --------- | ------------------------------------------------------------------------------------ |
| `randomness`       | `number` | `0.25`    | Randomness of particle animation                                                     |
| `speed`            | `number` | `0.25`    | Speed of particle movement                                                           |
| `angle`            | `number` | `90`      | Movement angle in degrees (0=right, 90=down, 180=left, 270=up)                       |
| `particleSize`     | `number` | `1`       | Size of particles                                                                    |
| `particleSoftness` | `number` | `0`       | Edge softness of particles (0 = sharp, 1 = very soft)                                |
| `twinkle`          | `number` | `0.5`     | Intensity of the twinkle effect (0 = off, 1 = full twinkle)                          |
| `count`            | `number` | `5`       | Number of particle layers                                                            |
| `particleColor`    | `string` | `#ffffff` | Color of the particles                                                               |
| `speedVariance`    | `number` | `0.3`     | Per-layer speed variance (0 = all layers same speed, 1 = high variance)              |
| `angleVariance`    | `number` | `30`      | Per-layer angle variance in degrees (0 = all layers same angle, 180 = full variance) |
| `particleDensity`  | `number` | `3`       | Particle density (lower = more spread out, higher = more dense)                      |

### FlowingGradient (`flowinggradient`) {#flowinggradient}

**Category:** textures  
**Description:** Liquid silk gradient with organic flowing color bands

**Props:**

| Name         | Type                                                        | Default   | Notes                               |
| ------------ | ----------------------------------------------------------- | --------- | ----------------------------------- |
| `colorA`     | `string`                                                    | `#0a0015` | Deep background color               |
| `colorB`     | `string`                                                    | `#6b17e6` | Primary accent color                |
| `colorC`     | `string`                                                    | `#ff4d6a` | Secondary accent color              |
| `colorD`     | `string`                                                    | `#ff6b35` | Tertiary accent color               |
| `colorSpace` | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `oklch`   | Color space for color interpolation |
| `speed`      | `number`                                                    | `1`       | Animation speed                     |
| `distortion` | `number`                                                    | `0.5`     | Organic distortion intensity        |
| `seed`       | `number`                                                    | `0`       | Random seed for variation           |

### Godrays (`godrays`) {#godrays}

**Category:** textures  
**Description:** Volumetric light rays emanating from a point

**Props:**

| Name              | Type                     | Default         | Notes                                          |
| ----------------- | ------------------------ | --------------- | ---------------------------------------------- |
| `center`          | `{x: number, y: number}` | `{"x":0,"y":0}` | The center point of the god rays               |
| `density`         | `number`                 | `0.3`           | Frequency of ray sectors                       |
| `intensity`       | `number`                 | `0.8`           | Ray visibility within sectors                  |
| `spotty`          | `number`                 | `1`             | Density of spots on rays (higher = more spots) |
| `speed`           | `number`                 | `0.5`           | Animation speed of the rays                    |
| `rayColor`        | `string`                 | `#4283fb`       | Color of the light rays                        |
| `backgroundColor` | `string`                 | `transparent`   | Background color                               |

### Grid (`grid`) {#grid}

**Category:** textures  
**Description:** Simple grid lines pattern with adjustable thickness and rotation

**Props:**

| Name        | Type     | Default   | Notes                                                                               |
| ----------- | -------- | --------- | ----------------------------------------------------------------------------------- |
| `color`     | `string` | `#ffffff` | The color of the grid lines                                                         |
| `cells`     | `number` | `10`      | Number of cells along the shortest canvas edge (creates square cells)               |
| `thickness` | `number` | `1`       | Thickness of grid lines (normalized, 0.0-1.0)                                       |
| `rotation`  | `number` | `0`       | Rotation of the grid in degrees. At 45° this produces a crosshatch/diamond pattern. |

### HexGrid (`hexgrid`) {#hexgrid}

**Category:** textures  
**Description:** Honeycomb hexagonal grid pattern

**Props:**

| Name         | Type                                                        | Default   | Notes                                              |
| ------------ | ----------------------------------------------------------- | --------- | -------------------------------------------------- |
| `colorA`     | `string`                                                    | `#000000` | Cell fill color                                    |
| `colorB`     | `string`                                                    | `#ffffff` | Grid line color                                    |
| `cells`      | `number`                                                    | `8`       | Number of hexagons across the shortest canvas edge |
| `thickness`  | `number`                                                    | `1`       | Thickness of the hex grid lines                    |
| `colorSpace` | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`  | Color space for color interpolation                |

### ImageTexture (`imagetexture`) {#imagetexture}

**Category:** textures  
**Description:** Display an image with customizable object-fit modes

**Props:**

| Name        | Type                                                       | Default                          | Notes                                             |
| ----------- | ---------------------------------------------------------- | -------------------------------- | ------------------------------------------------- |
| `url`       | `string`                                                   | `https://shaders.com/sample.jpg` | Upload an image or provide a URL                  |
| `objectFit` | `"cover" \| "contain" \| "fill" \| "scale-down" \| "none"` | `cover`                          | How the image should be sized within the viewport |

### LinearGradient (`lineargradient`) {#lineargradient}

**Category:** textures  
**Description:** Create smooth linear color gradients

**Props:**

| Name         | Type                                                        | Default           | Notes                                                  |
| ------------ | ----------------------------------------------------------- | ----------------- | ------------------------------------------------------ |
| `colorA`     | `string`                                                    | `#1aff00`         | The starting color of the gradient                     |
| `colorB`     | `string`                                                    | `#0000ff`         | The ending color of the gradient                       |
| `start`      | `{x: number, y: number}`                                    | `{"x":0,"y":0.5}` | The starting point of the gradient                     |
| `end`        | `{x: number, y: number}`                                    | `{"x":1,"y":0.5}` | The ending point of the gradient                       |
| `angle`      | `number`                                                    | `0`               | Additional rotation angle of the gradient (in degrees) |
| `edges`      | `"stretch" \| "transparent" \| "mirror" \| "wrap"`          | `stretch`         | How to handle areas beyond the gradient endpoints      |
| `colorSpace` | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`          | Color space for color interpolation                    |

### MultiPointGradient (`multipointgradient`) {#multipointgradient}

**Category:** textures  
**Description:** Five individually placed color points blended together by proximity — drag each point to shape the gradient

**Props:**

| Name         | Type                     | Default             | Notes                               |
| ------------ | ------------------------ | ------------------- | ----------------------------------- |
| `colorA`     | `string`                 | `#4776E6`           | Color of control point A            |
| `positionA`  | `{x: number, y: number}` | `{"x":0.2,"y":0.2}` | Position of control point A         |
| `colorB`     | `string`                 | `#C44DFF`           | Color of control point B            |
| `positionB`  | `{x: number, y: number}` | `{"x":0.8,"y":0.2}` | Position of control point B         |
| `colorC`     | `string`                 | `#1ABC9C`           | Color of control point C            |
| `positionC`  | `{x: number, y: number}` | `{"x":0.2,"y":0.8}` | Position of control point C         |
| `colorD`     | `string`                 | `#F8BBD9`           | Color of control point D            |
| `positionD`  | `{x: number, y: number}` | `{"x":0.8,"y":0.8}` | Position of control point D         |
| `colorE`     | `string`                 | `#FF8C42`           | Color of control point E            |
| `positionE`  | `{x: number, y: number}` | `{"x":0.5,"y":0.5}` | Position of control point E         |
| `smoothness` | `number`                 | `2`                 | Controls how smoothly colors blend. |

### Plasma (`plasma`) {#plasma}

**Category:** textures  
**Description:** Animated effect of glowing plasma

**Props:**

| Name         | Type                                                        | Default   | Notes                                             |
| ------------ | ----------------------------------------------------------- | --------- | ------------------------------------------------- |
| `density`    | `number`                                                    | `2`       | Density of the plasma pattern                     |
| `speed`      | `number`                                                    | `2`       | Animation speed                                   |
| `intensity`  | `number`                                                    | `1.5`     | Brightness and spread of the plasma glow          |
| `warp`       | `number`                                                    | `0.4`     | How much the flow distorts and swirls             |
| `contrast`   | `number`                                                    | `1`       | Push darks darker and lights lighter              |
| `balance`    | `number`                                                    | `50`      | Skew color balance toward A (higher) or B (lower) |
| `colorA`     | `string`                                                    | `#7018be` | Primary color                                     |
| `colorB`     | `string`                                                    | `#000000` | Secondary color                                   |
| `colorSpace` | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`  | Color space for color interpolation               |

### RadialGradient (`radialgradient`) {#radialgradient}

**Category:** textures  
**Description:** Radial gradient radiating from a center point

**Props:**

| Name         | Type                                                        | Default             | Notes                                                                                                      |
| ------------ | ----------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------- |
| `colorA`     | `string`                                                    | `#ff0000`           | The starting color at the center of the gradient                                                           |
| `colorB`     | `string`                                                    | `#0000ff`           | The ending color at the edge of the gradient                                                               |
| `center`     | `{x: number, y: number}`                                    | `{"x":0.5,"y":0.5}` | The center point of the radial gradient                                                                    |
| `radius`     | `number`                                                    | `1`                 | The radius of the gradient (normalized, 0.0-1.0)                                                           |
| `repeat`     | `number`                                                    | `1`                 | Number of times the gradient repeats. Values above 1 create concentric rings.                              |
| `aspect`     | `number`                                                    | `1`                 | Stretches the gradient into an ellipse. Values below 1 compress vertically, above 1 compress horizontally. |
| `skewAngle`  | `number`                                                    | `0`                 | Rotates the ellipse axis in degrees. Only visible when Aspect is not 1.                                    |
| `colorSpace` | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`            | Color space for color interpolation                                                                        |

### Ripples (`ripples`) {#ripples}

**Category:** textures  
**Description:** Concentric animated ripples emanating from a point

**Props:**

| Name        | Type                     | Default             | Notes                                       |
| ----------- | ------------------------ | ------------------- | ------------------------------------------- |
| `center`    | `{x: number, y: number}` | `{"x":0.5,"y":0.5}` | The center point where ripples emanate from |
| `colorA`    | `string`                 | `#ffffff`           | Color of the ripple waves                   |
| `colorB`    | `string`                 | `#000000`           | Background color between ripples            |
| `speed`     | `number`                 | `1`                 | Speed of ripple animation                   |
| `frequency` | `number`                 | `20`                | Number of ripples/spacing between them      |
| `softness`  | `number`                 | `0`                 | Softness of ripple edges                    |
| `thickness` | `number`                 | `0.5`               | Thickness of each ripple band               |
| `phase`     | `number`                 | `0`                 | Phase offset for ripple animation           |

### SimplexNoise (`simplexnoise`) {#simplexnoise}

**Category:** textures  
**Description:** Organic noise with animated movement

**Props:**

| Name         | Type                                                        | Default   | Notes                                                                   |
| ------------ | ----------------------------------------------------------- | --------- | ----------------------------------------------------------------------- |
| `colorA`     | `string`                                                    | `#ffffff` | First color                                                             |
| `colorB`     | `string`                                                    | `#000000` | Second color                                                            |
| `colorSpace` | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`  | Color space for color interpolation                                     |
| `scale`      | `number`                                                    | `2`       | Pattern scale (higher = larger patterns)                                |
| `balance`    | `number`                                                    | `0`       | Balance between colors (negative = more colorB, positive = more colorA) |
| `contrast`   | `number`                                                    | `0`       | Pattern contrast (higher = sharper transitions)                         |
| `seed`       | `number`                                                    | `0`       | Random seed for pattern variation                                       |
| `speed`      | `number`                                                    | `1`       | Animation speed                                                         |

### SineWave (`sinewave`) {#sinewave}

**Category:** textures  
**Description:** Animated wave with thickness and softness

**Props:**

| Name        | Type                     | Default             | Notes                                       |
| ----------- | ------------------------ | ------------------- | ------------------------------------------- |
| `color`     | `string`                 | `#ffffff`           | The color of the sine wave                  |
| `amplitude` | `number`                 | `0.15`              | The height/amplitude of the sine wave       |
| `frequency` | `number`                 | `1`                 | The frequency/number of wave cycles         |
| `speed`     | `number`                 | `1`                 | The animation speed of the wave             |
| `angle`     | `number`                 | `0`                 | The rotation angle of the wave (in degrees) |
| `position`  | `{x: number, y: number}` | `{"x":0.5,"y":0.5}` | The center position of the wave             |
| `thickness` | `number`                 | `0.2`               | The thickness of the wave line              |
| `softness`  | `number`                 | `0.4`               | Edge softness of the wave line              |

### SolidColor (`solidcolor`) {#solidcolor}

**Category:** textures  
**Description:** Fill the canvas with a single solid color

**Props:**

| Name    | Type     | Default   | Notes                      |
| ------- | -------- | --------- | -------------------------- |
| `color` | `string` | `#5b18ca` | The solid color to display |

### Spiral (`spiral`) {#spiral}

**Category:** textures  
**Description:** Rotating spiral pattern with animated movement

**Props:**

| Name            | Type                                                        | Default             | Notes                                                                    |
| --------------- | ----------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------ |
| `colorA`        | `string`                                                    | `#000000`           | Background color                                                         |
| `colorB`        | `string`                                                    | `#ffffff`           | Spiral stroke color                                                      |
| `strokeWidth`   | `number`                                                    | `0.5`               | Thickness of spiral stroke                                               |
| `strokeFalloff` | `number`                                                    | `0`                 | Stroke losing width further from center                                  |
| `softness`      | `number`                                                    | `0`                 | Color transition sharpness (0 = hard edge, 1 = smooth fade)              |
| `speed`         | `number`                                                    | `1`                 | Animation speed (negative values reverse direction)                      |
| `center`        | `{x: number, y: number}`                                    | `{"x":0.5,"y":0.5}` | The center point of the spiral                                           |
| `scale`         | `number`                                                    | `1`                 | Scale factor for spiral bands (higher = more bands, lower = fewer bands) |
| `colorSpace`    | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`            | Color space for color interpolation                                      |

### Strands (`strands`) {#strands}

**Category:** textures  
**Description:** Procedural wavy strands with layered animation

**Props:**

| Name        | Type                     | Default           | Notes                            |
| ----------- | ------------------------ | ----------------- | -------------------------------- |
| `speed`     | `number`                 | `0.5`             | Overall animation speed          |
| `amplitude` | `number`                 | `1`               | Wave height amplitude            |
| `frequency` | `number`                 | `1`               | Wave frequency                   |
| `lineCount` | `number`                 | `12`              | Number of wave lines             |
| `lineWidth` | `number`                 | `0.1`             | Width of wave lines              |
| `waveColor` | `string`                 | `#f1c907`         | Color of the waves               |
| `pinEdges`  | `boolean`                | `true`            | Pin waves at edges (fade effect) |
| `start`     | `{x: number, y: number}` | `{"x":0,"y":0.5}` | Starting point of the waves      |
| `end`       | `{x: number, y: number}` | `{"x":1,"y":0.5}` | Ending point of the waves        |

### Stripes (`stripes`) {#stripes}

**Category:** textures  
**Description:** Alternating colored stripes with animation

**Props:**

| Name         | Type                                                        | Default   | Notes                                |
| ------------ | ----------------------------------------------------------- | --------- | ------------------------------------ |
| `colorA`     | `string`                                                    | `#000000` | First stripe color                   |
| `colorB`     | `string`                                                    | `#ffffff` | Second stripe color                  |
| `angle`      | `number`                                                    | `45`      | Angle of stripes in degrees          |
| `density`    | `number`                                                    | `5`       | Number of stripe pairs visible       |
| `balance`    | `number`                                                    | `0.5`     | Ratio of the two colors              |
| `softness`   | `number`                                                    | `0`       | Edge softness                        |
| `speed`      | `number`                                                    | `0.2`     | Animation speed                      |
| `offset`     | `number`                                                    | `0`       | Phase offset for pattern positioning |
| `colorSpace` | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`  | Color space for interpolation        |

### StudioBackground (`studiobackground`) {#studiobackground}

**Category:** textures  
**Description:** Multi-light studio background with ambient motion.

**Props:**

| Name               | Type                     | Default             | Notes                                               |
| ------------------ | ------------------------ | ------------------- | --------------------------------------------------- |
| `color`            | `string`                 | `#d8dbec`           | Base studio surface color                           |
| `keyColor`         | `string`                 | `#d5e4ea`           | Color of the overhead key light                     |
| `keyIntensity`     | `number`                 | `40`                | Intensity of the key light                          |
| `keySoftness`      | `number`                 | `50`                | How diffuse the key light is                        |
| `fillColor`        | `string`                 | `#d5e4ea`           | Color of the side fill lights                       |
| `fillIntensity`    | `number`                 | `10`                | Intensity of the fill lights                        |
| `fillSoftness`     | `number`                 | `70`                | How diffuse the fill lights are                     |
| `fillAngle`        | `number`                 | `70`                | How far apart the fill lights are from center       |
| `backColor`        | `string`                 | `#c8d4e8`           | Color of the upward back wash                       |
| `backIntensity`    | `number`                 | `20`                | Intensity of the back wash                          |
| `backSoftness`     | `number`                 | `80`                | How diffuse the back wash is                        |
| `brightness`       | `number`                 | `20`                | Overall ambient light level                         |
| `vignette`         | `number`                 | `0`                 | Edge darkening                                      |
| `center`           | `{x: number, y: number}` | `{"x":0.5,"y":0.8}` | Where the spotlight meets the floor                 |
| `lightTarget`      | `number`                 | `100`               | How far toward the floor vs wall the spotlights aim |
| `wallCurvature`    | `number`                 | `10`                | How rounded the cove is                             |
| `ambientIntensity` | `number`                 | `50`                | Intensity of drifting ambient lights                |
| `ambientSpeed`     | `number`                 | `2`                 | Drift speed                                         |
| `seed`             | `number`                 | `0`                 | Seed for ambient pattern                            |

### Swirl (`swirl`) {#swirl}

**Category:** textures  
**Description:** Flowing swirl pattern with multi-layered noise

**Props:**

| Name         | Type                                                        | Default   | Notes                                                           |
| ------------ | ----------------------------------------------------------- | --------- | --------------------------------------------------------------- |
| `colorA`     | `string`                                                    | `#1275d8` | Primary gradient color                                          |
| `colorB`     | `string`                                                    | `#e19136` | Secondary gradient color                                        |
| `speed`      | `number`                                                    | `1`       | Flow animation speed                                            |
| `detail`     | `number`                                                    | `1`       | Level of detail and intricacy in the swirl patterns             |
| `blend`      | `number`                                                    | `50`      | Skew color balance toward A (lower values) or B (higher values) |
| `colorSpace` | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`  | Color space for color interpolation                             |

### Truchet (`truchet`) {#truchet}

**Category:** textures  
**Description:** Quarter-circle arc tiles that connect to form organic, maze-like flowing curves

**Props:**

| Name         | Type                                                        | Default   | Notes                                                                      |
| ------------ | ----------------------------------------------------------- | --------- | -------------------------------------------------------------------------- |
| `colorA`     | `string`                                                    | `#000000` | Background color between the arcs                                          |
| `colorB`     | `string`                                                    | `#ffffff` | Arc line color                                                             |
| `cells`      | `number`                                                    | `10`      | Number of tiles across the shortest canvas edge                            |
| `thickness`  | `number`                                                    | `2`       | Thickness of the arc lines                                                 |
| `seed`       | `number`                                                    | `0`       | Random seed — changes which tiles flip, producing a different maze pattern |
| `colorSpace` | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`  | Color space for color interpolation                                        |

### VideoTexture (`videotexture`) {#videotexture}

**Category:** textures  
**Description:** Display a video with customizable playback and object-fit modes

**Props:**

| Name        | Type                                                       | Default                          | Notes                                             |
| ----------- | ---------------------------------------------------------- | -------------------------------- | ------------------------------------------------- |
| `url`       | `string`                                                   | `https://shaders.com/sample.mp4` | Upload a video or provide a URL                   |
| `objectFit` | `"cover" \| "contain" \| "fill" \| "scale-down" \| "none"` | `cover`                          | How the video should be sized within the viewport |
| `loop`      | `boolean`                                                  | `true`                           | Loop the video playback                           |

### Voronoi (`voronoi`) {#voronoi}

**Category:** textures  
**Description:** Cellular pattern where each pixel is colored by its distance to the nearest of many scattered points

**Props:**

| Name            | Type                                                        | Default   | Notes                                                                                                                                                                    |
| --------------- | ----------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `colorA`        | `string`                                                    | `#3186cf` | Color near each cell's center point                                                                                                                                      |
| `colorB`        | `string`                                                    | `#fc02dd` | Color at cell boundaries, far from any center point                                                                                                                      |
| `colorBorder`   | `string`                                                    | `#000000` | Color of the cell boundary lines                                                                                                                                         |
| `scale`         | `number`                                                    | `6`       | Number of cells across the canvas                                                                                                                                        |
| `speed`         | `number`                                                    | `0.5`     | Animation speed — how fast the cell points drift                                                                                                                         |
| `seed`          | `number`                                                    | `0`       | Random seed — shifts the cell pattern without changing the overall structure                                                                                             |
| `edgeIntensity` | `number`                                                    | `0.5`     | Controls how much of the cell interior is filled by the edge color. Low = center color dominates with a sharp boundary. High = edge color spreads further into the cell. |
| `edgeSoftness`  | `number`                                                    | `0.05`    | Width of the cell boundary lines.                                                                                                                                        |
| `colorSpace`    | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `oklch`   | Color space for color interpolation                                                                                                                                      |

### Weave (`weave`) {#weave}

**Category:** textures  
**Description:** Interlaced textile weave pattern with two thread colors going over and under each other

**Props:**

| Name       | Type     | Default   | Notes                                               |
| ---------- | -------- | --------- | --------------------------------------------------- |
| `colorA`   | `string` | `#c4c4c4` | Horizontal thread color                             |
| `colorB`   | `string` | `#4d4d4d` | Vertical thread color                               |
| `cells`    | `number` | `10`      | Number of threads across the shortest canvas edge   |
| `gap`      | `number` | `0.25`    | Gap between threads (0 = no gap, 0.5 = maximum gap) |
| `rotation` | `number` | `0`       | Rotation of the weave pattern in degrees            |

### WebcamTexture (`webcamtexture`) {#webcamtexture}

**Category:** textures  
**Description:** Display a live webcam feed with customizable object-fit modes

**Props:**

| Name        | Type                                                       | Default | Notes                                                   |
| ----------- | ---------------------------------------------------------- | ------- | ------------------------------------------------------- |
| `objectFit` | `"cover" \| "contain" \| "fill" \| "scale-down" \| "none"` | `cover` | How the webcam feed should be sized within the viewport |
| `mirror`    | `boolean`                                                  | `true`  | Mirror the webcam feed horizontally (selfie mode)       |

## Shapes

### Circle (`circle`) {#circle}

**Category:** shapes  
**Description:** Generate a circle with adjustable size and softness

**Props:**

| Name              | Type                                                        | Default             | Notes                                                                                       |
| ----------------- | ----------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------- |
| `color`           | `string`                                                    | `#ffffff`           | The color of the circle                                                                     |
| `radius`          | `number`                                                    | `1`                 | The radius of the circle. A value of one (1) is sets the circle to fit the canvas.          |
| `softness`        | `number`                                                    | `0`                 | Edge softness. Lower values like zero (0) are sharp, higher values like one (1) are softer. |
| `center`          | `{x: number, y: number}`                                    | `{"x":0.5,"y":0.5}` | The center point of the circle                                                              |
| `strokeThickness` | `number`                                                    | `0`                 | The thickness of the stroke outline. Zero (0) means no stroke.                              |
| `strokeColor`     | `string`                                                    | `#000000`           | The color of the stroke outline                                                             |
| `strokePosition`  | `"outside" \| "center" \| "inside"`                         | `center`            | Position of the stroke relative to the circle edge                                          |
| `colorSpace`      | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`            | Color space for blending fill and stroke colors in soft edges                               |

### Crescent (`crescent`) {#crescent}

**Category:** shapes  
**Description:** Crescent moon shape — an outer circle with an inner circle subtracted

**Props:**

| Name              | Type                                                        | Default             | Notes                                                      |
| ----------------- | ----------------------------------------------------------- | ------------------- | ---------------------------------------------------------- |
| `color`           | `string`                                                    | `#ffffff`           | Fill color of the crescent                                 |
| `center`          | `{x: number, y: number}`                                    | `{"x":0.5,"y":0.5}` | Center position of the crescent                            |
| `radius`          | `number`                                                    | `0.3`               | Outer circle radius                                        |
| `innerRatio`      | `number`                                                    | `0.8`               | Inner (bite) circle radius as a fraction of outer radius   |
| `offset`          | `number`                                                    | `0.2`               | Horizontal distance the bite circle is shifted from center |
| `rotation`        | `number`                                                    | `0`                 | Rotation in degrees                                        |
| `softness`        | `number`                                                    | `0`                 | Edge softness for antialiasing                             |
| `strokeThickness` | `number`                                                    | `0`                 | Stroke thickness. Zero means no stroke.                    |
| `strokeColor`     | `string`                                                    | `#000000`           | Color of the stroke outline                                |
| `strokePosition`  | `"outside" \| "center" \| "inside"`                         | `center`            | Position of the stroke relative to the shape edge          |
| `colorSpace`      | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`            | Color space for blending fill and stroke colors            |

### Cross (`cross`) {#cross}

**Category:** shapes  
**Description:** Plus / cross shape with adjustable arm length, width, and rounding

**Props:**

| Name              | Type                                                        | Default             | Notes                                                         |
| ----------------- | ----------------------------------------------------------- | ------------------- | ------------------------------------------------------------- |
| `color`           | `string`                                                    | `#ffffff`           | Fill color of the cross                                       |
| `center`          | `{x: number, y: number}`                                    | `{"x":0.5,"y":0.5}` | Center position of the cross                                  |
| `radius`          | `number`                                                    | `0.35`              | Arm half-length — distance from center to the end of each arm |
| `thickness`       | `number`                                                    | `0.08`              | Arm half-width — controls how wide each arm is                |
| `rounding`        | `number`                                                    | `0`                 | Corner rounding — rounds the arm ends and concave corners     |
| `rotation`        | `number`                                                    | `0`                 | Rotation in degrees (45° turns a plus into an ×)              |
| `softness`        | `number`                                                    | `0`                 | Edge softness for antialiasing                                |
| `strokeThickness` | `number`                                                    | `0`                 | Stroke thickness. Zero means no stroke.                       |
| `strokeColor`     | `string`                                                    | `#000000`           | Color of the stroke outline                                   |
| `strokePosition`  | `"outside" \| "center" \| "inside"`                         | `center`            | Position of the stroke relative to the shape edge             |
| `colorSpace`      | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`            | Color space for blending fill and stroke colors               |

### Ellipse (`ellipse`) {#ellipse}

**Category:** shapes  
**Description:** Ellipse with independently adjustable horizontal and vertical radii

**Props:**

| Name              | Type                                                        | Default             | Notes                                             |
| ----------------- | ----------------------------------------------------------- | ------------------- | ------------------------------------------------- |
| `color`           | `string`                                                    | `#ffffff`           | Fill color of the ellipse                         |
| `center`          | `{x: number, y: number}`                                    | `{"x":0.5,"y":0.5}` | Center position of the ellipse                    |
| `radiusX`         | `number`                                                    | `0.35`              | Horizontal semi-axis radius                       |
| `radiusY`         | `number`                                                    | `0.2`               | Vertical semi-axis radius                         |
| `rotation`        | `number`                                                    | `0`                 | Rotation in degrees                               |
| `softness`        | `number`                                                    | `0`                 | Edge softness for antialiasing                    |
| `strokeThickness` | `number`                                                    | `0`                 | Stroke thickness. Zero means no stroke.           |
| `strokeColor`     | `string`                                                    | `#000000`           | Color of the stroke outline                       |
| `strokePosition`  | `"outside" \| "center" \| "inside"`                         | `center`            | Position of the stroke relative to the shape edge |
| `colorSpace`      | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`            | Color space for blending fill and stroke colors   |

### Flower (`flower`) {#flower}

**Category:** shapes  
**Description:** Petal shape with N lobes and adjustable inner-to-outer radius ratio

**Props:**

| Name              | Type                                                        | Default             | Notes                                                                             |
| ----------------- | ----------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------- |
| `color`           | `string`                                                    | `#ffffff`           | Fill color of the flower                                                          |
| `center`          | `{x: number, y: number}`                                    | `{"x":0.5,"y":0.5}` | Center position of the flower                                                     |
| `radius`          | `number`                                                    | `0.4`               | Outer petal tip radius in UV space                                                |
| `sides`           | `number`                                                    | `5`                 | Number of petals                                                                  |
| `innerRatio`      | `number`                                                    | `0.4`               | Inner valley radius as a ratio of outer radius — lower values make deeper notches |
| `rotation`        | `number`                                                    | `0`                 | Rotation in degrees                                                               |
| `softness`        | `number`                                                    | `0`                 | Edge softness for antialiasing                                                    |
| `strokeThickness` | `number`                                                    | `0`                 | Stroke thickness. Zero means no stroke.                                           |
| `strokeColor`     | `string`                                                    | `#000000`           | Color of the stroke outline                                                       |
| `strokePosition`  | `"outside" \| "center" \| "inside"`                         | `center`            | Position of the stroke relative to the shape edge                                 |
| `colorSpace`      | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`            | Color space for blending fill and stroke colors                                   |

### Polygon (`polygon`) {#polygon}

**Category:** shapes  
**Description:** Regular polygon with adjustable sides and corner rounding

**Props:**

| Name              | Type                                                        | Default             | Notes                                                         |
| ----------------- | ----------------------------------------------------------- | ------------------- | ------------------------------------------------------------- |
| `color`           | `string`                                                    | `#ffffff`           | Fill color of the polygon                                     |
| `center`          | `{x: number, y: number}`                                    | `{"x":0.5,"y":0.5}` | Center position of the polygon                                |
| `radius`          | `number`                                                    | `0.4`               | Circumradius — distance from center to vertices in UV space   |
| `sides`           | `number`                                                    | `6`                 | Number of sides (3 = triangle, 4 = square, 6 = hexagon, etc.) |
| `rounding`        | `number`                                                    | `0`                 | Corner rounding — 0 is sharp vertices, 1 morphs into a circle |
| `rotation`        | `number`                                                    | `0`                 | Rotation in degrees                                           |
| `softness`        | `number`                                                    | `0`                 | Edge softness for antialiasing                                |
| `strokeThickness` | `number`                                                    | `0`                 | Stroke thickness. Zero means no stroke.                       |
| `strokeColor`     | `string`                                                    | `#000000`           | Color of the stroke outline                                   |
| `strokePosition`  | `"outside" \| "center" \| "inside"`                         | `center`            | Position of the stroke relative to the shape edge             |
| `colorSpace`      | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`            | Color space for blending fill and stroke colors               |

### Ring (`ring`) {#ring}

**Category:** shapes  
**Description:** Annular ring (donut) with adjustable radius and band thickness

**Props:**

| Name              | Type                                                        | Default             | Notes                                                                       |
| ----------------- | ----------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------- |
| `color`           | `string`                                                    | `#ffffff`           | Fill color of the ring                                                      |
| `center`          | `{x: number, y: number}`                                    | `{"x":0.5,"y":0.5}` | Center position of the ring                                                 |
| `radius`          | `number`                                                    | `0.3`               | Distance from center to the ring's midline in UV space                      |
| `thickness`       | `number`                                                    | `0.07`              | Half-width of the ring band — total ring width is twice this value          |
| `softness`        | `number`                                                    | `0`                 | Edge softness for antialiasing (applied to both inner and outer ring edges) |
| `strokeThickness` | `number`                                                    | `0`                 | Stroke thickness. Zero means no stroke.                                     |
| `strokeColor`     | `string`                                                    | `#000000`           | Color of the stroke outline                                                 |
| `strokePosition`  | `"outside" \| "center" \| "inside"`                         | `center`            | Position of the stroke relative to the ring edge                            |
| `colorSpace`      | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`            | Color space for blending fill and stroke colors                             |

### RoundedRect (`roundedrect`) {#roundedrect}

**Category:** shapes  
**Description:** Rounded rectangle with adjustable width, height, and corner rounding

**Props:**

| Name              | Type                                                        | Default             | Notes                                                               |
| ----------------- | ----------------------------------------------------------- | ------------------- | ------------------------------------------------------------------- |
| `color`           | `string`                                                    | `#ffffff`           | Fill color of the rectangle                                         |
| `center`          | `{x: number, y: number}`                                    | `{"x":0.5,"y":0.5}` | Center position of the rectangle                                    |
| `width`           | `number`                                                    | `0.35`              | Half-width of the rectangle                                         |
| `height`          | `number`                                                    | `0.25`              | Half-height of the rectangle                                        |
| `rounding`        | `number`                                                    | `0.05`              | Corner rounding radius — set to min(width, height) for a pill shape |
| `rotation`        | `number`                                                    | `0`                 | Rotation in degrees                                                 |
| `softness`        | `number`                                                    | `0`                 | Edge softness for antialiasing                                      |
| `strokeThickness` | `number`                                                    | `0`                 | Stroke thickness. Zero means no stroke.                             |
| `strokeColor`     | `string`                                                    | `#000000`           | Color of the stroke outline                                         |
| `strokePosition`  | `"outside" \| "center" \| "inside"`                         | `center`            | Position of the stroke relative to the shape edge                   |
| `colorSpace`      | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`            | Color space for blending fill and stroke colors                     |

### Star (`star`) {#star}

**Category:** shapes  
**Description:** Classic star polygon with straight sides and sharp pointed tips

**Props:**

| Name              | Type                                                        | Default             | Notes                                                                        |
| ----------------- | ----------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------- |
| `color`           | `string`                                                    | `#ffffff`           | Fill color of the star                                                       |
| `center`          | `{x: number, y: number}`                                    | `{"x":0.5,"y":0.5}` | Center position of the star                                                  |
| `radius`          | `number`                                                    | `0.4`               | Outer tip radius — distance from center to the pointed tips                  |
| `sides`           | `number`                                                    | `5`                 | Number of points on the star                                                 |
| `innerRatio`      | `number`                                                    | `0.4`               | Inner vertex radius as a ratio of outer radius (0.382 = golden-ratio 5-star) |
| `rotation`        | `number`                                                    | `0`                 | Rotation in degrees                                                          |
| `softness`        | `number`                                                    | `0`                 | Edge softness for antialiasing                                               |
| `strokeThickness` | `number`                                                    | `0`                 | Stroke thickness. Zero means no stroke.                                      |
| `strokeColor`     | `string`                                                    | `#000000`           | Color of the stroke outline                                                  |
| `strokePosition`  | `"outside" \| "center" \| "inside"`                         | `center`            | Position of the stroke relative to the shape edge                            |
| `colorSpace`      | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`            | Color space for blending fill and stroke colors                              |

### Trapezoid (`trapezoid`) {#trapezoid}

**Category:** shapes  
**Description:** Trapezoid with adjustable top and bottom widths and height

**Props:**

| Name              | Type                                                        | Default             | Notes                                             |
| ----------------- | ----------------------------------------------------------- | ------------------- | ------------------------------------------------- |
| `color`           | `string`                                                    | `#ffffff`           | Fill color of the trapezoid                       |
| `center`          | `{x: number, y: number}`                                    | `{"x":0.5,"y":0.5}` | Center position of the trapezoid                  |
| `bottomWidth`     | `number`                                                    | `0.35`              | Half-width of the bottom edge                     |
| `topWidth`        | `number`                                                    | `0.2`               | Half-width of the top edge                        |
| `height`          | `number`                                                    | `0.25`              | Half-height of the trapezoid                      |
| `rotation`        | `number`                                                    | `0`                 | Rotation in degrees                               |
| `softness`        | `number`                                                    | `0`                 | Edge softness for antialiasing                    |
| `strokeThickness` | `number`                                                    | `0`                 | Stroke thickness. Zero means no stroke.           |
| `strokeColor`     | `string`                                                    | `#000000`           | Color of the stroke outline                       |
| `strokePosition`  | `"outside" \| "center" \| "inside"`                         | `center`            | Position of the stroke relative to the shape edge |
| `colorSpace`      | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`            | Color space for blending fill and stroke colors   |

### Vesica (`vesica`) {#vesica}

**Category:** shapes  
**Description:** Vesica piscis (lens shape) formed by the intersection of two overlapping circles

**Props:**

| Name              | Type                                                        | Default             | Notes                                                                 |
| ----------------- | ----------------------------------------------------------- | ------------------- | --------------------------------------------------------------------- |
| `color`           | `string`                                                    | `#ffffff`           | Fill color of the vesica                                              |
| `center`          | `{x: number, y: number}`                                    | `{"x":0.5,"y":0.5}` | Center position of the vesica                                         |
| `radius`          | `number`                                                    | `0.35`              | Radius of the two overlapping circles                                 |
| `spread`          | `number`                                                    | `0.5`               | Circle separation — 0 = full circle overlap, 1 = infinitely thin lens |
| `rotation`        | `number`                                                    | `0`                 | Rotation in degrees                                                   |
| `softness`        | `number`                                                    | `0`                 | Edge softness for antialiasing                                        |
| `strokeThickness` | `number`                                                    | `0`                 | Stroke thickness. Zero means no stroke.                               |
| `strokeColor`     | `string`                                                    | `#000000`           | Color of the stroke outline                                           |
| `strokePosition`  | `"outside" \| "center" \| "inside"`                         | `center`            | Position of the stroke relative to the shape edge                     |
| `colorSpace`      | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`            | Color space for blending fill and stroke colors                       |

## Shape Effects

### Crystal (`crystal`) {#crystal}

**Category:** shape-effects  
**Description:** Diamond-like crystal lens with faceted refraction.

**Props:**

| Name                     | Type                     | Default             | Notes                                                                                                                                                                                                           |
| ------------------------ | ------------------------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `center`                 | `{x: number, y: number}` | `{"x":0.5,"y":0.5}` | Center position of the crystal shape                                                                                                                                                                            |
| `scale`                  | `number`                 | `1`                 | Scale of the crystal shape (1 = default size)                                                                                                                                                                   |
| `cutout`                 | `boolean`                | `false`             | Cut out alpha outside the crystal shape                                                                                                                                                                         |
| `refraction`             | `number`                 | `0.5`               | How strongly the crystal refracts content beneath                                                                                                                                                               |
| `dispersion`             | `number`                 | `0.5`               | Prismatic rainbow dispersion — splits light into spectral colors                                                                                                                                                |
| `facets`                 | `number`                 | `5`                 | Symmetry order — how many times the facet pattern repeats around the center                                                                                                                                     |
| `fresnel`                | `number`                 | `0.05`              | Fresnel rim glow intensity around the crystal boundary                                                                                                                                                          |
| `fresnelSoftness`        | `number`                 | `1`                 | Fresnel rim width — higher values spread the glow further inward                                                                                                                                                |
| `fresnelColor`           | `string`                 | `#ffffff`           | Color of the fresnel rim glow                                                                                                                                                                                   |
| `edgeSoftness`           | `number`                 | `0`                 | Softness of the crystal boundary edge                                                                                                                                                                           |
| `innerZoom`              | `number`                 | `1.5`               | Magnification of content seen through the crystal                                                                                                                                                               |
| `lightAngle`             | `number`                 | `270`               | Light direction angle in degrees                                                                                                                                                                                |
| `highlights`             | `number`                 | `0.5`               | Additive brightness on light-facing facets — never darkens                                                                                                                                                      |
| `shadows`                | `number`                 | `0.3`               | Darkening on shadow-facing facets — never brightens                                                                                                                                                             |
| `brightness`             | `number`                 | `1.2`               | Overall crystal brightness — higher values push facets toward brilliant white                                                                                                                                   |
| `tintColor`              | `string`                 | `#e8e0ff`           | Crystal body tint color                                                                                                                                                                                         |
| `tintIntensity`          | `number`                 | `0`                 | How much tint color is applied to the crystal interior                                                                                                                                                          |
| `tintPreserveLuminosity` | `boolean`                | `true`              | Preserve original brightness when tinting                                                                                                                                                                       |
| `shape`                  | `ShapeConfig`            | `polygonSDF`        | Shape to render — choose from 11 built-in analytical shapes or supply a custom SDF. See the [Shape Effects guide](/docs/guide/shape-effects) for all available shapes and their options.                        |
| `shapeSdfUrl`            | `string`                 | `""`                | URL to a pre-generated SDF \`.bin\` file — when non-empty, activates SVG mode and triggers a shader recompile. See the [Shape Effects guide](/docs/guide/shape-effects) for how to generate an SDF from an SVG. |

### Emboss (`emboss`) {#emboss}

**Category:** shape-effects  
**Description:** Embossed / debossed relief shading on top of child content, driven by a custom shape

**Props:**

| Name              | Type                     | Default             | Notes                                                                                                                                                                                                           |
| ----------------- | ------------------------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `center`          | `{x: number, y: number}` | `{"x":0.5,"y":0.5}` | Center position of the embossed shape                                                                                                                                                                           |
| `scale`           | `number`                 | `1`                 | Scale of the embossed shape (1 = default size)                                                                                                                                                                  |
| `depth`           | `number`                 | `-0.5`              | Relief depth — negative = inset (debossed), positive = raised (embossed)                                                                                                                                        |
| `lightAngle`      | `number`                 | `260`               | Directional light angle in degrees — controls highlight and shadow direction                                                                                                                                    |
| `lightIntensity`  | `number`                 | `0.6`               | Strength of the directional edge highlights and shadows                                                                                                                                                         |
| `shadowIntensity` | `number`                 | `0.3`               | Darkness of the relief shadow                                                                                                                                                                                   |
| `shape`           | `ShapeConfig`            | `circleSDF`         | Shape to render — choose from 11 built-in analytical shapes or supply a custom SDF. See the [Shape Effects guide](/docs/guide/shape-effects) for all available shapes and their options.                        |
| `shapeSdfUrl`     | `string`                 | `""`                | URL to a pre-generated SDF \`.bin\` file — when non-empty, activates SVG mode and triggers a shader recompile. See the [Shape Effects guide](/docs/guide/shape-effects) for how to generate an SDF from an SVG. |

### Glass (`glass`) {#glass}

**Category:** shape-effects  
**Description:** Optically realistic glass lens driven in a custom shape

**Props:**

| Name                     | Type                     | Default             | Notes                                                                                                                                                                                                           |
| ------------------------ | ------------------------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `center`                 | `{x: number, y: number}` | `{"x":0.5,"y":0.5}` | Center position of the glass shape                                                                                                                                                                              |
| `scale`                  | `number`                 | `1`                 | Scale of the glass shape (1 = default size)                                                                                                                                                                     |
| `cutout`                 | `boolean`                | `false`             | Cut out the alpha outside the glass shape                                                                                                                                                                       |
| `refraction`             | `number`                 | `1`                 | Lens refraction — how aggressively the edges warp content beneath (0 = none, 1 = max)                                                                                                                           |
| `edgeSoftness`           | `number`                 | `0.1`               | Edge softness — higher values give a wider, softer fade at the glass boundary                                                                                                                                   |
| `blur`                   | `number`                 | `0`                 | Frosted blur amount — 0 = clear glass, higher = frosted/diffuse                                                                                                                                                 |
| `thickness`              | `number`                 | `0.2`               | Glass depth — how far inward from the edge the refraction extends                                                                                                                                               |
| `aberration`             | `number`                 | `0.5`               | Chromatic aberration — splits RGB channels along the refraction vector                                                                                                                                          |
| `innerZoom`              | `number`                 | `1`                 | Inner zoom level — magnifies content seen through the glass                                                                                                                                                     |
| `lightAngle`             | `number`                 | `300`               | Light angle in degrees                                                                                                                                                                                          |
| `highlight`              | `number`                 | `0.05`              | Directional edge highlight — bright rim on the light-facing boundary                                                                                                                                            |
| `highlightColor`         | `string`                 | `#ffffff`           | Color of the directional edge highlight and specular glint                                                                                                                                                      |
| `highlightSoftness`      | `number`                 | `0.5`               | Specular highlight softness                                                                                                                                                                                     |
| `fresnel`                | `number`                 | `0.1`               | Fresnel rim glow — a soft luminous halo around the glass boundary                                                                                                                                               |
| `fresnelSoftness`        | `number`                 | `0.1`               | Fresnel rim width — higher values spread the glow further inward                                                                                                                                                |
| `fresnelColor`           | `string`                 | `#ffffff`           | Color of the fresnel rim glow                                                                                                                                                                                   |
| `tintColor`              | `string`                 | `#ffffff`           | Color tint applied to the internal directional gradient                                                                                                                                                         |
| `tintIntensity`          | `number`                 | `0`                 | Intensity of the color tint applied to the glass interior                                                                                                                                                       |
| `tintPreserveLuminosity` | `boolean`                | `true`              | Preserve original brightness when tinting                                                                                                                                                                       |
| `shape`                  | `ShapeConfig`            | `circleSDF`         | Shape to render — choose from 11 built-in analytical shapes or supply a custom SDF. See the [Shape Effects guide](/docs/guide/shape-effects) for all available shapes and their options.                        |
| `shapeSdfUrl`            | `string`                 | `""`                | URL to a pre-generated SDF \`.bin\` file — when non-empty, activates SVG mode and triggers a shader recompile. See the [Shape Effects guide](/docs/guide/shape-effects) for how to generate an SDF from an SVG. |

### Neon (`neon`) {#neon}

**Category:** shape-effects  
**Description:** Photorealistic neon tube / 3D pipe effect driven by a custom shape

**Props:**

| Name                | Type                     | Default             | Notes                                                                                                                                                                                                           |
| ------------------- | ------------------------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `center`            | `{x: number, y: number}` | `{"x":0.5,"y":0.5}` | Center position of the neon shape                                                                                                                                                                               |
| `scale`             | `number`                 | `1`                 | Scale of the neon shape (1 = default size)                                                                                                                                                                      |
| `color`             | `string`                 | `#00ddff`           | Primary neon tube color                                                                                                                                                                                         |
| `secondaryColor`    | `string`                 | `#ff00aa`           | Shadow-side color for a two-tone / dual-lit pipe look                                                                                                                                                           |
| `secondaryBlend`    | `number`                 | `0.5`               | Blend between mono (0) and two-tone (1) tube coloring                                                                                                                                                           |
| `glowColor`         | `string`                 | `#00ddff`           | Color of the outer glow / bloom                                                                                                                                                                                 |
| `tubeThickness`     | `number`                 | `0.2`               | How far inward from the boundary the tube extends. Low = thin neon outline, high = thick 3D pipe                                                                                                                |
| `intensity`         | `number`                 | `1.5`               | Overall brightness multiplier                                                                                                                                                                                   |
| `hotCoreIntensity`  | `number`                 | `0.6`               | Bright white-hot center line — the gas discharge glow inside the tube                                                                                                                                           |
| `glowIntensity`     | `number`                 | `0.6`               | Outer glow / bloom strength                                                                                                                                                                                     |
| `glowRadius`        | `number`                 | `0.25`              | How far the glow extends beyond the tube                                                                                                                                                                        |
| `lightAngle`        | `number`                 | `300`               | Directional light angle in degrees — controls 3D shading on the tube                                                                                                                                            |
| `specularIntensity` | `number`                 | `0.5`               | Specular highlight brightness on the tube surface                                                                                                                                                               |
| `specularSize`      | `number`                 | `0.5`               | Specular highlight size — 0 = tight pinpoint, 1 = broad sheen                                                                                                                                                   |
| `cornerSmoothing`   | `number`                 | `0.15`              | Rounds sharp corners to mimic how real glass tubes curve at bends                                                                                                                                               |
| `flickerSpeed`      | `number`                 | `0`                 | Flicker animation speed — 0 = off, higher = faster sporadic on/off                                                                                                                                              |
| `flickerAmount`     | `number`                 | `0.2`               | How often the neon flickers off — 0 = always on, 1 = frequent outages                                                                                                                                           |
| `flowSpeed`         | `number`                 | `0`                 | Flow animation speed — 0 = off, light rotates through the tube                                                                                                                                                  |
| `flowAmount`        | `number`                 | `0.3`               | Strength of the flowing brightness variation — 0 = uniform, 1 = dramatic                                                                                                                                        |
| `shape`             | `ShapeConfig`            | `circleSDF`         | Shape to render — choose from 11 built-in analytical shapes or supply a custom SDF. See the [Shape Effects guide](/docs/guide/shape-effects) for all available shapes and their options.                        |
| `shapeSdfUrl`       | `string`                 | `""`                | URL to a pre-generated SDF \`.bin\` file — when non-empty, activates SVG mode and triggers a shader recompile. See the [Shape Effects guide](/docs/guide/shape-effects) for how to generate an SDF from an SVG. |

### SmokeFill (`smokefill`) {#smokefill}

**Category:** shape-effects  
**Description:** Fill a shape with swirling fluid smoke that interacts with the shape boundary

**Props:**

| Name             | Type                                                        | Default             | Notes                                                                                                                                                                                                           |
| ---------------- | ----------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `colorA`         | `string`                                                    | `#8cf3ff`           | Color of fresh smoke                                                                                                                                                                                            |
| `colorB`         | `string`                                                    | `#04a0d6`           | Color smoke transitions to as it ages                                                                                                                                                                           |
| `center`         | `{x: number, y: number}`                                    | `{"x":0.5,"y":0.5}` | Center position of the shape                                                                                                                                                                                    |
| `scale`          | `number`                                                    | `1`                 | Scale of the shape (1 = default size)                                                                                                                                                                           |
| `emitFrom`       | `{x: number, y: number}`                                    | `{"x":0.5,"y":0.5}` | Emission source point within the shape                                                                                                                                                                          |
| `direction`      | `number`                                                    | `0`                 | Emission direction (0 = up, 90 = right, 180 = down, 270 = left)                                                                                                                                                 |
| `speed`          | `number`                                                    | `10`                | Emission velocity strength                                                                                                                                                                                      |
| `spread`         | `number`                                                    | `60`                | Emission cone angle in degrees                                                                                                                                                                                  |
| `emitRadius`     | `number`                                                    | `0.03`              | Size of the emission area                                                                                                                                                                                       |
| `intensity`      | `number`                                                    | `1`                 | Smoke emission density                                                                                                                                                                                          |
| `dissipation`    | `number`                                                    | `0.3`               | How fast smoke fades over time                                                                                                                                                                                  |
| `detail`         | `number`                                                    | `25`                | Fine-scale swirling detail                                                                                                                                                                                      |
| `gravity`        | `number`                                                    | `0.5`               | Downward gravitational pull on smoke — 0 = weightless, negative values = smoke rises                                                                                                                            |
| `colorDecay`     | `number`                                                    | `0.4`               | How quickly smoke shifts from Color A to Color B                                                                                                                                                                |
| `mouseInfluence` | `number`                                                    | `0.1`               | Strength of cursor influence                                                                                                                                                                                    |
| `mouseRadius`    | `number`                                                    | `0.1`               | Radius of cursor influence area                                                                                                                                                                                 |
| `colorSpace`     | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`            | Color space for color interpolation                                                                                                                                                                             |
| `shape`          | `ShapeConfig`                                               | `circleSDF`         | Shape to render — choose from 11 built-in analytical shapes or supply a custom SDF. See the [Shape Effects guide](/docs/guide/shape-effects) for all available shapes and their options.                        |
| `shapeSdfUrl`    | `string`                                                    | `""`                | URL to a pre-generated SDF \`.bin\` file — when non-empty, activates SVG mode and triggers a shader recompile. See the [Shape Effects guide](/docs/guide/shape-effects) for how to generate an SDF from an SVG. |

## Stylize

### Ascii (`ascii`) {#ascii}

**Category:** stylize  
**Description:** Convert imagery to ASCII character art

**Props:**

| Name             | Type                                                                                                                                                                                                                                                                                                                                       | Default          | Notes                                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `characters`     | `string`                                                                                                                                                                                                                                                                                                                                   | `@%#*+=-:.`      | Characters ordered from dense to sparse. First character is used for bright areas, last for dark areas.                                                                      |
| `cellSize`       | `number`                                                                                                                                                                                                                                                                                                                                   | `30`             | Size of each ASCII character cell (normalized to 1080p reference, scales proportionally at other resolutions)                                                                |
| `fontFamily`     | `"Azeret Mono" \| "Courier Prime" \| "Cutive Mono" \| "Fira Code" \| "Geist Mono" \| "IBM Plex Mono" \| "JetBrains Mono" \| "Major Mono Display" \| "Martian Mono" \| "Nova Mono" \| "Press Start 2P" \| "Roboto Mono" \| "Share Tech Mono" \| "Silkscreen" \| "Source Code Pro" \| "Space Mono" \| "Syne Mono" \| "VT323" \| "Xanh Mono"` | `JetBrains Mono` | Font family for characters                                                                                                                                                   |
| `spacing`        | `number`                                                                                                                                                                                                                                                                                                                                   | `1`              | Character size within each cell (1.0 = optimal size, 0.0 = smallest)                                                                                                         |
| `gamma`          | `number`                                                                                                                                                                                                                                                                                                                                   | `1`              | Brightness curve adjustment. <1 brightens darks (more light characters), >1 darkens midtones (more dark characters). Use to better fit characters to image brightness range. |
| `alphaThreshold` | `number`                                                                                                                                                                                                                                                                                                                                   | `0`              | Pixels with alpha below this threshold become fully transparent.                                                                                                             |
| `preserveAlpha`  | `boolean`                                                                                                                                                                                                                                                                                                                                  | `true`           | When enabled, output alpha matches input alpha. When disabled, pixels above the alpha threshold become fully opaque.                                                         |

### ChromaticAberration (`chromaticaberration`) {#chromaticaberration}

**Category:** stylize  
**Description:** Separate RGB channels for a prismatic distortion effect

**Props:**

| Name          | Type     | Default | Notes                                               |
| ------------- | -------- | ------- | --------------------------------------------------- |
| `strength`    | `number` | `0.2`   | Overall strength of the chromatic aberration effect |
| `angle`       | `number` | `0`     | Direction of the chromatic aberration in degrees    |
| `redOffset`   | `number` | `-1`    | Red channel offset multiplier                       |
| `greenOffset` | `number` | `0`     | Green channel offset multiplier                     |
| `blueOffset`  | `number` | `1`     | Blue channel offset multiplier                      |

### ContourLines (`contourlines`) {#contourlines}

**Category:** stylize  
**Description:** Draw topographical contour lines based on luminance or alpha

**Props:**

| Name              | Type                     | Default       | Notes                                                            |
| ----------------- | ------------------------ | ------------- | ---------------------------------------------------------------- |
| `levels`          | `number`                 | `5`           | Number of contour levels                                         |
| `lineWidth`       | `number`                 | `2`           | Width of the contour lines in pixels                             |
| `softness`        | `number`                 | `0`           | Edge softness of the lines (0 = sharp, 1 = soft)                 |
| `gamma`           | `number`                 | `0.5`         | Contour distribution. <1 clusters in bright, >1 clusters in dark |
| `invert`          | `boolean`                | `false`       | Invert the source values                                         |
| `source`          | `"luminance" \| "alpha"` | `luminance`   | Use luminance or alpha channel for contours                      |
| `colorMode`       | `"source" \| "custom"`   | `source`      | Use source image colors or custom colors                         |
| `lineColor`       | `string`                 | `#000000`     | Color of the contour lines (custom mode)                         |
| `backgroundColor` | `string`                 | `transparent` | Background color (custom mode)                                   |

### CRTScreen (`crtscreen`) {#crtscreen}

**Category:** stylize  
**Description:** Retro CRT monitor simulation with scanlines

**Props:**

| Name                | Type     | Default | Notes                                                                    |
| ------------------- | -------- | ------- | ------------------------------------------------------------------------ |
| `pixelSize`         | `number` | `128`   | Size of individual TV pixels (lower = more pixels)                       |
| `colorShift`        | `number` | `1`     | Chromatic aberration amount                                              |
| `scanlineIntensity` | `number` | `0.3`   | Strength of horizontal scanlines                                         |
| `scanlineFrequency` | `number` | `200`   | Number of scanlines across screen                                        |
| `brightness`        | `number` | `1`     | Screen brightness boost                                                  |
| `contrast`          | `number` | `1`     | Screen contrast enhancement                                              |
| `vignetteIntensity` | `number` | `1`     | Strength of corner darkening effect (0 = off)                            |
| `vignetteRadius`    | `number` | `0.5`   | How far the vignette extends inward (0 = edges only, 1 = reaches center) |

### Dither (`dither`) {#dither}

**Category:** stylize  
**Description:** Dithering effect with multiple pattern options

**Props:**

| Name        | Type                                                                                | Default       | Notes                                                                                |
| ----------- | ----------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ |
| `pattern`   | `"bayer2" \| "bayer4" \| "bayer8" \| "clusteredDot" \| "blueNoise" \| "whiteNoise"` | `bayer4`      | Dithering pattern algorithm                                                          |
| `pixelSize` | `number`                                                                            | `4`           | Size of dithering pixels                                                             |
| `threshold` | `number`                                                                            | `0.5`         | Luminance threshold for dithering                                                    |
| `spread`    | `number`                                                                            | `1`           | How much of the luminance range participates in dithering (lower = more solid areas) |
| `colorMode` | `"custom" \| "source"`                                                              | `custom`      | How colors are determined                                                            |
| `colorA`    | `string`                                                                            | `transparent` | Dark color for dithering                                                             |
| `colorB`    | `string`                                                                            | `#ffffff`     | Light color for dithering                                                            |

### DropShadow (`dropshadow`) {#dropshadow}

**Category:** stylize  
**Description:** Adds a soft shadow behind the child content based on its alpha silhouette

**Props:**

| Name        | Type      | Default   | Notes                                                                                     |
| ----------- | --------- | --------- | ----------------------------------------------------------------------------------------- |
| `color`     | `string`  | `#000000` | Shadow color                                                                              |
| `distance`  | `number`  | `0.1`     | How far the shadow is offset from the content                                             |
| `angle`     | `number`  | `135`     | Direction the shadow is cast (compass degrees: 0=up, 90=right, 135=lower-right, 180=down) |
| `blur`      | `number`  | `5`       | Shadow softness (blur radius in pixels)                                                   |
| `intensity` | `number`  | `0.5`     | Shadow intensity — how strong/visible the shadow is                                       |
| `cutout`    | `boolean` | `false`   | Hide the original layer and show only the shadow                                          |

### FilmGrain (`filmgrain`) {#filmgrain}

**Category:** stylize  
**Description:** Analog film grain texture overlay, weighted toward darker areas

**Props:**

| Name       | Type      | Default | Notes                                                                                                             |
| ---------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------------- |
| `strength` | `number`  | `0.5`   | Intensity of the film grain noise                                                                                 |
| `bias`     | `number`  | `2`     | Concentrates grain in darker areas. Higher values focus grain more heavily on shadows; 0 applies grain uniformly. |
| `animated` | `boolean` | `false` | When enabled, the grain pattern changes each frame for a dynamic film effect                                      |

### Glitch (`glitch`) {#glitch}

**Category:** stylize  
**Description:** Digital glitch that melts pixels and distorts colors

**Props:**

| Name                | Type     | Default | Notes                                                           |
| ------------------- | -------- | ------- | --------------------------------------------------------------- |
| `intensity`         | `number` | `0.5`   | Overall glitch strength and frequency of glitch bursts          |
| `speed`             | `number` | `1`     | How fast the glitch pattern evolves                             |
| `rgbShift`          | `number` | `5`     | Amount of chromatic aberration (RGB channel splitting)          |
| `blockDensity`      | `number` | `10`    | Base number of horizontal glitch bands                          |
| `colorBarIntensity` | `number` | `0.2`   | Intensity of vivid neon color bar overlay in glitch regions     |
| `mirrorAmount`      | `number` | `0.3`   | Chance of glitch blocks showing mirrored/flipped content        |
| `scanlineIntensity` | `number` | `0.2`   | Visibility of CRT-style horizontal scanlines in distorted areas |

### Glow (`glow`) {#glow}

**Category:** stylize  
**Description:** Soft glow effect with adjustable intensity

**Props:**

| Name        | Type     | Default | Notes                                                          |
| ----------- | -------- | ------- | -------------------------------------------------------------- |
| `intensity` | `number` | `1`     | Glow intensity (brightness of the glow effect)                 |
| `threshold` | `number` | `0.5`   | Brightness threshold for glow extraction (lower = more glow)   |
| `size`      | `number` | `25`    | Glow spread in pixels (clean up to \~72px, mild banding above) |

### Halftone (`halftone`) {#halftone}

**Category:** stylize  
**Description:** Halftone dot pattern effect for printing aesthetics

**Props:**

| Name            | Type                  | Default   | Notes                                                                                                                                            |
| --------------- | --------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `style`         | `"classic" \| "cmyk"` | `classic` | Halftone rendering style                                                                                                                         |
| `frequency`     | `number`              | `100`     | Frequency of the halftone dots                                                                                                                   |
| `angle`         | `number`              | `45`      | Rotation angle of the pattern (in degrees)                                                                                                       |
| `cyanAngle`     | `number`              | `15`      | Screen angle for the cyan plate (in degrees)                                                                                                     |
| `magentaAngle`  | `number`              | `75`      | Screen angle for the magenta plate (in degrees)                                                                                                  |
| `yellowAngle`   | `number`              | `0`       | Screen angle for the yellow plate (in degrees)                                                                                                   |
| `blackAngle`    | `number`              | `45`      | Screen angle for the black plate (in degrees)                                                                                                    |
| `misprint`      | `number`              | `0`       | Simulated mis-registration between plates. Plates are offset around the misprint angle, producing colour fringing at the edges of inked regions. |
| `misprintAngle` | `number`              | `0`       | Direction the plates drift apart. Rotating this rotates the colour-fringing pattern.                                                             |
| `paperColor`    | `string`              | `#ffffff` | Paper/substrate color shown where no ink lands                                                                                                   |
| `cyanColor`     | `string`              | `#00ffff` | Cyan ink color                                                                                                                                   |
| `magentaColor`  | `string`              | `#ff00ff` | Magenta ink color                                                                                                                                |
| `yellowColor`   | `string`              | `#ffff00` | Yellow ink color                                                                                                                                 |
| `blackColor`    | `string`              | `#000000` | Black (key) ink color                                                                                                                            |

### LensFlare (`lensflare`) {#lensflare}

**Category:** stylize  
**Description:** Realistic camera lens flare with artifacts.

**Props:**

| Name                 | Type                     | Default             | Notes                                                                                                |
| -------------------- | ------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------- |
| `lightPosition`      | `{x: number, y: number}` | `{"x":0.3,"y":0.3}` | Position of the light source                                                                         |
| `intensity`          | `number`                 | `0.5`               | Master brightness of the entire lens flare effect                                                    |
| `ghostIntensity`     | `number`                 | `0.4`               | Brightness of internal reflection ghost discs along the flare axis                                   |
| `ghostSpread`        | `number`                 | `0.7`               | Spacing between ghost reflections along the flare axis                                               |
| `ghostChroma`        | `number`                 | `0.3`               | Rainbow chromatic fringing around ghost element edges                                                |
| `haloIntensity`      | `number`                 | `0.4`               | Brightness of the circular halo ring from internal reflection                                        |
| `haloRadius`         | `number`                 | `0.6`               | Radius of the halo ring                                                                              |
| `haloChroma`         | `number`                 | `0.6`               | Spectral dispersion on the halo creating rainbow color separation                                    |
| `haloSoftness`       | `number`                 | `0.8`               | Thickness and softness of the halo ring                                                              |
| `starburstIntensity` | `number`                 | `0.3`               | Brightness of diffraction spikes radiating from the light source                                     |
| `starburstPoints`    | `number`                 | `6`                 | Number of starburst spikes (simulates aperture blade count)                                          |
| `streakIntensity`    | `number`                 | `0.15`              | Brightness of horizontal anamorphic light streak                                                     |
| `streakLength`       | `number`                 | `0.5`               | Horizontal extent of the anamorphic streak                                                           |
| `glareIntensity`     | `number`                 | `0.2`               | Soft veiling glare that washes out contrast around the light                                         |
| `glareSize`          | `number`                 | `0.5`               | Size of the soft glare glow                                                                          |
| `edgeFade`           | `number`                 | `0.2`               | How much the flare fades when the light source is near the screen edge (0 = no fade, 1 = heavy fade) |
| `speed`              | `number`                 | `0.5`               | Speed of subtle flare shimmer and starburst rotation                                                 |

### Paper (`paper`) {#paper}

**Category:** stylize  
**Description:** Applies realistic paper grain and surface roughness to child content

**Props:**

| Name           | Type     | Default | Notes                                                                              |
| -------------- | -------- | ------- | ---------------------------------------------------------------------------------- |
| `roughness`    | `number` | `0.3`   | Surface roughness — higher values create more pronounced brightness variation      |
| `grainScale`   | `number` | `1`     | Scale of the paper grain — lower = coarser, higher = finer                         |
| `displacement` | `number` | `0.15`  | Surface micro-roughness — shifts pixels at grain scale like real paper fiber bumps |
| `seed`         | `number` | `0`     | Random seed for pattern variation                                                  |

### Pixelate (`pixelate`) {#pixelate}

**Category:** stylize  
**Description:** Pixelation effect with adjustable cell size

**Props:**

| Name        | Type     | Default | Notes                                                                             |
| ----------- | -------- | ------- | --------------------------------------------------------------------------------- |
| `scale`     | `number` | `50`    | Number of pixels along the longest edge (higher = smaller pixels)                 |
| `gap`       | `number` | `0`     | Space between pixels as a fraction of cell size (0 = no gap, 1 = fully invisible) |
| `roundness` | `number` | `0`     | Roundness of each pixel's corners (0 = square, 1 = circle)                        |

### VHS (`vhs`) {#vhs}

**Category:** stylize  
**Description:** Analog VHS tape with intermittent tape damage, chroma bleed, and per-scanline noise

**Props:**

| Name            | Type     | Default | Notes                                                                                                                            |
| --------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `wobble`        | `number` | `1`     | Overall amount of tape damage — waves, creases, and head-switching noise. Bursts on and off organically over time.               |
| `scanlineNoise` | `number` | `0.6`   | Per-scanline fine chroma/luma jitter. Adds the classic horizontal-streak detail.                                                 |
| `smear`         | `number` | `0.2`   | Horizontal chroma smear (color bleed) amount. Positive trails colour to the right (classic VHS), negative trails it to the left. |
| `speed`         | `number` | `1`     | Animation speed of the tape effects.                                                                                             |

### Vignette (`vignette`) {#vignette}

**Category:** stylize  
**Description:** Darkens or tints the edges of the frame, drawing attention toward the center

**Props:**

| Name        | Type                     | Default             | Notes                                                     |
| ----------- | ------------------------ | ------------------- | --------------------------------------------------------- |
| `color`     | `string`                 | `#000000`           | Color of the vignette at the edges                        |
| `center`    | `{x: number, y: number}` | `{"x":0.5,"y":0.5}` | Center of the clear area where the vignette begins        |
| `radius`    | `number`                 | `0.5`               | Distance from center where the vignette begins to fade in |
| `falloff`   | `number`                 | `0.5`               | Width of the transition zone from clear to full vignette  |
| `intensity` | `number`                 | `1`                 | Strength of the vignette effect                           |

## Interactive

### ChromaFlow (`chromaflow`) {#chromaflow}

**Category:** interactive  
**Description:** Interactive liquid flow effect that follows your cursor

**Props:**

| Name         | Type     | Default   | Notes                                                   |
| ------------ | -------- | --------- | ------------------------------------------------------- |
| `baseColor`  | `string` | `#0066ff` | Base liquid color                                       |
| `upColor`    | `string` | `#00ff00` | Color for upward movement                               |
| `downColor`  | `string` | `#ff0000` | Color for downward movement                             |
| `leftColor`  | `string` | `#0000ff` | Color for leftward movement                             |
| `rightColor` | `string` | `#ffff00` | Color for rightward movement                            |
| `intensity`  | `number` | `1`       | Strength of the liquid effect                           |
| `radius`     | `number` | `3`       | Radius of the liquid effect                             |
| `momentum`   | `number` | `30`      | How much momentum colors retain in their flow direction |

### CursorRipples (`cursorripples`) {#cursorripples}

**Category:** interactive  
**Description:** Fluid-like ripple distortion

**Props:**

| Name             | Type                                               | Default   | Notes                                                            |
| ---------------- | -------------------------------------------------- | --------- | ---------------------------------------------------------------- |
| `intensity`      | `number`                                           | `10`      | Strength of the ripple distortion                                |
| `decay`          | `number`                                           | `10`      | How quickly ripples fade (higher = faster)                       |
| `radius`         | `number`                                           | `0.5`     | Radius of cursor influence                                       |
| `chromaticSplit` | `number`                                           | `1`       | RGB channel separation along ripple edges                        |
| `edges`          | `"stretch" \| "transparent" \| "mirror" \| "wrap"` | `stretch` | How to handle edges when distortion pushes content out of bounds |

### CursorTrail (`cursortrail`) {#cursortrail}

**Category:** interactive  
**Description:** Animated trail effect that tracks cursor movement

**Props:**

| Name         | Type                                                        | Default   | Notes                                                                     |
| ------------ | ----------------------------------------------------------- | --------- | ------------------------------------------------------------------------- |
| `colorA`     | `string`                                                    | `#00aaff` | Color of fresh trails                                                     |
| `colorB`     | `string`                                                    | `#ff00aa` | Color trails transition to as they fade                                   |
| `radius`     | `number`                                                    | `0.5`     | Base radius of trail circles                                              |
| `length`     | `number`                                                    | `0.5`     | How long trail circles persist (in seconds)                               |
| `shrink`     | `number`                                                    | `1`       | How much circles shrink as they fade out (0 = no shrink, 1 = full shrink) |
| `colorSpace` | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`  | Color space for color interpolation                                       |

### Fog (`fog`) {#fog}

**Category:** interactive  
**Description:** Fog that fills the screen and interacts with the mouse

**Props:**

| Name             | Type                                                        | Default   | Notes                                                                                                                                                             |
| ---------------- | ----------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `colorA`         | `string`                                                    | `#e0e0e0` | Primary fog color                                                                                                                                                 |
| `colorB`         | `string`                                                    | `#888888` | Secondary fog color — creates variation across the field                                                                                                          |
| `seed`           | `number`                                                    | `0`       | Deterministic starting pattern — different seeds produce different fog configurations                                                                             |
| `speed`          | `number`                                                    | `1`       | Simulation speed multiplier                                                                                                                                       |
| `turbulence`     | `number`                                                    | `1`       | Ambient motion strength                                                                                                                                           |
| `detail`         | `number`                                                    | `15`      | Fine-scale swirling structure — higher values produce more intricate wisps and vortices                                                                           |
| `blending`       | `number`                                                    | `0.3`     | How much the two colors blend together — 0 behaves like oil & water (colors stay distinct with sharp boundaries), 1 behaves like food coloring (colors fully mix) |
| `mouseInfluence` | `number`                                                    | `0.1`     | Strength of cursor influence — move the cursor to push fog                                                                                                        |
| `mouseRadius`    | `number`                                                    | `0.1`     | Radius of cursor influence area                                                                                                                                   |
| `colorSpace`     | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`  | Color space for color interpolation                                                                                                                               |

### GridDistortion (`griddistortion`) {#griddistortion}

**Category:** interactive  
**Description:** Interactive grid distortion controlled by mouse position

**Props:**

| Name        | Type                                               | Default   | Notes                                                            |
| ----------- | -------------------------------------------------- | --------- | ---------------------------------------------------------------- |
| `intensity` | `number`                                           | `1`       | Strength of the distortion effect                                |
| `decay`     | `number`                                           | `3`       | Rate of distortion decay (higher = faster)                       |
| `radius`    | `number`                                           | `1`       | Radius of the distortion effect                                  |
| `gridSize`  | `number`                                           | `20`      | Resolution of the distortion grid (higher = more detailed)       |
| `edges`     | `"stretch" \| "transparent" \| "mirror" \| "wrap"` | `stretch` | How to handle edges when distortion pushes content out of bounds |

### Liquify (`liquify`) {#liquify}

**Category:** interactive  
**Description:** Liquid-like interactive deformation effect

**Props:**

| Name        | Type                                               | Default   | Notes                                                            |
| ----------- | -------------------------------------------------- | --------- | ---------------------------------------------------------------- |
| `intensity` | `number`                                           | `10`      | Scale of the fabric displacement effect                          |
| `stiffness` | `number`                                           | `3`       | Fabric rigidity (higher = stiffer canvas, lower = stretchy silk) |
| `damping`   | `number`                                           | `3`       | How quickly fabric motion settles                                |
| `radius`    | `number`                                           | `1`       | Cursor influence area                                            |
| `edges`     | `"stretch" \| "transparent" \| "mirror" \| "wrap"` | `stretch` | How to handle edges when distortion pushes content out of bounds |

### Shatter (`shatter`) {#shatter}

**Category:** interactive  
**Description:** Broken glass effect with tectonic plate displacement

**Props:**

| Name                 | Type                                               | Default  | Notes                                                              |
| -------------------- | -------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| `crackWidth`         | `number`                                           | `1`      | Thickness of crack lines                                           |
| `intensity`          | `number`                                           | `4`      | How much shards shift                                              |
| `radius`             | `number`                                           | `0.4`    | Cursor influence radius                                            |
| `decay`              | `number`                                           | `1`      | How fast shards return to rest                                     |
| `seed`               | `number`                                           | `2`      | Random seed for pattern                                            |
| `chromaticSplit`     | `number`                                           | `1`      | RGB separation for prismatic glass effect                          |
| `refractionStrength` | `number`                                           | `5`      | How much cracks bend/distort the underlying image                  |
| `shardLighting`      | `number`                                           | `0.1`    | Subtle lighting on tilted shards for 3D depth                      |
| `edges`              | `"stretch" \| "transparent" \| "mirror" \| "wrap"` | `mirror` | How to handle edges when displacement pushes content out of bounds |

### Smoke (`smoke`) {#smoke}

**Category:** interactive  
**Description:** Realistic fluid smoke simulation with vorticity dynamics

**Props:**

| Name             | Type                                                        | Default           | Notes                                                           |
| ---------------- | ----------------------------------------------------------- | ----------------- | --------------------------------------------------------------- |
| `colorA`         | `string`                                                    | `#fc83f9`         | Color of fresh smoke                                            |
| `colorB`         | `string`                                                    | `#c21c79`         | Color smoke transitions to as it ages                           |
| `emitFrom`       | `{x: number, y: number}`                                    | `{"x":0.5,"y":1}` | The emission source point                                       |
| `direction`      | `number`                                                    | `0`               | Emission direction (0 = up, 90 = right, 180 = down, 270 = left) |
| `speed`          | `number`                                                    | `20`              | Emission velocity strength                                      |
| `spread`         | `number`                                                    | `60`              | Emission cone angle in degrees                                  |
| `emitRadius`     | `number`                                                    | `0.08`            | Size of the emission area                                       |
| `intensity`      | `number`                                                    | `1`               | Smoke emission density                                          |
| `dissipation`    | `number`                                                    | `0.2`             | How fast smoke fades over time                                  |
| `detail`         | `number`                                                    | `25`              | Fine-scale swirling detail                                      |
| `gravity`        | `number`                                                    | `0.5`             | Downward gravitational pull on smoke                            |
| `colorDecay`     | `number`                                                    | `0.4`             | How quickly smoke shifts from Color A to Color B                |
| `mouseInfluence` | `number`                                                    | `0.1`             | Strength of cursor influence                                    |
| `mouseRadius`    | `number`                                                    | `0.1`             | Radius of cursor influence area                                 |
| `colorSpace`     | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`          | Color space for color interpolation                             |

## Distortions

### Bulge (`bulge`) {#bulge}

**Category:** distortions  
**Description:** Magnify or pinch content around a center point

**Props:**

| Name       | Type                                               | Default             | Notes                                                                         |
| ---------- | -------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------- |
| `center`   | `{x: number, y: number}`                           | `{"x":0.5,"y":0.5}` | The center point of the bulge effect                                          |
| `strength` | `number`                                           | `1`                 | The intensity of the bulge effect (positive = bulge out, negative = pinch in) |
| `radius`   | `number`                                           | `1`                 | The radius of the bulge effect area                                           |
| `falloff`  | `number`                                           | `0.5`               | Controls the smoothness of the transition (0 = hard edge, 1 = very smooth)    |
| `edges`    | `"stretch" \| "transparent" \| "mirror" \| "wrap"` | `stretch`           | How to handle edges when distortion pushes content out of bounds              |

### ConcentricSpin (`concentricspin`) {#concentricspin}

**Category:** distortions  
**Description:** Concentric rings that each rotate the underlying image by different amounts

**Props:**

| Name              | Type                                               | Default             | Notes                                                            |
| ----------------- | -------------------------------------------------- | ------------------- | ---------------------------------------------------------------- |
| `intensity`       | `number`                                           | `20`                | Maximum rotation angle per ring                                  |
| `rings`           | `number`                                           | `8`                 | Number of concentric rings                                       |
| `smoothness`      | `number`                                           | `0.03`              | Softness of transitions between rings                            |
| `seed`            | `number`                                           | `0`                 | Randomization seed for per-ring rotation variation               |
| `speed`           | `number`                                           | `0.1`               | Speed of continuous ring rotation                                |
| `speedRandomness` | `number`                                           | `0.5`               | How much each ring varies in rotation speed and direction        |
| `edges`           | `"stretch" \| "transparent" \| "mirror" \| "wrap"` | `mirror`            | How to handle edges when distortion pushes content out of bounds |
| `center`          | `{x: number, y: number}`                           | `{"x":0.5,"y":0.5}` | Center point of the concentric rings                             |

### FlowField (`flowfield`) {#flowfield}

**Category:** distortions  
**Description:** Fluid-like distortion with constant smooth motion

**Props:**

| Name             | Type                                               | Default  | Notes                                                            |
| ---------------- | -------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| `strength`       | `number`                                           | `0.15`   | Intensity of the flow distortion                                 |
| `detail`         | `number`                                           | `2`      | Scale of the flow patterns                                       |
| `speed`          | `number`                                           | `0`      | Speed of the flow                                                |
| `evolutionSpeed` | `number`                                           | `0`      | How fast the flow field pattern reshapes over time               |
| `edges`          | `"stretch" \| "transparent" \| "mirror" \| "wrap"` | `mirror` | How to handle edges when distortion pushes content out of bounds |

### FlutedGlass (`flutedglass`) {#flutedglass}

**Category:** distortions  
**Description:** Full-screen fluted glass effect — refracts content through repeating cylindrical bars

**Props:**

| Name                | Type                                               | Default   | Notes                                                                                                              |
| ------------------- | -------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------ |
| `shape`             | `"bars" \| "rounded" \| "waves"`                   | `bars`    | Cross-section shape of each flute                                                                                  |
| `angle`             | `number`                                           | `0`       | Direction of the flutes in degrees (0 = vertical bars)                                                             |
| `frequency`         | `number`                                           | `10`      | Number of flutes across the longest viewport axis                                                                  |
| `softness`          | `number`                                           | `0.5`     | How smoothly distortion fades from each flute centre to its edge (0 = flat middle / sharp seams, 1 = gentle curve) |
| `waveAmplitude`     | `number`                                           | `0.06`    | How far each flute sways horizontally as it travels (Waves shape only)                                             |
| `waveFrequency`     | `number`                                           | `1.5`     | How many sways fit along each flute (Waves shape only)                                                             |
| `speed`             | `number`                                           | `0`       | Animation speed — drifts the flute pattern over time and flows wave perturbations                                  |
| `refraction`        | `number`                                           | `1.5`     | How aggressively each flute bends content beneath it                                                               |
| `aberration`        | `number`                                           | `0.2`     | Chromatic aberration — splits RGB along the refraction direction at flute seams                                    |
| `lightAngle`        | `number`                                           | `30`      | Direction the light source is coming from (0 = head-on, 90 = grazing)                                              |
| `highlight`         | `number`                                           | `0.2`     | Strength of the specular reflection on each flute                                                                  |
| `highlightSoftness` | `number`                                           | `0.3`     | Spread of the specular peak (0 = pin-tight, 1 = broad sheen)                                                       |
| `highlightColor`    | `string`                                           | `#ffffff` | Color of the specular highlight                                                                                    |
| `edges`             | `"stretch" \| "transparent" \| "mirror" \| "wrap"` | `mirror`  | How to handle edges when distortion samples beyond the canvas                                                      |

### Form3D (`form3d`) {#form3d}

**Category:** distortions  
**Description:** Wraps child content onto a 3D raymarched shape with lighting.

**Props:**

| Name         | Type                              | Default                                                                     | Notes                                            |
| ------------ | --------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| `shape3d`    | `string`                          | `{"type":"ribbon","angle":0,"twist":50,"width":40,"thickness":20,"seed":0}` | 3D shape and its parameters                      |
| `center`     | `{x: number, y: number}`          | `{"x":0.5,"y":0.5}`                                                         | Center position of the shape on screen           |
| `zoom`       | `number`                          | `50`                                                                        | Camera zoom level                                |
| `glossiness` | `number`                          | `50`                                                                        | Specular highlight intensity and sharpness       |
| `lighting`   | `number`                          | `50`                                                                        | Overall intensity of lighting effects            |
| `uvMode`     | `"stretch" \| "mirror" \| "wrap"` | `stretch`                                                                   | How to handle UV coordinates at shape boundaries |
| `speed`      | `number`                          | `1`                                                                         | Animation speed — scales all spin rates          |

### GlassTiles (`glasstiles`) {#glasstiles}

**Category:** distortions  
**Description:** Refraction-like distortion in a tile grid pattern

**Props:**

| Name        | Type     | Default | Notes                                        |
| ----------- | -------- | ------- | -------------------------------------------- |
| `intensity` | `number` | `2`     | The intensity of the glass tiles effect      |
| `tileCount` | `number` | `20`    | Number of tiles across the longest dimension |
| `rotation`  | `number` | `0`     | Rotation angle of the tile grid in degrees   |
| `roundness` | `number` | `0`     | Makes tiles more circular instead of square  |

### Kaleidoscope (`kaleidoscope`) {#kaleidoscope}

**Category:** distortions  
**Description:** Create a kaleidoscope effect with radial mirrored segments

**Props:**

| Name       | Type                                               | Default             | Notes                                                            |
| ---------- | -------------------------------------------------- | ------------------- | ---------------------------------------------------------------- |
| `center`   | `{x: number, y: number}`                           | `{"x":0.5,"y":0.5}` | The center point of the kaleidoscope effect                      |
| `segments` | `number`                                           | `6`                 | Number of radial segments in the kaleidoscope                    |
| `angle`    | `number`                                           | `0`                 | Rotation offset for the entire kaleidoscope pattern              |
| `edges`    | `"stretch" \| "transparent" \| "mirror" \| "wrap"` | `mirror`            | How to handle edges when distortion pushes content out of bounds |

### Mirror (`mirror`) {#mirror}

**Category:** distortions  
**Description:** Mirror content across a line defined by center point and angle

**Props:**

| Name     | Type                                               | Default             | Notes                                                            |
| -------- | -------------------------------------------------- | ------------------- | ---------------------------------------------------------------- |
| `center` | `{x: number, y: number}`                           | `{"x":0.5,"y":0.5}` | The point the mirror line passes through                         |
| `angle`  | `number`                                           | `0`                 | The angle of the mirror line in degrees                          |
| `edges`  | `"stretch" \| "transparent" \| "mirror" \| "wrap"` | `mirror`            | How to handle edges when distortion pushes content out of bounds |

### Perspective (`perspective`) {#perspective}

**Category:** distortions  
**Description:** Rotate the plane in 3D space with pan and tilt

**Props:**

| Name     | Type                                               | Default             | Notes                                          |
| -------- | -------------------------------------------------- | ------------------- | ---------------------------------------------- |
| `center` | `{x: number, y: number}`                           | `{"x":0.5,"y":0.5}` | Center point of rotation                       |
| `pan`    | `number`                                           | `0`                 | Horizontal rotation (left/right)               |
| `tilt`   | `number`                                           | `0`                 | Vertical rotation (up/down)                    |
| `fov`    | `number`                                           | `60`                | Field of view - controls perspective intensity |
| `zoom`   | `number`                                           | `1`                 | Zoom in to fill the frame after rotation       |
| `offset` | `{x: number, y: number}`                           | `{"x":0.5,"y":0.5}` | Shift the result in X/Y                        |
| `edges`  | `"stretch" \| "transparent" \| "mirror" \| "wrap"` | `transparent`       | How to handle edges                            |

### PolarCoordinates (`polarcoordinates`) {#polarcoordinates}

**Category:** distortions  
**Description:** Convert rectangular coordinates to polar space

**Props:**

| Name        | Type                                               | Default             | Notes                                                                     |
| ----------- | -------------------------------------------------- | ------------------- | ------------------------------------------------------------------------- |
| `center`    | `{x: number, y: number}`                           | `{"x":0.5,"y":0.5}` | The center point for polar coordinate conversion                          |
| `wrap`      | `number`                                           | `1`                 | Controls how much of the angular range to use (1 = full 360°, 0.5 = 180°) |
| `radius`    | `number`                                           | `1`                 | Controls how much of the radius range to use (affects the radial mapping) |
| `intensity` | `number`                                           | `1`                 | Blends between original UVs (0) and polar coordinates (1)                 |
| `edges`     | `"stretch" \| "transparent" \| "mirror" \| "wrap"` | `transparent`       | How to handle edges when distortion pushes content out of bounds          |

### RectangularCoordinates (`rectangularcoordinates`) {#rectangularcoordinates}

**Category:** distortions  
**Description:** Convert polar coordinates back to rectangular space

**Props:**

| Name        | Type                                               | Default             | Notes                                                            |
| ----------- | -------------------------------------------------- | ------------------- | ---------------------------------------------------------------- |
| `center`    | `{x: number, y: number}`                           | `{"x":0.5,"y":0.5}` | The center point for rectangular coordinate conversion           |
| `scale`     | `number`                                           | `1`                 | Scale factor for the rectangular output                          |
| `intensity` | `number`                                           | `1`                 | Blends between original UVs (0) and rectangular coordinates (1)  |
| `edges`     | `"stretch" \| "transparent" \| "mirror" \| "wrap"` | `transparent`       | How to handle edges when distortion pushes content out of bounds |

### Spherize (`spherize`) {#spherize}

**Category:** distortions  
**Description:** Map content onto a 3D sphere surface with depth distortion

**Props:**

| Name             | Type                     | Default             | Notes                                                                    |
| ---------------- | ------------------------ | ------------------- | ------------------------------------------------------------------------ |
| `radius`         | `number`                 | `1`                 | Radius of the sphere (1 = half viewport height)                          |
| `depth`          | `number`                 | `1`                 | How much the sphere bulges toward viewer (0 = flat, higher = more bulge) |
| `center`         | `{x: number, y: number}` | `{"x":0.5,"y":0.5}` | The center point of the sphere                                           |
| `lightPosition`  | `{x: number, y: number}` | `{"x":0.3,"y":0.3}` | Position of the specular light source                                    |
| `lightIntensity` | `number`                 | `0.5`               | Intensity of the rim light (0 = off)                                     |
| `lightSoftness`  | `number`                 | `0.5`               | Softness of the rim light falloff (0 = hard edge, 1 = soft glow)         |
| `lightColor`     | `string`                 | `#ffffff`           | Color of the specular highlight                                          |

### Stretch (`stretch`) {#stretch}

**Category:** distortions  
**Description:** Stretch content towards a direction from a center point

**Props:**

| Name       | Type                                               | Default             | Notes                                                                             |
| ---------- | -------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------- |
| `center`   | `{x: number, y: number}`                           | `{"x":0.5,"y":0.5}` | The center point of the stretch effect                                            |
| `strength` | `number`                                           | `1`                 | The intensity of the stretch effect                                               |
| `angle`    | `number`                                           | `0`                 | The direction of the stretch in degrees                                           |
| `falloff`  | `number`                                           | `0`                 | Controls the sharpness of the transition (0 = sharp edge, 1 = gradual transition) |
| `edges`    | `"stretch" \| "transparent" \| "mirror" \| "wrap"` | `stretch`           | How to handle edges when distortion pushes content out of bounds                  |

### Twirl (`twirl`) {#twirl}

**Category:** distortions  
**Description:** Rotate and twist content around a center point

**Props:**

| Name        | Type                                               | Default             | Notes                                                            |
| ----------- | -------------------------------------------------- | ------------------- | ---------------------------------------------------------------- |
| `center`    | `{x: number, y: number}`                           | `{"x":0.5,"y":0.5}` | The center point of the twirl effect                             |
| `intensity` | `number`                                           | `1`                 | The strength of the twirl effect                                 |
| `edges`     | `"stretch" \| "transparent" \| "mirror" \| "wrap"` | `stretch`           | How to handle edges when distortion pushes content out of bounds |

### WaveDistortion (`wavedistortion`) {#wavedistortion}

**Category:** distortions  
**Description:** Wave-based distortion with multiple waveform types

**Props:**

| Name        | Type                                                         | Default   | Notes                                                            |
| ----------- | ------------------------------------------------------------ | --------- | ---------------------------------------------------------------- |
| `strength`  | `number`                                                     | `0.3`     | Distortion intensity                                             |
| `frequency` | `number`                                                     | `1`       | Number of bends/waves                                            |
| `speed`     | `number`                                                     | `1`       | Animation speed                                                  |
| `angle`     | `number`                                                     | `0`       | Direction of wave distortion in degrees                          |
| `waveType`  | `"sine" \| "triangle" \| "square" \| "sawtooth" \| "bounce"` | `sine`    | Shape of the distortion wave                                     |
| `edges`     | `"stretch" \| "transparent" \| "mirror" \| "wrap"`           | `stretch` | How to handle edges when distortion pushes content out of bounds |

## Blurs

### AngularBlur (`angularblur`) {#angularblur}

**Category:** blurs  
**Description:** Radial motion blur rotating around a center point

**Props:**

| Name        | Type                     | Default             | Notes                                |
| ----------- | ------------------------ | ------------------- | ------------------------------------ |
| `intensity` | `number`                 | `20`                | Intensity of the angular blur effect |
| `center`    | `{x: number, y: number}` | `{"x":0.5,"y":0.5}` | The center point of the rotation     |

### Blur (`blur`) {#blur}

**Category:** blurs  
**Description:** A simple Gaussian blur effect

**Props:**

| Name        | Type     | Default | Notes                        |
| ----------- | -------- | ------- | ---------------------------- |
| `intensity` | `number` | `50`    | Intensity of the blur effect |

### ChannelBlur (`channelblur`) {#channelblur}

**Category:** blurs  
**Description:** Independent blur for red, green, and blue channels

**Props:**

| Name             | Type     | Default | Notes                            |
| ---------------- | -------- | ------- | -------------------------------- |
| `redIntensity`   | `number` | `0`     | Blur intensity for red channel   |
| `greenIntensity` | `number` | `20`    | Blur intensity for green channel |
| `blueIntensity`  | `number` | `40`    | Blur intensity for blue channel  |

### DiffuseBlur (`diffuseblur`) {#diffuseblur}

**Category:** blurs  
**Description:** Grain-like pixel displacement at random

**Props:**

| Name        | Type                                               | Default   | Notes                                                            |
| ----------- | -------------------------------------------------- | --------- | ---------------------------------------------------------------- |
| `intensity` | `number`                                           | `30`      | Intensity of the diffuse blur effect                             |
| `edges`     | `"stretch" \| "transparent" \| "mirror" \| "wrap"` | `stretch` | How to handle edges when distortion pushes content out of bounds |

### LinearBlur (`linearblur`) {#linearblur}

**Category:** blurs  
**Description:** Directional motion blur in a specific angle

**Props:**

| Name        | Type     | Default | Notes                                     |
| ----------- | -------- | ------- | ----------------------------------------- |
| `intensity` | `number` | `30`    | Intensity of the linear blur effect       |
| `angle`     | `number` | `0`     | Direction of the linear blur (in degrees) |

### ProgressiveBlur (`progressiveblur`) {#progressiveblur}

**Category:** blurs  
**Description:** Blur that increases progressively in one direction

**Props:**

| Name        | Type                     | Default           | Notes                                                 |
| ----------- | ------------------------ | ----------------- | ----------------------------------------------------- |
| `intensity` | `number`                 | `50`              | Maximum intensity of the blur effect                  |
| `angle`     | `number`                 | `0`               | Direction of the blur gradient (in degrees)           |
| `center`    | `{x: number, y: number}` | `{"x":0,"y":0.5}` | Center point where blur begins                        |
| `falloff`   | `number`                 | `1`               | Distance over which blur transitions to full strength |

### TiltShift (`tiltshift`) {#tiltshift}

**Category:** blurs  
**Description:** Selective focus blur mimicking tilt-shift photography

**Props:**

| Name        | Type                     | Default             | Notes                                                 |
| ----------- | ------------------------ | ------------------- | ----------------------------------------------------- |
| `intensity` | `number`                 | `50`                | Maximum blur intensity at edges                       |
| `width`     | `number`                 | `0.3`               | Width of the sharp focus area                         |
| `falloff`   | `number`                 | `0.3`               | Distance over which blur transitions to full strength |
| `angle`     | `number`                 | `0`                 | Rotation angle of the focus line (in degrees)         |
| `center`    | `{x: number, y: number}` | `{"x":0.5,"y":0.5}` | Center point of the focus line                        |

### ZoomBlur (`zoomblur`) {#zoomblur}

**Category:** blurs  
**Description:** Radial zoom blur expanding from a center point

**Props:**

| Name        | Type                     | Default             | Notes                             |
| ----------- | ------------------------ | ------------------- | --------------------------------- |
| `intensity` | `number`                 | `30`                | Intensity of the zoom blur effect |
| `center`    | `{x: number, y: number}` | `{"x":0.5,"y":0.5}` | Center point of the zoom blur     |

## Adjustments

### BrightnessContrast (`brightnesscontrast`) {#brightnesscontrast}

**Category:** adjustments  
**Description:** Adjust brightness and contrast of the image

**Props:**

| Name         | Type     | Default | Notes                           |
| ------------ | -------- | ------- | ------------------------------- |
| `brightness` | `number` | `0`     | Brightness adjustment (-1 to 1) |
| `contrast`   | `number` | `0`     | Contrast adjustment (-1 to 1)   |

### Duotone (`duotone`) {#duotone}

**Category:** adjustments  
**Description:** Map colors to two tones based on luminance

**Props:**

| Name         | Type                                                        | Default   | Notes                                  |
| ------------ | ----------------------------------------------------------- | --------- | -------------------------------------- |
| `colorA`     | `string`                                                    | `#ff0000` | First color (used for darker areas)    |
| `colorB`     | `string`                                                    | `#023af4` | Second color (used for brighter areas) |
| `blend`      | `number`                                                    | `0.5`     | Blend point between the two colors     |
| `colorSpace` | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`  | Color space for color interpolation    |

### Grayscale (`grayscale`) {#grayscale}

**Category:** adjustments  
**Description:** Convert colors to black and white

**Props:** _(none)_

### HueShift (`hueshift`) {#hueshift}

**Category:** adjustments  
**Description:** Rotate hue around the color wheel

**Props:**

| Name    | Type     | Default | Notes                          |
| ------- | -------- | ------- | ------------------------------ |
| `shift` | `number` | `0`     | The amount to shift the hue by |

### Invert (`invert`) {#invert}

**Category:** adjustments  
**Description:** Invert RGB colors while preserving alpha

**Props:** _(none)_

### Posterize (`posterize`) {#posterize}

**Category:** adjustments  
**Description:** Reduce color depth to create a poster effect

**Props:**

| Name        | Type     | Default | Notes                                                                |
| ----------- | -------- | ------- | -------------------------------------------------------------------- |
| `intensity` | `number` | `5`     | The intensity of the posterization effect (lower is more posterized) |

### Saturation (`saturation`) {#saturation}

**Category:** adjustments  
**Description:** Adjust color saturation intensity

**Props:**

| Name        | Type     | Default | Notes                                                      |
| ----------- | -------- | ------- | ---------------------------------------------------------- |
| `intensity` | `number` | `1`     | The intensity of the saturation effect (1 being no change) |

### Sharpness (`sharpness`) {#sharpness}

**Category:** adjustments  
**Description:** Adjust image sharpness using a convolution kernel

**Props:**

| Name        | Type     | Default | Notes                                  |
| ----------- | -------- | ------- | -------------------------------------- |
| `sharpness` | `number` | `0`     | How sharp to make the underlying image |

### Solarize (`solarize`) {#solarize}

**Category:** adjustments  
**Description:** Inverts tones above a luminance threshold — a classic darkroom and photo effect

**Props:**

| Name        | Type     | Default | Notes                                                                                             |
| ----------- | -------- | ------- | ------------------------------------------------------------------------------------------------- |
| `threshold` | `number` | `0.5`   | Luminance level above which colors are inverted. Pixels brighter than this threshold get flipped. |
| `strength`  | `number` | `1`     | Blend between original (0) and fully solarized (1)                                                |

### Tint (`tint`) {#tint}

**Category:** adjustments  
**Description:** Apply a color tint to the image

**Props:**

| Name                 | Type      | Default   | Notes                                    |
| -------------------- | --------- | --------- | ---------------------------------------- |
| `color`              | `string`  | `#ff8800` | Tint color                               |
| `amount`             | `number`  | `0.5`     | Tint amount (0 = no tint, 1 = full tint) |
| `preserveLuminosity` | `boolean` | `true`    | Preserve original brightness             |

### Tritone (`tritone`) {#tritone}

**Category:** adjustments  
**Description:** "Map colors to three tones: shadows, midtones, highlights"

**Props:**

| Name         | Type                                                        | Default   | Notes                                             |
| ------------ | ----------------------------------------------------------- | --------- | ------------------------------------------------- |
| `colorA`     | `string`                                                    | `#ce1bea` | First color (used for shadows/darkest areas)      |
| `colorB`     | `string`                                                    | `#2fff00` | Second color (used for midtones)                  |
| `colorC`     | `string`                                                    | `#ffff00` | Third color (used for highlights/brightest areas) |
| `blendMid`   | `number`                                                    | `0.5`     | Midpoint position between the three colors        |
| `colorSpace` | `"linear" \| "oklch" \| "oklab" \| "hsl" \| "hsv" \| "lch"` | `linear`  | Color space for color interpolation               |

### Vibrance (`vibrance`) {#vibrance}

**Category:** adjustments  
**Description:** Selective saturation adjustment protecting skin tones

**Props:**

| Name        | Type     | Default | Notes                                |
| ----------- | -------- | ------- | ------------------------------------ |
| `intensity` | `number` | `0`     | The intensity of the vibrance effect |
