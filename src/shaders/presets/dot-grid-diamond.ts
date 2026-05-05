import { chain } from '@/shaders/core/chain'
import DotGrid from '@/shaders/textures/dot-grid'

export default chain()
  .pipe(new DotGrid({
    config: {
      colorBack: [0.02, 0.02, 0.05],
      colorFill: [0.5, 0.8, 1],
      colorStroke: [0.8, 0.95, 1],
      gapX: 24,
      gapY: 24,
      dotSize: 0.4,
      strokeWidth: 0.04,
      sizeRange: 0.15,
      opacityRange: 0.4,
      shape: 2,
    },
  }))
