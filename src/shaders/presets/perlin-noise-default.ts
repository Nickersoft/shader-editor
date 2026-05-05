import { chain } from '@/shaders/core/chain'
import ColorRamp from '@/shaders/effects/color-ramp'
import ScalarField from '@/shaders/textures/scalar-field'

export default chain()
  .pipe(new ScalarField({
    config: {
      mode: 0,
      scale: 3,
      speed: 0.5,
      octaves: 5,
      persistence: 0.55,
      lacunarity: 2.1,
      contrast: 1,
      brightness: 0,
      seed: 0,
    },
  }))
  .pipe(new ColorRamp({
    config: {
      colors: {
        values: [
          [0.38823529411764707, 0.16470588235294117, 0.8352941176470589, 1],
          [0.9882352941176471, 0.8117647058823529, 0.9686274509803922, 1],
        ],
        length: 2,
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
