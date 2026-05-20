import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "God Rays",
  description: "Volumetric light rays",
  color: "#facc15",
  category: "textures",
  defaultBlendMode: "normal",
};

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
export class Godrays extends ProceduralShader {
  static readonly typeId = "godrays";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();

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

    const sep = b.add(new N.SeparateXy());
    b.connect(polar).to(sep, "v");
    const r = { nodeId: sep.nodeId, pin: "x" } as const;
    const a01 = { nodeId: sep.nodeId, pin: "y" } as const;

    // ── frequency: density × 30 + 1 ────────────────────────────────────────
    const { freq, freq25 } = b.frame("Frequency", "#10b981", () => {
      const dens30 = b.add(new N.Math({ op: "mul" }), { b: 30 });
      b.connect(gi.density).to(dens30, "a");

      const freq = b.add(new N.Math({ op: "add" }), { b: 1 });
      b.connect(dens30).to(freq, "a");

      const freq25 = b.add(new N.Math({ op: "mul" }), { b: 2.5 });
      b.connect(freq).to(freq25, "a");
      return { freq, freq25 };
    });

    // ── angle → (cos, sin) — closed circular path in noise space ──────────
    const { cos_arg, sin_arg } = b.frame("Angle → cos/sin", "#0ea5e9", () => {
      const ang_rad = b.add(new N.Math({ op: "mul" }), { b: 6.2831853 });
      b.connect(a01).to(ang_rad, "a");

      const cos_arg = b.add(new N.Math({ op: "cos" }));
      b.connect(ang_rad).to(cos_arg, "x");
      const sin_arg = b.add(new N.Math({ op: "sin" }));
      b.connect(ang_rad).to(sin_arg, "x");
      return { cos_arg, sin_arg };
    });

    // ── radial offsets — same as legacy ────────────────────────────────────
    const { n1y, n2y } = b.frame("Radial offsets", "#0ea5e9", () => {
      const r2 = b.add(new N.Math({ op: "mul" }), { b: 2 });
      b.connect(r).to(r2, "a");
      const t06 = b.add(new N.Math({ op: "mul" }), { b: 0.6 });
      b.connect(time).to(t06, "a");
      const n1y = b.add(new N.Math({ op: "sub" }));
      b.connect(r2).to(n1y, "a");
      b.connect(t06).to(n1y, "b");

      const r12 = b.add(new N.Math({ op: "mul" }), { b: 1.2 });
      b.connect(r).to(r12, "a");
      const t04 = b.add(new N.Math({ op: "mul" }), { b: 0.4 });
      b.connect(time).to(t04, "a");
      const n2y = b.add(new N.Math({ op: "sub" }));
      b.connect(r12).to(n2y, "a");
      b.connect(t04).to(n2y, "b");
      return { n1y, n2y };
    });

    // ── noise1: circle path scaled by `freq` + radial offset on y ──────────
    const n1 = b.frame("Noise 1", "#f59e0b", () => {
      const n1ux = b.add(new N.Math({ op: "mul" }));
      b.connect(cos_arg).to(n1ux, "a");
      b.connect(freq).to(n1ux, "b");
      const n1sy = b.add(new N.Math({ op: "mul" }));
      b.connect(sin_arg).to(n1sy, "a");
      b.connect(freq).to(n1sy, "b");
      const n1uy = b.add(new N.Math({ op: "add" }));
      b.connect(n1sy).to(n1uy, "a");
      b.connect(n1y).to(n1uy, "b");
      const n1uv = b.add(new N.CombineXy());
      b.connect(n1ux).to(n1uv, "x");
      b.connect(n1uy).to(n1uv, "y");
      const n1 = b.add(new N.NoiseTexture({ kind: "value", scale: 1, seed: 0 }));
      b.connect(n1uv).to(n1, "p");
      return n1;
    });

    // ── noise2: same trick at 2.5× the angular rate, decorrelated by seed ──
    const n2 = b.frame("Noise 2", "#f59e0b", () => {
      const n2ux = b.add(new N.Math({ op: "mul" }));
      b.connect(cos_arg).to(n2ux, "a");
      b.connect(freq25).to(n2ux, "b");
      const n2sy = b.add(new N.Math({ op: "mul" }));
      b.connect(sin_arg).to(n2sy, "a");
      b.connect(freq25).to(n2sy, "b");
      const n2uy = b.add(new N.Math({ op: "add" }));
      b.connect(n2sy).to(n2uy, "a");
      b.connect(n2y).to(n2uy, "b");
      const n2uv = b.add(new N.CombineXy());
      b.connect(n2ux).to(n2uv, "x");
      b.connect(n2uy).to(n2uv, "y");
      const n2 = b.add(new N.NoiseTexture({ kind: "value", scale: 1, seed: 17 }));
      b.connect(n2uv).to(n2, "p");
      return n2;
    });

    // ── np = n1 · n2, pow-curve by weight, modulate by decay ───────────────
    const pow1 = b.frame("Combine + weight", "#8b5cf6", () => {
      const np = b.add(new N.Math({ op: "mul" }));
      b.connect(n1).to(np, "a");
      b.connect(n2).to(np, "b");

      const np_clamp = b.add(new N.MapRange({
        fromMin: 0,
        fromMax: 1,
        toMin: 0,
        toMax: 1,
        interp: "linear",
        clamp: true,
      }));
      b.connect(np).to(np_clamp, "x");

      // Softened from legacy 4..1 → 2.5..0.4 so rays bleed instead of cutting.
      const wexp = b.add(new N.MapRange({
        fromMin: 0,
        fromMax: 1,
        toMin: 2.5,
        toMax: 0.4,
        interp: "linear",
        clamp: true,
      }));
      b.connect(gi.weight).to(wexp, "x");

      const pow1 = b.add(new N.Math({ op: "pow" }));
      b.connect(np_clamp).to(pow1, "a");
      b.connect(wexp).to(pow1, "b");
      return pow1;
    });

    // ── radial decay: exp(−r · decay) ──────────────────────────────────────
    const decf = b.frame("Radial decay", "#ec4899", () => {
      const rd = b.add(new N.Math({ op: "mul" }));
      b.connect(r).to(rd, "a");
      b.connect(gi.decay).to(rd, "b");
      const negrd = b.add(new N.Math({ op: "neg" }));
      b.connect(rd).to(negrd, "x");
      const decf = b.add(new N.Math({ op: "exp" }));
      b.connect(negrd).to(decf, "x");
      return decf;
    });

    // ── n = pow1 · decf → smoothstep into [0, 1] for the ramp ──────────────
    const nclamp = b.frame("Finalize", "#22d3ee", () => {
      const nfinal = b.add(new N.Math({ op: "mul" }));
      b.connect(pow1).to(nfinal, "a");
      b.connect(decf).to(nfinal, "b");

      const nclamp = b.add(new N.MapRange({
        fromMin: 0,
        fromMax: 0.5,
        toMin: 0,
        toMax: 1,
        interp: "smoothstep",
        clamp: true,
      }));
      b.connect(nfinal).to(nclamp, "x");
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
  }
}

register(Godrays);
export default Godrays;
