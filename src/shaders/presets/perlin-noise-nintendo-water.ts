import { chain } from '@/shaders/core/chain'
import ColorRamp from '@/shaders/effects/color-ramp'
import ScalarField from '@/shaders/textures/scalar-field'

export default chain()
  .pipe(new ScalarField({
    config: {
      mode: 0,
      scale: 4,
      speed: 0.6,
      octaves: 6,
      persistence: 0.5,
      lacunarity: 2,
      contrast: 1.1,
      brightness: 0,
      seed: 5,
    },
  }))
  .pipe(new ColorRamp({
    config: {
      colors: {
        values: [
          [0, 0.12156862745098039, 0.43137254901960786, 1],
          [0, 0.3137254901960784, 0.8156862745098039, 1],
          [0, 0.7843137254901961, 1, 1],
          [0.5019607843137255, 0.9372549019607843, 1, 1],
        ],
        length: 4,
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
