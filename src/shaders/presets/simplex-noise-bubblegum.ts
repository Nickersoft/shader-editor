import { chain } from '@/shaders/core/chain'
import ColorRamp from '@/shaders/effects/color-ramp'
import ScalarField from '@/shaders/textures/scalar-field'

export default chain()
  .pipe(new ScalarField({
    config: {
      mode: 1,
      scale: 1.2,
      speed: 0.8,
      octaves: 3,
      persistence: 0.6,
      lacunarity: 2,
      contrast: 1.2,
      brightness: 0,
      seed: 10,
    },
  }))
  .pipe(new ColorRamp({
    config: {
      colors: {
        values: [
          [1, 0.5019607843137255, 0.7490196078431373, 1],
          [1, 0.7490196078431373, 0.9098039215686274, 1],
          [0.7490196078431373, 0.5019607843137255, 1, 1],
          [0.5019607843137255, 0.7490196078431373, 1, 1],
        ],
        length: 4,
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
