import { chain } from '@/shaders/core/chain'
import DotOrbit from '@/shaders/textures/dot-orbit'

export default chain()
  .pipe(new DotOrbit({
    config: {
      colors: {
        values: [
          [0.9686274509803922, 0.1450980392156863, 0.5215686274509804, 1],
          [0.4470588235294118, 0.03529411764705882, 0.7176470588235294, 1],
          [0.22745098039215686, 0.047058823529411764, 0.6392156862745098, 1],
          [0.2627450980392157, 0.3803921568627451, 0.9333333333333333, 1],
          [0.2980392156862745, 0.788235294117647, 0.9411764705882353, 1],
        ],
        length: 5,
      },
      colorBack: [1, 1, 1],
      cells: 18,
      size: 0.45,
      sizeRange: 0.5,
      spread: 0.6,
      softness: 0.05,
      stepsPerColor: 1,
      speed: 1,
    },
  }))
