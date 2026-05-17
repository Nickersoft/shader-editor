// ConcentricSpin — graph-decomposed. Each ring rotates by an angle made
// from a deterministic hash of the ring index plus an animated component.
// The seam between adjacent rings is hidden by a smoothstep crossfade of
// the two neighbouring rings' total angles.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder, type PrevRef } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Concentric Spin",
  description: "Concentric rings rotating at different rates",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class ConcentricSpin extends ProceduralEffect {
  static readonly typeId = "concentric-spin";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
      { id: "rings", type: "float", label: "Rings", default: 8 },
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "speed", type: "float", label: "Speed", default: 0.5 },
      { id: "speedRandomness", type: "float", label: "Speed Randomness", default: 0.5 },
      { id: "seed", type: "float", label: "Seed", default: 0 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const t = b.add("time", {}, undefined, "out");

    // d = uv − centre (Y flipped is original convention; keep it as plain
    // sub to match a coherent centred coordinate)
    const centre = b.add("combine-xy", {});
    b.connect(gi.centerX, centre.nodeId, "x");
    b.connect(gi.centerY, centre.nodeId, "y");
    const d = b.add("vector-math", { op: "sub" });
    b.connect(uv, d.nodeId, "a");
    b.connect(centre, d.nodeId, "b");

    // ringCoord = length(d) · rings
    const rLen = b.add("vector-math", { op: "length" });
    b.connect(d, rLen.nodeId, "a");
    const ringCoord = b.add("math", { op: "mul" });
    b.connect(rLen, ringCoord.nodeId, "a");
    b.connect(gi.rings, ringCoord.nodeId, "b");

    const ringIdx = b.add("math", { op: "floor" });
    b.connect(ringCoord, ringIdx.nodeId, "x");
    const ringFr = b.add("math", { op: "fract" });
    b.connect(ringCoord, ringFr.nodeId, "x");

    // Helper: a deterministic float hash from a float key in [−maxAngle,
    // +maxAngle]. Built from white-noise-texture using vec2(key, 0).
    const hash = (key: PrevRef): PrevRef => {
      const v = b.add("combine-xy", {}, { y: 0 });
      b.connect(key, v.nodeId, "x");
      const h = b.add("white-noise-texture", {});
      b.connect(v, h.nodeId, "p");
      // remap to [-1, 1]
      const h5 = b.add("math", { op: "sub" }, { b: 0.5 });
      b.connect(h, h5.nodeId, "a");
      const h2 = b.add("math", { op: "mul" }, { b: 2 });
      b.connect(h5, h2.nodeId, "a");
      return h2;
    };

    const maxAngle = b.add("math", { op: "mul" }, { b: 1.5708 });
    b.connect(gi.intensity, maxAngle.nodeId, "a");

    const seedOff = b.add("math", { op: "mul" }, { b: 13.7 });
    b.connect(gi.seed, seedOff.nodeId, "a");

    // staticA = hash(ringIdx + seedOff) · maxAngle
    const keyA = b.add("math", { op: "add" });
    b.connect(ringIdx, keyA.nodeId, "a");
    b.connect(seedOff, keyA.nodeId, "b");
    const hA = hash(keyA);
    const staticA = b.add("math", { op: "mul" });
    b.connect(hA, staticA.nodeId, "a");
    b.connect(maxAngle, staticA.nodeId, "b");

    // staticB = hash(ringIdx + 1 + seedOff) · maxAngle
    const keyB1 = b.add("math", { op: "add" });
    b.connect(ringIdx, keyB1.nodeId, "a");
    b.connect(b.add("value", { value: 1 }), keyB1.nodeId, "b");
    const keyB = b.add("math", { op: "add" });
    b.connect(keyB1, keyB.nodeId, "a");
    b.connect(seedOff, keyB.nodeId, "b");
    const hB = hash(keyB);
    const staticB = b.add("math", { op: "mul" });
    b.connect(hB, staticB.nodeId, "a");
    b.connect(maxAngle, staticB.nodeId, "b");

    // ringSpeedA = mix(1, hash(ringIdx + 42.7), speedRandomness)
    const keySA = b.add("math", { op: "add" }, { b: 42.7 });
    b.connect(ringIdx, keySA.nodeId, "a");
    const hSA = hash(keySA);
    const rSpeedA = b.add("math", { op: "mix" }, { a: 1 });
    b.connect(hSA, rSpeedA.nodeId, "b");
    b.connect(gi.speedRandomness, rSpeedA.nodeId, "c");

    const keySB1 = b.add("math", { op: "add" });
    b.connect(ringIdx, keySB1.nodeId, "a");
    b.connect(b.add("value", { value: 1 }), keySB1.nodeId, "b");
    const keySB = b.add("math", { op: "add" }, { b: 42.7 });
    b.connect(keySB1, keySB.nodeId, "a");
    const hSB = hash(keySB);
    const rSpeedB = b.add("math", { op: "mix" }, { a: 1 });
    b.connect(hSB, rSpeedB.nodeId, "b");
    b.connect(gi.speedRandomness, rSpeedB.nodeId, "c");

    // animA = t · speed · 0.25 · ringSpeedA
    const tSpeed = b.add("math", { op: "mul" });
    b.connect(t, tSpeed.nodeId, "a");
    b.connect(gi.speed, tSpeed.nodeId, "b");
    const tSpeed25 = b.add("math", { op: "mul" }, { b: 0.25 });
    b.connect(tSpeed, tSpeed25.nodeId, "a");
    const animA = b.add("math", { op: "mul" });
    b.connect(tSpeed25, animA.nodeId, "a");
    b.connect(rSpeedA, animA.nodeId, "b");
    const animB = b.add("math", { op: "mul" });
    b.connect(tSpeed25, animB.nodeId, "a");
    b.connect(rSpeedB, animB.nodeId, "b");

    const totalA = b.add("math", { op: "add" });
    b.connect(staticA, totalA.nodeId, "a");
    b.connect(animA, totalA.nodeId, "b");
    const totalB = b.add("math", { op: "add" });
    b.connect(staticB, totalB.nodeId, "a");
    b.connect(animB, totalB.nodeId, "b");

    // angle = mix(totalA, totalB, smoothstep(0.49, 0.51, ringFr))
    const blend = b.add("smoothstep", {}, { edge0: 0.49, edge1: 0.51 });
    b.connect(ringFr, blend.nodeId, "x");
    const angle = b.add("math", { op: "mix" });
    b.connect(totalA, angle.nodeId, "a");
    b.connect(totalB, angle.nodeId, "b");
    b.connect(blend, angle.nodeId, "c");

    // rotated = rotate2D(d, angle); finalUV = centre + rotated
    const rotated = b.add("vector-math", { op: "rotate-2d" });
    b.connect(d, rotated.nodeId, "a");
    b.connect(angle, rotated.nodeId, "b");
    const finalUv = b.add("vector-math", { op: "add" });
    b.connect(centre, finalUv.nodeId, "a");
    b.connect(rotated, finalUv.nodeId, "b");

    const sample = b.add("sample-previous-pass", { edges: "mirror" });
    b.connect(finalUv, sample.nodeId, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(ConcentricSpin);
export default ConcentricSpin;
