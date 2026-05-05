import { chain } from '@/shaders/core/chain'
import ColorRamp from '@/shaders/effects/color-ramp'
import ScalarField from '@/shaders/textures/scalar-field'

export default chain()
  .pipe(new ScalarField({
    config: {
      mode: 2,
      scale: 1,
      speed: 0.3,
      octaves: 1,
      persistence: 0.5,
      lacunarity: 2,
      contrast: 3,
      brightness: 0,
      seed: 0,
    },
  }))
  .pipe(new ColorRamp({
    config: {
      colors: {
        values: [
          [0, 0, 0, 1],
          [0.2784313725490196, 0.47843137254901963, 1, 1],
          [1, 1, 1, 1],
        ],
        length: 3,
      },
      channel: 0,
      steps: 0,
      stepsPerColor: 1,
      softness: 0.3,
      wrap: false,
      domainMin: 0,
      domainMax: 1,
    },
  }))
