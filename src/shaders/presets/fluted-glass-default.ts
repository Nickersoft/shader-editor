import { chain } from '@/shaders/core/chain'
import FlutedGlass from '@/shaders/distortion/fluted-glass'
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
  .pipe(new FlutedGlass({
    config: {
      size: 0.5,
      angle: 0,
      shape: 0,
      distortion: 0.6,
      highlights: 0.35,
      shadows: 0.4,
      shift: 0,
    },
  }))
