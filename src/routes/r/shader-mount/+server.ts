// Serves the shared shader-mount runtime as a shadcn registry item.
// Consumers run: `npx shadcn add <origin>/r/shader-mount`

import { json } from "@sveltejs/kit";
import { buildShaderMountRegistryItem } from "@/lib/codegen/export/registry";

export const prerender = true;

export function GET() {
  return json(buildShaderMountRegistryItem());
}
