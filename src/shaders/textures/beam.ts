import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

// Decomposed beam: angle pin → rotate-2D unit vector → dot with `p` → abs →
// smoothstep falloff. Users can swap the rotate2D step for a Const-driven
// vector to lock the beam, or wire the half-width to another signal (e.g. a
// Noise) to get a pulsing or wobbling beam.
export default {
  id: "beam",
  name: "Beam",
  description: "Directional light beam — Procedural Field preset",
  color: "#fde68a",
  graph: () => {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "angle", type: "float", label: "Angle (deg)", default: 0 },
      { id: "width", type: "float", label: "Width", default: 0.2 },
      { id: "softness", type: "float", label: "Softness", default: 0.3 },
    ]);

    const p = b.position();

    // angle (deg) → radians
    const deg2rad = b.add("const", { value: Math.PI / 180 });
    const rad = b.add("combine", { op: "mul" });
    b.connect(gi.angle, rad.nodeId, "a");
    b.connect(deg2rad, rad.nodeId, "b");

    // Beam normal = vec2(-sin(rad), cos(rad)). VectorMath.rotate2D applied to
    // (0, 1) by `rad` gives (-sin, cos), which is exactly the legacy normal.
    const upX = b.add("const", { value: 0 });
    const upY = b.add("const", { value: 1 });
    const up = b.add("combine-xy", {});
    b.connect(upX, up.nodeId, "x");
    b.connect(upY, up.nodeId, "y");
    const normal = b.add("vector-math", { op: "rotate2D" });
    b.connect(up, normal.nodeId, "a");
    b.connect(rad, normal.nodeId, "b");

    // Signed distance to the beam axis: dot(p, normal).
    const signed = b.add("vector-math", { op: "dot" });
    b.connect(p, signed.nodeId, "a");
    b.connect(normal, signed.nodeId, "b");
    const dist = b.add("math", { op: "abs" });
    b.connect(signed, dist.nodeId, "x");

    // Half-width and outer edge of the falloff band.
    const half = b.add("const", { value: 0.5 });
    const halfWidth = b.add("combine", { op: "mul" });
    b.connect(gi.width, halfWidth.nodeId, "a");
    b.connect(half, halfWidth.nodeId, "b");
    const halfSoft = b.add("combine", { op: "mul" });
    b.connect(gi.softness, halfSoft.nodeId, "a");
    b.connect(half, halfSoft.nodeId, "b");
    const outer = b.add("combine", { op: "add" });
    b.connect(halfWidth, outer.nodeId, "a");
    b.connect(halfSoft, outer.nodeId, "b");

    // mask = 1 - smoothstep(halfWidth, outer, dist).
    const ss = b.add("smoothstep", {});
    b.connect(halfWidth, ss.nodeId, "edge0");
    b.connect(outer, ss.nodeId, "edge1");
    b.connect(dist, ss.nodeId, "x");
    const mask = b.add("math", { op: "oneminus" });
    b.connect(ss, mask.nodeId, "x");

    const ramp = b.colorRamp(mask, [
      [0, 0, 0],
      [1, 0.5, 0.2],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
