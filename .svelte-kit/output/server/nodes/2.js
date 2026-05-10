export const index = 2;
let component_cache;
export const component = async () =>
  (component_cache ??= (await import("../entries/pages/_page.svelte.js")).default);
export const imports = [
  "_app/immutable/nodes/2.CnHTk6vi.js",
  "_app/immutable/chunks/DjA5qdfU.js",
  "_app/immutable/chunks/BSf_45ga.js",
];
export const stylesheets = ["_app/immutable/assets/2.BYBGbD8y.css"];
export const fonts = [];
