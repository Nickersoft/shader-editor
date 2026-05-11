import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type WithoutChild<T> = T extends { child?: unknown }
  ? Omit<T, "child">
  : T;
export type WithoutChildren<T> = T extends { children?: unknown }
  ? Omit<T, "children">
  : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
  ref?: U | null;
};

let idCounter = 0;
export function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

/**
 * Reorder `list` to match the order of `orderedIds`. Items whose id isn't in
 * `orderedIds` are appended at the end in their original relative order.
 */
export function reorderById<T extends { id: string }>(
  list: T[],
  orderedIds: string[],
): T[] {
  const byId = new Map(list.map((item) => [item.id, item]));
  const orderedSet = new Set(orderedIds);
  const out: T[] = [];
  for (const id of orderedIds) {
    const item = byId.get(id);
    if (item) out.push(item);
  }
  for (const item of list) if (!orderedSet.has(item.id)) out.push(item);
  return out;
}
