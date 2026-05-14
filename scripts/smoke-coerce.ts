// Coercion-matrix smoke test. Asserts that `coerce()` emits the expected
// GLSL for each documented transition and rejects pairs marked as
// incompatible. Runs as a standalone Bun script.

import { coerce } from "@/shaders/node-graph/coerce";
import type { PinSpec } from "@/shaders/node-graph";

interface Row {
  from: PinSpec;
  to: PinSpec;
  expected: string | null; // null = expected to reject
}

const pin = (type: PinSpec["type"], subtype?: PinSpec["subtype"]): PinSpec => ({
  id: "_",
  type,
  ...(subtype ? { subtype } : {}),
});

const X = "x"; // input expression placeholder

const rows: Row[] = [
  // Identity passes through unchanged.
  { from: pin("float"), to: pin("float"), expected: "x" },
  { from: pin("vec3", "color"), to: pin("vec3", "color"), expected: "x" },

  // Scalar broadcasts.
  { from: pin("float"), to: pin("vec2"), expected: "vec2(x)" },
  { from: pin("float"), to: pin("vec3"), expected: "vec3(x)" },
  { from: pin("float"), to: pin("vec4"), expected: "vec4(x)" },

  // Bool / int promotions.
  { from: pin("bool"), to: pin("float"), expected: "(x ? 1.0 : 0.0)" },
  { from: pin("bool"), to: pin("int"), expected: "(x ? 1 : 0)" },
  { from: pin("int"), to: pin("float"), expected: "float(x)" },

  // Vector promotions.
  { from: pin("vec2"), to: pin("vec3"), expected: "vec3(x, 0.0)" },
  { from: pin("vec3"), to: pin("vec4"), expected: "vec4(x, 1.0)" },
  { from: pin("vec4"), to: pin("vec3"), expected: "x.rgb" },

  // Vec3 collapse — subtype decides.
  {
    from: pin("vec3", "color"),
    to: pin("float"),
    expected: "dot(x, vec3(0.2126, 0.7152, 0.0722))",
  },
  { from: pin("vec3", "vector"), to: pin("float"), expected: "length(x)" },
  // Default subtype falls back to luminance.
  {
    from: pin("vec3"),
    to: pin("float"),
    expected: "dot(x, vec3(0.2126, 0.7152, 0.0722))",
  },

  // Explicit rejections.
  { from: pin("vec3"), to: pin("vec2"), expected: null },
  { from: pin("vec2"), to: pin("float"), expected: null },
  { from: pin("float"), to: pin("bool"), expected: null },
  { from: pin("vec3", "uv"), to: pin("float"), expected: null },
];

let pass = 0;
let fail = 0;
for (const row of rows) {
  const r = coerce(X, row.from, row.to);
  const label = `${row.from.type}${row.from.subtype ? ":" + row.from.subtype : ""} → ${row.to.type}${row.to.subtype ? ":" + row.to.subtype : ""}`;
  if (row.expected === null) {
    if (!r.ok) {
      console.log(`OK   ${label} → rejected`);
      pass++;
    } else {
      console.log(`FAIL ${label} → unexpectedly produced "${r.expr}"`);
      fail++;
    }
  } else {
    if (r.ok && r.expr === row.expected) {
      console.log(`OK   ${label} → ${r.expr}`);
      pass++;
    } else {
      console.log(`FAIL ${label} → expected "${row.expected}", got "${r.ok ? r.expr : "<rejected>"}"`);
      fail++;
    }
  }
}

console.log(`\n${pass}/${rows.length} cases ok, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
