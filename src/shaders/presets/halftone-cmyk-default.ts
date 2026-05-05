import { chain } from '@/shaders/core/chain'
import HalftoneCmyk from '@/shaders/effects/halftone-cmyk'
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
  .pipe(new HalftoneCmyk({
    config: {
      size: 0.5,
      softness: 0.1,
      contrast: 1,
      colorBack: [1, 1, 1],
      colorC: [0, 0.65, 0.92],
      colorM: [0.93, 0, 0.45],
      colorY: [1, 0.92, 0],
      colorK: [0.05, 0.05, 0.05],
    },
  }))
