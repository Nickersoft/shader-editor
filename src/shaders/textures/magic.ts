import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, NodeHandle, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Magic",
  description: "Recursive sin/cos swirl",
  color: "#a78bfa",
  category: "textures",
  defaultBlendMode: "normal",
};

// Decomposed Magic Texture. Each recursion step transforms (mx, my) → (mx',
// my'), where mx' = sin(mx*my + t), my' = cos(mx' + my + t), then both are
// scaled by `distortion`. `depth` is structural (chosen at preset-author
// time, default 2) so the iteration unrolls into the graph; users can swap
// the sin/cos with other Math ops to change the texture character entirely.
const DEPTH = 2;

function magicIter(
  b: GraphBuilder,
  mx: NodeHandle,
  my: NodeHandle,
  t: NodeHandle,
  dist: NodeHandle,
): { mx: NodeHandle; my: NodeHandle } {
  // mx_new = sin(mx * my + t)
  const mxMy = b.add(new N.Math({ op: "mul" }));
  b.connect(mx).to(mxMy, "a");
  b.connect(my).to(mxMy, "b");
  const mxArg = b.add(new N.Math({ op: "add" }));
  b.connect(mxMy).to(mxArg, "a");
  b.connect(t).to(mxArg, "b");
  const mxSin = b.add(new N.Math({ op: "sin" }));
  b.connect(mxArg).to(mxSin, "x");
  // my_new = cos(mx_new + my + t)
  const sumA = b.add(new N.Math({ op: "add" }));
  b.connect(mxSin).to(sumA, "a");
  b.connect(my).to(sumA, "b");
  const myArg = b.add(new N.Math({ op: "add" }));
  b.connect(sumA).to(myArg, "a");
  b.connect(t).to(myArg, "b");
  const myCos = b.add(new N.Math({ op: "cos" }));
  b.connect(myArg).to(myCos, "x");
  // Both scaled by distortion
  const mxD = b.add(new N.Math({ op: "mul" }));
  b.connect(mxSin).to(mxD, "a");
  b.connect(dist).to(mxD, "b");
  const myD = b.add(new N.Math({ op: "mul" }));
  b.connect(myCos).to(myD, "a");
  b.connect(dist).to(myD, "b");
  return { mx: mxD, my: myD };
}

export class Magic extends ProceduralShader {
  static readonly typeId = "magic";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "scale", type: "float", label: "Scale", default: 3 },
      { id: "distortion", type: "float", label: "Distortion", default: 1 },
    ]);
    const pPos = b.position();
    const tIn = b.time();

    // Setup: scale position, separate xy, half-time accumulator
    const { mpx, mpy, mt } = b.frame("Setup", "#0ea5e9", () => {
      const mp = b.add(new N.VectorMath({ op: "scale" }));
      b.connect(pPos).to(mp, "a");
      b.connect(gi.scale).to(mp, "b");
      const sepP = b.add(new N.SeparateXy());
      b.connect(mp).to(sepP, "v");
      const mt = b.add(new N.Math({ op: "mul" }), { b: 0.5 });
      b.connect(tIn).to(mt, "a");
      return {
        mpx: new NodeHandle(sepP.nodeId, "x"),
        mpy: new NodeHandle(sepP.nodeId, "y"),
        mt,
      };
    });

    // Seed the recursion: mx0 = sin((px + py)*5 + mt), my0 = cos((px − py)*5 − mt)
    const { mx0, my0 } = b.frame("Seed", "#10b981", () => {
      const pxPy = b.add(new N.Math({ op: "add" }));
      b.connect(mpx).to(pxPy, "a");
      b.connect(mpy).to(pxPy, "b");
      const pxPy5 = b.add(new N.Math({ op: "mul" }), { b: 5 });
      b.connect(pxPy).to(pxPy5, "a");
      const mx0Arg = b.add(new N.Math({ op: "add" }));
      b.connect(pxPy5).to(mx0Arg, "a");
      b.connect(mt).to(mx0Arg, "b");
      const mx0 = b.add(new N.Math({ op: "sin" }));
      b.connect(mx0Arg).to(mx0, "x");

      const pxMpy = b.add(new N.Math({ op: "sub" }));
      b.connect(mpx).to(pxMpy, "a");
      b.connect(mpy).to(pxMpy, "b");
      const pxMpy5 = b.add(new N.Math({ op: "mul" }), { b: 5 });
      b.connect(pxMpy).to(pxMpy5, "a");
      const my0Arg = b.add(new N.Math({ op: "sub" }));
      b.connect(pxMpy5).to(my0Arg, "a");
      b.connect(mt).to(my0Arg, "b");
      const my0 = b.add(new N.Math({ op: "cos" }));
      b.connect(my0Arg).to(my0, "x");
      return { mx0, my0 };
    });

    // Iterate DEPTH times — each step gets its own frame so the recursion is
    // visually obvious instead of being a wall of math nodes.
    let mx: NodeHandle = mx0;
    let my: NodeHandle = my0;
    for (let i = 0; i < DEPTH; i++) {
      const next = b.frame(`Iter ${i + 1}`, "#8b5cf6", () =>
        magicIter(b, mx, my, mt, gi.distortion),
      );
      mx = next.mx;
      my = next.my;
    }

    // Combine + colourise: n = clamp(0.5 + 0.5*(sin(mx+my) + cos(mx−my))*0.5)
    const sumScaled = b.frame("Combine", "#f59e0b", () => {
      const mxPlus = b.add(new N.Math({ op: "add" }));
      b.connect(mx).to(mxPlus, "a");
      b.connect(my).to(mxPlus, "b");
      const mxMinus = b.add(new N.Math({ op: "sub" }));
      b.connect(mx).to(mxMinus, "a");
      b.connect(my).to(mxMinus, "b");
      const sinP = b.add(new N.Math({ op: "sin" }));
      b.connect(mxPlus).to(sinP, "x");
      const cosM = b.add(new N.Math({ op: "cos" }));
      b.connect(mxMinus).to(cosM, "x");
      const sumSC = b.add(new N.Math({ op: "add" }));
      b.connect(sinP).to(sumSC, "a");
      b.connect(cosM).to(sumSC, "b");
      const sumScaled = b.add(new N.MapRange({
        fromMin: -2, fromMax: 2, toMin: 0, toMax: 1, interp: "linear", clamp: true,
      }));
      b.connect(sumSC).to(sumScaled, "x");
      return sumScaled;
    });

    const ramp = b.colorRamp(sumScaled, [
      [0.95, 0.27, 0.42],
      [0.99, 0.62, 0.16],
      [0.42, 0.09, 0.9],
      [0.07, 0.46, 0.85],
    ]);
    return b.output(ramp);
  }
}

register(Magic);
export default Magic;
