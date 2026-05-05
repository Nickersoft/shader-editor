import { chain } from '@/shaders/core/chain'
import MeshSpotsGradient from '@/shaders/textures/mesh-spots-gradient'
import OrganicWarp from '@/shaders/distortion/organic-warp'

export default chain()
  .pipe(new MeshSpotsGradient({
    config: {
      colors: {
        values: [
          [0.6666666666666666, 0.6549019607843137, 0.8431372549019608, 1],
          [0.23529411764705882, 0.16862745098039217, 0.5568627450980392, 1],
          [0.6666666666666666, 0.6549019607843137, 0.8431372549019608, 1],
          [0.23529411764705882, 0.16862745098039217, 0.5568627450980392, 1],
        ],
        length: 4,
      },
      falloff: 3.5,
      speed: 0.6,
      amplitude: 0.4,
      seed: 1,
    },
  }))
  .pipe(new OrganicWarp({
    config: {
      distortion: 0.6,
      swirl: 0.5,
      scale: 1,
      speed: 0.6,
      centerFalloff: 0,
      iterations: 2,
    },
  }))
