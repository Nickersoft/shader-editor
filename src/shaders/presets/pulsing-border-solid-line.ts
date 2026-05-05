import { chain } from '@/shaders/core/chain'
import PulsingBorder from '@/shaders/shapes/pulsing-border'

export default chain()
  .pipe(new PulsingBorder({
    config: {
      colors: {
        values: [
          [0.5058823529411764, 0.6784313725490196, 0.9254901960784314, 1],
        ],
        length: 1,
      },
      colorBack: [0, 0, 0, 0],
      roundness: 0,
      thickness: 0.05,
      softness: 0.4,
      intensity: 0.4,
      bloom: 0.35,
      spots: 1,
      spotSize: 1,
      pulse: 0,
      smoke: 0,
      smokeSize: 0,
      marginLeft: 0,
      marginRight: 0,
      marginTop: 0,
      marginBottom: 0,
      speed: 1,
    },
  }))
