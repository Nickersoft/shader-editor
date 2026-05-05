import { chain } from '@/shaders/core/chain'
import ColorRamp from '@/shaders/effects/color-ramp'
import ScalarField from '@/shaders/textures/scalar-field'

export default chain()
  .pipe(new ScalarField({
    config: {
      mode: 1,
      scale: 1,
      speed: 0.6,
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
          [0.0392156862745098, 0.0392156862745098, 0.0784313725490196, 1],
          [0.3137254901960784, 0.3764705882352941, 0.7529411764705882, 1],
          [1, 0.9607843137254902, 0.8784313725490196, 1],
        ],
        length: 3,
      },
      channel: 0,
      steps: 0,
      stepsPerColor: 4,
      softness: 0.1,
      wrap: false,
      domainMin: 0,
      domainMax: 1,
    },
  }))
