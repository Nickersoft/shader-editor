import { chain } from '@/shaders/core/chain'
import ImageSource from '@/shaders/textures/image-source'
import LiquidMetal from '@/shaders/textures/liquid-metal'

export default chain()
  .pipe(new ImageSource({
    config: {
      tint: [1, 1, 1, 1],
    },
    inputs: {
      image: {
        url: null,
        sourceKind: "url",
        fit: "contain",
      },
    },
  }))
  .pipe(new LiquidMetal({
    config: {
      colorBack: [0.95, 0.95, 0.97, 1],
      colorTint: [0.55, 0.65, 1, 0],
      angle: 0,
      repetition: 4,
      softness: 0.5,
      shiftRed: 0.3,
      shiftBlue: -0.3,
      distortion: 0.5,
      contour: 0.4,
      speed: 0.3,
    },
  }))
