import { chain } from '@/shaders/core/chain'
import Checkerboard from '@/shaders/textures/checkerboard'
import ColorRamp from '@/shaders/effects/color-ramp'
import OrganicWarp from '@/shaders/distortion/organic-warp'

export default chain()
  .pipe(new Checkerboard({
    config: {
      color1: [0, 0, 0],
      color2: [1, 1, 1],
      scale: 4,
      rotation: 0,
      softness: 1,
    },
  }))
  .pipe(new OrganicWarp({
    config: {
      distortion: 0.7,
      swirl: 0.4,
      scale: 1,
      speed: 0.5,
      centerFalloff: 0,
      iterations: 3,
    },
  }))
  .pipe(new ColorRamp({
    config: {
      colors: {
        values: [
          [0.10196078431372549, 0.0784313725490196, 0.32941176470588235, 1],
          [0.49411764705882355, 0.22745098039215686, 0.8470588235294118, 1],
          [1, 0.43137254901960786, 0.7803921568627451, 1],
          [1, 0.9019607843137255, 0.42745098039215684, 1],
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
