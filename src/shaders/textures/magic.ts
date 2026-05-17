import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph, type PrevRef } from "@/shaders/node-graph";

const meta: NodeMeta = {
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
  mx: PrevRef,
  my: PrevRef,
  t: PrevRef,
  dist: PrevRef,
): { mx: PrevRef; my: PrevRef } {
  // mx_new = sin(mx * my + t)
  const mxMy = b.add("math", { op: "mul" });
  b.connect(mx, mxMy.nodeId, "a");
  b.connect(my, mxMy.nodeId, "b");
  const mxArg = b.add("math", { op: "add" });
  b.connect(mxMy, mxArg.nodeId, "a");
  b.connect(t, mxArg.nodeId, "b");
  const mxSin = b.add("math", { op: "sin" });
  b.connect(mxArg, mxSin.nodeId, "x");
  // my_new = cos(mx_new + my + t)
  const sumA = b.add("math", { op: "add" });
  b.connect(mxSin, sumA.nodeId, "a");
  b.connect(my, sumA.nodeId, "b");
  const myArg = b.add("math", { op: "add" });
  b.connect(sumA, myArg.nodeId, "a");
  b.connect(t, myArg.nodeId, "b");
  const myCos = b.add("math", { op: "cos" });
  b.connect(myArg, myCos.nodeId, "x");
  // Both scaled by distortion
  const mxD = b.add("math", { op: "mul" });
  b.connect(mxSin, mxD.nodeId, "a");
  b.connect(dist, mxD.nodeId, "b");
  const myD = b.add("math", { op: "mul" });
  b.connect(myCos, myD.nodeId, "a");
  b.connect(dist, myD.nodeId, "b");
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
      const mp = b.add("vector-math", { op: "scale" });
      b.connect(pPos, mp.nodeId, "a");
      b.connect(gi.scale, mp.nodeId, "b");
      const sepP = b.add("separate-xy", {});
      b.connect(mp, sepP.nodeId, "v");
      const mt = b.add("math", { op: "mul" }, { b: 0.5 });
      b.connect(tIn, mt.nodeId, "a");
      return {
        mpx: { nodeId: sepP.nodeId, pin: "x" } as PrevRef,
        mpy: { nodeId: sepP.nodeId, pin: "y" } as PrevRef,
        mt,
      };
    });

    // Seed the recursion: mx0 = sin((px + py)*5 + mt), my0 = cos((px − py)*5 − mt)
    const { mx0, my0 } = b.frame("Seed", "#10b981", () => {
      const pxPy = b.add("math", { op: "add" });
      b.connect(mpx, pxPy.nodeId, "a");
      b.connect(mpy, pxPy.nodeId, "b");
      const pxPy5 = b.add("math", { op: "mul" }, { b: 5 });
      b.connect(pxPy, pxPy5.nodeId, "a");
      const mx0Arg = b.add("math", { op: "add" });
      b.connect(pxPy5, mx0Arg.nodeId, "a");
      b.connect(mt, mx0Arg.nodeId, "b");
      const mx0 = b.add("math", { op: "sin" });
      b.connect(mx0Arg, mx0.nodeId, "x");

      const pxMpy = b.add("math", { op: "sub" });
      b.connect(mpx, pxMpy.nodeId, "a");
      b.connect(mpy, pxMpy.nodeId, "b");
      const pxMpy5 = b.add("math", { op: "mul" }, { b: 5 });
      b.connect(pxMpy, pxMpy5.nodeId, "a");
      const my0Arg = b.add("math", { op: "sub" });
      b.connect(pxMpy5, my0Arg.nodeId, "a");
      b.connect(mt, my0Arg.nodeId, "b");
      const my0 = b.add("math", { op: "cos" });
      b.connect(my0Arg, my0.nodeId, "x");
      return { mx0, my0 };
    });

    // Iterate DEPTH times — each step gets its own frame so the recursion is
    // visually obvious instead of being a wall of math nodes.
    let mx: PrevRef = mx0;
    let my: PrevRef = my0;
    for (let i = 0; i < DEPTH; i++) {
      const next = b.frame(`Iter ${i + 1}`, "#8b5cf6", () =>
        magicIter(b, mx, my, mt, gi.distortion),
      );
      mx = next.mx;
      my = next.my;
    }

    // Combine + colourise: n = clamp(0.5 + 0.5*(sin(mx+my) + cos(mx−my))*0.5)
    const sumScaled = b.frame("Combine", "#f59e0b", () => {
      const mxPlus = b.add("math", { op: "add" });
      b.connect(mx, mxPlus.nodeId, "a");
      b.connect(my, mxPlus.nodeId, "b");
      const mxMinus = b.add("math", { op: "sub" });
      b.connect(mx, mxMinus.nodeId, "a");
      b.connect(my, mxMinus.nodeId, "b");
      const sinP = b.add("math", { op: "sin" });
      b.connect(mxPlus, sinP.nodeId, "x");
      const cosM = b.add("math", { op: "cos" });
      b.connect(mxMinus, cosM.nodeId, "x");
      const sumSC = b.add("math", { op: "add" });
      b.connect(sinP, sumSC.nodeId, "a");
      b.connect(cosM, sumSC.nodeId, "b");
      const sumScaled = b.add("map-range", {
        fromMin: -2, fromMax: 2, toMin: 0, toMax: 1, interp: "linear", clamp: true,
      });
      b.connect(sumSC, sumScaled.nodeId, "x");
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
