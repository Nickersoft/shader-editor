import { chain } from '@/shaders/core/chain'
import Dither from '@/shaders/effects/dither'
import ScalarField from '@/shaders/textures/scalar-field'

export default chain()
  .pipe(new ScalarField({
    config: {
      mode: 1,
      scale: 1,
      speed: 0.5,
      octaves: 2,
      persistence: 0.5,
      lacunarity: 2,
      contrast: 1,
      brightness: 0,
      seed: 0,
    },
  }))
  .pipe(new Dither({
    config: {
      levels: 4,
      pixelSize: 2,
      colorDark: [0.05, 0.05, 0.1],
      colorLight: [1, 1, 0.95],
    },
  }))
