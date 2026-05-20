

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.CkTpmCy9.js","_app/immutable/chunks/CwUtRAe5.js","_app/immutable/chunks/BSf_45ga.js"];
export const stylesheets = ["_app/immutable/assets/2.DyJXk30W.css"];
export const fonts = [];
