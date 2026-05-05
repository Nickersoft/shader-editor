import { chain } from '@/shaders/core/chain'
import MeshSpotsGradient from '@/shaders/textures/mesh-spots-gradient'

export default chain()
  .pipe(new MeshSpotsGradient({
    config: {
      colors: {
        values: [
          [0.788235294117647, 0.9411764705882353, 1, 1],
          [0, 0.4823529411764706, 0.6666666666666666, 1],
          [0, 0.23921568627450981, 0.3568627450980392, 1],
          [0.49411764705882355, 0.8117647058823529, 0.9098039215686274, 1],
        ],
        length: 4,
      },
      falloff: 4,
      speed: 0,
      amplitude: 0.4,
      seed: 5,
    },
  }))
