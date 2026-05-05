import { chain } from '@/shaders/core/chain'
import ColorArrayRadialPanels from '@/shaders/textures/color-array-radial-panels'

export default chain()
  .pipe(new ColorArrayRadialPanels({
    config: {
      colors: {
        values: [
          [0.9490196078431372, 1, 0, 1],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0.35294117647058826, 0.00784313725490196, 0.5137254901960784, 1],
          [0, 0.3686274509803922, 1, 1],
        ],
        length: 5,
      },
      colorBack: [0.06274509803921569, 0, 0.12549019607843137, 1],
      density: 2.5,
      angle1: 0.05,
      angle2: -0.05,
      length: 1.4,
      edges: false,
      blur: 0.05,
      fadeIn: 1,
      fadeOut: 0,
      gradient: 1,
      speed: 0.5,
    },
  }))
