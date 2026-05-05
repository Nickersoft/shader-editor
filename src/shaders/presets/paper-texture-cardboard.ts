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
      colorFront: [0.5, 0.38, 0.2],
      colorBack: [0.85, 0.72, 0.5],
      fiber: 0.55,
      fiberScale: 120,
      fiberAngle: 5,
      crumples: 0.45,
      crumpleScale: 25,
      contrast: 0.6,
    },
    blendMode: "multiply",
  }))
  .pipe(new Noise({
    config: {
      intensity: 0.35,
      size: 1,
      colored: 0,
      animated: 0,
    },
  }))
