import { chain } from '@/shaders/core/chain'
import PulsingBorder from '@/shaders/shapes/pulsing-border'

export default chain()
  .pipe(new PulsingBorder({
    config: {
      colors: {
        values: [
          [0.050980392156862744, 0.7568627450980392, 0.9921568627450981, 1],
          [0.8509803921568627, 0.08235294117647059, 0.9372549019607843, 1],
          [1, 0.24705882352941178, 0.1803921568627451, 0.8],
        ],
        length: 3,
      },
      colorBack: [0, 0, 0, 1],
      roundness: 0.25,
      thickness: 0.1,
      softness: 0.75,
      intensity: 0.2,
      bloom: 0.25,
      spots: 4,
      spotSize: 0.5,
      pulse: 0.25,
      smoke: 0.3,
      smokeSize: 0.6,
      marginLeft: 0,
      marginRight: 0,
      marginTop: 0,
      marginBottom: 0,
      speed: 1,
    },
  }))
