import { chain } from '@/shaders/core/chain'
import VoronoiCells from '@/shaders/textures/voronoi-cells'

export default chain()
  .pipe(new VoronoiCells({
    config: {
      colors: {
        values: [
          [0.10196078431372549, 0.0196078431372549, 0.2, 1],
          [0.17647058823529413, 0.06274509803921569, 0.4, 1],
          [0.2901960784313726, 0.10196078431372549, 0.6, 1],
        ],
        length: 3,
      },
      colorGap: [0.85, 0.75, 1],
      colorGlow: [0.7, 0.4, 1],
      scale: 6,
      distortion: 0.3,
      gap: 0.02,
      glow: 0.4,
      stepsPerColor: 1,
      speed: 0.3,
    },
  }))
