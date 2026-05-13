import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder, type PrevRef } from "./preset-graphs/builders";

// Decomposed Magic Texture. Each recursion step transforms (mx, my) → (mx',
// my'), where mx' = sin(mx*my + t), my' = cos(mx' + my + t), then both are
// scaled by `distortion`. `depth` is structural (chosen at preset-author
// time, default 2) so the iteration unrolls into the graph; users can swap
// the sin/cos with other Math ops to change the texture character entirely.
const DEPTH = 2;

function magicIter(
  b: PresetGraphBuilder,
  mx: PrevRef,
  my: PrevRef,
  t: PrevRef,
  dist: PrevRef,
): { mx: PrevRef; my: PrevRef } {
  // mx_new = sin(mx * my + t)
  const mxMy = b.add("combine", { op: "mul" });
  b.connect(mx, mxMy.nodeId, "a");
  b.connect(my, mxMy.nodeId, "b");
  const mxArg = b.add("combine", { op: "add" });
  b.connect(mxMy, mxArg.nodeId, "a");
  b.connect(t, mxArg.nodeId, "b");
  const mxSin = b.add("math", { op: "sin" });
  b.connect(mxArg, mxSin.nodeId, "x");
  // my_new = cos(mx_new + my + t)
  const sumA = b.add("combine", { op: "add" });
  b.connect(mxSin, sumA.nodeId, "a");
  b.connect(my, sumA.nodeId, "b");
  const myArg = b.add("combine", { op: "add" });
  b.connect(sumA, myArg.nodeId, "a");
  b.connect(t, myArg.nodeId, "b");
  const myCos = b.add("math", { op: "cos" });
  b.connect(myArg, myCos.nodeId, "x");
  // Both scaled by distortion
  const mxD = b.add("combine", { op: "mul" });
  b.connect(mxSin, mxD.nodeId, "a");
  b.connect(dist, mxD.nodeId, "b");
  const myD = b.add("combine", { op: "mul" });
  b.connect(myCos, myD.nodeId, "a");
  b.connect(dist, myD.nodeId, "b");
  return { mx: mxD, my: myD };
}

export default {
  id: "magic",
  name: "Magic",
  description: "Recursive sin/cos swirl — Procedural Field preset",
  color: "#a78bfa",
  graph: () => {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "scale", type: "float", label: "Scale", default: 3 },
      { id: "distortion", type: "float", label: "Distortion", default: 1 },
    ]);
    const pPos = b.position();
    const tIn = b.time();

    // mp = p * scale
    const mp = b.add("vector-math", { op: "scale" });
    b.connect(pPos, mp.nodeId, "a");
    b.connect(gi.scale, mp.nodeId, "b");
    const sepP = b.add("separate-xy", {});
    b.connect(mp, sepP.nodeId, "v");
    const mpx: PrevRef = { nodeId: sepP.nodeId, pin: "x" };
    const mpy: PrevRef = { nodeId: sepP.nodeId, pin: "y" };

    // mt = t * 0.5
    const half = b.add("const", { value: 0.5 });
    const mt = b.add("combine", { op: "mul" });
    b.connect(tIn, mt.nodeId, "a");
    b.connect(half, mt.nodeId, "b");

    // mx0 = sin((mp.x + mp.y) * 5 + mt)
    const k5 = b.add("const", { value: 5 });
    const pxPy = b.add("combine", { op: "add" });
    b.connect(mpx, pxPy.nodeId, "a");
    b.connect(mpy, pxPy.nodeId, "b");
    const pxPy5 = b.add("combine", { op: "mul" });
    b.connect(pxPy, pxPy5.nodeId, "a");
    b.connect(k5, pxPy5.nodeId, "b");
    const mx0Arg = b.add("combine", { op: "add" });
    b.connect(pxPy5, mx0Arg.nodeId, "a");
    b.connect(mt, mx0Arg.nodeId, "b");
    const mx0 = b.add("math", { op: "sin" });
    b.connect(mx0Arg, mx0.nodeId, "x");

    // my0 = cos((mp.x - mp.y) * 5 - mt)
    const pxMpy = b.add("combine", { op: "sub" });
    b.connect(mpx, pxMpy.nodeId, "a");
    b.connect(mpy, pxMpy.nodeId, "b");
    const pxMpy5 = b.add("combine", { op: "mul" });
    b.connect(pxMpy, pxMpy5.nodeId, "a");
    b.connect(k5, pxMpy5.nodeId, "b");
    const my0Arg = b.add("combine", { op: "sub" });
    b.connect(pxMpy5, my0Arg.nodeId, "a");
    b.connect(mt, my0Arg.nodeId, "b");
    const my0 = b.add("math", { op: "cos" });
    b.connect(my0Arg, my0.nodeId, "x");

    // Iterate DEPTH times
    let mx: PrevRef = mx0;
    let my: PrevRef = my0;
    for (let i = 0; i < DEPTH; i++) {
      const next = magicIter(b, mx, my, mt, gi.distortion);
      mx = next.mx;
      my = next.my;
    }

    // n = clamp(0.5 + 0.5 * (sin(mx + my) + cos(mx - my)) * 0.5, 0, 1)
    const mxPlus = b.add("combine", { op: "add" });
    b.connect(mx, mxPlus.nodeId, "a");
    b.connect(my, mxPlus.nodeId, "b");
    const mxMinus = b.add("combine", { op: "sub" });
    b.connect(mx, mxMinus.nodeId, "a");
    b.connect(my, mxMinus.nodeId, "b");
    const sinP = b.add("math", { op: "sin" });
    b.connect(mxPlus, sinP.nodeId, "x");
    const cosM = b.add("math", { op: "cos" });
    b.connect(mxMinus, cosM.nodeId, "x");
    const sumSC = b.add("combine", { op: "add" });
    b.connect(sinP, sumSC.nodeId, "a");
    b.connect(cosM, sumSC.nodeId, "b");
    const sumScaled = b.add("map-range", {
      fromMin: -2, fromMax: 2, toMin: 0, toMax: 1, interp: "linear", clamp: true,
    });
    b.connect(sumSC, sumScaled.nodeId, "x");

    const ramp = b.colorRamp(sumScaled, [
      [0.95, 0.27, 0.42],
      [0.99, 0.62, 0.16],
      [0.42, 0.09, 0.9],
      [0.07, 0.46, 0.85],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
