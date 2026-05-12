// Public API for the node-graph subsystem.
//
// Importing this barrel also registers every primitive via the
// `./primitives` side-effect import.

import "./primitives";

export { emitGraph, GROUP_INPUT_TYPE_ID, GROUP_OUTPUT_TYPE_ID } from "./emit";
export type { EmittedGraph, EmitOptions } from "./emit";
export {
  getPrimitive,
  listPrimitives,
  registerPrimitive,
  requirePrimitive,
} from "./registry";
export type { EmitContext, EmitResult, NodePrimitive, UniformSpec } from "./registry";
export { glslLiteral, glslTypeOf } from "./types";
export type { Edge, GraphNode, NodeGraph, PinDefault, PinSpec, PinType } from "./types";
