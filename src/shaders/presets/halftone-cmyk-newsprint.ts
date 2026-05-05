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
      size: 0.35,
      softness: 0,
      contrast: 1.3,
      colorBack: [0.96, 0.93, 0.86],
      colorC: [0.1, 0.4, 0.6],
      colorM: [0.7, 0.1, 0.35],
      colorY: [0.85, 0.78, 0.1],
      colorK: [0.1, 0.08, 0.06],
    },
  }))
