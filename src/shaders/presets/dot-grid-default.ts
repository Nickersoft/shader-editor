import { chain } from '@/shaders/core/chain'
import DotGrid from '@/shaders/textures/dot-grid'

export default chain()
  .pipe(new DotGrid({
    config: {
      colorBack: [0.05, 0.05, 0.08],
      colorFill: [0.95, 0.9, 0.7],
      colorStroke: [0.95, 0.9, 0.7],
      gapX: 30,
      gapY: 30,
      dotSize: 0.3,
      strokeWidth: 0,
      sizeRange: 0,
      opacityRange: 0,
      shape: 0,
    },
  }))
