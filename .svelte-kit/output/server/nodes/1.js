

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.fVTloXd7.js","_app/immutable/chunks/DjA5qdfU.js","_app/immutable/chunks/BCPDeFvK.js","_app/immutable/chunks/BSf_45ga.js"];
export const stylesheets = [];
export const fonts = [];
