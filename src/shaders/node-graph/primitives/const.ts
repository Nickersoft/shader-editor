// Const — a single user-editable float that becomes a uniform. Strictly
// speaking the plan inventory doesn't list this, but hand-authoring any
// non-trivial graph needs scalar literals (multiplying by 2π, 30, etc.) and
// `Combine` only accepts pins — so an explicit zero-input float-source node
// avoids forcing every constant through `GroupInput`, which would clutter the
// layer's property pane with editor-internal noise.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  value: zFloat(-1000, 1000).default(1),
});

type Config = z.infer<typeof config>;

const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Value" }];

export default registerPrimitive({
  typeId: "const",
  name: "Const",
  category: "sources",
  color: "#64748b",
  description: "A user-editable scalar literal.",
  config,

  inputs() {
    return [];
  },

  outputs() {
    return OUTPUTS;
  },

  uniforms(node) {
    const c = node.config as Config;
    return [{ nameSuffix: "value", type: "float", value: c.value } satisfies UniformSpec];
  },

  emit(ctx) {
    return { statements: `float ${ctx.outputs.out} = ${ctx.uniforms.value};` };
  },
});
