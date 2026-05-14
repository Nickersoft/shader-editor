import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

/**
 * God Rays — radial sun-rays driven by two multiplied value-noise layers.
 *
 * Pipeline:
 *   Position → PolarTransform → SeparateXY → (r, a01)
 *   ang_rad = a01 × 2π                          (angle in radians)
 *   freq    = density × 30 + 1                  (rays per revolution)
 *   noise1.uv = (cos(ang)·freq,        sin(ang)·freq        + r·2  − t·0.6)
 *   noise2.uv = (cos(ang)·freq·2.5,    sin(ang)·freq·2.5    + r·1.2 − t·0.4)
 *   np      = value(noise1.uv) · value(noise2.uv)
 *   n       = pow(np, wexp) · exp(−r · decay)   with wexp = mix(2.5, 0.4, weight)
 *   color   = ramp(smoothstep(n, 0, 0.5))       dark gold → bright gold
 *   alpha   = exp(−r · decay)                   vignette only
 *
 * The angular noise input is `(cos(ang)·freq, sin(ang)·freq + radial)` — a
 * circle in noise space — instead of the legacy `(ang·freq, radial)` line, so
 * the radial seam on the −x axis is gone. Alpha is the radial decay alone,
 * so the layer reads as a continuous gold field fading at the edges.
 */
