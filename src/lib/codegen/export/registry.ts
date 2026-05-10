// Shadcn-compatible registry emitter.
//
// Each generated shader becomes one registry item that depends on the shared
// `shader-mount` runtime. Consumers run:
//
//   npx shadcn add <base>/r/<slug>.json
//
// and get both files installed (`@/lib/shader-mount.ts` once, plus the
// shader-specific component). Schema reference:
// https://ui.shadcn.com/schema/registry-item.json

import shaderMountSource from "../runtime/shader-mount.ts?raw";
import runtimeShellSource from "../runtime/runtime-shell.ts?raw";
import imageHelperSource from "../runtime/export-image-helper.ts?raw";
import noiseTextureSource from "../runtime/noise-texture.ts?raw";
import codegenTypesSource from "../types.ts?raw";

export interface RegistryFile {
  path: string;
  content: string;
  type: "registry:lib" | "registry:component" | "registry:ui" | "registry:hook" | "registry:page";
}

export interface RegistryItem {
  $schema: "https://ui.shadcn.com/schema/registry-item.json";
  name: string;
  type: "registry:lib" | "registry:component" | "registry:ui" | "registry:hook" | "registry:page";
  description?: string;
  /** Other registry-item names this depends on. shadcn installs them too. */
  registryDependencies?: string[];
  /** npm packages this depends on (e.g. ["react"]). */
  dependencies?: string[];
  files: RegistryFile[];
}

/**
 * The shared shader-mount registry item. Consumers install this once;
 * subsequent shader items depend on it via `registryDependencies`.
 *
 * The mount source plus its three dependencies (runtime-shell, image helper,
 * noise texture, and the UniformSpec types) are bundled together so the
 * installed file works without import-path surgery.
 */
export function buildShaderMountRegistryItem(): RegistryItem {
  // Strip cross-module `import` lines only — preserve `export` keywords so
  // UniformSpec / mountShader / MountOptions stay visible in the bundle.
  const stripImports = (src: string) => src.replace(/^\s*import [^\n]+\n/gm, "");

  // From types.ts we only want UniformGlType and UniformSpec. Pluck them out
  // by name so the bundle isn't polluted with editor-internal types
  // (GeneratedUniform, GeneratedPass, etc.).
  const typesSrc = stripImports(codegenTypesSource);
  const uniformGlType = typesSrc.match(/export type UniformGlType[\s\S]+?(?=\n\n)/)?.[0];
  const uniformSpec = typesSrc.match(/export interface UniformSpec[\s\S]+?\n\}/)?.[0];

  const merged = [
    "// --- types ---",
    uniformGlType ?? "",
    uniformSpec ?? "",
    "// --- noise texture ---",
    stripImports(noiseTextureSource),
    "// --- image cache + binding helpers ---",
    stripImports(imageHelperSource),
    "// --- multi-pass GL pipeline kernel ---",
    stripImports(runtimeShellSource),
    "// --- canvas-mount surface ---",
    stripImports(shaderMountSource),
  ]
    .filter(Boolean)
    .join("\n\n");

  const content = `// Auto-generated bundle for shadcn install. Single-file portable runtime.
// Source of truth: shader-composer's @/lib/codegen/runtime tree.

${merged}
`;

  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "shader-mount",
    type: "registry:lib",
    description:
      "Portable WebGL2 runtime that mounts a generated shader bundle (vertex + fragment passes + uniform metadata) onto a canvas.",
    files: [
      {
        path: "lib/shader-mount.ts",
        content,
        type: "registry:lib",
      },
    ],
  };
}

/**
 * Build a registry item for a generated shader. The shader file imports from
 * `./shader-mount`, which `registryDependencies` installs alongside.
 */
export function buildShaderRegistryItem(input: {
  /** Slug used in the install URL (e.g. `cool-blob`). */
  slug: string;
  /** PascalCase component name (e.g. `CoolBlob`). */
  componentName: string;
  /** Auto-generated React component source (from `generateReactComponent`). */
  reactSource: string;
  description?: string;
}): RegistryItem {
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: input.slug,
    type: "registry:component",
    description: input.description,
    registryDependencies: ["shader-mount"],
    dependencies: ["react"],
    files: [
      {
        path: `components/shaders/${input.slug}.tsx`,
        content: input.reactSource,
        type: "registry:component",
      },
    ],
  };
}
