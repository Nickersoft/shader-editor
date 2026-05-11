import type { Corner, Edge } from "./types";

export const HANDLE_SIZE = 8;
export const ROTATE_HOT_RADIUS = 16;
export const EDGE_THICKNESS = 8;

// Edge/corner resize cursors are the only ones the browser draws sensibly
// for arbitrary rotations; our shape rotation isn't fed into the cursor,
// but on light/moderate rotations the directional hint is still useful.
export const EDGES: Edge[] = [
  { axis: "y", sign: -1, cursor: "ns-resize" }, // top
  { axis: "y", sign: 1, cursor: "ns-resize" }, // bottom
  { axis: "x", sign: -1, cursor: "ew-resize" }, // left
  { axis: "x", sign: 1, cursor: "ew-resize" }, // right
];

export const CORNERS: Corner[] = [
  { sx: -1, sy: -1, cursor: "nwse-resize" },
  { sx: 1, sy: -1, cursor: "nesw-resize" },
  { sx: -1, sy: 1, cursor: "nesw-resize" },
  { sx: 1, sy: 1, cursor: "nwse-resize" },
];
