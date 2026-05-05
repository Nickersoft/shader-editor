import { chain } from '@/shaders/core/chain'
import MeshSpotsGradient from '@/shaders/textures/mesh-spots-gradient'
import Noise from '@/shaders/overlays/noise'
import OrganicWarp from '@/shaders/distortion/organic-warp'

export default chain()
  .pipe(new MeshSpotsGradient({
    config: {
      colors: {
        values: [
          [1, 0.9019607843137255, 0.6392156862745098, 1],
          [1, 0.49411764705882355, 0.37254901960784315, 1],
          [0.996078431372549, 0.7058823529411765, 0.4823529411764706, 1],
          [0.5254901960784314, 0.6588235294117647, 0.9058823529411765, 1],
        ],
        length: 4,
      },
      falloff: 3.5,
      speed: 0.4,
      amplitude: 0.35,
      seed: 2,
    },
  }))
  .pipe(new OrganicWarp({
    config: {
      distortion: 0.4,
      swirl: 0.2,
      scale: 1,
      speed: 0.4,
      centerFalloff: 0.2,
      iterations: 2,
    },
  }))
  .pipe(new Noise({
    config: {
      intensity: 0.5,
      size: 1,
      colored: 0,
      animated: 0,
    },
  }))
