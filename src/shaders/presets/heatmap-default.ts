import { chain } from '@/shaders/core/chain'
import Heatmap from '@/shaders/textures/heatmap'
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
        fit: "contain",
      },
    },
  }))
  .pipe(new Heatmap({
    config: {
      colorBack: [0.02, 0.02, 0.05, 1],
      colors: {
        values: [
          [0.06666666666666667, 0.12549019607843137, 0.41568627450980394, 1],
          [0.12156862745098039, 0.23137254901960785, 0.6352941176470588, 1],
          [0.1843137254901961, 0.38823529411764707, 0.9058823529411765, 1],
          [0.4196078431372549, 0.8431372549019608, 1, 1],
          [1, 0.9019607843137255, 0.4745098039215686, 1],
          [1, 0.6, 0.11764705882352941, 1],
          [1, 0.2980392156862745, 0, 1],
        ],
        length: 7,
      },
      angle: 0,
      noise: 0.2,
      innerGlow: 0.5,
      outerGlow: 0.5,
      contour: 0.5,
      speed: 1,
    },
  }))
