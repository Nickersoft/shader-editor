import { chain } from '@/shaders/core/chain'
import Metaballs from '@/shaders/textures/metaballs'

export default chain()
  .pipe(new Metaballs({
    config: {
      colors: {
        values: [
          [1, 0.6470588235294118, 0, 1],
          [1, 0.23921568627450981, 0, 1],
          [1, 0.9215686274509803, 0.23137254901960785, 1],
        ],
        length: 3,
      },
      count: 8,
      size: 0.6,
      softness: 0,
      speed: 0.7,
    },
  }))
