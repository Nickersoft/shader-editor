// Tracks which layer row a drag is currently over so the row can render
// a "drop will clip into me" highlight. Set from the `DragDropProvider`'s
// `onDragOver` callback and cleared on `onDragEnd`.

interface DragIntent {
  /** Layer id of the row currently being hovered, or null when nothing is. */
  targetId: string | null;
}

const state = $state<DragIntent>({ targetId: null });

export const dragIntent = {
  get targetId() {
    return state.targetId;
  },
  set(targetId: string | null) {
    state.targetId = targetId;
  },
  reset() {
    state.targetId = null;
  },
};
