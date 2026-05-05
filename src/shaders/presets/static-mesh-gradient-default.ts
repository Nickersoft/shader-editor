import { chain } from '@/shaders/core/chain'
import MeshSpotsGradient from '@/shaders/textures/mesh-spots-gradient'
import OrganicWarp from '@/shaders/distortion/organic-warp'

export default chain()
  .pipe(new MeshSpotsGradient({
    config: {
      colors: {
        values: [
          [0.8784313725490196, 0.9176470588235294, 1, 1],
          [0.1411764705882353, 0.11372549019607843, 0.6039215686274509, 1],
          [0.9686274509803922, 0.3137254901960784, 0.5725490196078431, 1],
          [0.6235294117647059, 0.3137254901960784, 0.8274509803921568, 1],
        ],
        length: 4,
      },
      falloff: 3.5,
      speed: 0,
      amplitude: 0.35,
      seed: 0,
    },
  }))
  .pipe(new OrganicWarp({
    config: {
      distortion: 0.35,
      swirl: 0.15,
      scale: 1,
      speed: 0,
      centerFalloff: 0,
      iterations: 2,
    },
  }))
