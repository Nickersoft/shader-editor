

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": false
};
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.kxBjVpyA.js","_app/immutable/chunks/DjA5qdfU.js","_app/immutable/chunks/BCPDeFvK.js","_app/immutable/chunks/BSf_45ga.js"];
export const stylesheets = ["_app/immutable/assets/0.C2VvgeOm.css"];
export const fonts = [];
