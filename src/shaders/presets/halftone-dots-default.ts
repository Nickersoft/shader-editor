import { chain } from '@/shaders/core/chain'
import Halftone from '@/shaders/effects/halftone'
import ImageSource from '@/shaders/textures/image-source'

export default chain()
  .pipe(new ImageSource({
    config: {
      tint: [1, 1, 1, 1],
    },
    inputs: {
      image: {
        url: null,
        sourceKind: "url",
        fit: "cover",
      },
    },
  }))
  .pipe(new Halftone({
    config: {
      cells: 80,
      angle: 0.7853,
      softness: 0.05,
      colorBack: [1, 1, 1],
      colorDot: [0, 0, 0],
    },
  }))
