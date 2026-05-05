import { chain } from '@/shaders/core/chain'
import ColorRamp from '@/shaders/effects/color-ramp'
import PolarFbmDistort from '@/shaders/distortion/polar-fbm-distort'
import RingScalar from '@/shaders/textures/ring-scalar'

export default chain()
  .pipe(new RingScalar({
    config: {
      centerX: 0.5,
      centerY: 0.5,
      radius: 0.4,
      thickness: 0.3,
      innerShape: 1,
    },
  }))
  .pipe(new PolarFbmDistort({
    config: {
      amount: 1.2,
      bias: 0.8,
      noiseScale: 1.4,
      iterations: 6,
      speed: 1,
    },
  }))
  .pipe(new ColorRamp({
    config: {
      colors: {
        values: [
          [0.03, 0.02, 0.08, 1],
          [0.9686274509803922, 0.396078431372549, 0.6039215686274509, 1],
          [0.35294117647058826, 0.5568627450980392, 1, 1],
          [1, 0.8156862745098039, 0.22745098039215686, 1],
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
