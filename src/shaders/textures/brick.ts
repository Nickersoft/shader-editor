import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "brick",
  name: "Brick",
  description: "Running-bond brick pattern — Procedural Field preset",
  color: "#dc2626",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const br = b.add("brick-texture", {
      scale: 5,
      rowHeight: 0.5,
      brickWidth: 1,
      offset: 0.5,
      mortarSize: 0.05,
      bias: 0.5,
    });
    b.connect(p, br.nodeId, "p");
    const ramp = b.colorRamp(br, [
      [0.78, 0.34, 0.24],
      [0.18, 0.16, 0.15],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
