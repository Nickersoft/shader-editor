import { chain } from '@/shaders/core/chain'
import PulsingBorder from '@/shaders/shapes/pulsing-border'

export default chain()
  .pipe(new PulsingBorder({
    config: {
      colors: {
        values: [
          [0.2980392156862745, 0.2784313725490196, 0.5803921568627451, 1],
          [0.4666666666666667, 0.2901960784313726, 0.49019607843137253, 1],
          [0.07058823529411765, 0.4117647058823529, 0.2901960784313726, 1],
          [0.0392156862745098, 1, 0.47058823529411764, 1],
          [0.2784313725490196, 0.2, 0.8, 1],
        ],
        length: 5,
      },
      colorBack: [0.047058823529411764, 0.09411764705882353, 0.17254901960784313, 1],
      roundness: 0,
      thickness: 1,
      softness: 1,
      intensity: 0.1,
      bloom: 0.2,
      spots: 4,
      spotSize: 0.25,
      pulse: 0,
      smoke: 0.32,
      smokeSize: 0.5,
      marginLeft: 0,
      marginRight: 0,
      marginTop: 0,
      marginBottom: 0,
      speed: 0.18,
    },
  }))
