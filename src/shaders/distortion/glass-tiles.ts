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
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const res = b.add("resolution", {}, undefined, "out");
    const splitRes = b.add("separate-xy", {});
    b.connect(res, splitRes.nodeId, "v");
    const aspect = b.add("math", { op: "div" });
    b.connect({ nodeId: splitRes.nodeId, pin: "x" }, aspect.nodeId, "a");
    b.connect({ nodeId: splitRes.nodeId, pin: "y" }, aspect.nodeId, "b");

    // Two candidate tileC values, blended on step(1, aspect).
    const wideX = b.add("value", { value: 1 });
    const tileCWideX = b.add("math", { op: "mul" });
    b.connect(gi.tileCount, tileCWideX.nodeId, "a");
    b.connect(wideX, tileCWideX.nodeId, "b");
    const tileCWideY = b.add("math", { op: "div" });
    b.connect(gi.tileCount, tileCWideY.nodeId, "a");
    b.connect(aspect, tileCWideY.nodeId, "b");
    const tallX = b.add("math", { op: "mul" });
    b.connect(gi.tileCount, tallX.nodeId, "a");
    b.connect(aspect, tallX.nodeId, "b");
    const tallY = gi.tileCount;
    const oneV = b.add("value", { value: 1 });
    const isWide = b.add("math", { op: "step" });
    b.connect(oneV, isWide.nodeId, "a");
    b.connect(aspect, isWide.nodeId, "b");
    // mix(tall, wide, isWide) per channel
    const tileCx = b.add("math", { op: "mix" });
    b.connect(tallX, tileCx.nodeId, "a");
    b.connect(tileCWideX, tileCx.nodeId, "b");
    // math:mix hardcodes t=0.5; build it manually as lerp instead.
    // tileCx = tall + (wide - tall) · isWide
    const diffX = b.add("math", { op: "sub" });
    b.connect(tileCWideX, diffX.nodeId, "a");
    b.connect(tallX, diffX.nodeId, "b");
    const scaledX = b.add("math", { op: "mul" });
    b.connect(diffX, scaledX.nodeId, "a");
    b.connect(isWide, scaledX.nodeId, "b");
    const finalTcX = b.add("math", { op: "add" });
    b.connect(tallX, finalTcX.nodeId, "a");
    b.connect(scaledX, finalTcX.nodeId, "b");
    const diffY = b.add("math", { op: "sub" });
    b.connect(tileCWideY, diffY.nodeId, "a");
    b.connect(tallY, diffY.nodeId, "b");
    const scaledY = b.add("math", { op: "mul" });
    b.connect(diffY, scaledY.nodeId, "a");
    b.connect(isWide, scaledY.nodeId, "b");
    const finalTcY = b.add("math", { op: "add" });
    b.connect(tallY, finalTcY.nodeId, "a");
    b.connect(scaledY, finalTcY.nodeId, "b");
    const tileC = b.add("combine-xy", {});
    b.connect(finalTcX, tileC.nodeId, "x");
    b.connect(finalTcY, tileC.nodeId, "y");

    // aspectUV = (uv.x · aspect, uv.y)
    const splitUv = b.add("separate-xy", {});
    b.connect(uv, splitUv.nodeId, "v");
    const uvAx = b.add("math", { op: "mul" });
    b.connect({ nodeId: splitUv.nodeId, pin: "x" }, uvAx.nodeId, "a");
    b.connect(aspect, uvAx.nodeId, "b");
    const aspectUv = b.add("combine-xy", {});
    b.connect(uvAx, aspectUv.nodeId, "x");
    b.connect({ nodeId: splitUv.nodeId, pin: "y" }, aspectUv.nodeId, "y");

    // origin = (0.5 · aspect, 0.5)
    const halfV = b.add("value", { value: 0.5 });
    const halfAspect = b.add("math", { op: "mul" });
    b.connect(halfV, halfAspect.nodeId, "a");
    b.connect(aspect, halfAspect.nodeId, "b");
    const origin = b.add("combine-xy", {});
    b.connect(halfAspect, origin.nodeId, "x");
    b.connect(halfV, origin.nodeId, "y");

    // centered = aspectUV − origin
    const centered = b.add("vector-math", { op: "sub" });
    b.connect(aspectUv, centered.nodeId, "a");
    b.connect(origin, centered.nodeId, "b");

    // rotated = rotate2D(centered, rotation·π/180) + origin
    const deg2rad = b.add("value", { value: Math.PI / 180 });
    const rotR = b.add("math", { op: "mul" });
    b.connect(gi.rotation, rotR.nodeId, "a");
    b.connect(deg2rad, rotR.nodeId, "b");
    const rot = b.add("vector-math", { op: "rotate-2d" });
    b.connect(centered, rot.nodeId, "a");
    b.connect(rotR, rot.nodeId, "b");
    const rotated = b.add("vector-math", { op: "add" });
    b.connect(rot, rotated.nodeId, "a");
    b.connect(origin, rotated.nodeId, "b");

    // gridUV = (rotated.x / aspect, rotated.y)
    const splitRot = b.add("separate-xy", {});
    b.connect(rotated, splitRot.nodeId, "v");
    const gridX = b.add("math", { op: "div" });
    b.connect({ nodeId: splitRot.nodeId, pin: "x" }, gridX.nodeId, "a");
    b.connect(aspect, gridX.nodeId, "b");
    const gridUv = b.add("combine-xy", {});
    b.connect(gridX, gridUv.nodeId, "x");
    b.connect({ nodeId: splitRot.nodeId, pin: "y" }, gridUv.nodeId, "y");

    // tileSize = 1/tileC; tileOrigin = floor(gridUV · tileC) / tileC
    const oneVec = b.add("combine-xy", {});
    b.connect(oneV, oneVec.nodeId, "x");
    b.connect(oneV, oneVec.nodeId, "y");
    // gridScaled = gridUV * tileC (component-wise)
    const splitGrid = b.add("separate-xy", {});
    b.connect(gridUv, splitGrid.nodeId, "v");
    const gxTc = b.add("math", { op: "mul" });
    b.connect({ nodeId: splitGrid.nodeId, pin: "x" }, gxTc.nodeId, "a");
    b.connect(finalTcX, gxTc.nodeId, "b");
    const gyTc = b.add("math", { op: "mul" });
    b.connect({ nodeId: splitGrid.nodeId, pin: "y" }, gyTc.nodeId, "a");
    b.connect(finalTcY, gyTc.nodeId, "b");
    const fx = b.add("math", { op: "floor" });
    b.connect(gxTc, fx.nodeId, "x");
    const fy = b.add("math", { op: "floor" });
    b.connect(gyTc, fy.nodeId, "x");
    const origX = b.add("math", { op: "div" });
    b.connect(fx, origX.nodeId, "a");
    b.connect(finalTcX, origX.nodeId, "b");
    const origY = b.add("math", { op: "div" });
    b.connect(fy, origY.nodeId, "a");
    b.connect(finalTcY, origY.nodeId, "b");

    // (gridUV − tileOrigin) / tileSize per channel = (gridUV − tileOrigin) · tileC
    const dx = b.add("math", { op: "sub" });
    b.connect({ nodeId: splitGrid.nodeId, pin: "x" }, dx.nodeId, "a");
    b.connect(origX, dx.nodeId, "b");
    const dy = b.add("math", { op: "sub" });
    b.connect({ nodeId: splitGrid.nodeId, pin: "y" }, dy.nodeId, "a");
    b.connect(origY, dy.nodeId, "b");
    const dxN = b.add("math", { op: "mul" });
    b.connect(dx, dxN.nodeId, "a");
    b.connect(finalTcX, dxN.nodeId, "b");
    const dyN = b.add("math", { op: "mul" });
    b.connect(dy, dyN.nodeId, "a");
    b.connect(finalTcY, dyN.nodeId, "b");
    const fcx = b.add("math", { op: "sub" });
    b.connect(dxN, fcx.nodeId, "a");
    b.connect(halfV, fcx.nodeId, "b");
    const fcy = b.add("math", { op: "sub" });
    b.connect(dyN, fcy.nodeId, "a");
    b.connect(halfV, fcy.nodeId, "b");
    const fromCenter = b.add("combine-xy", {});
    b.connect(fcx, fromCenter.nodeId, "x");
    b.connect(fcy, fromCenter.nodeId, "y");

    // dot(fromCenter, fromCenter)
    const fcDot = b.add("vector-math", { op: "dot" });
    b.connect(fromCenter, fcDot.nodeId, "a");
    b.connect(fromCenter, fcDot.nodeId, "b");
    const fourV = b.add("value", { value: 4 });
    const rMul = b.add("math", { op: "mul" });
    b.connect(gi.roundness, rMul.nodeId, "a");
    b.connect(fourV, rMul.nodeId, "b");
    const dr = b.add("math", { op: "mul" });
    b.connect(fcDot, dr.nodeId, "a");
    b.connect(rMul, dr.nodeId, "b");
    const oneMinusDR = b.add("math", { op: "sub" });
    b.connect(oneV, oneMinusDR.nodeId, "a");
    b.connect(dr, oneMinusDR.nodeId, "b");
    const zeroV = b.add("value", { value: 0 });
    const roundMask = b.add("math", { op: "max" });
    b.connect(zeroV, roundMask.nodeId, "a");
    b.connect(oneMinusDR, roundMask.nodeId, "b");

    // baseDist = fromCenter · intensity · 0.025 · roundMask
    const c25 = b.add("value", { value: 0.025 });
    const iC25 = b.add("math", { op: "mul" });
    b.connect(gi.intensity, iC25.nodeId, "a");
    b.connect(c25, iC25.nodeId, "b");
    const totalScale = b.add("math", { op: "mul" });
    b.connect(iC25, totalScale.nodeId, "a");
    b.connect(roundMask, totalScale.nodeId, "b");
    const baseDist = b.add("vector-math", { op: "scale" });
    b.connect(fromCenter, baseDist.nodeId, "a");
    b.connect(totalScale, baseDist.nodeId, "b");

    // finalUV = uv + (baseDist.x / aspect, baseDist.y)
    const splitBd = b.add("separate-xy", {});
    b.connect(baseDist, splitBd.nodeId, "v");
    const bdxOverA = b.add("math", { op: "div" });
    b.connect({ nodeId: splitBd.nodeId, pin: "x" }, bdxOverA.nodeId, "a");
    b.connect(aspect, bdxOverA.nodeId, "b");
    const offV = b.add("combine-xy", {});
    b.connect(bdxOverA, offV.nodeId, "x");
    b.connect({ nodeId: splitBd.nodeId, pin: "y" }, offV.nodeId, "y");
    const finalUv = b.add("vector-math", { op: "add" });
    b.connect(uv, finalUv.nodeId, "a");
    b.connect(offV, finalUv.nodeId, "b");

    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(finalUv, sample.nodeId, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(GlassTiles);
export default GlassTiles;
