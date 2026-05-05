import { chain } from '@/shaders/core/chain'
import ColorRamp from '@/shaders/effects/color-ramp'
import ScalarField from '@/shaders/textures/scalar-field'

export default chain()
  .pipe(new ScalarField({
    config: {
      mode: 4,
      scale: 6,
      speed: 1.5,
      octaves: 1,
      persistence: 0.5,
      lacunarity: 2,
      contrast: 1.5,
      brightness: 0,
      seed: 3,
    },
  }))
  .pipe(new ColorRamp({
    config: {
      colors: {
        values: [
          [1, 0.7333333333333333, 0, 1],
          [1, 0.3333333333333333, 0, 1],
          [0.8, 0, 0.6666666666666666, 1],
          [0.2, 0, 1, 1],
        ],
        length: 4,
      },
      channel: 0,
      steps: 0,
      stepsPerColor: 1,
      softness: 0.3,
      wrap: true,
      domainMin: 0,
      domainMax: 1,
    },
  }))
