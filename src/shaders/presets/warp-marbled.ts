import { chain } from '@/shaders/core/chain'
import ColorRamp from '@/shaders/effects/color-ramp'
import OrganicWarp from '@/shaders/distortion/organic-warp'
import Stripes from '@/shaders/textures/stripes'

export default chain()
  .pipe(new Stripes({
    config: {
      color1: [0, 0, 0],
      color2: [1, 1, 1],
      frequency: 4,
      duty: 0.5,
      angle: 0,
      softness: 1,
    },
  }))
  .pipe(new OrganicWarp({
    config: {
      distortion: 0.9,
      swirl: 0.7,
      scale: 1,
      speed: 0.3,
      centerFalloff: 0,
      iterations: 4,
    },
  }))
  .pipe(new ColorRamp({
    config: {
      colors: {
        values: [
          [0.0392156862745098, 0.023529411764705882, 0.07058823529411765, 1],
          [0.35294117647058826, 0.22745098039215686, 0.48627450980392156, 1],
          [0.7843137254901961, 0.7215686274509804, 0.8784313725490196, 1],
          [1, 0.9803921568627451, 0.9411764705882353, 1],
        ],
        length: 4,
      },
      channel: 0,
      steps: 0,
      stepsPerColor: 1,
      softness: 0.6,
      wrap: false,
      domainMin: 0,
      domainMax: 1,
    },
  }))