export default {
  id: "godrays",
  name: "God Rays",
  description: "Volumetric light rays — Procedural Field preset",
  color: "#facc15",
  graph: () => {
    const b = new PresetGraphBuilder();

    const gi = b.groupInput([
      { id: "center", type: "vec2", label: "Center", default: [0, 0] },
      { id: "density", type: "float", label: "Density", default: 0.3 },
      { id: "decay", type: "float", label: "Decay", default: 0.6 },
      { id: "weight", type: "float", label: "Weight", default: 0.8 },
    ]);

    const pos = b.position();
    const time = b.time();

    // ── polar coords ───────────────────────────────────────────────────────
    const polar = b.polarTransform(pos, gi.center);

    const sep = b.add("separate-xy", {});
    b.connect(polar, sep.nodeId, "v");
    const r = { nodeId: sep.nodeId, pin: "x" } as const;
    const a01 = { nodeId: sep.nodeId, pin: "y" } as const;

    // ── frequency: density × 30 + 1 ────────────────────────────────────────
    const { freq, freq25 } = b.frame("Frequency", "#10b981", () => {
      const dens30 = b.add("math", { op: "mul" }, { b: 30 });
      b.connect(gi.density, dens30.nodeId, "a");

      const freq = b.add("math", { op: "add" }, { b: 1 });
      b.connect(dens30, freq.nodeId, "a");

      const freq25 = b.add("math", { op: "mul" }, { b: 2.5 });
      b.connect(freq, freq25.nodeId, "a");
      return { freq, freq25 };
    });

    // ── angle → (cos, sin) — closed circular path in noise space ──────────
    const { cos_arg, sin_arg } = b.frame("Angle → cos/sin", "#0ea5e9", () => {
      const ang_rad = b.add("math", { op: "mul" }, { b: 6.2831853 });
      b.connect(a01, ang_rad.nodeId, "a");

      const cos_arg = b.add("math", { op: "cos" });
      b.connect(ang_rad, cos_arg.nodeId, "x");
      const sin_arg = b.add("math", { op: "sin" });
      b.connect(ang_rad, sin_arg.nodeId, "x");
      return { cos_arg, sin_arg };
    });

    // ── radial offsets — same as legacy ────────────────────────────────────
    const { n1y, n2y } = b.frame("Radial offsets", "#0ea5e9", () => {
      const r2 = b.add("math", { op: "mul" }, { b: 2 });
      b.connect(r, r2.nodeId, "a");
      const t06 = b.add("math", { op: "mul" }, { b: 0.6 });
      b.connect(time, t06.nodeId, "a");
      const n1y = b.add("math", { op: "sub" });
      b.connect(r2, n1y.nodeId, "a");
      b.connect(t06, n1y.nodeId, "b");

      const r12 = b.add("math", { op: "mul" }, { b: 1.2 });
      b.connect(r, r12.nodeId, "a");
      const t04 = b.add("math", { op: "mul" }, { b: 0.4 });
      b.connect(time, t04.nodeId, "a");
      const n2y = b.add("math", { op: "sub" });
      b.connect(r12, n2y.nodeId, "a");
      b.connect(t04, n2y.nodeId, "b");
      return { n1y, n2y };
    });

    // ── noise1: circle path scaled by `freq` + radial offset on y ──────────
    const n1 = b.frame("Noise 1", "#f59e0b", () => {
      const n1ux = b.add("math", { op: "mul" });
      b.connect(cos_arg, n1ux.nodeId, "a");
      b.connect(freq, n1ux.nodeId, "b");
      const n1sy = b.add("math", { op: "mul" });
      b.connect(sin_arg, n1sy.nodeId, "a");
      b.connect(freq, n1sy.nodeId, "b");
      const n1uy = b.add("math", { op: "add" });
      b.connect(n1sy, n1uy.nodeId, "a");
      b.connect(n1y, n1uy.nodeId, "b");
      const n1uv = b.add("combine-xy", {});
      b.connect(n1ux, n1uv.nodeId, "x");
      b.connect(n1uy, n1uv.nodeId, "y");
      const n1 = b.add("noise-texture", { kind: "value", scale: 1, seed: 0 });
      b.connect(n1uv, n1.nodeId, "p");
      return n1;
    });

    // ── noise2: same trick at 2.5× the angular rate, decorrelated by seed ──
    const n2 = b.frame("Noise 2", "#f59e0b", () => {
      const n2ux = b.add("math", { op: "mul" });
      b.connect(cos_arg, n2ux.nodeId, "a");
      b.connect(freq25, n2ux.nodeId, "b");
      const n2sy = b.add("math", { op: "mul" });
      b.connect(sin_arg, n2sy.nodeId, "a");
      b.connect(freq25, n2sy.nodeId, "b");
      const n2uy = b.add("math", { op: "add" });
      b.connect(n2sy, n2uy.nodeId, "a");
      b.connect(n2y, n2uy.nodeId, "b");
      const n2uv = b.add("combine-xy", {});
      b.connect(n2ux, n2uv.nodeId, "x");
      b.connect(n2uy, n2uv.nodeId, "y");
      const n2 = b.add("noise-texture", { kind: "value", scale: 1, seed: 17 });
      b.connect(n2uv, n2.nodeId, "p");
      return n2;
    });

    // ── np = n1 · n2, pow-curve by weight, modulate by decay ───────────────
    const pow1 = b.frame("Combine + weight", "#8b5cf6", () => {
      const np = b.add("math", { op: "mul" });
      b.connect(n1, np.nodeId, "a");
      b.connect(n2, np.nodeId, "b");

      const np_clamp = b.add("map-range", {
        fromMin: 0,
        fromMax: 1,
        toMin: 0,
        toMax: 1,
        interp: "linear",
        clamp: true,
      });
      b.connect(np, np_clamp.nodeId, "x");

      // Softened from legacy 4..1 → 2.5..0.4 so rays bleed instead of cutting.
      const wexp = b.add("map-range", {
        fromMin: 0,
        fromMax: 1,
        toMin: 2.5,
        toMax: 0.4,
        interp: "linear",
        clamp: true,
      });
      b.connect(gi.weight, wexp.nodeId, "x");

      const pow1 = b.add("math", { op: "pow" });
      b.connect(np_clamp, pow1.nodeId, "a");
      b.connect(wexp, pow1.nodeId, "b");
      return pow1;
    });

    // ── radial decay: exp(−r · decay) ──────────────────────────────────────
    const decf = b.frame("Radial decay", "#ec4899", () => {
      const rd = b.add("math", { op: "mul" });
      b.connect(r, rd.nodeId, "a");
      b.connect(gi.decay, rd.nodeId, "b");
      const negrd = b.add("math", { op: "neg" });
      b.connect(rd, negrd.nodeId, "x");
      const decf = b.add("math", { op: "exp" });
      b.connect(negrd, decf.nodeId, "x");
      return decf;
    });

    // ── n = pow1 · decf → smoothstep into [0, 1] for the ramp ──────────────
    const nclamp = b.frame("Finalize", "#22d3ee", () => {
      const nfinal = b.add("math", { op: "mul" });
      b.connect(pow1, nfinal.nodeId, "a");
      b.connect(decf, nfinal.nodeId, "b");

      const nclamp = b.add("map-range", {
        fromMin: 0,
        fromMax: 0.5,
        toMin: 0,
        toMax: 1,
        interp: "smoothstep",
        clamp: true,
      });
      b.connect(nfinal, nclamp.nodeId, "x");
      return nclamp;
    });

    // Dark warm gold → bright sun gold. Ray peaks read as bright streaks,
    // the field between them as a muted warm field.
    const ramp = b.colorRamp(nclamp, [
      [0.32, 0.26, 0.12],
      [1, 0.95, 0.7],
    ]);

    // Alpha is the vignette alone — opaque centre, soft fade to the edges.
    return b.output(ramp, decf);
  },
} satisfies ProceduralPreset;
