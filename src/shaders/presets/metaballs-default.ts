import { chain } from '@/shaders/core/chain'
import Metaballs from '@/shaders/textures/metaballs'

export default chain()
  .pipe(new Metaballs({
    config: {
      colors: {
        values: [
          [1, 0.3686274509803922, 0.5411764705882353, 1],
          [0.35294117647058826, 0.7215686274509804, 1, 1],
          [1, 0.8156862745098039, 0.22745098039215686, 1],
          [0.37254901960784315, 1, 0.6039215686274509, 1],
        ],
        length: 4,
      },
      colorBack: [0.04, 0.04, 0.08],
      count: 6,
      size: 0.5,
      softness: 0,
      speed: 1,
    },
  }))
