import { chain } from '@/shaders/core/chain'
import ColorArrayRadialPanels from '@/shaders/textures/color-array-radial-panels'

export default chain()
  .pipe(new ColorArrayRadialPanels({
    config: {
      colors: {
        values: [
          [0, 0.8117647058823529, 1, 1],
          [1, 0.17647058823529413, 0.3333333333333333, 1],
          [0.20392156862745098, 0.7803921568627451, 0.34901960784313724, 1],
          [0.6862745098039216, 0.3215686274509804, 0.8705882352941177, 1],
        ],
        length: 4,
      },
      colorBack: [1, 1, 1, 0],
      density: 1.6,
      angle1: 0.3,
      angle2: 0.3,
      length: 1,
      edges: true,
      blur: 0.25,
      fadeIn: 0.85,
      fadeOut: 0.3,
      gradient: 0,
      speed: 1,
    },
  }))
