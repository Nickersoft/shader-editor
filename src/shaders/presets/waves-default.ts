import { chain } from '@/shaders/core/chain'
import ColorRamp from '@/shaders/effects/color-ramp'
import ScalarField from '@/shaders/textures/scalar-field'

export default chain()
  .pipe(new ScalarField({
    config: {
      mode: 4,
      scale: 4,
      speed: 1,
      octaves: 1,
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
          [0, 0.3, 0.5, 1],
          [0, 0.6, 0.8, 1],
        ],
        length: 2,
      },
      channel: 0,
      steps: 0,
      stepsPerColor: 1,
      softness: 0.4,
      wrap: false,
      domainMin: 0,
      domainMax: 1,
    },
  }))
