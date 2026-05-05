import { chain } from '@/shaders/core/chain'
import Dither from '@/shaders/effects/dither'
import ImageSource from '@/shaders/textures/image-source'
import LuminanceTap from '@/shaders/effects/luminance-tap'

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
  .pipe(new LuminanceTap())
  .pipe(new Dither({
    config: {
      levels: 2,
      pixelSize: 3,
      colorDark: [0.05, 0.05, 0],
      colorLight: [0.9, 0.85, 0.5],
    },
  }))
