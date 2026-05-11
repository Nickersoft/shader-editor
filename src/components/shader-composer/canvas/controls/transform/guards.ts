import type { DragMode, DragState, DragStateWithMode } from "./types";

// in types.ts
export function isDragMode<T extends DragMode["kind"]>(
  state: DragState,
  kind: T,
): state is DragStateWithMode<T> {
  return state.mode.kind === kind;
}
