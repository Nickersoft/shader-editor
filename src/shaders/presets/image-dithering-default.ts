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
      levels: 4,
      pixelSize: 2,
      colorDark: [0, 0.05, 0.22],
      colorLight: [0.58, 1, 0.69],
    },
  }))
