import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "grid",
  name: "Grid",
  description: "Orthogonal grid lines — Procedural Field preset",
  color: "#0ea5e9",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const gl = b.add("grid-lines", { scale: 10, lineWidth: 0.06, softness: 0.04 });
    b.connect(p, gl.nodeId, "p");
    const ramp = b.colorRamp(gl, [
      [1, 1, 1],
      [0, 0, 0],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
