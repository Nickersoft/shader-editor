import { chain } from '@/shaders/core/chain'
import ColorRamp from '@/shaders/effects/color-ramp'
import LinearGradient from '@/shaders/textures/linear-gradient'
import OrganicWarp from '@/shaders/distortion/organic-warp'

export default chain()
  .pipe(new LinearGradient({
    config: {
      colors: {
        values: [
          [0, 0, 0, 1],
          [1, 1, 1, 1],
        ],
        length: 2,
      },
      angle: 0,
      offset: 0.5,
      smoothness: 1,
    },
  }))
  .pipe(new OrganicWarp({
    config: {
      distortion: 0.6,
      swirl: 0.3,
      scale: 1,
      speed: 0.4,
      centerFalloff: 0,
      iterations: 3,
    },
  }))
  .pipe(new ColorRamp({
    config: {
      colors: {
        values: [
          [0.0392156862745098, 0.08627450980392157, 0.32941176470588235, 1],
          [0.22745098039215686, 0.5411764705882353, 0.8470588235294118, 1],
          [0.6392156862745098, 0.9019607843137255, 1, 1],
        ],
        length: 3,
      },
      channel: 0,
      steps: 0,
      stepsPerColor: 1,
      softness: 0.7,
      wrap: false,
      domainMin: 0,
      domainMax: 1,
    },
  }))
