import type { BlendMode } from "@/shaders";

export const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "add", label: "Add" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "softLight", label: "Soft Light" },
  { value: "hardLight", label: "Hard Light" },
];
