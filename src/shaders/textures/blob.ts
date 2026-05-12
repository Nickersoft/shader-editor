import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "blob",
  name: "Blob",
  description: "Animated organic blob — Procedural Field preset",
  color: "#ff6b35",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const bl = b.add("blob", {});
    const bg = b.add("const", { value: 0 });
    const black = b.add("combine-xy", {});
    b.connect(bg, black.nodeId, "x");
    b.connect(bg, black.nodeId, "y");
    // Pure-black background as vec3 via gradient-texture with type=linear at
    // p=0 then ramp — but simpler: feed bl's color through MixColor against
    // a vec3 zero. ColorRamp [black, black] does that with `t` ignored.
    const blackRamp = b.colorRamp(bg, [
      [0, 0, 0],
      [0, 0, 0],
    ]);
    void black; // CombineXY would build vec2 zero; unused now.
    const mix = b.add("mix-color", {});
    b.connect(blackRamp, mix.nodeId, "a");
    b.connect({ nodeId: bl.nodeId, pin: "color" }, mix.nodeId, "b");
    b.connect({ nodeId: bl.nodeId, pin: "alpha" }, mix.nodeId, "t");
    return b.output(mix);
  },
} satisfies ProceduralPreset;
