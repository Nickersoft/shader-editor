import { chain } from '@/shaders/core/chain'
import ColorRamp from '@/shaders/effects/color-ramp'
import ScalarField from '@/shaders/textures/scalar-field'

export default chain()
  .pipe(new ScalarField({
    config: {
      mode: 1,
      scale: 1,
      speed: 1,
      octaves: 2,
      persistence: 0.5,
      lacunarity: 2,
      contrast: 1,
      brightness: 0,
      seed: 0,
    },
  }))
  .pipe(new ColorRamp({
    config: {
      colors: {
        values: [
          [0, 0, 0.05, 1],
          [0.4, 0.6, 1, 1],
          [1, 0.95, 0.85, 1],
        ],
        length: 3,
      },
      channel: 0,
      steps: 0,
      stepsPerColor: 1,
      softness: 0.5,
      wrap: false,
      domainMin: 0,
      domainMax: 1,
    },
  }))
