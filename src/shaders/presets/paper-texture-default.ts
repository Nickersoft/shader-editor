import { chain } from '@/shaders/core/chain'
import ImageSource from '@/shaders/textures/image-source'
import MaterialNoise from '@/shaders/effects/material-noise'
import Noise from '@/shaders/overlays/noise'

export default chain()
  .pipe(new ImageSource({
    config: {
      tint: [1, 1, 1, 1],
    },
    inputs: {
      image: {
        url: null,
        sourceKind: "url",
        fit: "cover",
      },
    },
  }))
  .pipe(new MaterialNoise({
    config: {
      colorFront: [0.62, 0.68, 0.74],
      colorBack: [1, 1, 1],
      fiber: 0.35,
      fiberScale: 80,
      fiberAngle: 0,
      crumples: 0.25,
      crumpleScale: 40,
      contrast: 0.4,
    },
    blendMode: "multiply",
  }))
  .pipe(new Noise({
    config: {
      intensity: 0.3,
      size: 1,
      colored: 0,
      animated: 0,
    },
  }))
