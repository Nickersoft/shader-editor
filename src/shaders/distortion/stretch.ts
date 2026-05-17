// Stretch — graph-decomposed directional stretch.
//   d = uv − c;  dir = vec2(cos(a), sin(a))
//   proj = dot(d, dir);  perp = d − dir·proj
//   fall = smoothstep(falloff, 0, |proj|);  scale = 1 + strength · fall
//   finalUV = c + dir · (proj·scale) + perp

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");

    const c = b.add("combine-xy", {});
    b.connect(gi.centerX, c.nodeId, "x");
    b.connect(gi.centerY, c.nodeId, "y");

    const deg2rad = b.add("value", { value: Math.PI / 180 });
    const ar = b.add("math", { op: "mul" });
    b.connect(gi.angle, ar.nodeId, "a");
    b.connect(deg2rad, ar.nodeId, "b");

    const cosA = b.add("math", { op: "cos" });
    b.connect(ar, cosA.nodeId, "x");
    const sinA = b.add("math", { op: "sin" });
    b.connect(ar, sinA.nodeId, "x");
    const dir = b.add("combine-xy", {});
    b.connect(cosA, dir.nodeId, "x");
    b.connect(sinA, dir.nodeId, "y");

    const d = b.add("vector-math", { op: "sub" });
    b.connect(uv, d.nodeId, "a");
    b.connect(c, d.nodeId, "b");

    const proj = b.add("vector-math", { op: "dot" });
    b.connect(d, proj.nodeId, "a");
    b.connect(dir, proj.nodeId, "b");

    // perp = d - dir * proj
    const dirProj = b.add("vector-math", { op: "scale" });
    b.connect(dir, dirProj.nodeId, "a");
    b.connect(proj, dirProj.nodeId, "b");
    const perp = b.add("vector-math", { op: "sub" });
    b.connect(d, perp.nodeId, "a");
    b.connect(dirProj, perp.nodeId, "b");

    // fall = smoothstep(falloff, 0, |proj|)   // reversed edges
    const absProj = b.add("math", { op: "abs" });
    b.connect(proj, absProj.nodeId, "x");
    const zero = b.add("value", { value: 0 });
    const fall = b.add("smoothstep", {});
    b.connect(gi.falloff, fall.nodeId, "edge0");
    b.connect(zero, fall.nodeId, "edge1");
    b.connect(absProj, fall.nodeId, "x");

    // scale = 1 + strength * fall
    const one = b.add("value", { value: 1 });
    const strFall = b.add("math", { op: "mul" });
    b.connect(gi.strength, strFall.nodeId, "a");
    b.connect(fall, strFall.nodeId, "b");
    const scale = b.add("math", { op: "add" });
    b.connect(one, scale.nodeId, "a");
    b.connect(strFall, scale.nodeId, "b");

    // newD = dir * (proj * scale) + perp
    const projScale = b.add("math", { op: "mul" });
    b.connect(proj, projScale.nodeId, "a");
    b.connect(scale, projScale.nodeId, "b");
    const dirPS = b.add("vector-math", { op: "scale" });
    b.connect(dir, dirPS.nodeId, "a");
    b.connect(projScale, dirPS.nodeId, "b");
    const newD = b.add("vector-math", { op: "add" });
    b.connect(dirPS, newD.nodeId, "a");
    b.connect(perp, newD.nodeId, "b");

    const finalUv = b.add("vector-math", { op: "add" });
    b.connect(c, finalUv.nodeId, "a");
    b.connect(newD, finalUv.nodeId, "b");

    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(finalUv, sample.nodeId, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(Stretch);
export default Stretch;
