// Public API for the node-graph subsystem.
//
// Importing this barrel also registers every node via the `./nodes`
// side-effect import.

import "./nodes";

export {
  ACCUMULATOR_IN_SUFFIX,
  ACCUMULATOR_OUT_SUFFIX,
  accumulatorInPinId,
  accumulatorOutPinId,
  emitGraph,
  GROUP_INPUT_TYPE_ID,
  GROUP_OUTPUT_TYPE_ID,
  GROUP_TYPE_ID,
  ITERATE_INDEX_PIN_ID,
  ITERATE_TYPE_ID,
} from "./emit";
export type { EmittedGraph, EmitOptions } from "./emit";
export { syncIterateSubgraphPins } from "./nodes/iterate";
export type { AccumulatorSpec } from "./nodes/iterate";
export {
  BaseNode,
  getNode,
  listNodes,
  register,
  requireNode,
} from "./registry";
export type {
  EmitContext,
  EmitResult,
  PinSchemas,
  NodeClass,
  NodeMeta,
  UniformSpec,
} from "./registry";
export {
  angle,
  bool,
  color,
  colorAlpha,
  float,
  int,
  pinSpecsFromSchema,
  uv,
  vec2,
  vec3,
  vec4,
  vector2,
  vector3,
} from "./pins";
export { canCoerce, coerce } from "./coerce";
export type { CoerceResult } from "./coerce";
export { ConnectBuilder, GraphBuilder, NodeHandle } from "./graph-builder";
export type { GroupInputPin, InPinId, OutPinId } from "./graph-builder";
// layoutGraph / relayoutGraph live in ./layout — import them directly. They
// pull in @dagrejs/dagre (~95 KB min), so keeping them off the barrel makes
// the dependency explicit at every consuming site.
export { makeGroup, ungroup } from "./group-ops";
export {
  aggregateGraphSpatialControls,
  graphAddr,
  GRAPH_ADDRESS_PREFIX,
  parseGraphAddress,
} from "./spatial-controls";
export type { ParsedGraphAddress } from "./spatial-controls";
export {
  coerceToPinDefault,
  defaultForPinType,
  floatLit,
  glslLiteral,
  glslTypeOf,
  PIN_TYPES,
} from "./types";
export type { Edge, Frame, GraphNode, NodeGraph, PinDefault, PinSpec, PinType } from "./types";
export { zPinType } from "./pins";
