import { chain } from '@/shaders/core/chain'
import ColorRamp from '@/shaders/effects/color-ramp'
import PolarFbmDistort from '@/shaders/distortion/polar-fbm-distort'
import RingScalar from '@/shaders/textures/ring-scalar'

export default chain()
  .pipe(new RingScalar({
    config: {
      centerX: 0.5,
      centerY: 0.5,
      radius: 0.45,
      thickness: 0.35,
      innerShape: 0.7,
    },
  }))
  .pipe(new PolarFbmDistort({
    config: {
      amount: 1.5,
      bias: 0.7,
      noiseScale: 1.8,
      iterations: 7,
      speed: 0.6,
    },
  }))
  .pipe(new ColorRamp({
    config: {
      colors: {
        values: [
          [0.02, 0.04, 0.1, 1],
          [0.0392156862745098, 1, 0.5882352941176471, 1],
          [0.35294117647058826, 0.8392156862745098, 1, 1],
          [0.7490196078431373, 0.9607843137254902, 0.8784313725490196, 1],
        ],
        length: 4,
      },
      channel: 0,
      steps: 0,
      stepsPerColor: 1,
      softness: 0.45,
      wrap: false,
      domainMin: 0,
      domainMax: 1,
    },
  }))
