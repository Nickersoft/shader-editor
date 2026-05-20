// Stretch — graph-decomposed directional stretch.
//   d = uv − c;  dir = vec2(cos(a), sin(a))
//   proj = dot(d, dir);  perp = d − dir·proj
//   fall = smoothstep(falloff, 0, |proj|);  scale = 1 + strength · fall
//   finalUV = c + dir · (proj·scale) + perp

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Stretch",
  description: "Directional stretch with falloff",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class Stretch extends ProceduralEffect {
  static readonly typeId = "stretch";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "angle", type: "float", label: "Angle", default: 0 },
      { id: "strength", type: "float", label: "Strength", default: 0 },
      { id: "falloff", type: "float", label: "Falloff", default: 0.5 },
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    const c = b.add(new N.CombineXy());
    b.connect(gi.centerX).to(c, "x");
    b.connect(gi.centerY).to(c, "y");

    const deg2rad = b.add(new N.Const({ value: Math.PI / 180 }));
    const ar = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.angle).to(ar, "a");
    b.connect(deg2rad).to(ar, "b");

    const cosA = b.add(new N.Math({ op: "cos" }));
    b.connect(ar).to(cosA, "x");
    const sinA = b.add(new N.Math({ op: "sin" }));
    b.connect(ar).to(sinA, "x");
    const dir = b.add(new N.CombineXy());
    b.connect(cosA).to(dir, "x");
    b.connect(sinA).to(dir, "y");

    const d = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(d, "a");
    b.connect(c).to(d, "b");

    const proj = b.add(new N.VectorMath({ op: "dot" }));
    b.connect(d).to(proj, "a");
    b.connect(dir).to(proj, "b");

    // perp = d - dir * proj
    const dirProj = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(dir).to(dirProj, "a");
    b.connect(proj).to(dirProj, "b");
    const perp = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(d).to(perp, "a");
    b.connect(dirProj).to(perp, "b");

    // fall = smoothstep(falloff, 0, |proj|)   // reversed edges
    const absProj = b.add(new N.Math({ op: "abs" }));
    b.connect(proj).to(absProj, "x");
    const zero = b.add(new N.Const({ value: 0 }));
    const fall = b.add(new N.Smoothstep());
    b.connect(gi.falloff).to(fall, "edge0");
    b.connect(zero).to(fall, "edge1");
    b.connect(absProj).to(fall, "x");

    // scale = 1 + strength * fall
    const one = b.add(new N.Const({ value: 1 }));
    const strFall = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.strength).to(strFall, "a");
    b.connect(fall).to(strFall, "b");
    const scale = b.add(new N.Math({ op: "add" }));
    b.connect(one).to(scale, "a");
    b.connect(strFall).to(scale, "b");

    // newD = dir * (proj * scale) + perp
    const projScale = b.add(new N.Math({ op: "mul" }));
    b.connect(proj).to(projScale, "a");
    b.connect(scale).to(projScale, "b");
    const dirPS = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(dir).to(dirPS, "a");
    b.connect(projScale).to(dirPS, "b");
    const newD = b.add(new N.VectorMath({ op: "add" }));
    b.connect(dirPS).to(newD, "a");
    b.connect(perp).to(newD, "b");

    const finalUv = b.add(new N.VectorMath({ op: "add" }));
    b.connect(c).to(finalUv, "a");
    b.connect(newD).to(finalUv, "b");

    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(finalUv).to(sample, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(Stretch);
export default Stretch;
