import { chain } from '@/shaders/core/chain'
import ColorArrayRadialPanels from '@/shaders/textures/color-array-radial-panels'

export default chain()
  .pipe(new ColorArrayRadialPanels({
    config: {
      colors: {
        values: [
          [1, 0.615686274509804, 0, 1],
          [0.9921568627450981, 0.30980392156862746, 0.18823529411764706, 1],
          [0.5019607843137255, 0.6078431372549019, 1, 1],
          [0.42745098039215684, 0.1803921568627451, 1, 1],
          [0.2, 0.22745098039215686, 1, 1],
          [0.9450980392156862, 0.3607843137254902, 1, 1],
          [1, 0.8352941176470589, 0.3411764705882353, 1],
        ],
        length: 7,
      },
      colorBack: [0, 0, 0, 1],
      density: 3,
      angle1: 0,
      angle2: 0,
      length: 1.1,
      edges: false,
      blur: 0,
      fadeIn: 1,
      fadeOut: 0.3,
      gradient: 0,
      speed: 0.5,
    },
  }))
