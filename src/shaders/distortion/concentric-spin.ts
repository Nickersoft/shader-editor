// ConcentricSpin — graph-decomposed. Each ring rotates by an angle made
// from a deterministic hash of the ring index plus an animated component.
// The seam between adjacent rings is hidden by a smoothstep crossfade of
// the two neighbouring rings' total angles.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder, type NodeHandle } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
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

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const t = b.add(new N.Time(), undefined, "out");

    // d = uv − centre (Y flipped is original convention; keep it as plain
    // sub to match a coherent centred coordinate)
    const centre = b.add(new N.CombineXy());
    b.connect(gi.centerX).to(centre, "x");
    b.connect(gi.centerY).to(centre, "y");
    const d = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(d, "a");
    b.connect(centre).to(d, "b");

    // ringCoord = length(d) · rings
    const rLen = b.add(new N.VectorMath({ op: "length" }));
    b.connect(d).to(rLen, "a");
    const ringCoord = b.add(new N.Math({ op: "mul" }));
    b.connect(rLen).to(ringCoord, "a");
    b.connect(gi.rings).to(ringCoord, "b");

    const ringIdx = b.add(new N.Math({ op: "floor" }));
    b.connect(ringCoord).to(ringIdx, "x");
    const ringFr = b.add(new N.Math({ op: "fract" }));
    b.connect(ringCoord).to(ringFr, "x");

    // Helper: a deterministic float hash from a float key in [−maxAngle,
    // +maxAngle]. Built from white-noise-texture using vec2(key, 0).
    const hash = (key: NodeHandle): NodeHandle => {
      const v = b.add(new N.CombineXy(), { y: 0 });
      b.connect(key).to(v, "x");
      const h = b.add(new N.Hash());
      b.connect(v).to(h, "p");
      // remap to [-1, 1]
      const h5 = b.add(new N.Math({ op: "sub" }), { b: 0.5 });
      b.connect(h).to(h5, "a");
      const h2 = b.add(new N.Math({ op: "mul" }), { b: 2 });
      b.connect(h5).to(h2, "a");
      return h2;
    };

    const maxAngle = b.add(new N.Math({ op: "mul" }), { b: 1.5708 });
    b.connect(gi.intensity).to(maxAngle, "a");

    const seedOff = b.add(new N.Math({ op: "mul" }), { b: 13.7 });
    b.connect(gi.seed).to(seedOff, "a");

    // staticA = hash(ringIdx + seedOff) · maxAngle
    const keyA = b.add(new N.Math({ op: "add" }));
    b.connect(ringIdx).to(keyA, "a");
    b.connect(seedOff).to(keyA, "b");
    const hA = hash(keyA);
    const staticA = b.add(new N.Math({ op: "mul" }));
    b.connect(hA).to(staticA, "a");
    b.connect(maxAngle).to(staticA, "b");

    // staticB = hash(ringIdx + 1 + seedOff) · maxAngle
    const keyB1 = b.add(new N.Math({ op: "add" }));
    b.connect(ringIdx).to(keyB1, "a");
    b.connect(b.add(new N.Const({ value: 1 }))).to(keyB1, "b");
    const keyB = b.add(new N.Math({ op: "add" }));
    b.connect(keyB1).to(keyB, "a");
    b.connect(seedOff).to(keyB, "b");
    const hB = hash(keyB);
    const staticB = b.add(new N.Math({ op: "mul" }));
    b.connect(hB).to(staticB, "a");
    b.connect(maxAngle).to(staticB, "b");

    // ringSpeedA = mix(1, hash(ringIdx + 42.7), speedRandomness)
    const keySA = b.add(new N.Math({ op: "add" }), { b: 42.7 });
    b.connect(ringIdx).to(keySA, "a");
    const hSA = hash(keySA);
    const rSpeedA = b.add(new N.Math({ op: "mix" }), { a: 1 });
    b.connect(hSA).to(rSpeedA, "b");
    b.connect(gi.speedRandomness).to(rSpeedA, "c");

    const keySB1 = b.add(new N.Math({ op: "add" }));
    b.connect(ringIdx).to(keySB1, "a");
    b.connect(b.add(new N.Const({ value: 1 }))).to(keySB1, "b");
    const keySB = b.add(new N.Math({ op: "add" }), { b: 42.7 });
    b.connect(keySB1).to(keySB, "a");
    const hSB = hash(keySB);
    const rSpeedB = b.add(new N.Math({ op: "mix" }), { a: 1 });
    b.connect(hSB).to(rSpeedB, "b");
    b.connect(gi.speedRandomness).to(rSpeedB, "c");

    // animA = t · speed · 0.25 · ringSpeedA
    const tSpeed = b.add(new N.Math({ op: "mul" }));
    b.connect(t).to(tSpeed, "a");
    b.connect(gi.speed).to(tSpeed, "b");
    const tSpeed25 = b.add(new N.Math({ op: "mul" }), { b: 0.25 });
    b.connect(tSpeed).to(tSpeed25, "a");
    const animA = b.add(new N.Math({ op: "mul" }));
    b.connect(tSpeed25).to(animA, "a");
    b.connect(rSpeedA).to(animA, "b");
    const animB = b.add(new N.Math({ op: "mul" }));
    b.connect(tSpeed25).to(animB, "a");
    b.connect(rSpeedB).to(animB, "b");

    const totalA = b.add(new N.Math({ op: "add" }));
    b.connect(staticA).to(totalA, "a");
    b.connect(animA).to(totalA, "b");
    const totalB = b.add(new N.Math({ op: "add" }));
    b.connect(staticB).to(totalB, "a");
    b.connect(animB).to(totalB, "b");

    // angle = mix(totalA, totalB, smoothstep(0.49, 0.51, ringFr))
    const blend = b.add(new N.Smoothstep(), { edge0: 0.49, edge1: 0.51 });
    b.connect(ringFr).to(blend, "x");
    const angle = b.add(new N.Math({ op: "mix" }));
    b.connect(totalA).to(angle, "a");
    b.connect(totalB).to(angle, "b");
    b.connect(blend).to(angle, "c");

    // rotated = rotate2D(d, angle); finalUV = centre + rotated
    const rotated = b.add(new N.VectorMath({ op: "rotate-2d" }));
    b.connect(d).to(rotated, "a");
    b.connect(angle).to(rotated, "b");
    const finalUv = b.add(new N.VectorMath({ op: "add" }));
    b.connect(centre).to(finalUv, "a");
    b.connect(rotated).to(finalUv, "b");

    const sample = b.add(new N.SamplePreviousPass({ edges: "mirror" }));
    b.connect(finalUv).to(sample, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(ConcentricSpin);
export default ConcentricSpin;
