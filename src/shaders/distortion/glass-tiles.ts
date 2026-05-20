// GlassTiles — graph-decomposed refraction-like tile distortion.
//   aspect = u_resolution.x / u_resolution.y
//   tileC  = aspect > 1 ? (count, count/aspect) : (count·aspect, count)
//   aspectUV = (uv.x · aspect, uv.y)
//   centered = aspectUV − (0.5·aspect, 0.5)
//   rotated = rotate2D(centered, rotation·π/180) + (0.5·aspect, 0.5)
//   gridUV = (rotated.x / aspect, rotated.y)
//   tileSize = 1 / tileC;  tileOrigin = floor(gridUV · tileC) / tileC
//   fromCenter = (gridUV − tileOrigin) / tileSize − 0.5
//   roundMask = max(0, 1 − dot(fromCenter, fromCenter) · roundness · 4)
//   baseDist = fromCenter · intensity · 0.025 · roundMask
//   finalUV = uv + (baseDist.x / aspect, baseDist.y)
//
// The aspect-branch picks tileC so tiles stay square regardless of orientation;
// the graph encodes both branches and `mix`es by step(1, aspect).

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Glass Tiles",
  description: "Refraction-like distortion in a tile grid pattern",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class GlassTiles extends ProceduralEffect {
  static readonly typeId = "glass-tiles";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "tileCount", type: "float", label: "Tile Count", default: 8 },
      { id: "rotation", type: "float", label: "Rotation", default: 0 },
      { id: "roundness", type: "float", label: "Roundness", default: 0.5 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const res = b.add(new N.Resolution(), undefined, "out");
    const splitRes = b.add(new N.SeparateXy());
    b.connect(res).to(splitRes, "v");
    const aspect = b.add(new N.Math({ op: "div" }));
    b.connect(splitRes, "x").to(aspect, "a");
    b.connect(splitRes, "y").to(aspect, "b");

    // Two candidate tileC values, blended on step(1, aspect).
    const wideX = b.add(new N.Const({ value: 1 }));
    const tileCWideX = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.tileCount).to(tileCWideX, "a");
    b.connect(wideX).to(tileCWideX, "b");
    const tileCWideY = b.add(new N.Math({ op: "div" }));
    b.connect(gi.tileCount).to(tileCWideY, "a");
    b.connect(aspect).to(tileCWideY, "b");
    const tallX = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.tileCount).to(tallX, "a");
    b.connect(aspect).to(tallX, "b");
    const tallY = gi.tileCount;
    const oneV = b.add(new N.Const({ value: 1 }));
    const isWide = b.add(new N.Math({ op: "step" }));
    b.connect(oneV).to(isWide, "a");
    b.connect(aspect).to(isWide, "b");
    // mix(tall, wide, isWide) per channel
    const tileCx = b.add(new N.Math({ op: "mix" }));
    b.connect(tallX).to(tileCx, "a");
    b.connect(tileCWideX).to(tileCx, "b");
    // math:mix hardcodes t=0.5; build it manually as lerp instead.
    // tileCx = tall + (wide - tall) · isWide
    const diffX = b.add(new N.Math({ op: "sub" }));
    b.connect(tileCWideX).to(diffX, "a");
    b.connect(tallX).to(diffX, "b");
    const scaledX = b.add(new N.Math({ op: "mul" }));
    b.connect(diffX).to(scaledX, "a");
    b.connect(isWide).to(scaledX, "b");
    const finalTcX = b.add(new N.Math({ op: "add" }));
    b.connect(tallX).to(finalTcX, "a");
    b.connect(scaledX).to(finalTcX, "b");
    const diffY = b.add(new N.Math({ op: "sub" }));
    b.connect(tileCWideY).to(diffY, "a");
    b.connect(tallY).to(diffY, "b");
    const scaledY = b.add(new N.Math({ op: "mul" }));
    b.connect(diffY).to(scaledY, "a");
    b.connect(isWide).to(scaledY, "b");
    const finalTcY = b.add(new N.Math({ op: "add" }));
    b.connect(tallY).to(finalTcY, "a");
    b.connect(scaledY).to(finalTcY, "b");
    const tileC = b.add(new N.CombineXy());
    b.connect(finalTcX).to(tileC, "x");
    b.connect(finalTcY).to(tileC, "y");

    // aspectUV = (uv.x · aspect, uv.y)
    const splitUv = b.add(new N.SeparateXy());
    b.connect(uv).to(splitUv, "v");
    const uvAx = b.add(new N.Math({ op: "mul" }));
    b.connect(splitUv, "x").to(uvAx, "a");
    b.connect(aspect).to(uvAx, "b");
    const aspectUv = b.add(new N.CombineXy());
    b.connect(uvAx).to(aspectUv, "x");
    b.connect(splitUv, "y").to(aspectUv, "y");

    // origin = (0.5 · aspect, 0.5)
    const halfV = b.add(new N.Const({ value: 0.5 }));
    const halfAspect = b.add(new N.Math({ op: "mul" }));
    b.connect(halfV).to(halfAspect, "a");
    b.connect(aspect).to(halfAspect, "b");
    const origin = b.add(new N.CombineXy());
    b.connect(halfAspect).to(origin, "x");
    b.connect(halfV).to(origin, "y");

    // centered = aspectUV − origin
    const centered = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(aspectUv).to(centered, "a");
    b.connect(origin).to(centered, "b");

    // rotated = rotate2D(centered, rotation·π/180) + origin
    const deg2rad = b.add(new N.Const({ value: Math.PI / 180 }));
    const rotR = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.rotation).to(rotR, "a");
    b.connect(deg2rad).to(rotR, "b");
    const rot = b.add(new N.VectorMath({ op: "rotate-2d" }));
    b.connect(centered).to(rot, "a");
    b.connect(rotR).to(rot, "b");
    const rotated = b.add(new N.VectorMath({ op: "add" }));
    b.connect(rot).to(rotated, "a");
    b.connect(origin).to(rotated, "b");

    // gridUV = (rotated.x / aspect, rotated.y)
    const splitRot = b.add(new N.SeparateXy());
    b.connect(rotated).to(splitRot, "v");
    const gridX = b.add(new N.Math({ op: "div" }));
    b.connect(splitRot, "x").to(gridX, "a");
    b.connect(aspect).to(gridX, "b");
    const gridUv = b.add(new N.CombineXy());
    b.connect(gridX).to(gridUv, "x");
    b.connect(splitRot, "y").to(gridUv, "y");

    // tileSize = 1/tileC; tileOrigin = floor(gridUV · tileC) / tileC
    const oneVec = b.add(new N.CombineXy());
    b.connect(oneV).to(oneVec, "x");
    b.connect(oneV).to(oneVec, "y");
    // gridScaled = gridUV * tileC (component-wise)
    const splitGrid = b.add(new N.SeparateXy());
    b.connect(gridUv).to(splitGrid, "v");
    const gxTc = b.add(new N.Math({ op: "mul" }));
    b.connect(splitGrid, "x").to(gxTc, "a");
    b.connect(finalTcX).to(gxTc, "b");
    const gyTc = b.add(new N.Math({ op: "mul" }));
    b.connect(splitGrid, "y").to(gyTc, "a");
    b.connect(finalTcY).to(gyTc, "b");
    const fx = b.add(new N.Math({ op: "floor" }));
    b.connect(gxTc).to(fx, "x");
    const fy = b.add(new N.Math({ op: "floor" }));
    b.connect(gyTc).to(fy, "x");
    const origX = b.add(new N.Math({ op: "div" }));
    b.connect(fx).to(origX, "a");
    b.connect(finalTcX).to(origX, "b");
    const origY = b.add(new N.Math({ op: "div" }));
    b.connect(fy).to(origY, "a");
    b.connect(finalTcY).to(origY, "b");

    // (gridUV − tileOrigin) / tileSize per channel = (gridUV − tileOrigin) · tileC
    const dx = b.add(new N.Math({ op: "sub" }));
    b.connect(splitGrid, "x").to(dx, "a");
    b.connect(origX).to(dx, "b");
    const dy = b.add(new N.Math({ op: "sub" }));
    b.connect(splitGrid, "y").to(dy, "a");
    b.connect(origY).to(dy, "b");
    const dxN = b.add(new N.Math({ op: "mul" }));
    b.connect(dx).to(dxN, "a");
    b.connect(finalTcX).to(dxN, "b");
    const dyN = b.add(new N.Math({ op: "mul" }));
    b.connect(dy).to(dyN, "a");
    b.connect(finalTcY).to(dyN, "b");
    const fcx = b.add(new N.Math({ op: "sub" }));
    b.connect(dxN).to(fcx, "a");
    b.connect(halfV).to(fcx, "b");
    const fcy = b.add(new N.Math({ op: "sub" }));
    b.connect(dyN).to(fcy, "a");
    b.connect(halfV).to(fcy, "b");
    const fromCenter = b.add(new N.CombineXy());
    b.connect(fcx).to(fromCenter, "x");
    b.connect(fcy).to(fromCenter, "y");

    // dot(fromCenter, fromCenter)
    const fcDot = b.add(new N.VectorMath({ op: "dot" }));
    b.connect(fromCenter).to(fcDot, "a");
    b.connect(fromCenter).to(fcDot, "b");
    const fourV = b.add(new N.Const({ value: 4 }));
    const rMul = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.roundness).to(rMul, "a");
    b.connect(fourV).to(rMul, "b");
    const dr = b.add(new N.Math({ op: "mul" }));
    b.connect(fcDot).to(dr, "a");
    b.connect(rMul).to(dr, "b");
    const oneMinusDR = b.add(new N.Math({ op: "sub" }));
    b.connect(oneV).to(oneMinusDR, "a");
    b.connect(dr).to(oneMinusDR, "b");
    const zeroV = b.add(new N.Const({ value: 0 }));
    const roundMask = b.add(new N.Math({ op: "max" }));
    b.connect(zeroV).to(roundMask, "a");
    b.connect(oneMinusDR).to(roundMask, "b");

    // baseDist = fromCenter · intensity · 0.025 · roundMask
    const c25 = b.add(new N.Const({ value: 0.025 }));
    const iC25 = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.intensity).to(iC25, "a");
    b.connect(c25).to(iC25, "b");
    const totalScale = b.add(new N.Math({ op: "mul" }));
    b.connect(iC25).to(totalScale, "a");
    b.connect(roundMask).to(totalScale, "b");
    const baseDist = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(fromCenter).to(baseDist, "a");
    b.connect(totalScale).to(baseDist, "b");

    // finalUV = uv + (baseDist.x / aspect, baseDist.y)
    const splitBd = b.add(new N.SeparateXy());
    b.connect(baseDist).to(splitBd, "v");
    const bdxOverA = b.add(new N.Math({ op: "div" }));
    b.connect(splitBd, "x").to(bdxOverA, "a");
    b.connect(aspect).to(bdxOverA, "b");
    const offV = b.add(new N.CombineXy());
    b.connect(bdxOverA).to(offV, "x");
    b.connect(splitBd, "y").to(offV, "y");
    const finalUv = b.add(new N.VectorMath({ op: "add" }));
    b.connect(uv).to(finalUv, "a");
    b.connect(offV).to(finalUv, "b");

    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(finalUv).to(sample, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(GlassTiles);
export default GlassTiles;
