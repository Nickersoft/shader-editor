import { _ as stringify, _t as hasContext, a as unmount, c as attr_style, d as derived, f as element, g as spread_props, gt as getContext, ht as getAllContexts, i as tick, it as ATTACHMENT_KEY, l as attributes, m as props_id, mt as run, n as mount, nt as clsx$1, p as ensure_array_like, r as onDestroy, rt as escape_html, s as attr_class, tt as attr, u as bind_props, v as html, vt as setContext, yt as __exportAll } from "../../chunks/index-server.js";
import { i as on } from "../../chunks/legacy-client.js";
import { clsx } from "clsx";
import { z } from "zod";
import { DragDropManager, Droppable, KeyboardSensor, PointerActivationConstraints, PointerSensor } from "@dnd-kit/dom";
import parse from "style-to-object";
import { focusable, isFocusable, isTabbable, tabbable } from "tabbable";
import { arrow, autoUpdate, computePosition, flip, hide, limitShift, offset, shift, size } from "@floating-ui/dom";
import { twMerge } from "tailwind-merge";
import { OptimisticSortingPlugin, Sortable, defaultSortableTransition } from "@dnd-kit/dom/sortable";
import { tv } from "tailwind-variants";
//#region src/shaders/core/registry.ts
var REGISTRY = /* @__PURE__ */ new Map();
function register(cls) {
	if (!cls.typeId) throw new Error(`Cannot register class ${cls.name}: missing static typeId`);
	if (REGISTRY.has(cls.typeId)) {
		const existing = REGISTRY.get(cls.typeId);
		if (existing !== cls) throw new Error(`Duplicate Node typeId "${cls.typeId}" — already registered to ${existing.name}, attempted by ${cls.name}`);
	}
	REGISTRY.set(cls.typeId, cls);
	return cls;
}
function getNodeClass(typeId) {
	return REGISTRY.get(typeId);
}
function listNodeClasses() {
	return Array.from(REGISTRY.values());
}
/**
* Hydrate a serialized node into a class instance. Throws if the typeId is
* unregistered (e.g. a save file references a primitive that's been renamed
* or removed).
*/
function deserializeNode(json) {
	const cls = REGISTRY.get(json.typeId);
	if (!cls) throw new Error(`Unknown node typeId "${json.typeId}" (instance id: ${json.id})`);
	return new cls({
		id: json.id,
		config: json.config,
		inputs: json.inputs,
		blendMode: json.blendMode,
		opacity: json.opacity,
		enabled: json.enabled
	});
}
//#endregion
//#region src/shaders/core/chain.ts
var ShaderChain = class ShaderChain {
	nodes;
	constructor(nodes = []) {
		this.nodes = nodes;
	}
	/** Append a node. Returns the chain for fluent composition. */
	pipe(node) {
		this.nodes.push(node);
		return this;
	}
	/** Insert a node at a specific position. */
	insert(index, node) {
		this.nodes.splice(index, 0, node);
		return this;
	}
	/** Remove a node by instance id. No-op if not found. */
	remove(id) {
		const idx = this.nodes.findIndex((n) => n.id === id);
		if (idx >= 0) this.nodes.splice(idx, 1);
		return this;
	}
	/** Move a node to a new index in the chain. */
	reorder(id, newIndex) {
		const idx = this.nodes.findIndex((n) => n.id === id);
		if (idx < 0) return this;
		const [node] = this.nodes.splice(idx, 1);
		this.nodes.splice(newIndex, 0, node);
		return this;
	}
	/** Find a node by instance id. */
	find(id) {
		return this.nodes.find((n) => n.id === id);
	}
	/** Enabled nodes in render order. */
	get enabled() {
		return this.nodes.filter((n) => n.enabled);
	}
	toJSON() {
		return { nodes: this.nodes.map((n) => n.toJSON()) };
	}
	static fromJSON(json) {
		return new ShaderChain(json.nodes.map((n) => deserializeNode(n)));
	}
	/** Shallow clone — useful when handing the chain to React state. */
	clone() {
		return ShaderChain.fromJSON(this.toJSON());
	}
};
/** Fluent constructor. */
function chain(...initial) {
	return new ShaderChain(initial);
}
//#endregion
//#region src/shaders/core/schemas.ts
/**
* Attach UI metadata to a Zod schema. Thin wrapper over Zod 4's native
* `.meta()` that types the metadata bag as `UiMeta`.
*/
function withMeta(schema, meta) {
	const existing = schema.meta() ?? {};
	return schema.meta({
		...existing,
		...meta,
		ui: {
			...existing.ui,
			...meta.ui
		}
	});
}
/**
* If `schema` is a Zod 4 wrapper (`.optional()`, `.default(...)`, etc.),
* return its inner schema; otherwise return undefined. Canonical wrapper
* traversal primitive — used by `getMetaDeep` and the codegen `unwrap`.
*/
function tryUnwrap(schema) {
	if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable || schema instanceof z.ZodDefault || schema instanceof z.ZodPrefault || schema instanceof z.ZodNonOptional || schema instanceof z.ZodReadonly || schema instanceof z.ZodCatch) return schema.unwrap();
}
var metaCache = /* @__PURE__ */ new WeakMap();
/**
* Walks `.optional()` / `.default()` / `.nullable()` wrappers and merges
* metadata from every level of the chain. Outer-layer metadata wins on
* conflicts (so a primitive can `.describe('Override')` over a helper's label
* without losing the inner `kind`).
*
* Necessary because Zod 4's wrappers don't propagate `.meta()` outward, *and*
* because `.describe()` writes to the outer wrapper's own meta — which would
* otherwise hide a base-schema `kind` like `'palette'` or `'image-input'`.
*
* Results are cached per-schema in a WeakMap. Schemas are referentially
* stable (declared as `static config` / `static inputs` on Node classes), so
* this turns repeat calls during property-panel renders into O(1) lookups.
*/
function getMetaDeep(schema) {
	if (metaCache.has(schema)) return metaCache.get(schema);
	const chain = [];
	let s = schema;
	while (s) {
		const m = s.meta();
		if (m) chain.push(m);
		s = tryUnwrap(s);
	}
	let out;
	if (chain.length > 0) {
		out = {};
		for (let i = chain.length - 1; i >= 0; i--) {
			const layer = chain[i];
			out = {
				...out,
				...layer,
				ui: {
					...out.ui,
					...layer.ui
				}
			};
		}
	}
	metaCache.set(schema, out);
	return out;
}
function zFloat(min, max, step = .01) {
	return withMeta(z.number().min(min).max(max), { ui: {
		min,
		max,
		step
	} });
}
function zInt(min, max) {
	return withMeta(z.number().int().min(min).max(max), { ui: {
		min,
		max,
		step: 1
	} });
}
function zAngle(step = 1) {
	return withMeta(z.number(), { ui: {
		min: 0,
		max: 360,
		step
	} });
}
function zBool() {
	return z.boolean();
}
/**
* Mark a schema as conditionally visible based on sibling field values. Used
* by the property panel to hide irrelevant fields (e.g. on a unified Gradient
* node, hide `radius` unless `type === 'radial'`).
*/
function zVisibleWhen(schema, conditions) {
	return withMeta(schema, { ui: { visibleWhen: conditions } });
}
function zVec2(min, max, step = .01) {
	const ui = min !== void 0 && max !== void 0 ? {
		min,
		max,
		step
	} : { step };
	return withMeta(z.tuple([z.number(), z.number()]), { ui });
}
/**
* vec2 in UV space for a "center"/"origin"/"position" control. Range is
* symmetric around 0 so origins can sit off-screen (e.g. godray sun, lens
* flare just out of frame). Canvas itself spans 0..1; a default extent of 1
* gives one canvas-width of off-screen reach in every direction.
*/
function zCenter(extent = 1, step = .01) {
	return zVec2(-extent, extent, step);
}
/** Single-axis counterpart to `zCenter` for `centerX`/`centerY` style configs. */
function zCenterAxis(extent = 1, step = .01) {
	return zFloat(-extent, extent, step);
}
/**
* The five fields that make up a shape's universal Transform: position
* (`x`/`y`), bounding-box extent (`width`/`height`), and `rotation`. Spread
* into a shape's `z.object({...})` so every shape exposes the same Figma-style
* bounding-box transform, with shape-specific config fields appearing
* alongside.
*
*   const config = z.object({
*     ...transformFields(),
*     sides: zInt(3, 16).default(6),
*     ...
*   })
*
* `width` / `height` are in y-relative units (1.0 spans one canvas height).
* Range allows >1 so wide shapes can extend past the canvas; ≤2 keeps the
* slider scale sane while still reaching the corners on portrait canvases.
*/
function transformFields() {
	return {
		x: withMeta(zCenterAxis(1, .001).default(.5).describe("X"), { ui: { group: "transform" } }),
		y: withMeta(zCenterAxis(1, .001).default(.5).describe("Y"), { ui: { group: "transform" } }),
		width: withMeta(zFloat(.001, 2, .001).default(.5).describe("Width"), { ui: { group: "transform" } }),
		height: withMeta(zFloat(.001, 2, .001).default(.5).describe("Height"), { ui: { group: "transform" } }),
		rotation: withMeta(zAngle(1).default(0).describe("Rotation"), { ui: { group: "transform" } })
	};
}
/** vec3 color in 0..1 with a color-picker UI. */
function zColor() {
	return withMeta(z.tuple([
		z.number(),
		z.number(),
		z.number()
	]), { ui: {
		color: true,
		min: 0,
		max: 1,
		step: .001
	} });
}
/** vec4 color (RGBA) in 0..1 with a color-picker UI. */
function zColorRgba() {
	return withMeta(z.tuple([
		z.number(),
		z.number(),
		z.number(),
		z.number()
	]), { ui: {
		color: true,
		min: 0,
		max: 1,
		step: .001
	} });
}
z.object({
	values: z.array(z.tuple([
		z.number(),
		z.number(),
		z.number(),
		z.number()
	])),
	length: z.number().int().min(0)
});
var EdgeModeSchema = z.enum([
	"stretch",
	"transparent",
	"mirror",
	"wrap"
]);
function zEdges() {
	return EdgeModeSchema;
}
function edgeMode(value) {
	switch (value) {
		case "stretch": return "0";
		case "transparent": return "1";
		case "mirror": return "2";
		case "wrap": return "3";
	}
}
var ImageFitSchema = z.enum([
	"cover",
	"contain",
	"fill"
]);
var ImageInputSchema = z.object({
	url: z.string().nullable(),
	sourceKind: z.enum([
		"url",
		"dataUrl",
		"asset"
	]).default("url"),
	aspect: z.number().optional(),
	fit: ImageFitSchema.default("contain"),
	offsetX: z.number().default(0),
	offsetY: z.number().default(0),
	scale: z.number().default(1),
	rotation: z.number().default(0)
});
/**
* For typed chain inputs on `Node.inputs`. The codegen + UI both dispatch on
* the `image-input` kind: GeneratorNode/EffectNode bind it as a sampler2D
* (with companion meta/offset uniforms); ProcessingNode receives it as
* resolved data in `preprocess()`.
*/
function zImageInput() {
	return withMeta(ImageInputSchema, { kind: "image-input" });
}
var noImage = {
	url: null,
	sourceKind: "url",
	fit: "cover",
	offsetX: 0,
	offsetY: 0,
	scale: 1,
	rotation: 0
};
({ ...noImage });
//#endregion
//#region src/shaders/core/node.svelte.ts
function sanitizeName(name) {
	let sanitized = name.replace(/[^a-zA-Z0-9]/g, "");
	if (/^[0-9]/.test(sanitized)) sanitized = "l" + sanitized;
	if (!sanitized) sanitized = "layer";
	return sanitized;
}
var instanceCounter = 0;
function defaultId(typeId) {
	instanceCounter += 1;
	return `${typeId}-${Date.now().toString(36)}-${instanceCounter}`;
}
/**
* Abstract base. Do not extend directly — use GeneratorNode, EffectNode, or
* ProcessingNode.
*
* Generic over the inferred config + input shapes:
*   class Circle extends GeneratorNode<z.infer<typeof config>, z.infer<typeof inputs>> { … }
*
* The generics give `this.config` and `this.inputs` precise types and let
* `uniformName(key)` enforce that `key` is an actual field on either schema.
*/
var Node$1 = class {
	static typeId = "";
	static config;
	static inputs;
	static meta;
	id;
	config;
	inputs;
	blendMode;
	opacity;
	enabled;
	constructor(init = {}) {
		const cls = this.constructor;
		if (!cls.typeId) throw new Error(`Node subclass ${cls.name} is missing static typeId — set 'static typeId = "..."' on the class.`);
		this.id = init.id ?? defaultId(cls.typeId);
		this.config = init.config ? cls.config.parse(init.config) : cls.config.parse({});
		this.inputs = init.inputs ? cls.inputs.parse(init.inputs) : cls.inputs.parse({});
		this.blendMode = init.blendMode ?? cls.meta.defaultBlendMode;
		this.opacity = init.opacity ?? 1;
		this.enabled = init.enabled ?? true;
	}
	/** Static metadata accessor for the instance's class. */
	get cls() {
		return this.constructor;
	}
	get typeId() {
		return this.cls.typeId;
	}
	get meta() {
		return this.cls.meta;
	}
	/**
	* Override for the GLSL uniform prefix. The codegen sets this to a
	* human-readable slug (e.g. `voronoi`, `circle2`) before fragment emission,
	* so the emitted shader uses readable names. When unset, falls back to the
	* sanitized node id (which is stable but cryptic).
	*
	* @internal codegen-only.
	*/
	prefixOverride = null;
	/** GLSL-safe prefix for this instance's uniforms. */
	get prefix() {
		return this.prefixOverride ?? sanitizeName(this.id);
	}
	/**
	* Returns the generated uniform name for a config or input key. The key is
	* type-checked against the union of both schemas' fields, so a typo or
	* dropped field becomes a compile-time error inside `glsl()`:
	*
	*   const radius = this.uniformName('radius')   // ✓ if config has `radius`
	*   const oops   = this.uniformName('radiu')    // TS error
	*/
	uniformName(key) {
		return `u_${this.prefix}_${key}`;
	}
	/**
	* Discriminator for config fields that change the GLSL source (not just
	* uniform values). The shader-preview pipeline only rebuilds when the
	* scene's "structural key" changes; for nodes whose `glsl()` branches on
	* config (e.g. Gradient `type`, Halftone `style`), override this to return
	* a stable string of the relevant config slice. Default = no contribution.
	*/
	structuralKey() {
		return "";
	}
	toJSON() {
		return {
			id: this.id,
			typeId: this.typeId,
			config: this.config,
			inputs: this.inputs,
			blendMode: this.blendMode,
			opacity: this.opacity,
			enabled: this.enabled
		};
	}
};
/**
* Produces a color from `uv` alone (or sampled global resources like
* `u_noiseTexture`). Multiple consecutive GeneratorNodes co-render in one
* fragment shader and are blended together by the codegen.
*/
var GeneratorNode = class extends Node$1 {};
/**
* Receives the previous pass output. Always triggers an FBO split. Inside
* `main`, the previous color is bound to `vec4 base` and the previous-pass
* texture is `u_prevPass`.
*
* `glsl()` may return either a single GlslBlock (one pass) or an array of
* blocks (each becomes its own GLSL pass; each subsequent pass reads the
* preceding pass's output via `u_prevPass`). Use the array form for inherently
* multi-stage effects like a true separable Gaussian blur (horizontal then
* vertical) or an iterative simulation step.
*/
var EffectNode = class extends Node$1 {
	/**
	* Attachment scope. Subclasses override to restrict where they may be
	* placed (e.g. cursor-driven effects that need full canvas state set
	* `scope = 'scene'`).
	*/
	static scope = "both";
	/**
	* Source-kind constraint. Subclasses override to declare what generator
	* type they require — e.g. 'shape' for `shape-effects`.
	*/
	static appliesTo = ["any"];
};
function isGeneratorNode(node) {
	return node instanceof GeneratorNode;
}
function isEffectNode(node) {
	return node instanceof EffectNode;
}
/**
* Read the static `scope` field from an EffectNode subclass. Returns 'both'
* when the field isn't declared (the default). Generators / Processing nodes
* have no scope concept and return 'both' as a no-op.
*/
function getEffectScope(cls) {
	return cls.scope ?? "both";
}
/**
* Read the static `appliesTo` field from an EffectNode subclass. Returns
* `['any']` when not declared. Generators / Processing nodes have no
* applicability constraint and return `['any']` as a no-op.
*/
function getEffectAppliesTo(cls) {
	return cls.appliesTo ?? ["any"];
}
/**
* Map a generator's category to the source-kind used for effect-applicability
* checks. Anything outside `shapes`/`textures` is treated as 'any' so it
* doesn't accidentally exclude effects.
*/
function generatorSourceKind(cls) {
	const cat = cls.meta.category;
	if (cat === "shapes") return "shape";
	if (cat === "textures") return "texture";
	return "any";
}
//#endregion
//#region src/shaders/core/scene.svelte.ts
var layerCounter = 0;
function defaultLayerId() {
	layerCounter += 1;
	return `layer-${Date.now().toString(36)}-${layerCounter}`;
}
var Layer = class Layer {
	id;
	name = "";
	source = null;
	effects = [];
	blendMode = "normal";
	opacity = 1;
	enabled = true;
	useAsMask = false;
	children = [];
	constructor(init) {
		this.id = init.id ?? defaultLayerId();
		this.source = init.source;
		this.effects = init.effects ?? [];
		this.name = init.name ?? init.source.meta.name;
		this.blendMode = init.blendMode ?? init.source.blendMode;
		this.opacity = init.opacity ?? 1;
		this.enabled = init.enabled ?? true;
		this.useAsMask = init.useAsMask ?? false;
		this.children = init.children ?? [];
	}
	/** All GLSL nodes inside this layer, in render order. */
	get nodes() {
		return [this.source, ...this.effects];
	}
	toJSON() {
		return {
			id: this.id,
			name: this.name,
			source: this.source.toJSON(),
			effects: this.effects.map((e) => e.toJSON()),
			blendMode: this.blendMode,
			opacity: this.opacity,
			enabled: this.enabled,
			useAsMask: this.useAsMask,
			children: this.children.length > 0 ? this.children.map((c) => c.toJSON()) : void 0
		};
	}
	static fromJSON(json) {
		const source = deserializeNode(json.source);
		if (!isGeneratorNode(source)) throw new Error(`Layer "${json.id}" source must be a GeneratorNode (got ${json.source.typeId})`);
		const effects = json.effects.map((e) => {
			const node = deserializeNode(e);
			if (!isEffectNode(node)) throw new Error(`Layer "${json.id}" effect must be an EffectNode (got ${e.typeId})`);
			return node;
		});
		const children = (json.children ?? []).map((c) => Layer.fromJSON(c));
		return new Layer({
			id: json.id,
			name: json.name,
			source,
			effects,
			blendMode: json.blendMode,
			opacity: json.opacity,
			enabled: json.enabled,
			useAsMask: json.useAsMask ?? false,
			children
		});
	}
	clone() {
		return Layer.fromJSON(this.toJSON());
	}
};
var DEFAULT_BACKGROUND = [
	0,
	0,
	0,
	0
];
var Scene = class Scene {
	layers = [];
	postEffects = [];
	background = { color: [...DEFAULT_BACKGROUND] };
	constructor(init = {}) {
		this.layers = init.layers ?? [];
		this.postEffects = init.postEffects ?? [];
		this.background = init.background ?? { color: [...DEFAULT_BACKGROUND] };
	}
	/** Find a layer by id (recursive — searches into children). */
	findLayer(id) {
		const walk = (layers) => {
			for (const l of layers) {
				if (l.id === id) return l;
				const c = walk(l.children);
				if (c) return c;
			}
		};
		return walk(this.layers);
	}
	/** Find a layer's parent by id (or null if it's at the top level). */
	findLayerParent(id) {
		const walk = (layers, parent) => {
			for (const l of layers) {
				if (l.id === id) return parent;
				const c = walk(l.children, l);
				if (c !== void 0) return c;
			}
		};
		return walk(this.layers, null);
	}
	/**
	* Locate any GLSL node by id — the source or an effect of any layer (at any
	* depth), or a scene post-effect. Returns the node plus the layer that owns
	* it (`null` for scene post-effects).
	*/
	findNode(id) {
		const walk = (layers) => {
			for (const layer of layers) {
				if (layer.source.id === id) return {
					node: layer.source,
					layer
				};
				const fx = layer.effects.find((e) => e.id === id);
				if (fx) return {
					node: fx,
					layer
				};
				const found = walk(layer.children);
				if (found) return found;
			}
		};
		const found = walk(this.layers);
		if (found) return found;
		const sceneFx = this.postEffects.find((e) => e.id === id);
		if (sceneFx) return {
			node: sceneFx,
			layer: null
		};
	}
	/**
	* Enabled top-level layers in render order. Children are NOT included here
	* — use `flatLayers()` for the render-order traversal that drives the
	* compositor.
	*/
	get enabledLayers() {
		return this.layers.filter((l) => l.enabled);
	}
	/**
	* Flatten the layer tree into render order, parent-before-children. Each
	* entry carries its index in the flat list and the index of its clipping
	* parent (or null for un-clipped top-level layers). Disabled layers — and
	* any descendants of a disabled layer — are skipped.
	*/
	flatLayers() {
		const out = [];
		const walk = (layer, parentFlatIndex) => {
			if (!layer.enabled) return;
			const myIndex = out.length;
			out.push({
				layer,
				flatIndex: myIndex,
				parentFlatIndex
			});
			for (const child of layer.children) walk(child, myIndex);
		};
		for (const l of this.layers) walk(l, null);
		return out;
	}
	toJSON() {
		return {
			layers: this.layers.map((l) => l.toJSON()),
			postEffects: this.postEffects.map((e) => e.toJSON()),
			background: { color: [...this.background.color] }
		};
	}
	static fromJSON(json) {
		return new Scene({
			layers: json.layers.map((l) => Layer.fromJSON(l)),
			postEffects: (json.postEffects ?? []).map((e) => {
				const node = deserializeNode(e);
				if (!isEffectNode(node)) throw new Error(`Scene postEffect must be an EffectNode (got ${e.typeId})`);
				return node;
			}),
			background: json.background ?? { color: [...DEFAULT_BACKGROUND] }
		});
	}
	clone() {
		return Scene.fromJSON(this.toJSON());
	}
};
/**
* Bridge for Phase 1 — flatten a Scene back into a single ShaderChain so the
* existing codegen/runtime keeps working before scene-aware codegen lands in
* Phase 2. The flattening is "render-order naive": all layers' generators +
* effects in order, then scene post-effects. Multi-layer scenes will not
* render correctly through this path (effects bleed across layers); this
* bridge is only meant to keep the editor functional during the rewrite.
*/
function flattenSceneToChain(scene) {
	const out = [];
	for (const flat of scene.flatLayers()) {
		out.push(flat.layer.source);
		for (const fx of flat.layer.effects) out.push(fx);
	}
	for (const fx of scene.postEffects) out.push(fx);
	return out;
}
function chainToScene(chain) {
	return migrateChainNodes(chain.nodes);
}
/**
* Greedy chain → Scene migration. Walks the flat node list:
*   - Each GeneratorNode starts a new Layer.
*   - Each subsequent EffectNode (or ProcessingNode) attaches to the current
*     Layer until the next GeneratorNode or end of chain.
*   - Effects/Processing nodes that appear before any Generator are dropped
*     (a chain that starts with an Effect has no source to operate on; in
*     today's runtime that produces a transparent prev-pass, which we treat
*     as "no layer").
*
* Preserves today's visual output exactly when the chain has the common
* shape of one Generator at the head followed by Effects.
*/
function migrateChainNodes(nodes) {
	const layers = [];
	let current = null;
	const flush = () => {
		if (current) {
			layers.push(new Layer({
				source: current.source,
				effects: current.effects,
				blendMode: current.source.blendMode,
				opacity: current.source.opacity,
				enabled: current.source.enabled
			}));
			current = null;
		}
	};
	for (const node of nodes) {
		if (isGeneratorNode(node)) {
			flush();
			current = {
				source: node,
				effects: []
			};
			continue;
		}
		if (isEffectNode(node) && current) {
			current.effects.push(node);
			continue;
		}
	}
	flush();
	return new Scene({ layers });
}
//#endregion
//#region src/shaders/core/spatial.ts
/** Resolve a (possibly function-valued) spatial-controls declaration. */
function resolveSpatialControls(spec, config) {
	if (!spec) return [];
	return typeof spec === "function" ? spec(config) : spec;
}
//#endregion
//#region src/shaders/textures/aurora.ts
var config$103 = z.object({
	colorA: zColor().default([
		.65,
		.2,
		.97
	]).describe("Color A"),
	colorB: zColor().default([
		.13,
		.93,
		.53
	]).describe("Color B"),
	colorC: zColor().default([
		.09,
		.58,
		.91
	]).describe("Color C"),
	balance: zFloat(0, 100, 1).default(50).describe("Balance"),
	intensity: zFloat(0, 200, 1).default(80).describe("Intensity"),
	curtainCount: zInt(1, 8).default(4).describe("Curtain Count"),
	speed: zFloat(0, 20, .1).default(5).describe("Speed"),
	waviness: zFloat(0, 100, 1).default(50).describe("Waviness"),
	rayDensity: zFloat(0, 100, 1).default(20).describe("Ray Density"),
	height: zFloat(0, 200, 1).default(120).describe("Height"),
	center: zCenter().default([.5, 0]).describe("Center"),
	seed: zFloat(0, 10, .01).default(0).describe("Seed")
});
var inputs$103 = z.object({});
var meta$103 = {
	name: "Aurora",
	description: "Layered aurora curtains with vertical rays and flowing light",
	color: "#22ee88",
	category: "textures",
	defaultBlendMode: "normal"
};
var Aurora = class extends GeneratorNode {
	static typeId = "aurora";
	static config = config$103;
	static inputs = inputs$103;
	static meta = meta$103;
	glsl() {
		const colorA = this.uniformName("colorA");
		const colorB = this.uniformName("colorB");
		const colorC = this.uniformName("colorC");
		const balance = this.uniformName("balance");
		const intensity = this.uniformName("intensity");
		const curtainCount = this.uniformName("curtainCount");
		const speed = this.uniformName("speed");
		const waviness = this.uniformName("waviness");
		const rayDensity = this.uniformName("rayDensity");
		const height = this.uniformName("height");
		const center = this.uniformName("center");
		const seed = this.uniformName("seed");
		return { main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
// Docs convention: center.y=0 anchors the aurora to the visual top, with depth
// extending downward. WebGL uv.y=0 is the visual bottom, so flip y on intake.
vec2 uvTd = vec2(uv.x, 1.0 - uv.y);
vec2 p = (uvTd - ${center}) * _ar;
float t = u_time * (${speed} * 0.04) + ${seed};

float wav = ${waviness} / 100.0;
float bal = ${balance} / 100.0;
float h01 = max(${height} / 100.0, 0.001);

// Each curtain is a vertical sheet whose X-position varies smoothly with Y.
// Pure sin-only motion — no fbm — so contours stay clean, not lumpy.
float aur = 0.0;
float layers = float(${curtainCount});
for (int i = 0; i < 8; i++) {
  if (float(i) >= layers) break;
  float fi = float(i);
  float layerKey = (fi + 0.5) / max(layers, 1.0) - 0.5;
  float phase = fi * 1.7 + ${seed};

  float xCurtain = layerKey * 0.7;
  xCurtain += sin(p.y * 2.5 + phase + t * 1.2) * 0.22 * wav;
  xCurtain += sin(p.y * 5.0 - phase * 1.7 + t * 0.7) * 0.10 * wav;

  float dx = abs(p.x - xCurtain);
  float w = 0.20 + 0.04 * sin(p.y * 3.0 + phase);
  float coreH = exp(-pow(dx / max(w, 0.02), 2.0));

  // Animated falloff: the effective bottom of the aurora ripples across X
  // and time. Two harmonics + a per-layer phase keep the wave from feeling
  // like one rigid sine.
  float hWave = sin(p.x * 1.6 + t * 0.9 + phase) * 0.18
              + sin(p.x * 3.4 - t * 0.6 + phase * 1.3) * 0.08;
  float hLocal = h01 * (1.0 + hWave);
  float vFade = smoothstep(-0.02, 0.12, p.y)
              * pow(clamp(1.0 - p.y / max(hLocal, 0.05), 0.0, 1.0), 1.4);

  // Screen-blend curtains so overlaps don't accumulate past 1.0 into a
  // saturated "burn hole" where the depth color shows through at full power.
  float layer = coreH * vFade;
  aur = 1.0 - (1.0 - aur) * (1.0 - layer);
}

// Subtle vertical-ray modulation — pure sin, no fbm, low contrast.
float rayN = clamp(${rayDensity} / 100.0, 0.0, 1.0);
float rays = 0.5 + 0.5 * sin(uv.x * (3.0 + ${rayDensity} * 0.10) * 6.28318);
aur *= mix(1.0, 0.92 + 0.16 * rays, rayN);

aur *= ${intensity} / 100.0;

// Animated depth: the color ramp's vertical position rides a slow horizontal
// wave so the A→B transition band undulates instead of sitting on a fixed Y.
float depthShift = sin(p.x * 1.4 + t * 0.65) * 0.10
                 + sin(p.x * 2.7 - t * 0.45) * 0.05;
float depth = clamp(p.y / h01 + depthShift, 0.0, 1.0);
float k1 = smoothstep(0.0, mix(0.20, 0.60, bal), depth);
float k2 = smoothstep(mix(0.40, 0.85, bal), 1.0, depth);
vec3 col = mix(${colorA}, ${colorB}, k1);
col = mix(col, ${colorC}, k2);

// Subtle dim at the A↔B midpoint — keeps the natural cyan transition from
// reading as a hot bright blob.
float midDim = exp(-pow((k1 - 0.5) / 0.22, 2.0)) * (1.0 - smoothstep(0.7, 1.0, k2));
col *= 1.0 - 0.18 * midDim;

float a = clamp(aur, 0.0, 1.0);
return vec4(col * a, a);` };
	}
};
register(Aurora);
//#endregion
//#region src/shaders/textures/beam.ts
var config$102 = z.object({
	startX: zFloat(0, 1).default(.2).describe("Start X"),
	startY: zFloat(0, 1).default(.5).describe("Start Y"),
	endX: zFloat(0, 1).default(.8).describe("End X"),
	endY: zFloat(0, 1).default(.5).describe("End Y"),
	softness: zFloat(0, 1).default(.3).describe("Softness"),
	intensity: zFloat(0, 2).default(1).describe("Intensity"),
	color1: zColor().default([
		1,
		.5,
		.2
	]).describe("Color 1"),
	color2: zColor().default([
		.2,
		.5,
		1
	]).describe("Color 2")
});
var inputs$102 = z.object({});
var meta$102 = {
	name: "Beam",
	description: "Soft directional light beam between two points",
	color: "#fde68a",
	category: "textures",
	defaultBlendMode: "add"
};
var Beam = class extends GeneratorNode {
	static typeId = "beam";
	static config = config$102;
	static inputs = inputs$102;
	static meta = meta$102;
	glsl() {
		return {
			dependencies: ["sdSegment"],
			main: `
float aspect = u_resolution.x / max(u_resolution.y, 1.0);
vec2 s = vec2(${this.uniformName("startX")} * aspect, ${this.uniformName("startY")});
vec2 e = vec2(${this.uniformName("endX")} * aspect, ${this.uniformName("endY")});
vec2 p = vec2(uv.x * aspect, uv.y);
vec2 ba = e - s;
vec2 pa = p - s;
float lenSq = max(dot(ba, ba), 1e-6);
float t = clamp(dot(pa, ba) / lenSq, 0.0, 1.0);
float d = sdSegment(p, s, e);
float soft = max(${this.uniformName("softness")}, 1e-4);
float a = (1.0 - smoothstep(0.0, soft, d)) * ${this.uniformName("intensity")};
vec3 col = mix(${this.uniformName("color1")}, ${this.uniformName("color2")}, t);
return vec4(col * a, a);`
		};
	}
};
register(Beam);
//#endregion
//#region src/shaders/textures/blob.ts
var config$101 = z.object({
	colorA: zColor().default([
		1,
		.42,
		.21
	]).describe("Color A"),
	colorB: zColor().default([
		.91,
		.12,
		.39
	]).describe("Color B"),
	size: zFloat(0, 1).default(.5).describe("Size"),
	deformation: zFloat(0, 1).default(.5).describe("Deformation"),
	softness: zFloat(0, 1).default(.5).describe("Softness"),
	highlightIntensity: zFloat(0, 1).default(.5).describe("Highlight Intensity"),
	highlightX: zFloat(-1, 1).default(.3).describe("Highlight X"),
	highlightY: zFloat(-1, 1).default(-.3).describe("Highlight Y"),
	highlightZ: zFloat(0, 1).default(.4).describe("Highlight Z"),
	highlightColor: zColor().default([
		1,
		.88,
		.1
	]).describe("Highlight Color"),
	speed: zFloat(0, 4, .05).default(.5).describe("Speed"),
	seed: zFloat(0, 100, .1).default(1).describe("Seed"),
	center: zCenter().default([.5, .5]).describe("Center")
});
var inputs$101 = z.object({});
var meta$101 = {
	name: "Blob",
	description: "Organic animated blob with 3D lighting and gradients",
	color: "#ff6b35",
	category: "textures",
	defaultBlendMode: "normal"
};
var Blob$1 = class extends GeneratorNode {
	static typeId = "blob";
	static config = config$101;
	static inputs = inputs$101;
	static meta = meta$101;
	glsl() {
		const colorA = this.uniformName("colorA");
		const colorB = this.uniformName("colorB");
		const size = this.uniformName("size");
		const deformation = this.uniformName("deformation");
		const softness = this.uniformName("softness");
		const hlIntensity = this.uniformName("highlightIntensity");
		const hlX = this.uniformName("highlightX");
		const hlY = this.uniformName("highlightY");
		const hlZ = this.uniformName("highlightZ");
		const hlColor = this.uniformName("highlightColor");
		const speed = this.uniformName("speed");
		const seed = this.uniformName("seed");
		return {
			dependencies: ["fbm", "simplex2D"],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - ${this.uniformName("center")}) * _ar;
float t = u_time * ${speed};
float r0 = ${size} * 0.45 + 0.05;

float ang = atan(p.y, p.x);
float def = ${deformation};
float warp = 0.0;
warp += sin(ang * 3.0 + t * 0.7 + ${seed}) * 0.18;
warp += sin(ang * 5.0 - t * 1.1 + ${seed} * 1.7) * 0.10;
warp += fbm(vec2(cos(ang), sin(ang)) * 2.0 + t * 0.2 + ${seed}, 3.0, 2.0, 0.5) * 0.25;
float radius = r0 * (1.0 + warp * def);

float d = length(p) - radius;
float edge = mix(0.005, 0.20, ${softness});
float mask = 1.0 - smoothstep(-edge, edge, d);

float fill = clamp(length(p) / max(radius, 1e-4), 0.0, 1.0);
vec3 bg = mix(${colorA}, ${colorB}, fill);

float inside = clamp(-d / max(radius, 1e-4), 0.0, 1.0);
float h = sqrt(max(inside, 0.0));
vec2 grad = vec2(dFdx(d), dFdy(d));
vec3 N = normalize(vec3(-grad * 4.0, max(h, 0.001)));
vec3 L = normalize(vec3(${hlX}, ${hlY}, max(${hlZ}, 0.05)));
float spec = pow(max(dot(N, L), 0.0), 24.0);
vec3 hilite = ${hlColor} * spec * ${hlIntensity} * 1.6;

vec3 col = bg + hilite * mask;
return vec4(col * mask, mask);`
		};
	}
};
register(Blob$1);
//#endregion
//#region src/shaders/textures/checkerboard.ts
var config$100 = z.object({
	scale: zFloat(1, 64, .5).default(8).describe("Scale"),
	rotation: zAngle().default(0).describe("Rotation"),
	softness: zFloat(0, 1).default(0).describe("Softness"),
	color1: zColor().default([
		.05,
		.05,
		.05
	]).describe("Color 1"),
	color2: zColor().default([
		.95,
		.95,
		.95
	]).describe("Color 2")
});
var inputs$100 = z.object({});
var meta$100 = {
	name: "Checkerboard",
	description: "Two-tone tiled checker pattern (softness=1 for sinusoidal blend)",
	color: "#0ea5e9",
	category: "textures",
	defaultBlendMode: "normal"
};
var Checkerboard = class extends GeneratorNode {
	static typeId = "checkerboard";
	static config = config$100;
	static inputs = inputs$100;
	static meta = meta$100;
	glsl() {
		const scale = this.uniformName("scale");
		return {
			dependencies: ["aastep", "rotate2D"],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
p = rotate2D(p, ${this.uniformName("rotation")} * 3.14159 / 180.0);
vec2 cell = floor(p * ${scale});
float hard = mod(cell.x + cell.y, 2.0);
float soft = 0.5 + 0.5 * sin(p.x * 3.14159 * ${scale}) * cos(p.y * 3.14159 * ${scale});
float m = mix(hard, soft, ${this.uniformName("softness")});
return vec4(mix(${this.uniformName("color1")}, ${this.uniformName("color2")}, m), 1.0);`
		};
	}
};
register(Checkerboard);
//#endregion
//#region src/shaders/textures/domtexture.ts
var config$99 = z.object({ placeholder: zColor().default([
	.4,
	.4,
	.45
]).describe("Placeholder Color") });
var inputs$99 = z.object({});
var meta$99 = {
	name: "DOM Texture",
	description: "Render live HTML/DOM content as a WebGPU texture layer (experimental)",
	color: "#64748b",
	category: "textures",
	defaultBlendMode: "normal"
};
var DomTexture = class extends GeneratorNode {
	static typeId = "dom-texture";
	static config = config$99;
	static inputs = inputs$99;
	static meta = meta$99;
	glsl() {
		return { main: `return vec4(${this.uniformName("placeholder")}, 1.0);` };
	}
};
register(DomTexture);
//#endregion
//#region src/shaders/textures/dot-grid.ts
var config$98 = z.object({
	color: zColor().default([
		1,
		1,
		1
	]).describe("Color"),
	density: zFloat(2, 200, 1).default(30).describe("Density"),
	dotSize: zFloat(0, 1).default(.3).describe("Dot Size"),
	twinkle: zFloat(0, 1).default(0).describe("Twinkle")
});
var inputs$98 = z.object({});
var meta$98 = {
	name: "Dot Grid",
	description: "Grid of dots with optional twinkling animation",
	color: "#0ea5e9",
	category: "textures",
	defaultBlendMode: "normal"
};
var DotGrid = class extends GeneratorNode {
	static typeId = "dot-grid";
	static config = config$98;
	static inputs = inputs$98;
	static meta = meta$98;
	glsl() {
		const color = this.uniformName("color");
		return {
			dependencies: ["hash21"],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 q = uv * _ar * ${this.uniformName("density")};
vec2 cellId = floor(q);
vec2 cellUv = fract(q) - 0.5;
float d = length(cellUv);
float sz = clamp(${this.uniformName("dotSize")}, 0.0, 1.0) * 0.5;
float aa = fwidth(d);
float dot_ = 1.0 - smoothstep(sz - aa, sz + aa, d);
float tw = 0.5 + 0.5 * sin(u_time * 3.0 + hash21(cellId) * 6.2831);
float a = dot_ * mix(1.0, tw, ${this.uniformName("twinkle")});
return vec4(${color} * a, a);`
		};
	}
};
register(DotGrid);
//#endregion
//#region src/shaders/textures/falling-lines.ts
var config$97 = z.object({
	colorA: zColorRgba().default([
		1,
		1,
		1,
		1
	]).describe("Color A"),
	colorB: zColorRgba().default([
		1,
		1,
		1,
		0
	]).describe("Color B"),
	angle: zAngle(1).default(90).describe("Angle"),
	speed: zFloat(0, 4, .05).default(.5).describe("Speed"),
	speedVariance: zFloat(0, 1).default(.3).describe("Speed Variance"),
	density: zFloat(2, 100, 1).default(15).describe("Density"),
	trailLength: zFloat(0, 1).default(.35).describe("Trail Length"),
	balance: zFloat(0, 1).default(.5).describe("Balance"),
	strokeWidth: zFloat(0, 1).default(.15).describe("Stroke Width"),
	rounding: zFloat(0, 1).default(1).describe("Rounding")
});
var inputs$97 = z.object({});
var meta$97 = {
	name: "Falling Lines",
	description: "Directional falling lines with a leading-to-trailing color fade",
	color: "#0ea5e9",
	category: "textures",
	defaultBlendMode: "normal"
};
var FallingLines = class extends GeneratorNode {
	static typeId = "falling-lines";
	static config = config$97;
	static inputs = inputs$97;
	static meta = meta$97;
	glsl() {
		const colorA = this.uniformName("colorA");
		const colorB = this.uniformName("colorB");
		const angle = this.uniformName("angle");
		const speed = this.uniformName("speed");
		const speedVariance = this.uniformName("speedVariance");
		const density = this.uniformName("density");
		const trailLength = this.uniformName("trailLength");
		const balance = this.uniformName("balance");
		return {
			dependencies: ["hash21", "rotate2D"],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
p = rotate2D(p, -(${angle} - 90.0) * 3.14159265 / 180.0);
float dens = ${density};
float colId = floor(p.x * dens);
float jitter = hash21(vec2(colId, 7.0));
float jSpeed = mix(1.0 - ${speedVariance}, 1.0 + ${speedVariance}, jitter);
float yOff = u_time * ${speed} * 0.6 * jSpeed + jitter * 9.7;
float spacing = max(${trailLength} * 1.6, 0.05);
float lane = fract(p.y + yOff) / spacing;
float along = clamp(lane, 0.0, 1.0);
float on = step(lane, 1.0);
float xLocal = (fract(p.x * dens) - 0.5) * 2.0;
float halfW = clamp(${this.uniformName("strokeWidth")}, 0.001, 1.0);
float stroke = 1.0 - smoothstep(halfW * 0.95, halfW, abs(xLocal));
// Round leading cap.
float cap = 1.0 - smoothstep(0.95, 1.0, along);
float roundCap = mix(1.0, cap, ${this.uniformName("rounding")});
float lineMask = stroke * on * roundCap;
float mixT = mix(along, smoothstep(0.0, 1.0, along), 1.0);
mixT = clamp(mixT + (${balance} - 0.5), 0.0, 1.0);
vec4 col = mix(${colorA}, ${colorB}, mixT);
return vec4(col.rgb * lineMask * col.a, col.a * lineMask);`
		};
	}
};
register(FallingLines);
//#endregion
//#region src/shaders/textures/floating-particles.ts
var config$96 = z.object({
	randomness: zFloat(0, 1).default(.9).describe("Randomness"),
	speed: zFloat(0, 4, .05).default(.3).describe("Speed"),
	angle: zAngle(1).default(90).describe("Angle"),
	rotation: zAngle(1).default(0).describe("Rotation"),
	particleSize: zFloat(0, 4, .01).default(.6).describe("Particle Size"),
	particleSoftness: zFloat(0, 1).default(.85).describe("Particle Softness"),
	sizeVariance: zFloat(0, 1).default(.7).describe("Size Variance"),
	sway: zFloat(0, 1).default(.4).describe("Sway"),
	twinkle: zFloat(0, 1).default(.6).describe("Twinkle"),
	count: zInt(1, 12).default(5).describe("Layer Count"),
	particleColor: zColor().default([
		1,
		1,
		1
	]).describe("Particle Color"),
	speedVariance: zFloat(0, 1).default(.5).describe("Speed Variance"),
	angleVariance: zFloat(0, 180, 1).default(15).describe("Angle Variance"),
	particleDensity: zFloat(.5, 12, .1).default(2.5).describe("Particle Density")
});
var inputs$96 = z.object({});
var meta$96 = {
	name: "Floating Particles",
	description: "Animated floating particles with twinkle effects",
	color: "#fbbf24",
	category: "textures",
	defaultBlendMode: "normal"
};
var FloatingParticles = class extends GeneratorNode {
	static typeId = "floating-particles";
	static config = config$96;
	static inputs = inputs$96;
	static meta = meta$96;
	glsl() {
		const randomness = this.uniformName("randomness");
		const speed = this.uniformName("speed");
		const angle = this.uniformName("angle");
		const rotation = this.uniformName("rotation");
		const particleSize = this.uniformName("particleSize");
		const particleSoftness = this.uniformName("particleSoftness");
		const sizeVariance = this.uniformName("sizeVariance");
		const sway = this.uniformName("sway");
		const twinkle = this.uniformName("twinkle");
		const count = this.uniformName("count");
		const particleColor = this.uniformName("particleColor");
		const speedVariance = this.uniformName("speedVariance");
		return {
			dependencies: [
				"hash21",
				"hash22",
				"rotate2D"
			],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec3 accum = vec3(0.0);
float alphaSum = 0.0;
float layers = float(${count});
float baseAng = radians(${angle});
float angVar = radians(${this.uniformName("angleVariance")});
for (int i = 0; i < 12; i++) {
  if (float(i) >= layers) break;
  float fi = float(i);
  float layerKey = fi / max(layers, 1.0);
  float layerHash = hash21(vec2(fi * 7.13, 1.7));

  float layerSpeed = mix(1.0 - ${speedVariance}, 1.0 + ${speedVariance}, layerHash);
  float layerAng = baseAng + (layerHash - 0.5) * 2.0 * angVar;
  vec2 dir = vec2(cos(layerAng), sin(layerAng));
  vec2 drift = dir * u_time * ${speed} * 0.06 * layerSpeed;

  float dens = ${this.uniformName("particleDensity")} * (1.0 + 0.4 * layerKey);
  vec2 cellSpace = rotate2D((uv - 0.5) * _ar, radians(${rotation})) + 0.5;
  vec2 q = cellSpace * dens - drift;
  vec2 cellId = floor(q);
  vec2 cellUv = fract(q);

  // Sample a 3x3 neighborhood so particles can drift beyond cell bounds
  // and break up the visible grid pattern.
  float layerAlpha = 0.0;
  for (int oy = -1; oy <= 1; oy++) {
    for (int ox = -1; ox <= 1; ox++) {
      vec2 off = vec2(float(ox), float(oy));
      vec2 nId = cellId + off;
      vec2 h = hash22(nId + fi * 31.0);
      vec2 h2 = hash22(nId * 0.91 + fi * 17.3);

      // Per-particle jitter inside its home cell.
      vec2 jitter = (h - 0.5) * ${randomness};
      // Per-particle horizontal sway (perpendicular to drift direction).
      vec2 perp = vec2(-dir.y, dir.x);
      float swayPhase = h2.x * 6.2831 + u_time * (0.6 + h2.y * 1.2);
      vec2 swayOff = perp * sin(swayPhase) * ${sway} * 0.35;

      vec2 cp = vec2(0.5) + jitter + swayOff;
      float d = distance(cellUv - off, cp);

      // Per-particle size variation — dust comes in many sizes.
      float sizeMul = mix(1.0 - ${sizeVariance}, 1.0, h2.x);
      float pr = mix(0.02, 0.18, clamp(${particleSize}, 0.0, 4.0) * 0.25) * sizeMul;
      float soft = mix(0.0008, pr, ${particleSoftness});
      float dot_ = 1.0 - smoothstep(pr - soft, pr, d);

      float tw = 0.5 + 0.5 * sin(u_time * 2.2 * (0.6 + h.y) + h2.x * 6.2831);
      float a = dot_ * mix(1.0, tw, ${twinkle});

      layerAlpha = max(layerAlpha, a);
    }
  }

  accum += ${particleColor} * layerAlpha;
  alphaSum = max(alphaSum, layerAlpha);
}
float aOut = clamp(alphaSum, 0.0, 1.0);
return vec4(accum, aOut);`
		};
	}
};
register(FloatingParticles);
//#endregion
//#region src/shaders/textures/flowing-gradient.ts
var config$95 = z.object({
	colorA: zColor().default([
		.04,
		0,
		.08
	]).describe("Color A"),
	colorB: zColor().default([
		.42,
		.09,
		.9
	]).describe("Color B"),
	colorC: zColor().default([
		1,
		.3,
		.42
	]).describe("Color C"),
	colorD: zColor().default([
		1,
		.42,
		.21
	]).describe("Color D"),
	speed: zFloat(0, 4, .05).default(1).describe("Speed"),
	distortion: zFloat(0, 1).default(.5).describe("Distortion"),
	seed: zFloat(0, 100, .1).default(0).describe("Seed")
});
var inputs$95 = z.object({});
var meta$95 = {
	name: "Flowing Gradient",
	description: "Liquid silk gradient with organic flowing color bands",
	color: "#6b17e6",
	category: "textures",
	defaultBlendMode: "normal"
};
var FlowingGradient = class extends GeneratorNode {
	static typeId = "flowing-gradient";
	static config = config$95;
	static inputs = inputs$95;
	static meta = meta$95;
	glsl() {
		const colorA = this.uniformName("colorA");
		const colorB = this.uniformName("colorB");
		const colorC = this.uniformName("colorC");
		const colorD = this.uniformName("colorD");
		const speed = this.uniformName("speed");
		const distortion = this.uniformName("distortion");
		return {
			dependencies: ["fbm", "simplex2D"],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
float t = u_time * ${speed} * 0.15 + ${this.uniformName("seed")};

float warp = ${distortion} * 1.6;
vec2 q = p + warp * vec2(
  fbm(p * 0.8 + vec2(0.0, t), 2.0, 2.0, 0.5),
  fbm(p * 0.8 + vec2(t, 0.0), 2.0, 2.0, 0.5)
);
vec2 r = p + warp * vec2(
  fbm(q * 1.0 + vec2(t * 1.3, 0.0), 2.0, 2.0, 0.5),
  fbm(q * 1.0 + vec2(0.0, t * 1.1), 2.0, 2.0, 0.5)
);

float band = fbm(r * 0.9 + t, 2.0, 2.0, 0.5);
float k = clamp(0.5 + 0.5 * band, 0.0, 1.0);

// Stepped 4-color ramp.
vec3 col;
if (k < 0.333) {
  col = mix(${colorA}, ${colorB}, k * 3.0);
} else if (k < 0.666) {
  col = mix(${colorB}, ${colorC}, (k - 0.333) * 3.0);
} else {
  col = mix(${colorC}, ${colorD}, (k - 0.666) * 3.0);
}
return vec4(col, 1.0);`
		};
	}
};
register(FlowingGradient);
//#endregion
//#region src/shaders/textures/gradient.ts
var config$94 = z.object({
	type: z.enum([
		"linear",
		"radial",
		"conic",
		"diamond"
	]).default("linear").describe("Type"),
	colorA: zColor().default([
		.1,
		1,
		0
	]).describe("Color A"),
	colorB: zColor().default([
		0,
		0,
		1
	]).describe("Color B"),
	start: zVisibleWhen(zVec2().default([0, .5]), { type: ["linear"] }).describe("Start"),
	end: zVisibleWhen(zVec2().default([1, .5]), { type: ["linear"] }).describe("End"),
	edges: zVisibleWhen(zEdges().default("stretch"), { type: ["linear"] }).describe("Edges"),
	center: zVisibleWhen(zCenter().default([.5, .5]), { type: [
		"radial",
		"conic",
		"diamond"
	] }).describe("Center"),
	radius: zVisibleWhen(zFloat(0, 2, .01).default(.5), { type: ["radial"] }).describe("Radius"),
	aspect: zVisibleWhen(zFloat(.1, 4, .01).default(1), { type: ["radial"] }).describe("Aspect"),
	size: zVisibleWhen(zFloat(.05, 2, .01).default(.7), { type: ["diamond"] }).describe("Size"),
	roundness: zVisibleWhen(zFloat(0, 1).default(0), { type: ["diamond"] }).describe("Roundness"),
	rotation: zVisibleWhen(zAngle().default(0), { type: [
		"linear",
		"radial",
		"conic",
		"diamond"
	] }).describe("Rotation"),
	repeat: zVisibleWhen(zFloat(1, 12, .5).default(1), { type: [
		"radial",
		"conic",
		"diamond"
	] }).describe("Repeat")
});
var inputs$94 = z.object({});
var meta$94 = {
	name: "Gradient",
	description: "Linear, radial, conic, or diamond gradient between two colors",
	color: "#f97316",
	category: "textures",
	defaultBlendMode: "normal"
};
var Gradient = class extends GeneratorNode {
	static typeId = "gradient";
	static config = config$94;
	static inputs = inputs$94;
	static meta = meta$94;
	static spatialControls = (cfg) => {
		switch (cfg.type ?? "linear") {
			case "linear": return [{
				kind: "segmentVec2",
				from: "start",
				to: "end",
				colorFrom: "colorA",
				colorTo: "colorB",
				label: "Gradient line"
			}];
			case "radial": return [{
				kind: "radiusVec2",
				center: "center",
				r: "radius",
				color: "colorA",
				label: "Radius"
			}];
			case "conic":
			case "diamond": return [{
				kind: "pointVec2",
				key: "center",
				color: "colorA",
				label: "Center"
			}];
		}
	};
	structuralKey() {
		return `${this.config.type}|${this.config.edges}`;
	}
	glsl() {
		const colorA = this.uniformName("colorA");
		const colorB = this.uniformName("colorB");
		const rotation = this.uniformName("rotation");
		const type = this.config.type;
		if (type === "linear") {
			const start = this.uniformName("start");
			const end = this.uniformName("end");
			const edges = this.config.edges;
			let edgeBlock;
			switch (edges) {
				case "stretch":
					edgeBlock = `t = clamp(t, 0.0, 1.0);`;
					break;
				case "transparent":
					edgeBlock = `if (t < 0.0 || t > 1.0) return vec4(0.0);`;
					break;
				case "mirror":
					edgeBlock = `float _m = mod(abs(t), 2.0); t = (_m > 1.0) ? (2.0 - _m) : _m;`;
					break;
				case "wrap":
					edgeBlock = `t = fract(t);`;
					break;
			}
			return {
				dependencies: ["rotate2D"],
				main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 s = ${start} * _ar;
vec2 e = ${end} * _ar;
vec2 p = uv * _ar;
vec2 dir = e - s;
float L = max(length(dir), 1e-4);
vec2 nDir = dir / L;
nDir = rotate2D(nDir, ${rotation} * 3.14159 / 180.0);
float t = dot(p - s, nDir) / L;
${edgeBlock}
vec3 col = mix(${colorA}, ${colorB}, t);
return vec4(col, 1.0);`
			};
		}
		if (type === "radial") {
			const center = this.uniformName("center");
			const radius = this.uniformName("radius");
			const repeat = this.uniformName("repeat");
			return {
				dependencies: ["rotate2D"],
				main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - ${center}) * _ar;
p = rotate2D(p, ${rotation} * 3.14159 / 180.0);
p.x /= max(${this.uniformName("aspect")}, 1e-4);
float r = length(p) / max(${radius}, 1e-4);
float t = fract(r * ${repeat});
float k = 0.5 - 0.5 * cos(t * 6.28318530);
vec3 col = mix(${colorA}, ${colorB}, k);
return vec4(col, 1.0);`
			};
		}
		if (type === "conic") return { main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - ${this.uniformName("center")}) * _ar;
float a = atan(p.y, p.x) + 3.14159265;
float t = fract((a / 6.28318530 + ${rotation} / 360.0) * ${this.uniformName("repeat")});
vec3 col = mix(${colorA}, ${colorB}, t);
return vec4(col, 1.0);` };
		const center = this.uniformName("center");
		const size = this.uniformName("size");
		const repeat = this.uniformName("repeat");
		return {
			dependencies: ["rotate2D"],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - ${center}) * _ar;
p = rotate2D(p, ${rotation} * 3.14159 / 180.0);
float manhattan = abs(p.x) + abs(p.y);
float chebyshev = max(abs(p.x), abs(p.y)) * 2.0;
float d = mix(manhattan, chebyshev, ${this.uniformName("roundness")}) / max(${size}, 1e-4);
float t = fract(d * ${repeat});
float k = 0.5 - 0.5 * cos(t * 6.28318530);
vec3 col = mix(${colorA}, ${colorB}, k);
return vec4(col, 1.0);`
		};
	}
};
register(Gradient);
//#endregion
//#region src/shaders/textures/godrays.ts
var config$93 = z.object({
	rayColor: zColorRgba().default([
		.26,
		.51,
		.98,
		1
	]).describe("Ray Color"),
	backgroundColor: zColorRgba().default([
		0,
		0,
		0,
		0
	]).describe("Background Color"),
	center: zCenter(2).default([0, 0]).describe("Center"),
	density: zFloat(0, 1, .01).default(.3).describe("Density"),
	intensity: zFloat(0, 1, .01).default(.8).describe("Intensity"),
	spotty: zFloat(0, 1, .01).default(1).describe("Spotty"),
	speed: zFloat(0, 2, .05).default(.5).describe("Speed")
});
var inputs$93 = z.object({});
var meta$93 = {
	name: "God Rays",
	description: "Volumetric light rays emanating from a point",
	color: "#facc15",
	category: "textures",
	defaultBlendMode: "add"
};
var GodRays = class extends GeneratorNode {
	static typeId = "godrays";
	static config = config$93;
	static inputs = inputs$93;
	static meta = meta$93;
	glsl() {
		const rayColor = this.uniformName("rayColor");
		const backgroundColor = this.uniformName("backgroundColor");
		const center = this.uniformName("center");
		const density = this.uniformName("density");
		const intensity = this.uniformName("intensity");
		return {
			dependencies: ["valueNoise"],
			main: `
float aspect = u_resolution.x / u_resolution.y;
vec2 centerUV = ${center} * 0.5 + 0.5;
vec2 delta = uv - centerUV;
vec2 shapeUV = vec2(delta.x * aspect, delta.y);
float radius = length(shapeUV);
float angle = atan(shapeUV.y, shapeUV.x);
float angleWrapped = mod(angle, 6.2831853);
float blend = smoothstep(-0.15, 0.15, shapeUV.x);
float spots = 6.5 * abs(${this.uniformName("spotty")});
float intensityExp = 4.0 - 3.0 * clamp(${intensity}, 0.0, 1.0);
float dens = 6.0 * ${density};
float animTime = u_time * ${this.uniformName("speed")} * 0.2;

float r1 = radius - animTime * 3.0;
float r2 = radius * 0.5 * (1.0 + spots) - animTime * 2.0;
float f1 = dens * 5.0;
float nL1 = pow(valueNoise(vec2(angle * f1, r1)), intensityExp);
float nR1 = pow(valueNoise(vec2(angleWrapped * f1, r1)), intensityExp);
float rayA = mix(nR1, nL1, blend);
float nL1b = pow(valueNoise(vec2(angle * f1 * 4.0, r2)), intensityExp);
float nR1b = pow(valueNoise(vec2(angleWrapped * f1 * 4.0, r2)), intensityExp);
rayA *= mix(nR1b, nL1b, blend);

float r3 = radius * 1.4 - animTime * 2.5;
float r4 = radius * 0.7 * (1.0 + spots) - animTime * 1.8;
float f2 = dens * 4.5;
float nL2 = pow(valueNoise(vec2(angle * f2, r3)), intensityExp);
float nR2 = pow(valueNoise(vec2(angleWrapped * f2, r3)), intensityExp);
float rayB = mix(nR2, nL2, blend);
float nL2b = pow(valueNoise(vec2(angle * f2 * 3.5, r4)), intensityExp);
float nR2b = pow(valueNoise(vec2(angleWrapped * f2 * 3.5, r4)), intensityExp);
rayB *= mix(nR2b, nL2b, blend);

float rayEffect = clamp(rayA + rayB * 0.7, 0.0, 1.0);

vec4 rc = ${rayColor};
vec4 bg = ${backgroundColor};
float rayAlpha = rayEffect * rc.a;
float finalAlpha = rayAlpha + bg.a * (1.0 - rayAlpha);
vec3 rayContribution = rc.rgb * rayAlpha;
vec3 bgContribution = bg.rgb * bg.a * (1.0 - rayAlpha);
return vec4(rayContribution + bgContribution, finalAlpha);`
		};
	}
};
register(GodRays);
//#endregion
//#region src/shaders/textures/grid.ts
var config$92 = z.object({
	color: zColorRgba().default([
		1,
		1,
		1,
		1
	]).describe("Color"),
	cells: zInt(1, 100).default(10).describe("Cells"),
	thickness: zFloat(0, 1).default(1).describe("Thickness"),
	rotation: zAngle().default(0).describe("Rotation")
});
var inputs$92 = z.object({});
var meta$92 = {
	name: "Grid",
	description: "Simple grid lines pattern with adjustable thickness and rotation",
	color: "#0ea5e9",
	category: "textures",
	defaultBlendMode: "normal"
};
var Grid = class extends GeneratorNode {
	static typeId = "grid";
	static config = config$92;
	static inputs = inputs$92;
	static meta = meta$92;
	glsl() {
		const color = this.uniformName("color");
		const cells = this.uniformName("cells");
		const thickness = this.uniformName("thickness");
		return {
			dependencies: ["aastep", "rotate2D"],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
p = rotate2D(p, ${this.uniformName("rotation")} * 3.14159 / 180.0);
float n = float(${cells});
vec2 g = abs(fract(p * n) - 0.5);
float halfW = clamp(${thickness}, 0.0, 1.0) * 0.06;
float dx = aastep(0.5 - halfW, g.x);
float dy = aastep(0.5 - halfW, g.y);
float m = max(dx, dy);
return vec4(${color}.rgb * m, ${color}.a * m);`
		};
	}
};
register(Grid);
//#endregion
//#region src/shaders/textures/hex-grid.ts
var config$91 = z.object({
	colorA: zColor().default([
		0,
		0,
		0
	]).describe("Color A"),
	colorB: zColor().default([
		1,
		1,
		1
	]).describe("Color B"),
	cells: zInt(1, 80).default(8).describe("Cells"),
	thickness: zFloat(0, 4, .05).default(1).describe("Thickness")
});
var inputs$91 = z.object({});
var meta$91 = {
	name: "Hex Grid",
	description: "Honeycomb hexagonal grid pattern",
	color: "#0ea5e9",
	category: "textures",
	defaultBlendMode: "normal"
};
var HexGrid = class extends GeneratorNode {
	static typeId = "hex-grid";
	static config = config$91;
	static inputs = inputs$91;
	static meta = meta$91;
	glsl() {
		const colorA = this.uniformName("colorA");
		const colorB = this.uniformName("colorB");
		return {
			dependencies: ["aastep"],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
vec2 q = p * float(${this.uniformName("cells")});
const vec2 h = vec2(1.0, 1.7320508);
vec2 a = mod(q, h) - h * 0.5;
vec2 b = mod(q - h * 0.5, h) - h * 0.5;
vec2 g = (dot(a, a) < dot(b, b)) ? a : b;
g = abs(g);
float dist = max(g.x, g.x * 0.5 + g.y * 0.866025);
float lw = clamp(${this.uniformName("thickness")}, 0.0, 4.0) * 0.025;
float line = 1.0 - aastep(0.5 - lw, dist);
vec3 col = mix(${colorA}, ${colorB}, line);
return vec4(col, 1.0);`
		};
	}
};
register(HexGrid);
//#endregion
//#region src/shaders/textures/image-texture.ts
var config$90 = z.object({ tint: zColorRgba().default([
	1,
	1,
	1,
	1
]).describe("Tint") });
var inputs$90 = z.object({ image: zImageInput().default(noImage).describe("Image") });
var meta$90 = {
	name: "Image Texture",
	description: "Sample an uploaded image as a texture",
	color: "#3b82f6",
	category: "textures",
	defaultBlendMode: "normal"
};
var ImageTexture = class extends GeneratorNode {
	static typeId = "image-texture";
	static config = config$90;
	static inputs = inputs$90;
	static meta = meta$90;
	glsl() {
		const image = this.uniformName("image");
		return {
			dependencies: ["applySizing"],
			main: `
vec2 sampleUv = applySizing(uv, ${image}_meta, ${image}_offset);
if (sampleUv.x < 0.0 || sampleUv.x > 1.0 || sampleUv.y < 0.0 || sampleUv.y > 1.0) {
  return vec4(0.0);
}
vec4 src = texture(${image}, sampleUv);
return src * ${this.uniformName("tint")};`
		};
	}
};
register(ImageTexture);
//#endregion
//#region src/shaders/textures/multi-point-gradient.ts
var config$89 = z.object({
	colorA: zColor().default([
		.28,
		.46,
		.9
	]).describe("Color A"),
	positionA: zCenter().default([.2, .2]).describe("Position A"),
	colorB: zColor().default([
		.77,
		.3,
		1
	]).describe("Color B"),
	positionB: zCenter().default([.8, .2]).describe("Position B"),
	colorC: zColor().default([
		.1,
		.74,
		.61
	]).describe("Color C"),
	positionC: zCenter().default([.2, .8]).describe("Position C"),
	colorD: zColor().default([
		.97,
		.73,
		.85
	]).describe("Color D"),
	positionD: zCenter().default([.8, .8]).describe("Position D"),
	colorE: zColor().default([
		1,
		.55,
		.26
	]).describe("Color E"),
	positionE: zCenter().default([.5, .5]).describe("Position E"),
	smoothness: zFloat(.1, 8, .05).default(2).describe("Smoothness")
});
var inputs$89 = z.object({});
var meta$89 = {
	name: "Multi-Point Gradient",
	description: "Five color points blended together by proximity",
	color: "#a855f7",
	category: "textures",
	defaultBlendMode: "normal"
};
var MultiPointGradient = class extends GeneratorNode {
	static typeId = "multi-point-gradient";
	static config = config$89;
	static inputs = inputs$89;
	static meta = meta$89;
	static spatialControls = [
		{
			kind: "colorStopVec2",
			key: "positionA",
			color: "colorA",
			label: "Stop A"
		},
		{
			kind: "colorStopVec2",
			key: "positionB",
			color: "colorB",
			label: "Stop B"
		},
		{
			kind: "colorStopVec2",
			key: "positionC",
			color: "colorC",
			label: "Stop C"
		},
		{
			kind: "colorStopVec2",
			key: "positionD",
			color: "colorD",
			label: "Stop D"
		},
		{
			kind: "colorStopVec2",
			key: "positionE",
			color: "colorE",
			label: "Stop E"
		}
	];
	glsl() {
		const colorA = this.uniformName("colorA");
		const positionA = this.uniformName("positionA");
		const colorB = this.uniformName("colorB");
		const positionB = this.uniformName("positionB");
		const colorC = this.uniformName("colorC");
		const positionC = this.uniformName("positionC");
		const colorD = this.uniformName("colorD");
		const positionD = this.uniformName("positionD");
		const colorE = this.uniformName("colorE");
		const positionE = this.uniformName("positionE");
		return { main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = uv * _ar;
float k = max(${this.uniformName("smoothness")}, 0.05) * 2.0;

vec2 ps[5];
vec3 cs[5];
ps[0] = ${positionA} * _ar; cs[0] = ${colorA};
ps[1] = ${positionB} * _ar; cs[1] = ${colorB};
ps[2] = ${positionC} * _ar; cs[2] = ${colorC};
ps[3] = ${positionD} * _ar; cs[3] = ${colorD};
ps[4] = ${positionE} * _ar; cs[4] = ${colorE};

float ws[5];
float wsum = 0.0;
for (int i = 0; i < 5; i++) {
  float d = max(distance(p, ps[i]), 1e-4);
  float w = 1.0 / pow(d, k);
  ws[i] = w;
  wsum += w;
}
vec3 col = vec3(0.0);
for (int i = 0; i < 5; i++) {
  col += cs[i] * (ws[i] / wsum);
}
return vec4(col, 1.0);` };
	}
};
register(MultiPointGradient);
//#endregion
//#region src/shaders/textures/plasma.ts
var config$88 = z.object({
	colorA: zColor().default([
		.44,
		.09,
		.75
	]).describe("Color A"),
	colorB: zColor().default([
		0,
		0,
		0
	]).describe("Color B"),
	density: zFloat(.1, 12, .05).default(2).describe("Density"),
	speed: zFloat(0, 8, .05).default(2).describe("Speed"),
	intensity: zFloat(0, 4, .01).default(1.5).describe("Intensity"),
	warp: zFloat(0, 2, .01).default(.4).describe("Warp"),
	contrast: zFloat(0, 4, .01).default(1).describe("Contrast"),
	balance: zFloat(0, 100, 1).default(50).describe("Balance")
});
var inputs$88 = z.object({});
var meta$88 = {
	name: "Plasma",
	description: "Animated effect of glowing plasma",
	color: "#ec4899",
	category: "textures",
	defaultBlendMode: "normal"
};
var Plasma = class extends GeneratorNode {
	static typeId = "plasma";
	static config = config$88;
	static inputs = inputs$88;
	static meta = meta$88;
	glsl() {
		const colorA = this.uniformName("colorA");
		const colorB = this.uniformName("colorB");
		const density = this.uniformName("density");
		const speed = this.uniformName("speed");
		const intensity = this.uniformName("intensity");
		return {
			dependencies: ["fbm", "simplex2D"],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
float t = u_time * ${speed} * 0.25;
vec2 q = p * ${density};
q += ${this.uniformName("warp")} * vec2(fbm(q + t, 4.0, 2.0, 0.5), fbm(q - t * 0.7, 4.0, 2.0, 0.5));
float v = sin(q.x + t) + sin(q.y * 0.7 + t * 1.3) + sin((q.x + q.y) * 0.6 + t * 0.9);
v += sin(length(q) - t);
v *= 0.25 * ${intensity};
float k = clamp(0.5 + 0.5 * v, 0.0, 1.0);
k = clamp((k - 0.5) * ${this.uniformName("contrast")} + 0.5 + (${this.uniformName("balance")} / 100.0 - 0.5) * 0.6, 0.0, 1.0);
vec3 col = mix(${colorB}, ${colorA}, k);
return vec4(col, 1.0);`
		};
	}
};
register(Plasma);
//#endregion
//#region src/shaders/textures/ripples.ts
var config$87 = z.object({
	center: zCenter().default([.5, .5]).describe("Center"),
	colorA: zColor().default([
		1,
		1,
		1
	]).describe("Color A"),
	colorB: zColor().default([
		0,
		0,
		0
	]).describe("Color B"),
	speed: zFloat(0, 4, .05).default(1).describe("Speed"),
	frequency: zFloat(1, 200, 1).default(20).describe("Frequency"),
	softness: zFloat(0, 1).default(0).describe("Softness"),
	thickness: zFloat(0, 1).default(.5).describe("Thickness"),
	phase: zFloat(0, 6.2832, .01).default(0).describe("Phase")
});
var inputs$87 = z.object({});
var meta$87 = {
	name: "Ripples",
	description: "Concentric animated ripples emanating from a point",
	color: "#22d3ee",
	category: "textures",
	defaultBlendMode: "normal"
};
var Ripples = class extends GeneratorNode {
	static typeId = "ripples";
	static config = config$87;
	static inputs = inputs$87;
	static meta = meta$87;
	glsl() {
		const center = this.uniformName("center");
		const colorA = this.uniformName("colorA");
		const colorB = this.uniformName("colorB");
		const speed = this.uniformName("speed");
		const frequency = this.uniformName("frequency");
		const softness = this.uniformName("softness");
		const thickness = this.uniformName("thickness");
		return { main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - ${center}) * _ar;
float r = length(p);
float w = r * ${frequency} - u_time * ${speed} * 4.0 + ${this.uniformName("phase")};
float band = 0.5 + 0.5 * cos(w);
float thick = clamp(${thickness}, 0.0, 1.0);
float soft = clamp(${softness}, 0.0, 1.0) * 0.49 + 0.005;
float lo = clamp(0.5 - thick * 0.5, 0.0, 1.0);
float hi = clamp(0.5 + thick * 0.5, 0.0, 1.0);
float ring = smoothstep(lo - soft, lo + soft, band) * (1.0 - smoothstep(hi - soft, hi + soft, band));
vec3 col = mix(${colorB}, ${colorA}, ring);
return vec4(col, 1.0);` };
	}
};
register(Ripples);
//#endregion
//#region src/shaders/textures/simplex-noise.ts
var config$86 = z.object({
	colorA: zColor().default([
		1,
		1,
		1
	]).describe("Color A"),
	colorB: zColor().default([
		0,
		0,
		0
	]).describe("Color B"),
	scale: zFloat(.1, 20, .1).default(2).describe("Scale"),
	balance: zFloat(-1, 1).default(0).describe("Balance"),
	contrast: zFloat(-1, 4, .05).default(0).describe("Contrast"),
	seed: zFloat(0, 100, .1).default(0).describe("Seed"),
	speed: zFloat(0, 4, .05).default(1).describe("Speed")
});
var inputs$86 = z.object({});
var meta$86 = {
	name: "Simplex Noise",
	description: "Organic noise with animated movement",
	color: "#8b5cf6",
	category: "textures",
	defaultBlendMode: "normal"
};
var SimplexNoise = class extends GeneratorNode {
	static typeId = "simplex-noise";
	static config = config$86;
	static inputs = inputs$86;
	static meta = meta$86;
	glsl() {
		const colorA = this.uniformName("colorA");
		const colorB = this.uniformName("colorB");
		const scale = this.uniformName("scale");
		const balance = this.uniformName("balance");
		const contrast = this.uniformName("contrast");
		return {
			dependencies: ["simplex2D", "fbm"],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar * ${scale} + ${this.uniformName("seed")};
float t = u_time * ${this.uniformName("speed")} * 0.15;
float n = fbm(p + t, 5.0, 2.0, 0.5);
n = n * 0.5 + 0.5;
n = clamp(n + ${balance} * 0.5, 0.0, 1.0);
float c = clamp(${contrast} + 1.0, 0.0, 5.0);
n = clamp((n - 0.5) * c + 0.5, 0.0, 1.0);
vec3 col = mix(${colorB}, ${colorA}, n);
return vec4(col, 1.0);`
		};
	}
};
register(SimplexNoise);
//#endregion
//#region src/shaders/textures/sine-wave.ts
var config$85 = z.object({
	color: zColor().default([
		1,
		1,
		1
	]).describe("Color"),
	amplitude: zFloat(0, .5).default(.15).describe("Amplitude"),
	frequency: zFloat(0, 20, .05).default(1).describe("Frequency"),
	speed: zFloat(0, 4, .05).default(1).describe("Speed"),
	angle: zAngle(1).default(0).describe("Angle"),
	position: zCenter().default([.5, .5]).describe("Position"),
	thickness: zFloat(0, 1).default(.2).describe("Thickness"),
	softness: zFloat(0, 1).default(.4).describe("Softness")
});
var inputs$85 = z.object({});
var meta$85 = {
	name: "Sine Wave",
	description: "Animated wave with thickness and softness",
	color: "#0ea5e9",
	category: "textures",
	defaultBlendMode: "normal"
};
var SineWave = class extends GeneratorNode {
	static typeId = "sine-wave";
	static config = config$85;
	static inputs = inputs$85;
	static meta = meta$85;
	glsl() {
		const color = this.uniformName("color");
		const amp = this.uniformName("amplitude");
		const freq = this.uniformName("frequency");
		const speed = this.uniformName("speed");
		const angle = this.uniformName("angle");
		return {
			dependencies: ["rotate2D"],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - ${this.uniformName("position")}) * _ar;
p = rotate2D(p, ${angle} * 3.14159265 / 180.0);
float y = ${amp} * sin(p.x * ${freq} * 6.2831853 + u_time * ${speed});
float d = abs(p.y - y);
float thick = ${this.uniformName("thickness")} * 0.25;
float soft = ${this.uniformName("softness")} * thick + 0.0008;
float m = 1.0 - smoothstep(thick, thick + soft, d);
return vec4(${color} * m, m);`
		};
	}
};
register(SineWave);
//#endregion
//#region src/shaders/textures/solid-color.ts
var config$84 = z.object({ color: zColor().default([
	.357,
	.094,
	.792
]).describe("Color") });
var inputs$84 = z.object({});
var meta$84 = {
	name: "Solid Color",
	description: "Fill the canvas with a single solid color",
	color: "#a3a3a3",
	category: "textures",
	defaultBlendMode: "normal"
};
var SolidColor = class extends GeneratorNode {
	static typeId = "solid-color";
	static config = config$84;
	static inputs = inputs$84;
	static meta = meta$84;
	glsl() {
		return { main: `
return vec4(${this.uniformName("color")}, 1.0);` };
	}
};
register(SolidColor);
//#endregion
//#region src/shaders/textures/spiral.ts
var config$83 = z.object({
	colorA: zColor().default([
		0,
		0,
		0
	]).describe("Color A"),
	colorB: zColor().default([
		1,
		1,
		1
	]).describe("Color B"),
	strokeWidth: zFloat(0, 1).default(.5).describe("Stroke Width"),
	strokeFalloff: zFloat(0, 1).default(0).describe("Stroke Falloff"),
	softness: zFloat(0, 1).default(0).describe("Softness"),
	speed: zFloat(-4, 4, .05).default(1).describe("Speed"),
	center: zCenter().default([.5, .5]).describe("Center"),
	scale: zFloat(.1, 8, .05).default(1).describe("Scale")
});
var inputs$83 = z.object({});
var meta$83 = {
	name: "Spiral",
	description: "Rotating spiral pattern with animated movement",
	color: "#a855f7",
	category: "textures",
	defaultBlendMode: "normal"
};
var Spiral = class extends GeneratorNode {
	static typeId = "spiral";
	static config = config$83;
	static inputs = inputs$83;
	static meta = meta$83;
	glsl() {
		const colorA = this.uniformName("colorA");
		const colorB = this.uniformName("colorB");
		const strokeWidth = this.uniformName("strokeWidth");
		const strokeFalloff = this.uniformName("strokeFalloff");
		const softness = this.uniformName("softness");
		const speed = this.uniformName("speed");
		return { main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - ${this.uniformName("center")}) * _ar;
float r = length(p);
float a = atan(p.y, p.x) - u_time * ${speed};
float offset = r * ${this.uniformName("scale")} + a / 6.28318530;
float shape = abs(fract(offset) - 0.5) * 2.0;
float baseWidth = clamp(${strokeWidth}, ${strokeFalloff} * 0.005, 1.0);
float width = baseWidth * (1.0 - clamp(${strokeFalloff}, 0.0, 1.0) * r);
float soft = clamp(${softness}, 0.0, 1.0) + 0.001;
float res = smoothstep(width - soft, width + soft, shape);
vec3 col = mix(${colorA}, ${colorB}, res);
return vec4(col, 1.0);` };
	}
};
register(Spiral);
//#endregion
//#region src/shaders/textures/strands.ts
var config$82 = z.object({
	speed: zFloat(0, 4, .05).default(.5).describe("Speed"),
	amplitude: zFloat(0, 4, .01).default(1).describe("Amplitude"),
	frequency: zFloat(.1, 12, .05).default(1).describe("Frequency"),
	lineCount: zInt(1, 80).default(12).describe("Line Count"),
	lineWidth: zFloat(0, 1).default(.1).describe("Line Width"),
	waveColor: zColor().default([
		.95,
		.79,
		.03
	]).describe("Wave Color"),
	pinEdges: zBool().default(true).describe("Pin Edges"),
	start: zVec2().default([0, .5]).describe("Start"),
	end: zVec2().default([1, .5]).describe("End")
});
var inputs$82 = z.object({});
var meta$82 = {
	name: "Strands",
	description: "Procedural wavy strands with layered animation",
	color: "#0ea5e9",
	category: "textures",
	defaultBlendMode: "normal"
};
var Strands = class extends GeneratorNode {
	static typeId = "strands";
	static config = config$82;
	static inputs = inputs$82;
	static meta = meta$82;
	glsl() {
		const speed = this.uniformName("speed");
		const amplitude = this.uniformName("amplitude");
		const frequency = this.uniformName("frequency");
		const lineCount = this.uniformName("lineCount");
		const lineWidth = this.uniformName("lineWidth");
		const waveColor = this.uniformName("waveColor");
		const pinEdges = this.uniformName("pinEdges");
		return {
			dependencies: ["aastep"],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 s = ${this.uniformName("start")} * _ar;
vec2 e = ${this.uniformName("end")} * _ar;
vec2 p = uv * _ar;
vec2 axis = e - s;
float L = max(length(axis), 1e-4);
vec2 nDir = axis / L;
vec2 nPerp = vec2(-nDir.y, nDir.x);
float along = dot(p - s, nDir) / L;
float across = dot(p - s, nPerp);
float t = u_time * ${speed};
float n = float(${lineCount});
float pin = 1.0;
if (${pinEdges}) pin = sin(clamp(along, 0.0, 1.0) * 3.14159);
float acc = 0.0;
for (int i = 0; i < 64; i++) {
  if (float(i) >= n) break;
  float fi = float(i);
  float layerKey = (fi + 0.5) / max(n, 1.0) - 0.5;
  float wave = sin(along * 6.2831 * ${frequency} + t + fi * 0.7) * 0.06 * ${amplitude} * pin;
  float laneY = layerKey * 0.6 + wave;
  float d = abs(across - laneY);
  acc = max(acc, 1.0 - aastep(${lineWidth} * 0.05, d));
}
return vec4(${waveColor} * acc, acc);`
		};
	}
};
register(Strands);
//#endregion
//#region src/shaders/textures/stripes.ts
var config$81 = z.object({
	colorA: zColor().default([
		0,
		0,
		0
	]).describe("Color A"),
	colorB: zColor().default([
		1,
		1,
		1
	]).describe("Color B"),
	angle: zAngle().default(45).describe("Angle"),
	density: zFloat(.5, 60, .5).default(5).describe("Density"),
	balance: zFloat(0, 1).default(.5).describe("Balance"),
	softness: zFloat(0, 1).default(0).describe("Softness"),
	speed: zFloat(-4, 4, .05).default(.2).describe("Speed"),
	offset: zFloat(0, 1).default(0).describe("Offset")
});
var inputs$81 = z.object({});
var meta$81 = {
	name: "Stripes",
	description: "Alternating colored stripes with animation",
	color: "#0ea5e9",
	category: "textures",
	defaultBlendMode: "normal"
};
var Stripes = class extends GeneratorNode {
	static typeId = "stripes";
	static config = config$81;
	static inputs = inputs$81;
	static meta = meta$81;
	glsl() {
		const colorA = this.uniformName("colorA");
		const colorB = this.uniformName("colorB");
		const angle = this.uniformName("angle");
		const density = this.uniformName("density");
		const balance = this.uniformName("balance");
		const softness = this.uniformName("softness");
		const speed = this.uniformName("speed");
		return {
			dependencies: ["aastep", "rotate2D"],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
p = rotate2D(p, ${angle} * 3.14159 / 180.0);
float t = fract(p.x * ${density} + ${this.uniformName("offset")} + u_time * ${speed} * 0.2);
float bal = clamp(${balance}, 0.001, 0.999);
float soft = clamp(${softness}, 0.0, 1.0) * 0.49 + 0.001;
float m = smoothstep(bal - soft, bal + soft, t);
vec3 col = mix(${colorB}, ${colorA}, m);
return vec4(col, 1.0);`
		};
	}
};
register(Stripes);
//#endregion
//#region src/shaders/textures/studio-background.ts
var config$80 = z.object({
	color: zColor().default([
		.85,
		.86,
		.93
	]).describe("Color"),
	keyColor: zColor().default([
		.83,
		.89,
		.92
	]).describe("Key Color"),
	keyIntensity: zFloat(0, 200, 1).default(40).describe("Key Intensity"),
	keySoftness: zFloat(0, 100, 1).default(50).describe("Key Softness"),
	fillColor: zColor().default([
		.83,
		.89,
		.92
	]).describe("Fill Color"),
	fillIntensity: zFloat(0, 200, 1).default(10).describe("Fill Intensity"),
	fillSoftness: zFloat(0, 100, 1).default(70).describe("Fill Softness"),
	fillAngle: zFloat(0, 180, 1).default(70).describe("Fill Angle"),
	backColor: zColor().default([
		.78,
		.83,
		.91
	]).describe("Back Color"),
	backIntensity: zFloat(0, 200, 1).default(20).describe("Back Intensity"),
	backSoftness: zFloat(0, 100, 1).default(80).describe("Back Softness"),
	brightness: zFloat(0, 200, 1).default(20).describe("Brightness"),
	vignette: zFloat(0, 100, 1).default(0).describe("Vignette"),
	center: zCenter().default([.5, .8]).describe("Center"),
	lightTarget: zFloat(0, 200, 1).default(100).describe("Light Target"),
	wallCurvature: zFloat(0, 100, 1).default(10).describe("Wall Curvature"),
	ambientIntensity: zFloat(0, 200, 1).default(50).describe("Ambient Intensity"),
	ambientSpeed: zFloat(0, 20, .1).default(2).describe("Ambient Speed"),
	seed: zFloat(0, 100, .1).default(0).describe("Seed")
});
var inputs$80 = z.object({});
var meta$80 = {
	name: "Studio Background",
	description: "Multi-light studio background with ambient motion",
	color: "#94a3b8",
	category: "textures",
	defaultBlendMode: "normal"
};
var StudioBackground = class extends GeneratorNode {
	static typeId = "studio-background";
	static config = config$80;
	static inputs = inputs$80;
	static meta = meta$80;
	glsl() {
		const color = this.uniformName("color");
		const keyColor = this.uniformName("keyColor");
		const keyIntensity = this.uniformName("keyIntensity");
		const keySoftness = this.uniformName("keySoftness");
		const fillColor = this.uniformName("fillColor");
		const fillIntensity = this.uniformName("fillIntensity");
		const fillSoftness = this.uniformName("fillSoftness");
		const fillAngle = this.uniformName("fillAngle");
		const backColor = this.uniformName("backColor");
		const backIntensity = this.uniformName("backIntensity");
		const backSoftness = this.uniformName("backSoftness");
		const brightness = this.uniformName("brightness");
		const vignette = this.uniformName("vignette");
		const center = this.uniformName("center");
		const lightTarget = this.uniformName("lightTarget");
		const wallCurvature = this.uniformName("wallCurvature");
		const ambientIntensity = this.uniformName("ambientIntensity");
		return {
			dependencies: ["fbm", "simplex2D"],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = uv * _ar;
vec2 ctr = ${center} * _ar;

// Cove curvature — bend the floor up into the back wall.
float curve = ${wallCurvature} / 100.0;
float floorMix = smoothstep(0.0, 1.0, 1.0 - uv.y);
floorMix = mix(floorMix, pow(floorMix, mix(1.0, 4.0, curve)), 0.5);

vec3 bg = ${color} * (${brightness} / 100.0 * 0.6 + 0.7);

// Key light — overhead spot near center, biased downward by lightTarget.
float lt = ${lightTarget} / 100.0;
vec2 keyAim = vec2(ctr.x, mix(0.2 * _ar.y, 0.8 * _ar.y, lt));
float keyR = distance(p, keyAim);
float keyS = max(${keySoftness} / 100.0, 0.05) * 0.9 + 0.1;
float keyMask = exp(-pow(keyR / keyS, 2.0)) * (${keyIntensity} / 100.0);
vec3 col = bg + ${keyColor} * keyMask;

// Fill lights — left + right at fillAngle off vertical.
float fa = radians(${fillAngle});
vec2 lDir = vec2(-sin(fa), cos(fa));
vec2 rDir = vec2(sin(fa), cos(fa));
vec2 lPos = ctr + lDir * 0.7 * _ar.y;
vec2 rPos = ctr + rDir * 0.7 * _ar.y;
float fillS = max(${fillSoftness} / 100.0, 0.05) * 1.1 + 0.1;
float lMask = exp(-pow(distance(p, lPos) / fillS, 2.0));
float rMask = exp(-pow(distance(p, rPos) / fillS, 2.0));
col += ${fillColor} * (lMask + rMask) * (${fillIntensity} / 100.0) * 0.7;

// Back wash — broad upper gradient.
float backS = max(${backSoftness} / 100.0, 0.05) * 1.4 + 0.2;
float backMask = exp(-pow((1.0 - uv.y) / backS, 2.0)) * (${backIntensity} / 100.0);
col += ${backColor} * backMask * 0.8;

// Ambient drifting noise.
float t = u_time * ${this.uniformName("ambientSpeed")} * 0.05 + ${this.uniformName("seed")};
float drift = fbm(p * 1.6 + vec2(t, t * 0.7), 4.0, 2.0, 0.5);
col += vec3(0.04, 0.05, 0.07) * drift * (${ambientIntensity} / 100.0);

// Vignette.
float vig = ${vignette} / 100.0;
float r = distance(uv, vec2(0.5));
col *= mix(1.0, smoothstep(0.85, 0.15, r), vig);

return vec4(col * mix(0.9, 1.1, floorMix), 1.0);`
		};
	}
};
register(StudioBackground);
//#endregion
//#region src/shaders/textures/swirl.ts
var config$79 = z.object({
	colorA: zColor().default([
		.07,
		.46,
		.85
	]).describe("Color A"),
	colorB: zColor().default([
		.88,
		.57,
		.21
	]).describe("Color B"),
	speed: zFloat(0, 4, .05).default(1).describe("Speed"),
	detail: zFloat(.1, 4, .05).default(1).describe("Detail"),
	blend: zFloat(0, 100, 1).default(50).describe("Blend")
});
var inputs$79 = z.object({});
var meta$79 = {
	name: "Swirl",
	description: "Flowing swirl pattern with multi-layered noise",
	color: "#22d3ee",
	category: "textures",
	defaultBlendMode: "normal"
};
var Swirl = class extends GeneratorNode {
	static typeId = "swirl";
	static config = config$79;
	static inputs = inputs$79;
	static meta = meta$79;
	glsl() {
		const colorA = this.uniformName("colorA");
		const colorB = this.uniformName("colorB");
		const speed = this.uniformName("speed");
		return {
			dependencies: ["fbm", "simplex2D"],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar * mix(1.0, 3.0, ${this.uniformName("detail")} * 0.5);
float t = u_time * ${speed} * 0.2;
vec2 q = p + vec2(fbm(p + vec2(t, 0.0), 4.0, 2.0, 0.5), fbm(p + vec2(0.0, t), 4.0, 2.0, 0.5));
vec2 r = p + vec2(fbm(q * 1.6 + t * 1.3, 4.0, 2.0, 0.5), fbm(q * 1.6 - t * 1.1, 4.0, 2.0, 0.5));
float n = fbm(r * 1.4 + t, 5.0, 2.0, 0.5);
float k = clamp(0.5 + 0.5 * n + (${this.uniformName("blend")} / 100.0 - 0.5) * 0.6, 0.0, 1.0);
vec3 col = mix(${colorA}, ${colorB}, k);
return vec4(col, 1.0);`
		};
	}
};
register(Swirl);
//#endregion
//#region src/shaders/textures/truchet.ts
var config$78 = z.object({
	colorA: zColor().default([
		0,
		0,
		0
	]).describe("Color A"),
	colorB: zColor().default([
		1,
		1,
		1
	]).describe("Color B"),
	cells: zInt(2, 80).default(10).describe("Cells"),
	thickness: zFloat(0, 8, .1).default(2).describe("Thickness"),
	seed: zFloat(0, 100, 1).default(0).describe("Seed")
});
var inputs$78 = z.object({});
var meta$78 = {
	name: "Truchet",
	description: "Quarter-circle arc tiles forming organic, maze-like flowing curves",
	color: "#0ea5e9",
	category: "textures",
	defaultBlendMode: "normal"
};
var Truchet = class extends GeneratorNode {
	static typeId = "truchet";
	static config = config$78;
	static inputs = inputs$78;
	static meta = meta$78;
	glsl() {
		const colorA = this.uniformName("colorA");
		const colorB = this.uniformName("colorB");
		const cells = this.uniformName("cells");
		const thickness = this.uniformName("thickness");
		return {
			dependencies: ["aastep", "hash"],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
vec2 q = p * float(${cells});
vec2 cell = floor(q);
vec2 f = fract(q);
float h = hash(cell + ${this.uniformName("seed")});
if (h < 0.5) f = vec2(f.x, 1.0 - f.y);
float d = abs(length(f) - 0.5);
float d2 = abs(length(f - vec2(1.0)) - 0.5);
float dd = min(d, d2);
float lw = clamp(${thickness}, 0.0, 8.0) * 0.025;
float arc = 1.0 - aastep(lw, dd);
vec3 col = mix(${colorA}, ${colorB}, arc);
return vec4(col, 1.0);`
		};
	}
};
register(Truchet);
//#endregion
//#region src/shaders/textures/video-texture.ts
var config$77 = z.object({
	url: z.string().default("https://shaders.com/sample.mp4").describe("URL"),
	objectFit: z.enum([
		"cover",
		"contain",
		"fill",
		"scale-down",
		"none"
	]).default("cover").describe("Object Fit"),
	loop: zBool().default(true).describe("Loop"),
	placeholder: zColor().default([
		.1,
		.1,
		.12
	]).describe("Placeholder Color")
});
var inputs$77 = z.object({});
var meta$77 = {
	name: "Video Texture",
	description: "Display a video with customizable playback and object-fit modes",
	color: "#6366f1",
	category: "textures",
	defaultBlendMode: "normal"
};
var VideoTexture = class extends GeneratorNode {
	static typeId = "video-texture";
	static config = config$77;
	static inputs = inputs$77;
	static meta = meta$77;
	glsl() {
		return { main: `return vec4(${this.uniformName("placeholder")}, 1.0);` };
	}
};
register(VideoTexture);
//#endregion
//#region src/shaders/textures/voronoi.ts
var config$76 = z.object({
	colorA: zColor().default([
		.19,
		.53,
		.81
	]).describe("Color A"),
	colorB: zColor().default([
		.99,
		.01,
		.87
	]).describe("Color B"),
	colorBorder: zColor().default([
		0,
		0,
		0
	]).describe("Border Color"),
	scale: zFloat(.5, 30, .1).default(6).describe("Scale"),
	speed: zFloat(0, 4, .05).default(.5).describe("Speed"),
	seed: zFloat(0, 100, .1).default(0).describe("Seed"),
	edgeIntensity: zFloat(0, 1).default(.5).describe("Edge Intensity"),
	edgeSoftness: zFloat(0, .5, .005).default(.05).describe("Edge Softness")
});
var inputs$76 = z.object({});
var meta$76 = {
	name: "Voronoi",
	description: "Cellular pattern shaded by distance to nearest scattered point",
	color: "#06b6d4",
	category: "textures",
	defaultBlendMode: "normal"
};
var Voronoi = class extends GeneratorNode {
	static typeId = "voronoi";
	static config = config$76;
	static inputs = inputs$76;
	static meta = meta$76;
	glsl() {
		const colorA = this.uniformName("colorA");
		const colorB = this.uniformName("colorB");
		const colorBorder = this.uniformName("colorBorder");
		const scale = this.uniformName("scale");
		return {
			dependencies: ["hash22"],
			main: `
float aspect = u_resolution.x / max(u_resolution.y, 1.0);
vec2 scaledUV = vec2(uv.x * aspect, uv.y) * ${scale};
vec2 cell = floor(scaledUV);
vec2 localUV = fract(scaledUV);
float t = u_time * ${this.uniformName("speed")};
float d1 = 10.0;
float d2 = 10.0;
for (int ny = -1; ny <= 1; ny++) {
  for (int nx = -1; nx <= 1; nx++) {
    vec2 off = vec2(float(nx), float(ny));
    vec2 h = hash22(cell + off + ${this.uniformName("seed")});
    float px = clamp(h.x + sin(t + h.x * 6.28) * 0.15, 0.05, 0.95);
    float py = clamp(h.y + cos(t * 0.7 + h.y * 6.28) * 0.15, 0.05, 0.95);
    float d = length(localUV - (off + vec2(px, py)));
    if (d < d1) { d2 = d1; d1 = d; }
    else if (d < d2) { d2 = d; }
  }
}
float safeSum = max(d1 + d2, 1e-4);
float fillT = clamp(d1 * 2.0 / safeSum, 0.0, 1.0);
fillT = pow(fillT, 4.0 - ${this.uniformName("edgeIntensity")} * 3.0);
vec3 cellColor = mix(${colorA}, ${colorB}, clamp(fillT, 0.0, 1.0));
float scaledEdge = ${this.uniformName("edgeSoftness")} * ${scale} / 6.0;
float edgeMetric = (d2 - d1) / safeSum;
float edgeMask = smoothstep(0.0, scaledEdge + 0.001, edgeMetric);
vec3 col = mix(${colorBorder}, cellColor, edgeMask);
return vec4(col, 1.0);`
		};
	}
};
register(Voronoi);
//#endregion
//#region src/shaders/textures/weave.ts
var config$75 = z.object({
	colorA: zColor().default([
		.77,
		.77,
		.77
	]).describe("Color A"),
	colorB: zColor().default([
		.3,
		.3,
		.3
	]).describe("Color B"),
	cells: zInt(2, 80).default(10).describe("Cells"),
	gap: zFloat(0, .5).default(.25).describe("Gap"),
	rotation: zAngle().default(0).describe("Rotation")
});
var inputs$75 = z.object({});
var meta$75 = {
	name: "Weave",
	description: "Interlaced textile weave with two thread colors going over and under",
	color: "#0ea5e9",
	category: "textures",
	defaultBlendMode: "normal"
};
var Weave = class extends GeneratorNode {
	static typeId = "weave";
	static config = config$75;
	static inputs = inputs$75;
	static meta = meta$75;
	glsl() {
		const colorA = this.uniformName("colorA");
		const colorB = this.uniformName("colorB");
		const cells = this.uniformName("cells");
		const gap = this.uniformName("gap");
		return {
			dependencies: ["aastep", "rotate2D"],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
p = rotate2D(p, ${this.uniformName("rotation")} * 3.14159 / 180.0);
vec2 q = p * float(${cells});
vec2 cell = floor(q);
vec2 f = fract(q) - 0.5;
bool aOver = mod(cell.x + cell.y, 2.0) < 0.5;
float threadHalf = (0.5 - clamp(${gap}, 0.0, 0.5)) * 0.5 + 0.05;
float horiz = 1.0 - aastep(threadHalf, abs(f.y));
float vert = 1.0 - aastep(threadHalf, abs(f.x));
float aMask = aOver ? horiz : horiz * 0.5;
float bMask = aOver ? vert * 0.5 : vert;
vec3 col = vec3(0.0);
float a = max(aMask, bMask);
col = mix(col, ${colorA}, aMask);
col = mix(col, ${colorB}, bMask);
return vec4(col, a);`
		};
	}
};
register(Weave);
//#endregion
//#region src/shaders/textures/webcam-texture.ts
var config$74 = z.object({
	objectFit: z.enum([
		"cover",
		"contain",
		"fill",
		"scale-down",
		"none"
	]).default("cover").describe("Object Fit"),
	mirror: zBool().default(true).describe("Mirror"),
	placeholder: zColor().default([
		.08,
		.1,
		.14
	]).describe("Placeholder Color")
});
var inputs$74 = z.object({});
var meta$74 = {
	name: "Webcam Texture",
	description: "Display a live webcam feed with customizable object-fit modes",
	color: "#10b981",
	category: "textures",
	defaultBlendMode: "normal"
};
var WebcamTexture = class extends GeneratorNode {
	static typeId = "webcam-texture";
	static config = config$74;
	static inputs = inputs$74;
	static meta = meta$74;
	glsl() {
		return { main: `return vec4(${this.uniformName("placeholder")}, 1.0);` };
	}
};
register(WebcamTexture);
//#endregion
//#region src/shaders/shapes/circle.ts
var config$73 = z.object({
	...transformFields(),
	fillColor: zColor().default([
		1,
		1,
		1
	]).describe("Fill"),
	strokeColor: zColor().default([
		0,
		0,
		0
	]).describe("Stroke"),
	strokeWidth: zFloat(0, .1, .001).default(0).describe("Stroke Width"),
	strokeMode: z.enum([
		"inside",
		"center",
		"outside"
	]).default("center").describe("Stroke Mode")
});
var inputs$73 = z.object({});
var meta$73 = {
	name: "Ellipse",
	description: "Circle or ellipse — fills its bounding box",
	color: "#3b82f6",
	category: "shapes",
	defaultBlendMode: "normal"
};
var Circle = class extends GeneratorNode {
	static typeId = "circle";
	static config = config$73;
	static inputs = inputs$73;
	static meta = meta$73;
	static spatialControls = [{
		kind: "transform",
		x: "x",
		y: "y",
		w: "width",
		h: "height",
		rotation: "rotation",
		label: "Bounds"
	}];
	glsl() {
		const x = this.uniformName("x");
		const y = this.uniformName("y");
		const w = this.uniformName("width");
		const h = this.uniformName("height");
		const rot = this.uniformName("rotation");
		const fill = this.uniformName("fillColor");
		const stroke = this.uniformName("strokeColor");
		const sw = this.uniformName("strokeWidth");
		return {
			dependencies: [
				"aastep",
				"sdCircle",
				"rotate2D"
			],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${x}, ${y})) * _ar;
p = rotate2D(p, ${rot} * 3.14159265 / 180.0);
// Squash into the bbox-local unit frame, evaluate as a unit disc, then
// approximate world-space distance via the smaller half-extent for stroke.
vec2 pn = p / vec2(${w} * 0.5, ${h} * 0.5);
float refHalf = min(${w}, ${h}) * 0.5;
float d = sdCircle(pn, 1.0) * refHalf;
float fillA = 1.0 - aastep(0.0, d);
float strokeA = (1.0 - aastep(${sw} * 0.5, abs(d - ${this.config.strokeMode === "inside" ? `(-${sw} * 0.5)` : this.config.strokeMode === "outside" ? `(${sw} * 0.5)` : `0.0`}))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeA);
return vec4(col, max(fillA, strokeA));`
		};
	}
};
register(Circle);
//#endregion
//#region src/shaders/shapes/crescent.ts
var config$72 = z.object({
	...transformFields(),
	innerRatio: zFloat(.3, 1.2, .01).default(.8).describe("Inner Ratio"),
	offset: zFloat(.01, 1, .001).default(.4).describe("Offset"),
	fillColor: zColor().default([
		1,
		1,
		1
	]).describe("Fill"),
	strokeColor: zColor().default([
		0,
		0,
		0
	]).describe("Stroke"),
	strokeWidth: zFloat(0, .1, .001).default(0).describe("Stroke Width"),
	strokeMode: z.enum([
		"inside",
		"center",
		"outside"
	]).default("center").describe("Stroke Mode")
});
var inputs$72 = z.object({});
var meta$72 = {
	name: "Crescent",
	description: "Crescent moon shape (subtracts an offset circle)",
	color: "#3b82f6",
	category: "shapes",
	defaultBlendMode: "normal"
};
var Crescent = class extends GeneratorNode {
	static typeId = "crescent";
	static config = config$72;
	static inputs = inputs$72;
	static meta = meta$72;
	static spatialControls = [{
		kind: "transform",
		x: "x",
		y: "y",
		w: "width",
		h: "height",
		rotation: "rotation",
		label: "Bounds"
	}];
	glsl() {
		const x = this.uniformName("x");
		const y = this.uniformName("y");
		const w = this.uniformName("width");
		const h = this.uniformName("height");
		const rot = this.uniformName("rotation");
		const ir = this.uniformName("innerRatio");
		const off = this.uniformName("offset");
		const fill = this.uniformName("fillColor");
		const stroke = this.uniformName("strokeColor");
		const sw = this.uniformName("strokeWidth");
		return {
			dependencies: [
				"aastep",
				"sdCircle",
				"rotate2D"
			],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${x}, ${y})) * _ar;
p = rotate2D(p, ${rot} * 3.14159265 / 180.0);
vec2 pn = p / vec2(${w} * 0.5, ${h} * 0.5);
float refHalf = min(${w}, ${h}) * 0.5;
float d1 = sdCircle(pn, 1.0);
float d2 = sdCircle(pn - vec2(${off}, 0.0), ${ir});
float d = max(d1, -d2) * refHalf;
float fillA = 1.0 - aastep(0.0, d);
float strokeA = (1.0 - aastep(${sw} * 0.5, abs(d - ${this.config.strokeMode === "inside" ? `(-${sw} * 0.5)` : this.config.strokeMode === "outside" ? `(${sw} * 0.5)` : `0.0`}))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeA);
return vec4(col, max(fillA, strokeA));`
		};
	}
};
register(Crescent);
//#endregion
//#region src/shaders/shapes/cross.ts
var config$71 = z.object({
	...transformFields(),
	thickness: zFloat(.05, 1, .001).default(.3).describe("Thickness"),
	rounding: zFloat(0, 1, .01).default(0).describe("Rounding"),
	fillColor: zColor().default([
		1,
		1,
		1
	]).describe("Fill"),
	strokeColor: zColor().default([
		0,
		0,
		0
	]).describe("Stroke"),
	strokeWidth: zFloat(0, .1, .001).default(0).describe("Stroke Width"),
	strokeMode: z.enum([
		"inside",
		"center",
		"outside"
	]).default("center").describe("Stroke Mode")
});
var inputs$71 = z.object({});
var meta$71 = {
	name: "Cross",
	description: "Plus / cross filling its bounding box; thickness as ratio of the bbox",
	color: "#3b82f6",
	category: "shapes",
	defaultBlendMode: "normal"
};
var Cross = class extends GeneratorNode {
	static typeId = "cross";
	static config = config$71;
	static inputs = inputs$71;
	static meta = meta$71;
	static spatialControls = [{
		kind: "transform",
		x: "x",
		y: "y",
		w: "width",
		h: "height",
		rotation: "rotation",
		label: "Bounds"
	}];
	glsl() {
		const x = this.uniformName("x");
		const y = this.uniformName("y");
		const w = this.uniformName("width");
		const h = this.uniformName("height");
		const rot = this.uniformName("rotation");
		const th = this.uniformName("thickness");
		const round = this.uniformName("rounding");
		const fill = this.uniformName("fillColor");
		const stroke = this.uniformName("strokeColor");
		const sw = this.uniformName("strokeWidth");
		return {
			dependencies: ["aastep", "rotate2D"],
			functions: `
float sdCrossPlus(vec2 p, vec2 b, float thickness, float rounding) {
  vec2 ap = abs(p);
  return min(max(ap.x - b.x, ap.y - thickness), max(ap.y - b.y, ap.x - thickness)) - rounding;
}`,
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${x}, ${y})) * _ar;
p = rotate2D(p, ${rot} * 3.14159265 / 180.0);
vec2 halfB = vec2(${w} * 0.5, ${h} * 0.5);
float thick = ${th} * min(${w}, ${h}) * 0.5;
float r = ${round} * min(${w}, ${h}) * 0.25;
float d = sdCrossPlus(p, halfB, thick, r);
float fillA = 1.0 - aastep(0.0, d);
float strokeA = (1.0 - aastep(${sw} * 0.5, abs(d - ${this.config.strokeMode === "inside" ? `(-${sw} * 0.5)` : this.config.strokeMode === "outside" ? `(${sw} * 0.5)` : `0.0`}))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeA);
return vec4(col, max(fillA, strokeA));`
		};
	}
};
register(Cross);
//#endregion
//#region src/shaders/shapes/flower.ts
var config$70 = z.object({
	...transformFields(),
	petals: zInt(3, 16).default(5).describe("Petals"),
	innerRatio: zFloat(.1, .95, .01).default(.4).describe("Inner Ratio"),
	fillColor: zColor().default([
		1,
		1,
		1
	]).describe("Fill"),
	strokeColor: zColor().default([
		0,
		0,
		0
	]).describe("Stroke"),
	strokeWidth: zFloat(0, .1, .001).default(0).describe("Stroke Width"),
	strokeMode: z.enum([
		"inside",
		"center",
		"outside"
	]).default("center").describe("Stroke Mode")
});
var inputs$70 = z.object({});
var meta$70 = {
	name: "Flower",
	description: "Petal shape with N lobes and adjustable inner-to-outer radius ratio",
	color: "#f472b6",
	category: "shapes",
	defaultBlendMode: "normal"
};
var Flower = class extends GeneratorNode {
	static typeId = "flower";
	static config = config$70;
	static inputs = inputs$70;
	static meta = meta$70;
	static spatialControls = [{
		kind: "transform",
		x: "x",
		y: "y",
		w: "width",
		h: "height",
		rotation: "rotation",
		label: "Bounds"
	}];
	glsl() {
		const x = this.uniformName("x");
		const y = this.uniformName("y");
		const w = this.uniformName("width");
		const h = this.uniformName("height");
		const rot = this.uniformName("rotation");
		const petals = this.uniformName("petals");
		const ir = this.uniformName("innerRatio");
		const fill = this.uniformName("fillColor");
		const stroke = this.uniformName("strokeColor");
		const sw = this.uniformName("strokeWidth");
		return {
			dependencies: ["aastep", "rotate2D"],
			functions: `
float sdFlower(vec2 p, float outerRadius, float sides, float innerRatio) {
  float a = atan(p.y, p.x);
  float len = length(p);
  float innerRadius = outerRadius * innerRatio;
  float tA = a * sides / 6.28318530718;
  float t = abs((tA - floor(tA)) * 2.0 - 1.0);
  float boundary = innerRadius + (outerRadius - innerRadius) * t;
  return len - boundary;
}`,
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${x}, ${y})) * _ar;
p = rotate2D(p, ${rot} * 3.14159265 / 180.0);
vec2 pn = p / vec2(${w} * 0.5, ${h} * 0.5);
float refHalf = min(${w}, ${h}) * 0.5;
float d = sdFlower(pn, 1.0, float(${petals}), ${ir}) * refHalf;
float fillA = 1.0 - aastep(0.0, d);
float strokeA = (1.0 - aastep(${sw} * 0.5, abs(d - ${this.config.strokeMode === "inside" ? `(-${sw} * 0.5)` : this.config.strokeMode === "outside" ? `(${sw} * 0.5)` : `0.0`}))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeA);
return vec4(col, max(fillA, strokeA));`
		};
	}
};
register(Flower);
//#endregion
//#region src/shaders/shapes/polygon.ts
var config$69 = z.object({
	...transformFields(),
	sides: zInt(3, 16).default(6).describe("Sides"),
	rounding: zFloat(0, 1, .01).default(0).describe("Rounding"),
	fillColor: zColor().default([
		1,
		1,
		1
	]).describe("Fill"),
	strokeColor: zColor().default([
		0,
		0,
		0
	]).describe("Stroke"),
	strokeWidth: zFloat(0, .1, .001).default(0).describe("Stroke Width"),
	strokeMode: z.enum([
		"inside",
		"center",
		"outside"
	]).default("center").describe("Stroke Mode")
});
var inputs$69 = z.object({});
var meta$69 = {
	name: "Polygon",
	description: "Regular polygon with adjustable sides and corner rounding",
	color: "#3b82f6",
	category: "shapes",
	defaultBlendMode: "normal"
};
var Polygon = class extends GeneratorNode {
	static typeId = "polygon";
	static config = config$69;
	static inputs = inputs$69;
	static meta = meta$69;
	static spatialControls = [{
		kind: "transform",
		x: "x",
		y: "y",
		w: "width",
		h: "height",
		rotation: "rotation",
		label: "Bounds"
	}];
	glsl() {
		const x = this.uniformName("x");
		const y = this.uniformName("y");
		const w = this.uniformName("width");
		const h = this.uniformName("height");
		const rot = this.uniformName("rotation");
		const sides = this.uniformName("sides");
		const round = this.uniformName("rounding");
		const fill = this.uniformName("fillColor");
		const stroke = this.uniformName("strokeColor");
		const sw = this.uniformName("strokeWidth");
		return {
			dependencies: [
				"aastep",
				"sdRegularPolygon",
				"sdCircle",
				"rotate2D"
			],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${x}, ${y})) * _ar;
p = rotate2D(p, ${rot} * 3.14159265 / 180.0);
vec2 pn = p / vec2(${w} * 0.5, ${h} * 0.5);
float refHalf = min(${w}, ${h}) * 0.5;
float dPoly = sdRegularPolygon(pn, 1.0, float(${sides}));
float dCirc = sdCircle(pn, 1.0);
float d = mix(dPoly, dCirc, ${round}) * refHalf;
float fillA = 1.0 - aastep(0.0, d);
float strokeA = (1.0 - aastep(${sw} * 0.5, abs(d - ${this.config.strokeMode === "inside" ? `(-${sw} * 0.5)` : this.config.strokeMode === "outside" ? `(${sw} * 0.5)` : `0.0`}))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeA);
return vec4(col, max(fillA, strokeA));`
		};
	}
};
register(Polygon);
//#endregion
//#region src/shaders/shapes/ring.ts
var config$68 = z.object({
	...transformFields(),
	thickness: zFloat(0, 1, .001).default(.2).describe("Thickness"),
	innerShape: zFloat(0, 1, .01).default(0).describe("Inner Falloff"),
	fillColor: zColor().default([
		1,
		1,
		1
	]).describe("Fill"),
	strokeColor: zColor().default([
		0,
		0,
		0
	]).describe("Stroke"),
	strokeWidth: zFloat(0, .1, .001).default(0).describe("Stroke Width"),
	strokeMode: z.enum([
		"inside",
		"center",
		"outside"
	]).default("center").describe("Stroke Mode")
});
var inputs$68 = z.object({});
var meta$68 = {
	name: "Ring",
	description: "Annular ring with adjustable thickness — fills its bounding box",
	color: "#3b82f6",
	category: "shapes",
	defaultBlendMode: "normal"
};
var Ring = class extends GeneratorNode {
	static typeId = "ring";
	static config = config$68;
	static inputs = inputs$68;
	static meta = meta$68;
	static spatialControls = [{
		kind: "transform",
		x: "x",
		y: "y",
		w: "width",
		h: "height",
		rotation: "rotation",
		label: "Bounds"
	}];
	structuralKey() {
		return this.config.innerShape > 0 ? "soft" : "crisp";
	}
	glsl() {
		const x = this.uniformName("x");
		const y = this.uniformName("y");
		const w = this.uniformName("width");
		const h = this.uniformName("height");
		const rot = this.uniformName("rotation");
		const th = this.uniformName("thickness");
		const innerShape = this.uniformName("innerShape");
		const fill = this.uniformName("fillColor");
		const stroke = this.uniformName("strokeColor");
		const sw = this.uniformName("strokeWidth");
		const offset = this.config.strokeMode === "inside" ? `(-${sw} * 0.5)` : this.config.strokeMode === "outside" ? `(${sw} * 0.5)` : `0.0`;
		return {
			dependencies: [
				"aastep",
				"sdCircle",
				"rotate2D"
			],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${x}, ${y})) * _ar;
p = rotate2D(p, ${rot} * 3.14159265 / 180.0);
vec2 pn = p / vec2(${w} * 0.5, ${h} * 0.5);
float refHalf = min(${w}, ${h}) * 0.5;
float distOut = sdCircle(pn, 1.0);
${this.config.innerShape > 0 ? `
// Soft-falloff ring: smooth alpha bump fading inward from the outer boundary.
float outer = 1.0 - smoothstep(0.0, ${th}, distOut);
float inner = smoothstep(-pow(${innerShape}, 3.0) * ${th}, 0.0, distOut);
float fillA = outer * inner;` : `
// Crisp band: alpha 1 inside [-thickness, 0] in unit-bbox space, ~1px feather.
float d = abs(distOut + ${th} * 0.5) - ${th} * 0.5;
float fillA = 1.0 - aastep(0.0, d);`}
// Stroke tracks the band-centre line so it stays recognisable across modes.
float strokeD = (abs(distOut + ${th} * 0.5) - ${th} * 0.5) * refHalf;
float strokeA = (1.0 - aastep(${sw} * 0.5, abs(strokeD - ${offset}))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeA);
return vec4(col, max(fillA, strokeA));`
		};
	}
};
register(Ring);
//#endregion
//#region src/shaders/shapes/rounded-rect.ts
var config$67 = z.object({
	...transformFields(),
	rounding: zFloat(0, 1, .001).default(.2).describe("Rounding"),
	fillColor: zColor().default([
		1,
		1,
		1
	]).describe("Fill"),
	strokeColor: zColor().default([
		0,
		0,
		0
	]).describe("Stroke"),
	strokeWidth: zFloat(0, .1, .001).default(0).describe("Stroke Width"),
	strokeMode: z.enum([
		"inside",
		"center",
		"outside"
	]).default("center").describe("Stroke Mode")
});
var inputs$67 = z.object({});
var meta$67 = {
	name: "Rounded Rect",
	description: "Rectangle with rounded corners — fills its bounding box",
	color: "#3b82f6",
	category: "shapes",
	defaultBlendMode: "normal"
};
var RoundedRect = class extends GeneratorNode {
	static typeId = "rounded-rect";
	static config = config$67;
	static inputs = inputs$67;
	static meta = meta$67;
	static spatialControls = [{
		kind: "transform",
		x: "x",
		y: "y",
		w: "width",
		h: "height",
		rotation: "rotation",
		label: "Bounds"
	}];
	glsl() {
		const x = this.uniformName("x");
		const y = this.uniformName("y");
		const w = this.uniformName("width");
		const h = this.uniformName("height");
		const rot = this.uniformName("rotation");
		const round = this.uniformName("rounding");
		const fill = this.uniformName("fillColor");
		const stroke = this.uniformName("strokeColor");
		const sw = this.uniformName("strokeWidth");
		return {
			dependencies: [
				"aastep",
				"sdRoundedBox",
				"rotate2D"
			],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${x}, ${y})) * _ar;
p = rotate2D(p, ${rot} * 3.14159265 / 180.0);
// Corner radius caps at half the smaller half-extent — pill at rounding=1.
float r = ${round} * min(${w}, ${h}) * 0.5;
float d = sdRoundedBox(p, vec2(${w} * 0.5, ${h} * 0.5), r);
float fillA = 1.0 - aastep(0.0, d);
float strokeA = (1.0 - aastep(${sw} * 0.5, abs(d - ${this.config.strokeMode === "inside" ? `(-${sw} * 0.5)` : this.config.strokeMode === "outside" ? `(${sw} * 0.5)` : `0.0`}))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeA);
return vec4(col, max(fillA, strokeA));`
		};
	}
};
register(RoundedRect);
//#endregion
//#region src/shaders/shapes/star.ts
var config$66 = z.object({
	...transformFields(),
	points: zInt(3, 12).default(5).describe("Points"),
	innerRatio: zFloat(.1, .9, .01).default(.4).describe("Inner Ratio"),
	fillColor: zColor().default([
		1,
		1,
		1
	]).describe("Fill"),
	strokeColor: zColor().default([
		0,
		0,
		0
	]).describe("Stroke"),
	strokeWidth: zFloat(0, .1, .001).default(0).describe("Stroke Width"),
	strokeMode: z.enum([
		"inside",
		"center",
		"outside"
	]).default("center").describe("Stroke Mode")
});
var inputs$66 = z.object({});
var meta$66 = {
	name: "Star",
	description: "N-pointed star with adjustable inner radius ratio",
	color: "#3b82f6",
	category: "shapes",
	defaultBlendMode: "normal"
};
var Star = class extends GeneratorNode {
	static typeId = "star";
	static config = config$66;
	static inputs = inputs$66;
	static meta = meta$66;
	static spatialControls = [{
		kind: "transform",
		x: "x",
		y: "y",
		w: "width",
		h: "height",
		rotation: "rotation",
		label: "Bounds"
	}];
	glsl() {
		const x = this.uniformName("x");
		const y = this.uniformName("y");
		const w = this.uniformName("width");
		const h = this.uniformName("height");
		const rot = this.uniformName("rotation");
		const pts = this.uniformName("points");
		const ir = this.uniformName("innerRatio");
		const fill = this.uniformName("fillColor");
		const stroke = this.uniformName("strokeColor");
		const sw = this.uniformName("strokeWidth");
		return {
			dependencies: ["aastep", "rotate2D"],
			functions: `
float sdStarRatio(vec2 p, float outerRadius, float sides, float innerRatio) {
  float innerRadius = outerRadius * innerRatio;
  float len = length(p);
  float a = atan(p.y, p.x);
  float sectorAngle = 6.28318530718 / sides;
  float sectorIdx = floor(a / sectorAngle + 0.5);
  float bn = a - sectorIdx * sectorAngle;
  float fpx = abs(len * sin(bn));
  float fpy = len * cos(bn);
  float an = 3.14159265 / sides;
  float ex = innerRadius * sin(an);
  float ey = innerRadius * cos(an) - outerRadius;
  float qx = fpx;
  float qy = fpy - outerRadius;
  float t = clamp((qx * ex + qy * ey) / (ex * ex + ey * ey), 0.0, 1.0);
  float nx = fpx - ex * t;
  float ny = fpy - (outerRadius + ey * t);
  float dist = sqrt(nx * nx + ny * ny);
  float crossV = ex * qy - ey * qx;
  return dist * sign(crossV);
}`,
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${x}, ${y})) * _ar;
p = rotate2D(p, ${rot} * 3.14159265 / 180.0);
vec2 pn = p / vec2(${w} * 0.5, ${h} * 0.5);
float refHalf = min(${w}, ${h}) * 0.5;
float d = sdStarRatio(pn, 1.0, float(${pts}), ${ir}) * refHalf;
float fillA = 1.0 - aastep(0.0, d);
float strokeA = (1.0 - aastep(${sw} * 0.5, abs(d - ${this.config.strokeMode === "inside" ? `(-${sw} * 0.5)` : this.config.strokeMode === "outside" ? `(${sw} * 0.5)` : `0.0`}))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeA);
return vec4(col, max(fillA, strokeA));`
		};
	}
};
register(Star);
//#endregion
//#region src/shaders/shapes/trapezoid.ts
var config$65 = z.object({
	...transformFields(),
	topRatio: zFloat(0, 1, .001).default(.6).describe("Top Ratio"),
	fillColor: zColor().default([
		1,
		1,
		1
	]).describe("Fill"),
	strokeColor: zColor().default([
		0,
		0,
		0
	]).describe("Stroke"),
	strokeWidth: zFloat(0, .1, .001).default(0).describe("Stroke Width"),
	strokeMode: z.enum([
		"inside",
		"center",
		"outside"
	]).default("center").describe("Stroke Mode")
});
var inputs$65 = z.object({});
var meta$65 = {
	name: "Trapezoid",
	description: "Trapezoid filling its bounding box; top width is a ratio of the bottom",
	color: "#f59e0b",
	category: "shapes",
	defaultBlendMode: "normal"
};
var Trapezoid = class extends GeneratorNode {
	static typeId = "trapezoid";
	static config = config$65;
	static inputs = inputs$65;
	static meta = meta$65;
	static spatialControls = [{
		kind: "transform",
		x: "x",
		y: "y",
		w: "width",
		h: "height",
		rotation: "rotation",
		label: "Bounds"
	}];
	glsl() {
		const x = this.uniformName("x");
		const y = this.uniformName("y");
		const w = this.uniformName("width");
		const h = this.uniformName("height");
		const rot = this.uniformName("rotation");
		const tr = this.uniformName("topRatio");
		const fill = this.uniformName("fillColor");
		const stroke = this.uniformName("strokeColor");
		const sw = this.uniformName("strokeWidth");
		return {
			dependencies: ["aastep", "rotate2D"],
			functions: `
float sdTrapezoid(vec2 p, float topWidth, float bottomWidth, float height) {
  vec2 k1 = vec2(bottomWidth, height);
  vec2 k2 = vec2(bottomWidth - topWidth, 2.0 * height);
  p.x = abs(p.x);
  vec2 ca = vec2(p.x - min(p.x, p.y < 0.0 ? bottomWidth : topWidth), abs(p.y) - height);
  vec2 cb = p - k1 + k2 * clamp(dot(k1 - p, k2) / dot(k2, k2), 0.0, 1.0);
  float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
  return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}`,
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${x}, ${y})) * _ar;
p = rotate2D(p, ${rot} * 3.14159265 / 180.0);
// Bottom width = bbox width; top width = ratio × bottom. Height = bbox height.
float halfBottom = ${w} * 0.5;
float halfTop = halfBottom * ${tr};
float halfHeight = ${h} * 0.5;
float d = sdTrapezoid(p, halfTop, halfBottom, halfHeight);
float fillA = 1.0 - aastep(0.0, d);
float strokeA = (1.0 - aastep(${sw} * 0.5, abs(d - ${this.config.strokeMode === "inside" ? `(-${sw} * 0.5)` : this.config.strokeMode === "outside" ? `(${sw} * 0.5)` : `0.0`}))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeA);
return vec4(col, max(fillA, strokeA));`
		};
	}
};
register(Trapezoid);
//#endregion
//#region src/shaders/shapes/vesica.ts
var config$64 = z.object({
	...transformFields(),
	spread: zFloat(.05, .95, .01).default(.5).describe("Spread"),
	fillColor: zColor().default([
		1,
		1,
		1
	]).describe("Fill"),
	strokeColor: zColor().default([
		0,
		0,
		0
	]).describe("Stroke"),
	strokeWidth: zFloat(0, .1, .001).default(0).describe("Stroke Width"),
	strokeMode: z.enum([
		"inside",
		"center",
		"outside"
	]).default("center").describe("Stroke Mode")
});
var inputs$64 = z.object({});
var meta$64 = {
	name: "Vesica",
	description: "Almond / lens shape (intersection of two circles)",
	color: "#3b82f6",
	category: "shapes",
	defaultBlendMode: "normal"
};
var Vesica = class extends GeneratorNode {
	static typeId = "vesica";
	static config = config$64;
	static inputs = inputs$64;
	static meta = meta$64;
	static spatialControls = [{
		kind: "transform",
		x: "x",
		y: "y",
		w: "width",
		h: "height",
		rotation: "rotation",
		label: "Bounds"
	}];
	glsl() {
		const x = this.uniformName("x");
		const y = this.uniformName("y");
		const w = this.uniformName("width");
		const h = this.uniformName("height");
		const rot = this.uniformName("rotation");
		const spread = this.uniformName("spread");
		const fill = this.uniformName("fillColor");
		const stroke = this.uniformName("strokeColor");
		const sw = this.uniformName("strokeWidth");
		return {
			dependencies: [
				"aastep",
				"sdVesica",
				"rotate2D"
			],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${x}, ${y})) * _ar;
p = rotate2D(p, ${rot} * 3.14159265 / 180.0);
vec2 pn = p / vec2(${w} * 0.5, ${h} * 0.5);
float refHalf = min(${w}, ${h}) * 0.5;
float d = sdVesica(pn.yx, 1.0, ${spread}) * refHalf;
float fillA = 1.0 - aastep(0.0, d);
float strokeA = (1.0 - aastep(${sw} * 0.5, abs(d - ${this.config.strokeMode === "inside" ? `(-${sw} * 0.5)` : this.config.strokeMode === "outside" ? `(${sw} * 0.5)` : `0.0`}))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeA);
return vec4(col, max(fillA, strokeA));`
		};
	}
};
register(Vesica);
//#endregion
//#region src/shaders/shape-effects/crystal.ts
var config$63 = z.object({
	intensity: zFloat(0, 1, .01).default(.5).describe("Intensity"),
	facets: zFloat(1, 30, .5).default(8).describe("Facets"),
	chromaticAberration: zFloat(0, 1, .01).default(.3).describe("Chromatic Aberration"),
	fresnel: zFloat(0, 1, .01).default(.5).describe("Fresnel")
});
var inputs$63 = z.object({});
var meta$63 = {
	name: "Crystal",
	description: "Crystalline faceted refraction",
	color: "#a78bfa",
	category: "shape-effects",
	defaultBlendMode: "normal"
};
var Crystal = class extends EffectNode {
	static typeId = "crystal";
	static config = config$63;
	static inputs = inputs$63;
	static meta = meta$63;
	static appliesTo = ["shape"];
	glsl() {
		const intensity = this.uniformName("intensity");
		return {
			dependencies: ["hash2"],
			main: `
vec2 q = uv * ${this.uniformName("facets")};
vec2 cell = floor(q);
vec2 fpos = fract(q);
vec2 offset = (hash2(cell) - 0.5) * 2.0 * ${intensity} * 0.05;
float caStrength = ${this.uniformName("chromaticAberration")} * 0.015;
vec2 caDir = normalize(offset + vec2(1e-5));
float r = texture(u_prevPass, uv + offset + caDir * caStrength).r;
vec4 g = texture(u_prevPass, uv + offset);
float b = texture(u_prevPass, uv + offset - caDir * caStrength).b;
vec2 edgeDist = min(fpos, 1.0 - fpos);
float rim = 1.0 - smoothstep(0.0, 0.15, min(edgeDist.x, edgeDist.y));
vec3 col = vec3(r, g.g, b) + rim * ${this.uniformName("fresnel")};
return vec4(col, g.a);`
		};
	}
};
register(Crystal);
//#endregion
//#region src/shaders/shape-effects/emboss.ts
var config$62 = z.object({
	lightAngle: zAngle().default(45).describe("Light Angle"),
	intensity: zFloat(0, 1, .01).default(.5).describe("Intensity"),
	softness: zFloat(0, 1, .01).default(.5).describe("Softness")
});
var inputs$62 = z.object({});
var meta$62 = {
	name: "Emboss",
	description: "Embossed relief",
	color: "#475569",
	category: "shape-effects",
	defaultBlendMode: "normal"
};
var Emboss = class extends EffectNode {
	static typeId = "emboss";
	static config = config$62;
	static inputs = inputs$62;
	static meta = meta$62;
	static appliesTo = ["shape"];
	glsl() {
		const angle = this.uniformName("lightAngle");
		const intensity = this.uniformName("intensity");
		return {
			dependencies: ["luma"],
			main: `
vec2 texel = 1.0 / u_resolution;
float a = ${angle} * 3.14159 / 180.0;
float reach = mix(1.0, 4.0, ${this.uniformName("softness")});
vec2 dir = vec2(cos(a), sin(a)) * texel * reach;
float l1 = luma(texture(u_prevPass, uv + dir).rgb);
float l2 = luma(texture(u_prevPass, uv - dir).rgb);
float v = (l1 - l2) * ${intensity} * 4.0 + 0.5;
return vec4(vec3(v), 1.0);`
		};
	}
};
register(Emboss);
//#endregion
//#region src/shaders/shape-effects/glass.ts
var config$61 = z.object({
	refraction: zFloat(0, 1, .01).default(.5).describe("Refraction"),
	chromaticAberration: zFloat(0, 1, .01).default(.3).describe("Chromatic Aberration"),
	blur: zFloat(0, 1, .01).default(.2).describe("Blur"),
	tint: zColor().default([
		1,
		1,
		1
	]).describe("Tint"),
	tintIntensity: zFloat(0, 1, .01).default(.2).describe("Tint Intensity"),
	fresnel: zFloat(0, 1, .01).default(.3).describe("Fresnel")
});
var inputs$61 = z.object({});
var meta$61 = {
	name: "Glass",
	description: "Frosted-glass refraction",
	color: "#22d3ee",
	category: "shape-effects",
	defaultBlendMode: "normal"
};
var Glass = class extends EffectNode {
	static typeId = "glass";
	static config = config$61;
	static inputs = inputs$61;
	static meta = meta$61;
	static appliesTo = ["shape"];
	glsl() {
		return {
			dependencies: ["simplex2D", "gaussian9"],
			main: `
vec2 q = uv * 8.0;
float e = 0.01;
float n  = simplex2D(q);
float nx = simplex2D(q + vec2(e, 0.0));
float ny = simplex2D(q + vec2(0.0, e));
vec2 grad = vec2(nx - n, ny - n) / e;
vec2 refractedUV = uv + grad * ${this.uniformName("refraction")} * 0.04;
float caStrength = ${this.uniformName("chromaticAberration")} * 0.015;
vec2 caDir = normalize(grad + vec2(1e-5));
vec2 texel = 1.0 / u_resolution;
vec2 br = texel * ${this.uniformName("blur")} * 6.0;
vec4 sR = gaussian9(u_prevPass, refractedUV + caDir * caStrength, br);
vec4 sG = gaussian9(u_prevPass, refractedUV, br);
vec4 sB = gaussian9(u_prevPass, refractedUV - caDir * caStrength, br);
vec3 col = vec3(sR.r, sG.g, sB.b);
col = mix(col, col * ${this.uniformName("tint")}, ${this.uniformName("tintIntensity")});
float rim = clamp(length(grad) * 0.5, 0.0, 1.0);
col += rim * ${this.uniformName("fresnel")};
return vec4(col, sG.a);`
		};
	}
};
register(Glass);
//#endregion
//#region src/shaders/shape-effects/neon.ts
var config$60 = z.object({
	glowIntensity: zFloat(0, 2, .05).default(1).describe("Glow Intensity"),
	glowSize: zFloat(0, 1, .01).default(.3).describe("Glow Size"),
	flicker: zFloat(0, 1, .01).default(0).describe("Flicker"),
	coreColor: zColor().default([
		1,
		1,
		1
	]).describe("Core Color"),
	glowColor: zColor().default([
		1,
		.6,
		.2
	]).describe("Glow Color")
});
var inputs$60 = z.object({});
var meta$60 = {
	name: "Neon",
	description: "Glowing-edges neon effect",
	color: "#facc15",
	category: "shape-effects",
	defaultBlendMode: "normal"
};
var Neon = class extends EffectNode {
	static typeId = "neon";
	static config = config$60;
	static inputs = inputs$60;
	static meta = meta$60;
	static appliesTo = ["shape"];
	glsl() {
		const glowIntensity = this.uniformName("glowIntensity");
		return {
			dependencies: ["luma", "gaussian13"],
			main: `
vec2 texel = 1.0 / u_resolution;
float lc = luma(texture(u_prevPass, uv).rgb);
float l1 = luma(texture(u_prevPass, uv + vec2(texel.x, 0.0)).rgb);
float l2 = luma(texture(u_prevPass, uv - vec2(texel.x, 0.0)).rgb);
float l3 = luma(texture(u_prevPass, uv + vec2(0.0, texel.y)).rgb);
float l4 = luma(texture(u_prevPass, uv - vec2(0.0, texel.y)).rgb);
float edge = clamp(abs(l1 - l2) + abs(l3 - l4), 0.0, 1.0);
vec2 g = texel * ${this.uniformName("glowSize")} * 30.0;
vec4 blurH = gaussian13(u_prevPass, uv, vec2(g.x, 0.0));
vec4 blurV = gaussian13(u_prevPass, uv, vec2(0.0, g.y));
float blurEdge = (luma(blurH.rgb) + luma(blurV.rgb)) * 0.5;
float flick = 1.0 - ${this.uniformName("flicker")} * (0.5 + 0.5 * sin(u_time * 20.0));
vec3 core = ${this.uniformName("coreColor")} * edge * 4.0;
vec3 halo = ${this.uniformName("glowColor")} * blurEdge * 1.5;
vec3 col = (core + halo) * ${glowIntensity} * flick;
return vec4(col, 1.0);`
		};
	}
};
register(Neon);
//#endregion
//#region src/shaders/shape-effects/smoke-fill.ts
var config$59 = z.object({
	intensity: zFloat(0, 1).default(.5).describe("Intensity"),
	speed: zFloat(0, 2, .05).default(.3).describe("Speed"),
	scale: zFloat(.1, 5, .05).default(2).describe("Scale"),
	color1: zColor().default([
		.55,
		.95,
		1
	]).describe("Color 1"),
	color2: zColor().default([
		.02,
		.63,
		.84
	]).describe("Color 2")
});
var inputs$59 = z.object({});
var meta$59 = {
	name: "Smoke Fill",
	description: "Fill an alpha mask with billowing smoke",
	color: "#94a3b8",
	category: "shape-effects",
	defaultBlendMode: "normal"
};
var SmokeFill = class extends EffectNode {
	static typeId = "smoke-fill";
	static config = config$59;
	static inputs = inputs$59;
	static meta = meta$59;
	static appliesTo = ["shape"];
	glsl() {
		const intensity = this.uniformName("intensity");
		const speed = this.uniformName("speed");
		return {
			dependencies: [
				"fbm",
				"simplex2D",
				"unpremultiplyAlpha"
			],
			main: `
// Sample the previous pass directly — when SmokeFill runs as its own FBO pass
// the codegen passes \`base\` as vec4(0), so we cannot rely on it. The previous
// alpha mask (e.g. a shape) gates where the smoke actually paints.
vec4 prev = unpremultiplyAlpha(texture(u_prevPass, uv));
float n = fbm(uv * ${this.uniformName("scale")} + u_time * vec2(0.0, ${speed} * 0.1), 4.0, 2.0, 0.5) * 0.5 + 0.5;
vec3 smoke = mix(${this.uniformName("color1")}, ${this.uniformName("color2")}, n);
return vec4(mix(prev.rgb, smoke, prev.a * ${intensity} * n), prev.a);`
		};
	}
};
register(SmokeFill);
//#endregion
//#region src/shaders/stylize/ascii.ts
var config$58 = z.object({
	density: zFloat(8, 300, 1).default(80).describe("Density"),
	gamma: zFloat(.5, 3, .01).default(1).describe("Gamma"),
	alphaThreshold: zFloat(0, 1).default(.05).describe("Alpha Threshold"),
	preserveAlpha: zBool().default(true).describe("Preserve Alpha"),
	colorBack: zColor().default([
		0,
		0,
		0
	]).describe("Background"),
	colorChar: zColor().default([
		.4,
		1,
		.5
	]).describe("Character")
});
var inputs$58 = z.object({});
var meta$58 = {
	name: "ASCII",
	description: "Coarse ASCII-like dot density",
	color: "#475569",
	category: "stylize",
	defaultBlendMode: "normal"
};
var Ascii = class extends EffectNode {
	static typeId = "ascii";
	static config = config$58;
	static inputs = inputs$58;
	static meta = meta$58;
	glsl() {
		const density = this.uniformName("density");
		const gamma = this.uniformName("gamma");
		const alphaThreshold = this.uniformName("alphaThreshold");
		const preserveAlpha = this.uniformName("preserveAlpha");
		return { main: `
vec2 cells = vec2(${density}, ${density} * (u_resolution.y / max(u_resolution.x, 1.0)));
vec2 cellId = floor(uv * cells);
vec2 cellUv = fract(uv * cells);
vec2 cellSample = (cellId + 0.5) / cells;
vec4 cellColor = texture(u_prevPass, cellSample);
float lum = dot(cellColor.rgb, vec3(0.299, 0.587, 0.114));
float toned = pow(clamp(lum, 0.0, 1.0), 1.0 / max(${gamma}, 1e-4));
float bars = floor(toned * 4.0);
float fill = step(cellUv.y, bars * 0.25 + 0.05);
float bar  = step(abs(cellUv.x - 0.5), 0.4) * fill;
vec3 rgb = mix(${this.uniformName("colorBack")}, ${this.uniformName("colorChar")}, bar);
float srcAlpha = texture(u_prevPass, uv).a;
float outA = ${preserveAlpha} ? srcAlpha : 1.0;
if (srcAlpha < ${alphaThreshold}) outA = 0.0;
return vec4(rgb, outA);` };
	}
};
register(Ascii);
//#endregion
//#region src/shaders/stylize/chromatic-aberration.ts
var config$57 = z.object({
	strength: zFloat(0, 1).default(.5).describe("Strength"),
	angle: zAngle().default(0).describe("Angle")
});
var inputs$57 = z.object({});
var meta$57 = {
	name: "Chromatic Aberration",
	description: "Aspect-corrected RGB channel offset along an angle",
	color: "#ef4444",
	category: "stylize",
	defaultBlendMode: "normal"
};
var ChromaticAberration = class extends EffectNode {
	static typeId = "chromatic-aberration";
	static config = config$57;
	static inputs = inputs$57;
	static meta = meta$57;
	glsl() {
		const strength = this.uniformName("strength");
		return {
			dependencies: ["pi"],
			main: `
float aspect = u_resolution.x / max(u_resolution.y, 1.0);
float a = ${this.uniformName("angle")} * PI / 180.0;
vec2 dir = vec2(cos(a) / aspect, sin(a));
vec2 off = dir * ${strength} * 0.01;
float r = texture(u_prevPass, uv - off).r;
vec4 g = texture(u_prevPass, uv);
float b = texture(u_prevPass, uv + off).b;
return vec4(r, g.g, b, g.a);`
		};
	}
};
register(ChromaticAberration);
//#endregion
//#region src/shaders/stylize/contour-lines.ts
var config$56 = z.object({
	colorBack: zColor().default([
		.02,
		.04,
		.05
	]).describe("Background"),
	colorFront: zColor().default([
		.55,
		.95,
		.7
	]).describe("Lines"),
	scale: zFloat(.5, 20, .1).default(3).describe("Scale"),
	frequency: zFloat(1, 30, .5).default(5).describe("Line Frequency"),
	thickness: zFloat(0, 1).default(.5).describe("Thickness"),
	softness: zFloat(0, 1).default(.3).describe("Softness"),
	speed: zFloat(0, 4, .05).default(0).describe("Speed")
});
var inputs$56 = z.object({});
var meta$56 = {
	name: "Contour Lines",
	description: "Topographic contour lines from noise",
	color: "#84cc16",
	category: "stylize",
	defaultBlendMode: "normal"
};
var ContourLines = class extends EffectNode {
	static typeId = "contour-lines";
	static config = config$56;
	static inputs = inputs$56;
	static meta = meta$56;
	glsl() {
		const colorBack = this.uniformName("colorBack");
		const colorFront = this.uniformName("colorFront");
		const scale = this.uniformName("scale");
		const frequency = this.uniformName("frequency");
		const thickness = this.uniformName("thickness");
		const softness = this.uniformName("softness");
		return {
			dependencies: ["simplex2D"],
			main: `
base = texture(u_prevPass, uv);
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
vec2 q = p * ${scale} + u_time * ${this.uniformName("speed")} * 0.3;
float n = simplex2D(q) * 0.5 + 0.5;
float lines = abs(fract(n * ${frequency}) - 0.5) * 2.0;
float halfWidth = clamp(${thickness}, 0.0, 1.0) * 0.5;
float soft = max(${softness}, 0.001) * 0.5;
float m = 1.0 - smoothstep(halfWidth, halfWidth + soft, lines);
return vec4(mix(${colorBack}, ${colorFront}, m), 1.0);`
		};
	}
};
register(ContourLines);
//#endregion
//#region src/shaders/stylize/crt-screen.ts
var config$55 = z.object({
	pixelSize: zFloat(0, .05, .001).default(.005).describe("Pixel Size"),
	scanlineFrequency: zFloat(50, 500, 1).default(200).describe("Scanline Frequency"),
	brightness: zFloat(0, 2, .01).default(1.1).describe("Brightness"),
	contrast: zFloat(0, 2, .01).default(1.1).describe("Contrast"),
	vignetteRadius: zFloat(0, 2, .01).default(.8).describe("Vignette Radius"),
	vignetteIntensity: zFloat(0, 1).default(.5).describe("Vignette Intensity")
});
var inputs$55 = z.object({});
var meta$55 = {
	name: "CRT Screen",
	description: "Pixelation, scanlines, brightness/contrast, and vignette",
	color: "#22d3ee",
	category: "stylize",
	defaultBlendMode: "normal"
};
var CrtScreen = class extends EffectNode {
	static typeId = "crt-screen";
	static config = config$55;
	static inputs = inputs$55;
	static meta = meta$55;
	glsl() {
		const pixelSize = this.uniformName("pixelSize");
		const scanlineFrequency = this.uniformName("scanlineFrequency");
		const brightness = this.uniformName("brightness");
		const contrast = this.uniformName("contrast");
		const vignetteRadius = this.uniformName("vignetteRadius");
		return {
			dependencies: ["pi"],
			main: `
float ps = max(${pixelSize}, 1e-5);
vec2 q = (floor(uv / ps) + 0.5) * ps;
vec4 src = texture(u_prevPass, q);
vec3 col = src.rgb;
float scan = 0.5 + 0.5 * sin(uv.y * ${scanlineFrequency} * PI * 2.0);
col *= mix(1.0, scan, 0.5);
col = (col - 0.5) * ${contrast} + 0.5;
col *= ${brightness};
vec2 d = uv - 0.5;
float r = length(d);
float vig = smoothstep(${vignetteRadius}, ${vignetteRadius} - 0.5, r);
col = mix(col, col * vig, ${this.uniformName("vignetteIntensity")});
return vec4(col, src.a);`
		};
	}
};
register(CrtScreen);
//#endregion
//#region src/shaders/stylize/dither.ts
var config$54 = z.object({
	pattern: z.enum([
		"bayer2",
		"bayer4",
		"bayer8",
		"whiteNoise"
	]).default("bayer4").describe("Pattern"),
	threshold: zFloat(0, 1).default(.5).describe("Threshold"),
	spread: zFloat(0, 1).default(.5).describe("Spread"),
	colorDark: zColor().default([
		.05,
		.05,
		.1
	]).describe("Dark"),
	colorLight: zColor().default([
		1,
		1,
		.95
	]).describe("Light")
});
var inputs$54 = z.object({});
var meta$54 = {
	name: "Dither",
	description: "Bayer or noise-based ordered dither (2-color)",
	color: "#475569",
	category: "stylize",
	defaultBlendMode: "normal"
};
var BAYER2 = `
const float bayer2[4] = float[4](
  0.0/4.0, 2.0/4.0,
  3.0/4.0, 1.0/4.0
);`;
var BAYER4 = `
const float bayer4[16] = float[16](
  0.0/16.0,  8.0/16.0,  2.0/16.0, 10.0/16.0,
 12.0/16.0,  4.0/16.0, 14.0/16.0,  6.0/16.0,
  3.0/16.0, 11.0/16.0,  1.0/16.0,  9.0/16.0,
 15.0/16.0,  7.0/16.0, 13.0/16.0,  5.0/16.0
);`;
var BAYER8 = `
const float bayer8[64] = float[64](
   0.0/64.0, 32.0/64.0,  8.0/64.0, 40.0/64.0,  2.0/64.0, 34.0/64.0, 10.0/64.0, 42.0/64.0,
  48.0/64.0, 16.0/64.0, 56.0/64.0, 24.0/64.0, 50.0/64.0, 18.0/64.0, 58.0/64.0, 26.0/64.0,
  12.0/64.0, 44.0/64.0,  4.0/64.0, 36.0/64.0, 14.0/64.0, 46.0/64.0,  6.0/64.0, 38.0/64.0,
  60.0/64.0, 28.0/64.0, 52.0/64.0, 20.0/64.0, 62.0/64.0, 30.0/64.0, 54.0/64.0, 22.0/64.0,
   3.0/64.0, 35.0/64.0, 11.0/64.0, 43.0/64.0,  1.0/64.0, 33.0/64.0,  9.0/64.0, 41.0/64.0,
  51.0/64.0, 19.0/64.0, 59.0/64.0, 27.0/64.0, 49.0/64.0, 17.0/64.0, 57.0/64.0, 25.0/64.0,
  15.0/64.0, 47.0/64.0,  7.0/64.0, 39.0/64.0, 13.0/64.0, 45.0/64.0,  5.0/64.0, 37.0/64.0,
  63.0/64.0, 31.0/64.0, 55.0/64.0, 23.0/64.0, 61.0/64.0, 29.0/64.0, 53.0/64.0, 21.0/64.0
);`;
var Dither = class extends EffectNode {
	static typeId = "dither";
	static config = config$54;
	static inputs = inputs$54;
	static meta = meta$54;
	glsl() {
		const threshold = this.uniformName("threshold");
		const spread = this.uniformName("spread");
		const colorDark = this.uniformName("colorDark");
		const colorLight = this.uniformName("colorLight");
		const pattern = this.config.pattern;
		let functions = "";
		let sampleExpr = "";
		if (pattern === "bayer2") {
			functions = BAYER2;
			sampleExpr = `
ivec2 ipx = ivec2(mod(gl_FragCoord.xy, 2.0));
float t = bayer2[ipx.y * 2 + ipx.x];`;
		} else if (pattern === "bayer4") {
			functions = BAYER4;
			sampleExpr = `
ivec2 ipx = ivec2(mod(gl_FragCoord.xy, 4.0));
float t = bayer4[ipx.y * 4 + ipx.x];`;
		} else if (pattern === "bayer8") {
			functions = BAYER8;
			sampleExpr = `
ivec2 ipx = ivec2(mod(gl_FragCoord.xy, 8.0));
float t = bayer8[ipx.y * 8 + ipx.x];`;
		} else sampleExpr = `
float t = hash21(gl_FragCoord.xy);`;
		const block = {
			dependencies: pattern === "whiteNoise" ? ["hash21", "luma"] : ["luma"],
			main: `
vec4 src = texture(u_prevPass, uv);
float lum = luma(src.rgb);
${sampleExpr}
float d = lum + (t - 0.5) * ${spread};
float v = step(${threshold}, d);
return vec4(mix(${colorDark}, ${colorLight}, v), src.a);`
		};
		if (functions) block.functions = functions;
		return block;
	}
};
register(Dither);
//#endregion
//#region src/shaders/stylize/drop-shadow.ts
var config$53 = z.object({
	angle: zAngle().default(135).describe("Angle"),
	distance: zFloat(0, 1, .001).default(.05).describe("Distance"),
	blur: zFloat(0, 50, .5).default(10).describe("Blur"),
	color: zColor().default([
		0,
		0,
		0
	]).describe("Shadow Color"),
	opacity: zFloat(0, 1).default(.5).describe("Opacity"),
	cutout: zBool().default(false).describe("Cutout")
});
var inputs$53 = z.object({});
var meta$53 = {
	name: "Drop Shadow",
	description: "Soft shadow behind opaque content",
	color: "#1e293b",
	category: "stylize",
	defaultBlendMode: "normal"
};
var DropShadow = class extends EffectNode {
	static typeId = "drop-shadow";
	static config = config$53;
	static inputs = inputs$53;
	static meta = meta$53;
	glsl() {
		const angle = this.uniformName("angle");
		const distance = this.uniformName("distance");
		const blur = this.uniformName("blur");
		const color = this.uniformName("color");
		return {
			dependencies: ["gaussian13", "pi"],
			main: `
vec2 texel = 1.0 / u_resolution;
float a = ${angle} * PI / 180.0;
vec2 off = vec2(cos(a), sin(a)) * ${distance};
vec2 blurDir = texel * ${blur};
vec4 h = gaussian13(u_prevPass, uv - off, vec2(blurDir.x, 0.0));
vec4 v = gaussian13(u_prevPass, uv - off, vec2(0.0, blurDir.y));
float shadowA = (h.a + v.a) * 0.5 * ${this.uniformName("opacity")};
vec4 src = texture(u_prevPass, uv);
vec4 shadow = vec4(${color}, shadowA);
if (${this.uniformName("cutout")}) {
  float a2 = shadow.a * (1.0 - src.a);
  return vec4(shadow.rgb, a2);
}
vec4 outCol;
outCol.rgb = mix(shadow.rgb, src.rgb, src.a);
outCol.a = src.a + shadow.a * (1.0 - src.a);
return outCol;`
		};
	}
};
register(DropShadow);
//#endregion
//#region src/shaders/stylize/film-grain.ts
var config$52 = z.object({
	intensity: zFloat(0, 1).default(.3).describe("Intensity"),
	size: zFloat(0, 1, .01).default(.5).describe("Size"),
	bias: zFloat(-1, 1, .01).default(0).describe("Bias"),
	animated: zBool().default(false).describe("Animated")
});
var inputs$52 = z.object({});
var meta$52 = {
	name: "Film Grain",
	description: "Per-pixel grain biased toward dark or light areas",
	color: "#a3a3a3",
	category: "stylize",
	defaultBlendMode: "normal"
};
var FilmGrain = class extends EffectNode {
	static typeId = "film-grain";
	static config = config$52;
	static inputs = inputs$52;
	static meta = meta$52;
	glsl() {
		const intensity = this.uniformName("intensity");
		const size = this.uniformName("size");
		const bias = this.uniformName("bias");
		return {
			dependencies: ["hash21", "luma"],
			main: `
base = texture(u_prevPass, uv);
float seed = ${this.uniformName("animated")} ? floor(u_time * 30.0) : 0.0;
float pxScale = mix(8.0, 0.5, clamp(${size}, 0.0, 1.0));
vec2 grainUV = floor(uv * u_resolution / max(pxScale, 0.001));
float n = hash21(grainUV + vec2(seed * 13.7, seed * 7.13));
float grain = (n - 0.5) * 2.0 * ${intensity};
float lum = luma(base.rgb);
float w = smoothstep(0.0, 0.5 + ${bias}, lum);
vec3 rgb = mix(base.rgb, base.rgb + grain, w);
return vec4(rgb, base.a);`
		};
	}
};
register(FilmGrain);
//#endregion
//#region src/shaders/stylize/glitch.ts
var config$51 = z.object({
	intensity: zFloat(0, .3, .005).default(.04).describe("Intensity"),
	speed: zFloat(0, 30, .1).default(6).describe("Speed"),
	blockDensity: zFloat(0, 1).default(.5).describe("Block Density"),
	colorBars: zFloat(0, 1).default(0).describe("Color Bars"),
	mirrorChance: zFloat(0, 1).default(0).describe("Mirror Chance"),
	scanlineDistortion: zFloat(0, 1).default(0).describe("Scanline Distortion")
});
var inputs$51 = z.object({});
var meta$51 = {
	name: "Glitch",
	description: "Banded jitter with optional color bars, mirroring, and scanline distortion",
	color: "#22d3ee",
	category: "stylize",
	defaultBlendMode: "normal"
};
var Glitch = class extends EffectNode {
	static typeId = "glitch";
	static config = config$51;
	static inputs = inputs$51;
	static meta = meta$51;
	glsl() {
		const intensity = this.uniformName("intensity");
		const speed = this.uniformName("speed");
		const blockDensity = this.uniformName("blockDensity");
		const colorBars = this.uniformName("colorBars");
		const mirrorChance = this.uniformName("mirrorChance");
		return {
			dependencies: ["hash"],
			main: `
float lines = mix(8.0, 400.0, clamp(${blockDensity}, 0.0, 1.0));
float band = floor(uv.y * lines);
float t = floor(u_time * ${speed});
float h = hash(vec2(band, t));
float jitter = (h - 0.5) * 2.0 * ${intensity};
vec2 q = vec2(uv.x + jitter, uv.y);

float scanWave = sin(uv.y * 800.0 + u_time * ${speed} * 4.0);
q.x += scanWave * ${this.uniformName("scanlineDistortion")} * 0.01;

float mirrorH = hash(vec2(band, t + 17.0));
if (mirrorH < ${mirrorChance}) {
  q.x = 1.0 - q.x;
}

vec4 src = texture(u_prevPass, q);

float barH = hash(vec2(band, t + 31.0));
if (barH < ${colorBars}) {
  vec3 bar = vec3(
    step(0.33, fract(band * 0.137 + t * 0.07)),
    step(0.33, fract(band * 0.491 + t * 0.13)),
    step(0.33, fract(band * 0.733 + t * 0.19))
  );
  src.rgb = mix(src.rgb, bar, 0.7);
}

return src;`
		};
	}
};
register(Glitch);
//#endregion
//#region src/shaders/stylize/glow.ts
var config$50 = z.object({
	threshold: zFloat(0, 1).default(.5).describe("Threshold"),
	radius: zFloat(0, 40, .5).default(8).describe("Radius"),
	intensity: zFloat(0, 4, .05).default(1).describe("Intensity"),
	tint: zColor().default([
		1,
		1,
		1
	]).describe("Tint")
});
var inputs$50 = z.object({});
var meta$50 = {
	name: "Glow",
	description: "True bloom — bright pass + blur + add",
	color: "#fbbf24",
	category: "stylize",
	defaultBlendMode: "normal"
};
var Glow = class extends EffectNode {
	static typeId = "glow";
	static config = config$50;
	static inputs = inputs$50;
	static meta = meta$50;
	glsl() {
		const threshold = this.uniformName("threshold");
		const radius = this.uniformName("radius");
		const intensity = this.uniformName("intensity");
		return {
			dependencies: ["luma"],
			main: `
vec2 texel = 1.0 / u_resolution;
vec2 r = texel * ${radius};
vec3 bright = vec3(0.0);
const int N = 3;
for (int i = -N; i <= N; i++) {
  for (int j = -N; j <= N; j++) {
    vec3 c = texture(u_prevPass, uv + r * vec2(float(i), float(j))).rgb;
    bright += max(c - ${threshold}, vec3(0.0)) * smoothstep(${threshold} - 0.05, ${threshold} + 0.05, luma(c));
  }
}
bright /= float((2 * N + 1) * (2 * N + 1));
vec4 src = texture(u_prevPass, uv);
return vec4(src.rgb + bright * ${this.uniformName("tint")} * ${intensity}, src.a);`
		};
	}
};
register(Glow);
//#endregion
//#region src/shaders/stylize/halftone.ts
var config$49 = z.object({
	style: z.enum(["classic", "cmyk"]).default("classic").describe("Style"),
	cells: zFloat(4, 400, 1).default(60).describe("Cells"),
	angle: zFloat(0, 90, 1).default(30).describe("Angle"),
	softness: zFloat(.001, .4, .001).default(.05).describe("Softness"),
	colorBack: zColor().default([
		1,
		1,
		1
	]).describe("Background"),
	colorDot: zColor().default([
		0,
		0,
		0
	]).describe("Dot")
});
var inputs$49 = z.object({});
var meta$49 = {
	name: "Halftone",
	description: "Print-style dot screen — classic monochrome or CMYK plates",
	color: "#475569",
	category: "stylize",
	defaultBlendMode: "normal"
};
var Halftone = class extends EffectNode {
	static typeId = "halftone";
	static config = config$49;
	static inputs = inputs$49;
	static meta = meta$49;
	structuralKey() {
		return this.config.style;
	}
	glsl() {
		const cells = this.uniformName("cells");
		const angle = this.uniformName("angle");
		const softness = this.uniformName("softness");
		const colorBack = this.uniformName("colorBack");
		const colorDot = this.uniformName("colorDot");
		if (this.config.style === "cmyk") {
			const fnName = `halftone_${this.prefix}_plate`;
			return {
				dependencies: ["rotate2D"],
				functions: `
float ${fnName}(vec2 uv, vec2 ar, float v, float deg, float soft) {
  vec2 q = rotate2D(uv - 0.5, deg * 3.14159265 / 180.0) + 0.5;
  vec2 cu = fract(q * ar) - 0.5;
  float r = clamp(v, 0.0, 1.0) * 0.5;
  float d = length(cu);
  return 1.0 - smoothstep(r - soft, r + soft, d);
}`,
				main: `
vec4 src = texture(u_prevPass, uv);
vec3 rgb = clamp(src.rgb, 0.0, 1.0);
float K = 1.0 - max(max(rgb.r, rgb.g), rgb.b);
float denom = max(1.0 - K, 1e-4);
float C = (1.0 - rgb.r - K) / denom;
float M = (1.0 - rgb.g - K) / denom;
float Y = (1.0 - rgb.b - K) / denom;
vec2 ar = vec2(${cells}, ${cells} * (u_resolution.y / max(u_resolution.x, 1.0)));
float dC = ${fnName}(uv, ar, C, 75.0, ${softness});
float dM = ${fnName}(uv, ar, M, 15.0, ${softness});
float dY = ${fnName}(uv, ar, Y, 0.0, ${softness});
float dK = ${fnName}(uv, ar, K, 45.0, ${softness});
vec3 plateC = vec3(0.0, 0.7, 1.0);
vec3 plateM = vec3(1.0, 0.0, 0.6);
vec3 plateY = vec3(1.0, 0.95, 0.0);
vec3 plateK = vec3(0.0);
vec3 col = vec3(1.0);
col = mix(col, plateC, dC);
col = mix(col, plateM, dM);
col = mix(col, plateY, dY);
col = mix(col, plateK, dK);
return vec4(col, src.a);`
			};
		}
		return {
			dependencies: ["rotate2D", "luma"],
			main: `
vec2 q = rotate2D(uv - 0.5, ${angle} * 3.14159 / 180.0) + 0.5;
vec2 cellUv = fract(q * vec2(${cells}, ${cells} * (u_resolution.y / max(u_resolution.x, 1.0)))) - 0.5;
float lum = luma(texture(u_prevPass, uv).rgb);
float radius = (1.0 - lum) * 0.5;
float d = length(cellUv);
float fillDot = 1.0 - smoothstep(radius - ${softness}, radius + ${softness}, d);
return vec4(mix(${colorBack}, ${colorDot}, fillDot), 1.0);`
		};
	}
};
register(Halftone);
//#endregion
//#region src/shaders/stylize/lens-flare.ts
var config$48 = z.object({
	lightX: zFloat(0, 1).default(.5).describe("Light X"),
	lightY: zFloat(0, 1).default(.5).describe("Light Y"),
	intensity: zFloat(0, 2).default(1).describe("Intensity"),
	ghosts: zInt(0, 8).default(4).describe("Ghosts"),
	ghostSpacing: zFloat(0, 1).default(.3).describe("Ghost Spacing"),
	haloSize: zFloat(0, 1).default(.5).describe("Halo Size"),
	streakLength: zFloat(0, 1).default(.3).describe("Streak Length"),
	color: zColor().default([
		1,
		.9,
		.7
	]).describe("Color")
});
var inputs$48 = z.object({});
var meta$48 = {
	name: "Lens Flare",
	description: "Anamorphic lens flare with ghosts, halo, and streak",
	color: "#fde047",
	category: "stylize",
	defaultBlendMode: "add"
};
var LensFlare = class extends EffectNode {
	static typeId = "lens-flare";
	static config = config$48;
	static inputs = inputs$48;
	static meta = meta$48;
	glsl() {
		const lx = this.uniformName("lightX");
		const ly = this.uniformName("lightY");
		const intensity = this.uniformName("intensity");
		const ghosts = this.uniformName("ghosts");
		const ghostSpacing = this.uniformName("ghostSpacing");
		return { main: `
base = texture(u_prevPass, uv);
vec2 _ar = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
vec2 center = vec2(${lx}, ${ly});
vec2 p = (uv - center) * _ar;
float r = length(p);

float core = exp(-r * r * 60.0);

float halo = exp(-pow(abs(r - ${this.uniformName("haloSize")}) * 8.0, 2.0));

float streak = exp(-abs(p.y) * 80.0) * exp(-abs(p.x) / max(${this.uniformName("streakLength")}, 1e-4));

float ghostsAcc = 0.0;
int N = ${ghosts};
for (int i = 1; i <= 8; i++) {
  if (i > N) break;
  vec2 g = (center - uv) * (float(i) / float(max(N, 1))) * ${ghostSpacing};
  vec2 gp = ((uv + g) - center) * _ar;
  float gd = length(gp);
  ghostsAcc += exp(-gd * gd * 80.0) * (1.0 / float(i));
}

float v = (core + halo * 0.6 + streak * 0.7 + ghostsAcc * 0.8) * ${intensity};
vec3 rgb = ${this.uniformName("color")} * v;
return vec4(rgb, clamp(v, 0.0, 1.0));` };
	}
};
register(LensFlare);
//#endregion
//#region src/shaders/stylize/paper.ts
var config$47 = z.object({
	displacement: zFloat(0, 1).default(.5).describe("Displacement"),
	frequency: zFloat(1, 50, .5).default(10).describe("Frequency"),
	roughness: zFloat(0, 1).default(.5).describe("Roughness"),
	seed: zFloat(0, 10, .01).default(0).describe("Seed")
});
var inputs$47 = z.object({});
var meta$47 = {
	name: "Paper",
	description: "Multi-octave paper-fiber overlay",
	color: "#fef3c7",
	category: "stylize",
	defaultBlendMode: "normal"
};
var Paper = class extends EffectNode {
	static typeId = "paper";
	static config = config$47;
	static inputs = inputs$47;
	static meta = meta$47;
	glsl() {
		const displacement = this.uniformName("displacement");
		const frequency = this.uniformName("frequency");
		const roughness = this.uniformName("roughness");
		const seed = this.uniformName("seed");
		return {
			dependencies: ["simplex2D"],
			main: `
base = texture(u_prevPass, uv);
vec2 q = uv * ${frequency} + vec2(${seed}, ${seed} * 1.7);
float n =
  simplex2D(q) * 0.5 +
  simplex2D(q * 2.0) * 0.25 +
  simplex2D(q * 4.0) * 0.125 +
  simplex2D(q * 8.0) * 0.0625;
n = n * 0.5 + 0.5;
vec3 disp = base.rgb + (n - 0.5) * ${displacement};
vec3 rgb = mix(base.rgb, disp, ${roughness});
return vec4(rgb, base.a);`
		};
	}
};
register(Paper);
//#endregion
//#region src/shaders/stylize/pixelate.ts
var config$46 = z.object({
	cells: zFloat(4, 400, 1).default(80).describe("Cells"),
	gap: zFloat(0, 1).default(0).describe("Gap"),
	roundness: zFloat(0, 1).default(0).describe("Roundness")
});
var inputs$46 = z.object({});
var meta$46 = {
	name: "Pixelate",
	description: "Reduce resolution to discrete cells with optional gap and rounded corners",
	color: "#22d3ee",
	category: "stylize",
	defaultBlendMode: "normal"
};
var Pixelate = class extends EffectNode {
	static typeId = "pixelate";
	static config = config$46;
	static inputs = inputs$46;
	static meta = meta$46;
	glsl() {
		const cells = this.uniformName("cells");
		return { main: `
vec2 cellsV = vec2(${cells}, ${cells} * (u_resolution.y / max(u_resolution.x, 1.0)));
vec2 q = (floor(uv * cellsV) + 0.5) / cellsV;
vec4 src = texture(u_prevPass, q);

vec2 cellUv = fract(uv * cellsV) - 0.5;
vec2 ap = abs(cellUv);
float halfSize = 0.5 - clamp(${this.uniformName("gap")}, 0.0, 0.49);
float r = clamp(${this.uniformName("roundness")}, 0.0, 1.0) * halfSize;
vec2 d = ap - vec2(halfSize - r);
float sd = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
float fw = fwidth(sd);
float mask = 1.0 - smoothstep(-fw, fw, sd);

return vec4(src.rgb, src.a * mask);` };
	}
};
register(Pixelate);
//#endregion
//#region src/shaders/stylize/vhs.ts
var config$45 = z.object({
	wobble: zFloat(0, 5, .01).default(1).describe("Wobble"),
	scanlineNoise: zFloat(0, 1, .01).default(.6).describe("Scanline Noise"),
	smear: zFloat(-2, 2, .01).default(.2).describe("Smear"),
	speed: zFloat(.1, 3, .1).default(1).describe("Speed")
});
var inputs$45 = z.object({});
var meta$45 = {
	name: "VHS",
	description: "Analog VHS tape with intermittent tape damage, chroma bleed, and per-scanline noise",
	color: "#22d3ee",
	category: "stylize",
	defaultBlendMode: "normal"
};
var SMEAR_SAMPLES = 6;
var FIELD_LINES = 487;
var Vhs = class extends EffectNode {
	static typeId = "vhs";
	static config = config$45;
	static inputs = inputs$45;
	static meta = meta$45;
	glsl() {
		const wobble = this.uniformName("wobble");
		const scanlineNoiseAmt = this.uniformName("scanlineNoise");
		const smear = this.uniformName("smear");
		const speed = this.uniformName("speed");
		const smearLoop = [];
		for (let i = 0; i < SMEAR_SAMPLES; i++) {
			const w = i / (SMEAR_SAMPLES - 1) * (2 / SMEAR_SAMPLES);
			smearLoop.push(`{ vec3 s = texture(u_prevPass, vec2(chromaUV.x + (${(-i).toFixed(1)}) * smearScale, chromaUV.y)).rgb;
  accumI += dot(s, vec3(0.596, -0.274, -0.322)) * ${w.toFixed(8)};
  accumQ += dot(s, vec3(0.211, -0.523,  0.312)) * ${w.toFixed(8)}; }`);
		}
		return {
			functions: `
float vhs_hash2D(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}
float vhs_smoothNoise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = vhs_hash2D(i);
  float b = vhs_hash2D(i + vec2(1.0, 0.0));
  float c = vhs_hash2D(i + vec2(0.0, 1.0));
  float d = vhs_hash2D(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float vhs_scanlineHash(float row, float t, float seed) {
  return (fract(sin(row * 12.9898 + (t + seed) * 78.233) * 43758.5453) - 0.5) * 2.0;
}`,
			main: `
float t = u_time * ${speed};

// Organic on/off envelope for tape damage bursts.
float burst = smoothstep(0.45, 0.8, vhs_smoothNoise2D(vec2(t * 0.4, 0.0)));

// Per-scanline jitter (chroma + luma rows offset independently).
float rowInt = floor(uv.y * ${FIELD_LINES.toFixed(1)});
float fineGate = 0.25 + burst * 0.75;
float chromaRowOffset = vhs_scanlineHash(rowInt, t, 0.0)    * ${scanlineNoiseAmt} * 0.008 * fineGate;
float lumaRowOffset   = vhs_scanlineHash(rowInt, t, 69.42)  * ${scanlineNoiseAmt} * 0.004 * fineGate;

// Slow + fast tape waves.
float wave1 = vhs_smoothNoise2D(vec2(uv.y *  3.0, t * 0.8)) - 0.5;
float wave2 = vhs_smoothNoise2D(vec2(uv.y * 30.0, t * 6.0)) - 0.5;
float tapeWave = (wave1 * 0.008 + wave2 * 0.002) * ${wobble};

// Tape creases — narrow horizontal stripes that scroll vertically and
// gate on intermittently.
float creasePhase = smoothstep(0.92, 0.99, sin(uv.y * 8.0 - t * 3.77));
float creaseNoise = smoothstep(0.3, 1.0, vhs_smoothNoise2D(vec2(uv.y * 4.77, t)));
float creaseShift = creasePhase * creaseNoise * ${wobble} * -0.018;

// Head-switching noise concentrated in the bottom 6% of the frame.
float switchPhase = smoothstep(0.06, 0.0, uv.y);
float switchNoise = vhs_smoothNoise2D(vec2(uv.y * 60.0, t * 14.0)) - 0.5;
float switchX = switchPhase * switchNoise * ${wobble} * 0.09;
float switchY = switchPhase * ${wobble} * burst * 0.02;

float globalX = tapeWave + creaseShift + switchX;
vec2 lumaUV   = vec2(uv.x + globalX + lumaRowOffset,   uv.y + switchY);
vec2 chromaUV = vec2(uv.x + globalX + chromaRowOffset, uv.y + switchY);

// Sharp luma sample.
vec4 lumaSample = texture(u_prevPass, lumaUV);
float sharpY = dot(lumaSample.rgb, vec3(0.299, 0.587, 0.114));

// Horizontal chroma smear in YIQ. Direction follows the sign of smear.
float smearScale = ${smear} * 0.0075;
float accumI = 0.0;
float accumQ = 0.0;
${smearLoop.join("\n")}

vec3 finalRgb = vec3(
  sharpY + accumI * 0.956 + accumQ * 0.621,
  sharpY - accumI * 0.272 - accumQ * 0.647,
  sharpY - accumI * 1.106 + accumQ * 1.703
);

// Slow AC-mains beat.
float acBeat = 1.0 + cos(mod(t, 6.2831853) * 2.0 + uv.y * 0.5) * 0.015 * ${wobble};
finalRgb = clamp(finalRgb * acBeat, vec3(0.0), vec3(1.0));

return vec4(finalRgb, lumaSample.a);`
		};
	}
};
register(Vhs);
//#endregion
//#region src/shaders/stylize/vignette.ts
var config$44 = z.object({
	centerX: zCenterAxis().default(.5).describe("Center X"),
	centerY: zCenterAxis().default(.5).describe("Center Y"),
	radius: zFloat(0, 2, .01).default(.7).describe("Radius"),
	falloff: zFloat(0, 1).default(.3).describe("Falloff"),
	intensity: zFloat(0, 1).default(.5).describe("Intensity"),
	color: zColor().default([
		0,
		0,
		0
	]).describe("Color")
});
var inputs$44 = z.object({});
var meta$44 = {
	name: "Vignette",
	description: "Off-center radial darkening with configurable falloff",
	color: "#475569",
	category: "stylize",
	defaultBlendMode: "normal"
};
var Vignette = class extends EffectNode {
	static typeId = "vignette";
	static config = config$44;
	static inputs = inputs$44;
	static meta = meta$44;
	glsl() {
		const centerX = this.uniformName("centerX");
		const centerY = this.uniformName("centerY");
		const radius = this.uniformName("radius");
		return { main: `
base = texture(u_prevPass, uv);
vec2 ar = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
vec2 d = (uv - vec2(${centerX}, ${centerY})) * ar;
float r = length(d);
float v = smoothstep(${radius}, ${radius} + max(${this.uniformName("falloff")}, 1e-4), r) * ${this.uniformName("intensity")};
return vec4(mix(base.rgb, ${this.uniformName("color")}, v), base.a);` };
	}
};
register(Vignette);
//#endregion
//#region src/shaders/interactive/chroma-flow.ts
var config$43 = z.object({
	intensity: zFloat(0, 1).default(.5).describe("Intensity"),
	speed: zFloat(0, 2, .05).default(.5).describe("Speed"),
	scale: zFloat(.1, 5, .05).default(1).describe("Scale"),
	color1: zColor().default([
		0,
		.4,
		1
	]).describe("Color 1"),
	color2: zColor().default([
		0,
		1,
		.4
	]).describe("Color 2"),
	color3: zColor().default([
		1,
		0,
		.4
	]).describe("Color 3"),
	color4: zColor().default([
		.2,
		0,
		1
	]).describe("Color 4"),
	color5: zColor().default([
		1,
		1,
		.2
	]).describe("Color 5")
});
var inputs$43 = z.object({});
var meta$43 = {
	name: "Chroma Flow",
	description: "Animated multi-color simplex flow",
	color: "#a855f7",
	category: "interactive",
	defaultBlendMode: "normal"
};
var ChromaFlow = class extends GeneratorNode {
	static typeId = "chroma-flow";
	static config = config$43;
	static inputs = inputs$43;
	static meta = meta$43;
	glsl() {
		const intensity = this.uniformName("intensity");
		const speed = this.uniformName("speed");
		return {
			dependencies: ["simplex2D"],
			main: `
vec2 q = (uv - u_mouse) * ${this.uniformName("scale")};
float t = u_time * ${speed};
float n1 = simplex2D(q + vec2(t, 0.0)) * 0.5 + 0.5;
float n2 = simplex2D(q * 1.3 - vec2(t * 0.7, 0.0)) * 0.5 + 0.5;
float n3 = simplex2D(q * 0.7 + vec2(0.0, t * 0.5)) * 0.5 + 0.5;
float n4 = simplex2D(q * 1.7 + vec2(t * 0.3, t * 0.6)) * 0.5 + 0.5;
vec3 a = mix(${this.uniformName("color1")}, ${this.uniformName("color2")}, n1);
vec3 b = mix(${this.uniformName("color3")}, ${this.uniformName("color4")}, n2);
vec3 c = mix(a, b, n3);
vec3 flow = mix(c, ${this.uniformName("color5")}, n4);
return vec4(mix(base.rgb, flow, ${intensity}), base.a);`
		};
	}
};
register(ChromaFlow);
//#endregion
//#region src/shaders/interactive/cursor-ripples.ts
var config$42 = z.object({
	frequency: zFloat(1, 30, .1).default(10).describe("Frequency"),
	speed: zFloat(0, 5, .05).default(1).describe("Speed"),
	intensity: zFloat(0, 1).default(.3).describe("Intensity"),
	decay: zFloat(0, 2, .05).default(.5).describe("Decay"),
	edges: zEdges().default("stretch").describe("Edges")
});
var inputs$42 = z.object({});
var meta$42 = {
	name: "Cursor Ripples",
	description: "Concentric ripples emanating from a center point",
	color: "#22d3ee",
	category: "interactive",
	defaultBlendMode: "normal"
};
var CursorRipples = class extends EffectNode {
	static typeId = "cursor-ripples";
	static config = config$42;
	static inputs = inputs$42;
	static meta = meta$42;
	static scope = "scene";
	glsl() {
		const frequency = this.uniformName("frequency");
		const speed = this.uniformName("speed");
		const intensity = this.uniformName("intensity");
		return {
			dependencies: ["applyEdgeHandling", "unpremultiplyAlpha"],
			main: `
float aspect = u_resolution.x / max(u_resolution.y, 1.0);
vec2 aspectUV = vec2(uv.x * aspect, uv.y);
vec2 cursorPos = vec2(u_mouse.x * aspect, u_mouse.y);
vec2 p = aspectUV - cursorPos;
float r = length(p);
float wave = sin(r * ${frequency} - u_time * ${speed}) * exp(-r * ${this.uniformName("decay")}) * ${intensity};
vec2 dir = (r > 1e-5) ? (p / r) : vec2(0.0);
vec2 finalUV = uv + dir * wave * 0.05;
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`
		};
	}
};
register(CursorRipples);
//#endregion
//#region src/shaders/interactive/cursor-trail.ts
var config$41 = z.object({
	length: zFloat(0, 1, .01).default(.3).describe("Length"),
	width: zFloat(0, .5, .005).default(.05).describe("Width"),
	color: zColor().default([
		1,
		.9,
		.4
	]).describe("Color"),
	intensity: zFloat(0, 1).default(.5).describe("Intensity"),
	fade: zFloat(.5, .99, .005).default(.92).describe("Fade")
});
var inputs$41 = z.object({});
var meta$41 = {
	name: "Cursor Trail",
	description: "Glowing curved trail from a center point",
	color: "#facc15",
	category: "interactive",
	defaultBlendMode: "normal"
};
var CursorTrail = class extends EffectNode {
	static typeId = "cursor-trail";
	static config = config$41;
	static inputs = inputs$41;
	static meta = meta$41;
	static scope = "scene";
	glsl() {
		const len = this.uniformName("length");
		const width = this.uniformName("width");
		const color = this.uniformName("color");
		const intensity = this.uniformName("intensity");
		const fade = this.uniformName("fade");
		return { main: `
vec4 src = texture(u_prevPass, uv);
vec4 prev = texture(u_prevFrame, uv);
float aspect = u_resolution.x / max(u_resolution.y, 1.0);
vec2 aspectUV = vec2(uv.x * aspect, uv.y);
vec2 cursorPos = vec2(u_mouse.x * aspect, u_mouse.y);
vec2 mouseVec = vec2(u_mouseDelta.x * aspect, u_mouseDelta.y);
float headDist = length(aspectUV - cursorPos);
float head = 1.0 - smoothstep(0.0, max(${width}, 1e-4), headDist);
float trailLen = length(mouseVec) * 100.0 * ${len};
vec2 backTrail = cursorPos - normalize(mouseVec + vec2(1e-5)) * trailLen;
float backDist = length(aspectUV - backTrail);
float trail = 1.0 - smoothstep(0.0, max(${width} * 1.5, 1e-4), backDist);
float emit = max(head, trail * 0.5) * ${intensity};
vec3 painted = ${color} * emit;
vec3 faded = prev.rgb * ${fade};
vec3 trailRgb = max(faded, painted);
return vec4(src.rgb + trailRgb, max(src.a, max(prev.a * ${fade}, emit)));` };
	}
};
register(CursorTrail);
//#endregion
//#region src/shaders/interactive/fog.ts
var config$40 = z.object({
	intensity: zFloat(0, 1).default(.5).describe("Intensity"),
	speed: zFloat(0, 2, .05).default(.3).describe("Speed"),
	scale: zFloat(.1, 5, .05).default(1).describe("Scale"),
	color1: zColor().default([
		1,
		1,
		1
	]).describe("Color 1"),
	color2: zColor().default([
		.5,
		.5,
		.5
	]).describe("Color 2")
});
var inputs$40 = z.object({});
var meta$40 = {
	name: "Fog",
	description: "Drifting volumetric fog",
	color: "#cbd5e1",
	category: "interactive",
	defaultBlendMode: "normal"
};
var Fog = class extends EffectNode {
	static typeId = "fog";
	static config = config$40;
	static inputs = inputs$40;
	static meta = meta$40;
	glsl() {
		const intensity = this.uniformName("intensity");
		const speed = this.uniformName("speed");
		return {
			dependencies: ["fbm", "simplex2D"],
			main: `
vec2 mouseDrift = (u_mouse - vec2(0.5)) * 0.5;
float n = fbm((uv + mouseDrift) * ${this.uniformName("scale")} + vec2(u_time * ${speed}, 0.0), 4.0, 2.0, 0.5) * 0.5 + 0.5;
vec3 fog = mix(${this.uniformName("color1")}, ${this.uniformName("color2")}, n);
return vec4(mix(base.rgb, fog, n * ${intensity}), base.a);`
		};
	}
};
register(Fog);
//#endregion
//#region src/shaders/interactive/grid-distortion.ts
var config$39 = z.object({
	amount: zFloat(0, .4, .005).default(.05).describe("Amount"),
	scale: zFloat(1, 30, .5).default(4).describe("Scale"),
	speed: zFloat(0, 4, .05).default(.5).describe("Speed"),
	decay: zFloat(0, 1, .01).default(.9).describe("Decay")
});
var inputs$39 = z.object({});
var meta$39 = {
	name: "Grid Distortion",
	description: "Mesh-style noise warp",
	color: "#22d3ee",
	category: "interactive",
	defaultBlendMode: "normal"
};
var GridDistortion = class extends EffectNode {
	static typeId = "grid-distortion";
	static config = config$39;
	static inputs = inputs$39;
	static meta = meta$39;
	glsl() {
		const amount = this.uniformName("amount");
		const scale = this.uniformName("scale");
		return {
			dependencies: ["simplex2D"],
			main: `
float t = u_time * ${this.uniformName("speed")};
vec2 q = uv * ${scale};
float mousePush = exp(-distance(uv, u_mouse) * 4.0);
vec2 offset = vec2(simplex2D(q + t), simplex2D(q + t + 13.7)) * ${amount} * ${this.uniformName("decay")};
offset += (uv - u_mouse) * mousePush * length(u_mouseDelta) * 5.0;
return texture(u_prevPass, uv + offset);`
		};
	}
};
register(GridDistortion);
//#endregion
//#region src/shaders/interactive/liquify.ts
var config$38 = z.object({
	amount: zFloat(0, .4, .005).default(.05).describe("Amount"),
	scale: zFloat(.5, 20, .1).default(3).describe("Scale"),
	speed: zFloat(0, 4, .05).default(.5).describe("Speed"),
	stiffness: zFloat(0, 1, .01).default(.5).describe("Stiffness"),
	damping: zFloat(0, 1, .01).default(.5).describe("Damping"),
	edges: zEdges().default("stretch").describe("Edges")
});
var inputs$38 = z.object({});
var meta$38 = {
	name: "Liquify",
	description: "Soft noise-driven liquid warp",
	color: "#22d3ee",
	category: "interactive",
	defaultBlendMode: "normal"
};
var Liquify = class extends EffectNode {
	static typeId = "liquify";
	static config = config$38;
	static inputs = inputs$38;
	static meta = meta$38;
	glsl() {
		const amount = this.uniformName("amount");
		const scale = this.uniformName("scale");
		return {
			dependencies: [
				"simplex2D",
				"applyEdgeHandling",
				"unpremultiplyAlpha"
			],
			main: `
float t = u_time * ${this.uniformName("speed")};
float effScale = ${scale} * mix(2.0, 0.5, ${this.uniformName("stiffness")});
float effAmount = ${amount} * mix(1.5, 0.5, ${this.uniformName("damping")});
vec2 toMouse = uv - u_mouse;
float mouseFalloff = exp(-length(toMouse) * 4.0);
float dx = simplex2D(uv * effScale + vec2(t, 0.0));
float dy = simplex2D(uv * effScale + vec2(0.0, t + 7.3));
vec2 finalUV = uv + vec2(dx, dy) * effAmount + toMouse * mouseFalloff * length(u_mouseDelta) * 2.0;
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`
		};
	}
};
register(Liquify);
//#endregion
//#region src/shaders/interactive/shatter.ts
var config$37 = z.object({
	intensity: zFloat(0, 1, .01).default(.3).describe("Intensity"),
	density: zFloat(1, 50, .5).default(10).describe("Density"),
	chromaticAberration: zFloat(0, 1, .01).default(.3).describe("Chromatic Aberration"),
	seed: zFloat(0, 10, .1).default(0).describe("Seed"),
	edges: zEdges().default("mirror").describe("Edges")
});
var inputs$37 = z.object({});
var meta$37 = {
	name: "Shatter",
	description: "Voronoi-cell shatter with chromatic split",
	color: "#22d3ee",
	category: "interactive",
	defaultBlendMode: "normal"
};
var Shatter = class extends EffectNode {
	static typeId = "shatter";
	static config = config$37;
	static inputs = inputs$37;
	static meta = meta$37;
	glsl() {
		const intensity = this.uniformName("intensity");
		const density = this.uniformName("density");
		const ca = this.uniformName("chromaticAberration");
		return {
			dependencies: [
				"hash2",
				"applyEdgeHandling",
				"unpremultiplyAlpha"
			],
			main: `
vec2 q = uv * ${density};
vec2 cell = floor(q) + ${this.uniformName("seed")};
float mouseImpact = exp(-distance(uv, u_mouse) * 6.0);
float effIntensity = ${intensity} + mouseImpact * ${intensity};
vec2 offset = (hash2(cell) - 0.5) * 2.0 * effIntensity * 0.1;
float caStrength = ${ca} * 0.02;
vec2 caDir = normalize(offset + vec2(1e-5));
int em = ${edgeMode(this.config.edges)};
float r = unpremultiplyAlpha(applyEdgeHandling(u_prevPass, uv + offset + caDir * caStrength, em)).r;
vec4 g = unpremultiplyAlpha(applyEdgeHandling(u_prevPass, uv + offset, em));
float b = unpremultiplyAlpha(applyEdgeHandling(u_prevPass, uv + offset - caDir * caStrength, em)).b;
return vec4(r, g.g, b, g.a);`
		};
	}
};
register(Shatter);
//#endregion
//#region src/shaders/interactive/smoke.ts
var config$36 = z.object({
	scale: zFloat(.3, 12, .05).default(2.5).describe("Scale"),
	speed: zFloat(0, 4, .05).default(.4).describe("Speed"),
	density: zFloat(0, 1).default(.5).describe("Density"),
	softness: zFloat(.05, 1).default(.6).describe("Softness"),
	color1: zColor().default([
		.99,
		.51,
		.98
	]).describe("Color 1"),
	color2: zColor().default([
		.76,
		.11,
		.47
	]).describe("Color 2")
});
var inputs$36 = z.object({});
var meta$36 = {
	name: "Smoke",
	description: "Drifting smoky cloud field",
	color: "#94a3b8",
	category: "interactive",
	defaultBlendMode: "normal"
};
var Smoke = class extends GeneratorNode {
	static typeId = "smoke";
	static config = config$36;
	static inputs = inputs$36;
	static meta = meta$36;
	glsl() {
		const scale = this.uniformName("scale");
		const speed = this.uniformName("speed");
		const density = this.uniformName("density");
		const softness = this.uniformName("softness");
		return {
			dependencies: ["simplex2D"],
			main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - u_mouse) * _ar;
vec2 q = p * ${scale};
float t = u_time * ${speed};
vec2 drift = u_mouseDelta * 5.0;
float v = 0.0;
float amp = 0.5;
for (int i = 0; i < 5; i++) {
  v += simplex2D(q + vec2(t, t * 0.7) + drift) * amp;
  q *= 2.0;
  amp *= 0.5;
}
float n = v * 0.5 + 0.5;
float a = smoothstep(0.5 - ${softness} * 0.5, 0.5 + ${softness} * 0.5, n);
vec3 col = mix(${this.uniformName("color1")}, ${this.uniformName("color2")}, n);
return vec4(col, a * ${density});`
		};
	}
};
register(Smoke);
//#endregion
//#region src/shaders/distortion/bulge.ts
var config$35 = z.object({
	centerX: zCenterAxis().default(.5).describe("Center X"),
	centerY: zCenterAxis().default(.5).describe("Center Y"),
	radius: zFloat(0, 5, .05).default(1).describe("Radius"),
	strength: zFloat(-1, 1, .05).default(1).describe("Strength"),
	falloff: zFloat(0, 1, .05).default(.5).describe("Falloff"),
	edges: zEdges().default("stretch").describe("Edges")
});
var inputs$35 = z.object({});
var meta$35 = {
	name: "Bulge",
	description: "Magnify or pinch content around a center point",
	color: "#22d3ee",
	category: "distortion",
	defaultBlendMode: "normal"
};
var Bulge = class extends EffectNode {
	static typeId = "bulge";
	static config = config$35;
	static inputs = inputs$35;
	static meta = meta$35;
	static spatialControls = [{
		kind: "point",
		x: "centerX",
		y: "centerY",
		label: "Center"
	}];
	glsl() {
		const cx = this.uniformName("centerX");
		const cy = this.uniformName("centerY");
		const radius = this.uniformName("radius");
		const strength = this.uniformName("strength");
		return {
			dependencies: ["applyEdgeHandling", "unpremultiplyAlpha"],
			main: `
float aspect = u_resolution.x / max(u_resolution.y, 1.0);
vec2 aspectUV = vec2(uv.x * aspect, uv.y);
vec2 centerPos = vec2(${cx} * aspect, 1.0 - ${cy});
vec2 delta = aspectUV - centerPos;
float dist = length(delta);
float effRadius = ${radius} * 0.5;
float smoothFalloff = 1.0 - smoothstep(effRadius * max(1.0 - ${this.uniformName("falloff")} - 0.001, 0.0), effRadius, dist);
float normDist = dist / max(effRadius, 1e-6);
float quadFall = max(0.0, 1.0 - normDist * normDist);
float falloffTotal = smoothFalloff * quadFall;
float disp = -${strength} * falloffTotal;
float scaleFactor = 1.0 + disp;
vec2 bulgedDelta = delta * scaleFactor;
vec2 bulgedUV = centerPos + bulgedDelta;
vec2 finalUV = vec2(bulgedUV.x / aspect, bulgedUV.y);
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`
		};
	}
};
register(Bulge);
//#endregion
//#region src/shaders/distortion/concentric-spin.ts
var config$34 = z.object({
	centerX: zCenterAxis().default(.5).describe("Center X"),
	centerY: zCenterAxis().default(.5).describe("Center Y"),
	rings: zFloat(1, 30, 1).default(8).describe("Rings"),
	intensity: zFloat(0, 1, .01).default(.5).describe("Intensity"),
	speed: zFloat(-4, 4, .05).default(.5).describe("Speed"),
	speedRandomness: zFloat(0, 1, .01).default(.5).describe("Speed Randomness"),
	seed: zFloat(0, 1, .01).default(0).describe("Seed"),
	edges: zEdges().default("mirror").describe("Edges")
});
var inputs$34 = z.object({});
var meta$34 = {
	name: "Concentric Spin",
	description: "Concentric rings rotating at different rates",
	color: "#22d3ee",
	category: "distortion",
	defaultBlendMode: "normal"
};
var ConcentricSpin = class extends EffectNode {
	static typeId = "concentric-spin";
	static config = config$34;
	static inputs = inputs$34;
	static meta = meta$34;
	glsl() {
		const cx = this.uniformName("centerX");
		const cy = this.uniformName("centerY");
		const rings = this.uniformName("rings");
		const intensity = this.uniformName("intensity");
		const speed = this.uniformName("speed");
		const speedRandomness = this.uniformName("speedRandomness");
		return {
			dependencies: ["applyEdgeHandling", "unpremultiplyAlpha"],
			functions: `
float concentricSpinHash(float x) {
  return (fract(sin(x * 12.9898) * 43758.5453) - 0.5) * 2.0;
}`,
			main: `
float aspect = u_resolution.x / max(u_resolution.y, 1.0);
float dx = (uv.x - ${cx}) * aspect;
float dy = (uv.y - (1.0 - ${cy}));
float ringCoord = length(vec2(dx, dy)) * ${rings};
float ringIndex = floor(ringCoord);
float ringFrac = fract(ringCoord);
float seedOffset = ${this.uniformName("seed")} * 13.7;
float maxAngle = ${intensity} * 1.5708;
float staticA = concentricSpinHash(ringIndex + seedOffset) * maxAngle;
float staticB = concentricSpinHash(ringIndex + 1.0 + seedOffset) * maxAngle;
float ringSpeedA = mix(1.0, concentricSpinHash(ringIndex + 42.7), ${speedRandomness});
float ringSpeedB = mix(1.0, concentricSpinHash(ringIndex + 1.0 + 42.7), ${speedRandomness});
float animA = u_time * ${speed} * 0.25 * ringSpeedA;
float animB = u_time * ${speed} * 0.25 * ringSpeedB;
float totalA = staticA + animA;
float totalB = staticB + animB;
float diff = mod(totalB - totalA + 3.14159265, 6.28318530) - 3.14159265;
float blend = smoothstep(0.49, 0.51, ringFrac);
float angle = totalA + diff * blend;
float ca = cos(angle);
float sa = sin(angle);
float rx = dx * ca - dy * sa;
float ry = dx * sa + dy * ca;
vec2 finalUV = vec2(rx / aspect + ${cx}, ry + (1.0 - ${cy}));
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`
		};
	}
};
register(ConcentricSpin);
//#endregion
//#region src/shaders/distortion/flow-field.ts
var config$33 = z.object({
	intensity: zFloat(0, 1, .01).default(.5).describe("Intensity"),
	detail: zFloat(0, 2, .05).default(1).describe("Detail"),
	evolutionSpeed: zFloat(0, 2, .05).default(.3).describe("Evolution Speed"),
	edges: zEdges().default("mirror").describe("Edges")
});
var inputs$33 = z.object({});
var meta$33 = {
	name: "Flow Field",
	description: "Fluid-like distortion with constant smooth motion",
	color: "#22d3ee",
	category: "distortion",
	defaultBlendMode: "normal"
};
var FlowField = class extends EffectNode {
	static typeId = "flow-field";
	static config = config$33;
	static inputs = inputs$33;
	static meta = meta$33;
	glsl() {
		const intensity = this.uniformName("intensity");
		const detail = this.uniformName("detail");
		return {
			dependencies: [
				"simplex2D",
				"applyEdgeHandling",
				"unpremultiplyAlpha"
			],
			main: `
float t = u_time * ${this.uniformName("evolutionSpeed")};
vec2 offset = vec2(
  simplex2D(uv * ${detail} * 5.0 + t),
  simplex2D(uv * ${detail} * 5.0 + 7.3 + t)
) * ${intensity} * 0.1;
vec2 finalUV = uv + offset;
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`
		};
	}
};
register(FlowField);
//#endregion
//#region src/shaders/distortion/fluted-glass.ts
var config$32 = z.object({
	frequency: zFloat(1, 50, .5).default(8).describe("Frequency"),
	softness: zFloat(0, 1, .01).default(.5).describe("Softness"),
	refraction: zFloat(0, 1, .01).default(.5).describe("Refraction"),
	aberration: zFloat(0, 1, .01).default(0).describe("Aberration"),
	lightAngle: zAngle().default(45).describe("Light Angle"),
	highlight: zFloat(0, 2, .01).default(.5).describe("Highlight"),
	highlightSoftness: zFloat(0, 1, .01).default(.5).describe("Highlight Softness"),
	highlightColor: zColor().default([
		1,
		1,
		1
	]).describe("Highlight Color"),
	edges: zEdges().default("mirror").describe("Edges")
});
var inputs$32 = z.object({});
var meta$32 = {
	name: "Fluted Glass",
	description: "Refractive vertical fluting with chromatic aberration and highlight",
	color: "#22d3ee",
	category: "distortion",
	defaultBlendMode: "normal"
};
var FlutedGlass = class extends EffectNode {
	static typeId = "fluted-glass";
	static config = config$32;
	static inputs = inputs$32;
	static meta = meta$32;
	glsl() {
		const frequency = this.uniformName("frequency");
		const softness = this.uniformName("softness");
		const refraction = this.uniformName("refraction");
		const aberration = this.uniformName("aberration");
		const lightAngle = this.uniformName("lightAngle");
		const highlight = this.uniformName("highlight");
		const highlightSoftness = this.uniformName("highlightSoftness");
		const highlightColor = this.uniformName("highlightColor");
		return {
			dependencies: [
				"pi",
				"applyEdgeHandling",
				"unpremultiplyAlpha"
			],
			main: `
float t = sin(uv.x * ${frequency} * PI);
float ts = sign(t) * pow(abs(t), mix(1.0, 0.3, ${softness}));
float refrX = ts * ${refraction} * 0.05;
vec2 finalUV = vec2(uv.x + refrX, uv.y);
float chr = ts * ${aberration} * 0.025;
vec4 rS = applyEdgeHandling(u_prevPass, vec2(finalUV.x + chr, finalUV.y), ${edgeMode(this.config.edges)});
vec4 gS = applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)});
vec4 bS = applyEdgeHandling(u_prevPass, vec2(finalUV.x - chr, finalUV.y), ${edgeMode(this.config.edges)});
vec4 sampled = unpremultiplyAlpha(vec4(rS.r, gS.g, bS.b, gS.a));
float softInv = 1.0 / max(${highlightSoftness}, 0.01);
float spec = pow(max(1.0 - abs(t), 0.0), softInv) * ${highlight};
float la = ${lightAngle} * PI / 180.0;
float lightFactor = max(cos(la - uv.x * PI), 0.0);
spec *= lightFactor;
vec3 lit = mix(sampled.rgb, ${highlightColor}, clamp(spec, 0.0, 1.0));
return vec4(lit, sampled.a);`
		};
	}
};
register(FlutedGlass);
//#endregion
//#region src/shaders/distortion/form3d.ts
var config$31 = z.object({
	centerX: zCenterAxis().default(.5).describe("Center X"),
	centerY: zCenterAxis().default(.5).describe("Center Y"),
	pan: zFloat(-90, 90, .5).default(0).describe("Pan (deg)"),
	tilt: zFloat(-90, 90, .5).default(0).describe("Tilt (deg)"),
	fov: zFloat(30, 120, 1).default(60).describe("FOV (deg)"),
	edges: zEdges().default("transparent").describe("Edges")
});
var inputs$31 = z.object({});
var meta$31 = {
	name: "Form 3D",
	description: "Pseudo-3D pan/tilt projection",
	color: "#22d3ee",
	category: "distortion",
	defaultBlendMode: "normal"
};
var Form3D = class extends EffectNode {
	static typeId = "form3d";
	static config = config$31;
	static inputs = inputs$31;
	static meta = meta$31;
	glsl() {
		return {
			dependencies: [
				"pi",
				"applyEdgeHandling",
				"unpremultiplyAlpha"
			],
			main: `
vec2 c = vec2(${this.uniformName("centerX")}, ${this.uniformName("centerY")});
vec2 p = uv - c;
float panR = ${this.uniformName("pan")} * PI / 180.0;
float tiltR = ${this.uniformName("tilt")} * PI / 180.0;
float fovScale = tan(${this.uniformName("fov")} * PI / 360.0);
p *= fovScale;
float denomY = 1.0 + p.x * tan(panR);
float warpedX = p.x;
float warpedY = p.y / max(denomY, 0.001);
float denomX = 1.0 + warpedY * tan(tiltR);
warpedX = warpedX / max(denomX, 0.001);
vec2 finalUV = vec2(warpedX, warpedY) + c;
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`
		};
	}
};
register(Form3D);
//#endregion
//#region src/shaders/distortion/glass-tiles.ts
var config$30 = z.object({
	intensity: zFloat(0, 1, .01).default(.5).describe("Intensity"),
	tileCount: zFloat(1, 50, 1).default(8).describe("Tile Count"),
	rotation: zAngle().default(0).describe("Rotation"),
	roundness: zFloat(0, 1, .01).default(.5).describe("Roundness"),
	edges: zEdges().default("stretch").describe("Edges")
});
var inputs$30 = z.object({});
var meta$30 = {
	name: "Glass Tiles",
	description: "Refraction-like distortion in a tile grid pattern",
	color: "#22d3ee",
	category: "distortion",
	defaultBlendMode: "normal"
};
var GlassTiles = class extends EffectNode {
	static typeId = "glass-tiles";
	static config = config$30;
	static inputs = inputs$30;
	static meta = meta$30;
	glsl() {
		const intensity = this.uniformName("intensity");
		const tileCount = this.uniformName("tileCount");
		return {
			dependencies: [
				"pi",
				"applyEdgeHandling",
				"unpremultiplyAlpha"
			],
			main: `
float aspect = u_resolution.x / max(u_resolution.y, 1.0);
vec2 tileC = aspect > 1.0
  ? vec2(${tileCount}, ${tileCount} / aspect)
  : vec2(${tileCount} * aspect, ${tileCount});
vec2 aspectUV = vec2(uv.x * aspect, uv.y);
float rotR = ${this.uniformName("rotation")} * PI / 180.0;
float ca = cos(rotR);
float sa = sin(rotR);
vec2 centered = aspectUV - vec2(0.5 * aspect, 0.5);
vec2 rotated = vec2(centered.x * ca - centered.y * sa, centered.x * sa + centered.y * ca) + vec2(0.5 * aspect, 0.5);
vec2 gridUV = vec2(rotated.x / aspect, rotated.y);
vec2 tileSize = vec2(1.0) / tileC;
vec2 tileOrigin = floor(gridUV * tileC) / tileC;
vec2 fromCenter = (gridUV - tileOrigin) / tileSize - vec2(0.5);
float roundMask = max(0.0, 1.0 - dot(fromCenter, fromCenter) * ${this.uniformName("roundness")} * 4.0);
vec2 baseDist = fromCenter * ${intensity} * 0.025 * roundMask;
vec2 finalUV = uv + vec2(baseDist.x / aspect, baseDist.y);
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`
		};
	}
};
register(GlassTiles);
//#endregion
//#region src/shaders/distortion/kaleidoscope.ts
var config$29 = z.object({
	segments: zFloat(2, 40, 1).default(8).describe("Segments"),
	centerX: zCenterAxis().default(.5).describe("Center X"),
	centerY: zCenterAxis().default(.5).describe("Center Y"),
	rotation: zAngle().default(0).describe("Rotation"),
	edges: zEdges().default("stretch").describe("Edges")
});
var inputs$29 = z.object({});
var meta$29 = {
	name: "Kaleidoscope",
	description: "N-fold radial mirror",
	color: "#22d3ee",
	category: "distortion",
	defaultBlendMode: "normal"
};
var Kaleidoscope = class extends EffectNode {
	static typeId = "kaleidoscope";
	static config = config$29;
	static inputs = inputs$29;
	static meta = meta$29;
	glsl() {
		const segments = this.uniformName("segments");
		return {
			dependencies: ["applyEdgeHandling", "unpremultiplyAlpha"],
			main: `
vec2 c = vec2(${this.uniformName("centerX")}, ${this.uniformName("centerY")});
vec2 d = uv - c;
float r = length(d);
float a = atan(d.y, d.x) + ${this.uniformName("rotation")} * 3.14159 / 180.0;
float seg = 6.28318 / max(${segments}, 1.0);
a = abs(mod(a, seg) - seg * 0.5);
vec2 rd = vec2(cos(a), sin(a)) * r;
vec2 finalUV = c + rd;
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`
		};
	}
};
register(Kaleidoscope);
//#endregion
//#region src/shaders/distortion/mirror.ts
var config$28 = z.object({
	angle: zAngle().default(90).describe("Axis Angle"),
	centerX: zCenterAxis().default(.5).describe("Center X"),
	centerY: zCenterAxis().default(.5).describe("Center Y"),
	side: zFloat(-1, 1, 1).default(1).describe("Mirror Side"),
	edges: zEdges().default("stretch").describe("Edges")
});
var inputs$28 = z.object({});
var meta$28 = {
	name: "Mirror",
	description: "Reflect across an axis",
	color: "#22d3ee",
	category: "distortion",
	defaultBlendMode: "normal"
};
var Mirror = class extends EffectNode {
	static typeId = "mirror";
	static config = config$28;
	static inputs = inputs$28;
	static meta = meta$28;
	glsl() {
		const angle = this.uniformName("angle");
		return {
			dependencies: [
				"rotate2D",
				"applyEdgeHandling",
				"unpremultiplyAlpha"
			],
			main: `
vec2 c = vec2(${this.uniformName("centerX")}, ${this.uniformName("centerY")});
float a = ${angle} * 3.14159 / 180.0;
vec2 d = rotate2D(uv - c, -a);
d.x = abs(d.x) * ${this.uniformName("side")};
vec2 finalUV = c + rotate2D(d, a);
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`
		};
	}
};
register(Mirror);
//#endregion
//#region src/shaders/distortion/perspective.ts
var config$27 = z.object({
	pan: zVec2(-1, 1, .01).default([0, 0]).describe("Pan"),
	tilt: zVec2(-1, 1, .01).default([0, 0]).describe("Tilt"),
	fov: zFloat(10, 120, 1).default(60).describe("FOV"),
	offset: zVec2(-1, 1, .01).default([0, 0]).describe("Offset"),
	edges: zEdges().default("transparent").describe("Edges")
});
var inputs$27 = z.object({});
var meta$27 = {
	name: "Perspective",
	description: "Rotate the plane in 3D space with pan, tilt, and FOV",
	color: "#22d3ee",
	category: "distortion",
	defaultBlendMode: "normal"
};
var Perspective = class extends EffectNode {
	static typeId = "perspective";
	static config = config$27;
	static inputs = inputs$27;
	static meta = meta$27;
	glsl() {
		const pan = this.uniformName("pan");
		const tilt = this.uniformName("tilt");
		const fov = this.uniformName("fov");
		return {
			dependencies: [
				"pi",
				"applyEdgeHandling",
				"unpremultiplyAlpha"
			],
			main: `
vec3 p = vec3((uv - 0.5 - ${this.uniformName("offset")}) * 2.0, 1.0);
float fovScale = 1.0 / tan(${fov} * 0.5 * PI / 180.0);
p.xy *= fovScale;
float ay = ${tilt}.x;
float ax = ${tilt}.y;
float cy = cos(ay), sy = sin(ay);
float cx = cos(ax), sx = sin(ax);
mat3 ry = mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy);
mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cx, sx, 0.0, -sx, cx);
p = rx * (ry * p);
vec2 finalUV = p.xy / max(p.z, 0.001) * 0.5 + 0.5 + ${pan};
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`
		};
	}
};
register(Perspective);
//#endregion
//#region src/shaders/distortion/polar-coordinates.ts
var config$26 = z.object({
	mode: z.enum(["rect-to-polar", "polar-to-rect"]).default("rect-to-polar").describe("Mode"),
	centerX: zCenterAxis().default(.5).describe("Center X"),
	centerY: zCenterAxis().default(.5).describe("Center Y"),
	radius: zFloat(0, 1, .01).default(.5).describe("Radius"),
	intensity: zFloat(0, 1, .01).default(1).describe("Intensity"),
	edges: zEdges().default("transparent").describe("Edges")
});
var inputs$26 = z.object({});
var meta$26 = {
	name: "Polar Coordinates",
	description: "Rectangular ↔ polar UV remap",
	color: "#22d3ee",
	category: "distortion",
	defaultBlendMode: "normal"
};
var PolarCoordinates = class extends EffectNode {
	static typeId = "polar-coordinates";
	static config = config$26;
	static inputs = inputs$26;
	static meta = meta$26;
	structuralKey() {
		return `${this.config.mode}|${this.config.edges}`;
	}
	glsl() {
		const cx = this.uniformName("centerX");
		const cy = this.uniformName("centerY");
		const radius = this.uniformName("radius");
		const intensity = this.uniformName("intensity");
		return {
			dependencies: ["applyEdgeHandling", "unpremultiplyAlpha"],
			main: `${this.config.mode === "rect-to-polar" ? `
float aspect = u_resolution.x / max(u_resolution.y, 1.0);
vec2 aspectUV = vec2(uv.x * aspect, uv.y);
vec2 centerPos = vec2(${cx} * aspect, 1.0 - ${cy});
vec2 delta = aspectUV - centerPos;
float angleN = (atan(delta.y, delta.x) + 3.14159265) / 6.28318530;
float r = length(delta) / max(${radius}, 1e-4);
vec2 transformed = vec2(angleN, r);` : `
float angle = (uv.x - 0.5) * 6.28318530;
float r = uv.y * ${radius};
vec2 transformed = vec2(${cx} + cos(angle) * r, (1.0 - ${cy}) + sin(angle) * r);`}
vec2 finalUV = mix(uv, transformed, ${intensity});
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`
		};
	}
};
register(PolarCoordinates);
//#endregion
//#region src/shaders/distortion/polar-flow-field.ts
var config$25 = z.object({
	mode: z.enum(["directional", "radial-dilate"]).default("radial-dilate").describe("Mode"),
	centerX: zCenterAxis().default(.5).describe("Center X"),
	centerY: zCenterAxis().default(.5).describe("Center Y"),
	intensity: zFloat(0, 1, .01).default(.5).describe("Intensity"),
	detail: zFloat(0, 5, .05).default(1.5).describe("Detail"),
	evolutionSpeed: zFloat(0, 2, .05).default(.3).describe("Evolution Speed"),
	loopDuration: zFloat(0, 10, .1).default(0).describe("Loop Duration"),
	edges: zEdges().default("transparent").describe("Edges")
});
var inputs$25 = z.object({});
var meta$25 = {
	name: "Polar Flow Field",
	description: "Noise-driven UV warp sampled in polar coordinates around a center; ideal for vortex, halo, and ring distortions",
	color: "#22d3ee",
	category: "distortion",
	defaultBlendMode: "normal"
};
var PolarFlowField = class extends EffectNode {
	static typeId = "polar-flow-field";
	static config = config$25;
	static inputs = inputs$25;
	static meta = meta$25;
	structuralKey() {
		return `${this.config.mode}|${this.config.edges}`;
	}
	glsl() {
		const cx = this.uniformName("centerX");
		const cy = this.uniformName("centerY");
		const intensity = this.uniformName("intensity");
		const detail = this.uniformName("detail");
		const evolutionSpeed = this.uniformName("evolutionSpeed");
		return {
			dependencies: [
				"fbm",
				"simplex2D",
				"pi",
				"seamlessLoopBlend",
				"applyEdgeHandling",
				"unpremultiplyAlpha"
			],
			main: `
vec2 _ar = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
vec2 c = vec2(${cx}, ${cy});
vec2 p = (uv - c) * _ar;
float ang = atan(p.y, p.x);
float L = length(p);
// 0.5*L − inversesqrt(L) gives noise a swirling-into-center character — this
// term makes the warp feel like flow around the anchor rather than a plain
// radial blob.
float radialOff = 0.5 * L - inversesqrt(max(L, 1e-4));

// Time loop. Two sawtooth signals (tA, tB) offset by loopDuration share a
// 2*loopDuration sample-wrap period. At any wrap moment the crossfade is
// fully on the OTHER sample, hiding the discontinuity. Blend is phased on
// the unwrapped tLin so its zeros and ones land exactly on the wraps:
//   tA wraps at tLin = loopDuration, 3*loopDuration, ... → blend = 1 (show tB)
//   tB wraps at tLin = 0, 2*loopDuration, ...           → blend = 0 (show tA)
// Pattern repeats every loopDuration seconds (seamless).
float dur = max(${this.uniformName("loopDuration")}, 0.0);
float useLoop = step(1e-4, dur);
float period = 2.0 * max(dur, 1e-3);
float tLin = u_time * ${evolutionSpeed};
float tA = mix(tLin, mod(tLin + dur, period), useLoop);
float tB = mix(tLin, mod(tLin,       period), useLoop);
float blend = useLoop * seamlessLoopBlend(tLin, dur);

float scale = max(${detail}, 1e-4);
vec2 polarA = vec2(ang, tA - radialOff) * scale;
vec2 polarB = vec2(ang, tB - radialOff) * scale;
// Period-wrapped variants for the seam-hiding crossfade. The noise's natural
// period in the angle dimension is scale * TWO_PI; wrapping by that period
// pushes the discontinuity off-screen for the left-half sample.
float seamPeriod = max(abs(scale * TWO_PI), 1e-6);
vec2 polarA_wrapped = vec2(fract(polarA.x / seamPeriod) * seamPeriod, polarA.y);
vec2 polarB_wrapped = vec2(fract(polarB.x / seamPeriod) * seamPeriod, polarB.y);
${this.config.mode === "radial-dilate" ? `
float seamMix = smoothstep(-0.25, 0.25, p.x);
float n1raw  = fbm(polarA,        4.0, 1.99, 0.65);
float n1wrap = fbm(polarA_wrapped, 4.0, 1.99, 0.65);
float n2raw  = fbm(polarB,        4.0, 1.99, 0.65);
float n2wrap = fbm(polarB_wrapped, 4.0, 1.99, 0.65);
float n1 = clamp(mix(n1wrap, n1raw, seamMix) * 0.25 + 0.5, 0.0, 1.0);
float n2 = clamp(mix(n2wrap, n2raw, seamMix) * 0.25 + 0.5, 0.0, 1.0);
float n01 = mix(n1, n2, blend);
// Reference smoke-ring's exact mapping: factor lerps 0.8 → 2.0 across n01.
// At intensity=0 the warp disappears; at intensity=1 it matches paper-design.
float factor = mix(1.0, 0.8 + 1.2 * n01, ${intensity});
vec2 q = uv - c;
vec2 warpedUV = c + q * factor;` : `
float seamMix = smoothstep(-0.25, 0.25, p.x);
vec2 nv1raw  = vec2(fbm(polarA,                          4.0, 1.99, 0.65),
                    fbm(polarA + vec2(0.0, 7.3),         4.0, 1.99, 0.65));
vec2 nv1wrap = vec2(fbm(polarA_wrapped,                  4.0, 1.99, 0.65),
                    fbm(polarA_wrapped + vec2(0.0, 7.3), 4.0, 1.99, 0.65));
vec2 nv2raw  = vec2(fbm(polarB,                          4.0, 1.99, 0.65),
                    fbm(polarB + vec2(0.0, 7.3),         4.0, 1.99, 0.65));
vec2 nv2wrap = vec2(fbm(polarB_wrapped,                  4.0, 1.99, 0.65),
                    fbm(polarB_wrapped + vec2(0.0, 7.3), 4.0, 1.99, 0.65));
vec2 nv1 = mix(nv1wrap, nv1raw, seamMix) * 0.25;
vec2 nv2 = mix(nv2wrap, nv2raw, seamMix) * 0.25;
vec2 nv = mix(nv1, nv2, blend);
vec2 warpedUV = uv + nv * ${intensity} * 0.4;`}

return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, warpedUV, ${edgeMode(this.config.edges)}));`
		};
	}
};
register(PolarFlowField);
//#endregion
//#region src/shaders/distortion/rectangular-coordinates.ts
var config$24 = z.object({
	centerX: zCenterAxis().default(.5).describe("Center X"),
	centerY: zCenterAxis().default(.5).describe("Center Y"),
	intensity: zFloat(0, 1, .01).default(1).describe("Intensity"),
	edges: zEdges().default("transparent").describe("Edges")
});
var inputs$24 = z.object({});
var meta$24 = {
	name: "Rectangular Coordinates",
	description: "Square ↔ circle remap via Fernandez-Guasti mapping",
	color: "#22d3ee",
	category: "distortion",
	defaultBlendMode: "normal"
};
var RectangularCoordinates = class extends EffectNode {
	static typeId = "rectangular-coordinates";
	static config = config$24;
	static inputs = inputs$24;
	static meta = meta$24;
	glsl() {
		return {
			dependencies: ["applyEdgeHandling", "unpremultiplyAlpha"],
			main: `
vec2 c = vec2(${this.uniformName("centerX")}, ${this.uniformName("centerY")});
vec2 p = (uv - c) * 2.0;
float x = clamp(p.x, -1.0, 1.0);
float y = clamp(p.y, -1.0, 1.0);
float u = x * sqrt(max(1.0 - y * y * 0.5, 0.0));
float v = y * sqrt(max(1.0 - x * x * 0.5, 0.0));
vec2 mapped = c + vec2(u, v) * 0.5;
vec2 finalUV = mix(uv, mapped, ${this.uniformName("intensity")});
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`
		};
	}
};
register(RectangularCoordinates);
//#endregion
//#region src/shaders/distortion/spherize.ts
var config$23 = z.object({
	centerX: zCenterAxis().default(.5).describe("Center X"),
	centerY: zCenterAxis().default(.5).describe("Center Y"),
	radius: zFloat(0, 1, .01).default(.5).describe("Radius"),
	depth: zFloat(0, 2, .01).default(1).describe("Depth"),
	lightAngle: zAngle().default(45).describe("Light Angle"),
	lightIntensity: zFloat(0, 2, .01).default(.5).describe("Light Intensity"),
	lightSoftness: zFloat(0, 1, .01).default(.5).describe("Light Softness"),
	lightColor: zColor().default([
		1,
		1,
		1
	]).describe("Light Color"),
	edges: zEdges().default("stretch").describe("Edges")
});
var inputs$23 = z.object({});
var meta$23 = {
	name: "Spherize",
	description: "Sphere lens distortion with directional light",
	color: "#22d3ee",
	category: "distortion",
	defaultBlendMode: "normal"
};
var Spherize = class extends EffectNode {
	static typeId = "spherize";
	static config = config$23;
	static inputs = inputs$23;
	static meta = meta$23;
	glsl() {
		const cx = this.uniformName("centerX");
		const cy = this.uniformName("centerY");
		const radius = this.uniformName("radius");
		const depth = this.uniformName("depth");
		const lightAngle = this.uniformName("lightAngle");
		const lightIntensity = this.uniformName("lightIntensity");
		const lightSoftness = this.uniformName("lightSoftness");
		const lightColor = this.uniformName("lightColor");
		return {
			dependencies: [
				"pi",
				"applyEdgeHandling",
				"unpremultiplyAlpha"
			],
			main: `
float aspect = u_resolution.x / max(u_resolution.y, 1.0);
vec2 aspectUV = vec2(uv.x * aspect, uv.y);
vec2 centerPos = vec2(${cx} * aspect, ${cy});
vec2 p = aspectUV - centerPos;
float r = length(p);
float effR = max(${radius}, 1e-4);
vec2 finalUV = uv;
float light = 0.0;
if (r < effR) {
  float t = r / effR;
  float theta = asin(clamp(t, 0.0, 1.0));
  float newR = sin(theta * ${depth}) * effR;
  vec2 dir = r > 1e-6 ? p / r : vec2(0.0);
  vec2 newP = centerPos + dir * newR;
  finalUV = vec2(newP.x / aspect, newP.y);
  float la = ${lightAngle} * PI / 180.0;
  vec3 n = normalize(vec3(p.x, p.y, sqrt(max(1.0 - t * t, 0.0)) * effR));
  vec3 L = vec3(cos(la), sin(la), 0.5);
  float ndl = max(dot(n, normalize(L)), 0.0);
  light = pow(ndl, 1.0 / max(${lightSoftness}, 0.01)) * ${lightIntensity};
}
vec4 sampled = unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));
vec3 lit = mix(sampled.rgb, ${lightColor}, clamp(light, 0.0, 1.0));
return vec4(lit, sampled.a);`
		};
	}
};
register(Spherize);
//#endregion
//#region src/shaders/distortion/stretch.ts
var config$22 = z.object({
	angle: zAngle().default(0).describe("Angle"),
	strength: zFloat(-1, 1, .01).default(0).describe("Strength"),
	falloff: zFloat(0, 1, .01).default(.5).describe("Falloff"),
	centerX: zCenterAxis().default(.5).describe("Center X"),
	centerY: zCenterAxis().default(.5).describe("Center Y"),
	edges: zEdges().default("stretch").describe("Edges")
});
var inputs$22 = z.object({});
var meta$22 = {
	name: "Stretch",
	description: "Directional stretch with falloff",
	color: "#22d3ee",
	category: "distortion",
	defaultBlendMode: "normal"
};
var Stretch = class extends EffectNode {
	static typeId = "stretch";
	static config = config$22;
	static inputs = inputs$22;
	static meta = meta$22;
	glsl() {
		const angle = this.uniformName("angle");
		const strength = this.uniformName("strength");
		const falloff = this.uniformName("falloff");
		return {
			dependencies: [
				"pi",
				"applyEdgeHandling",
				"unpremultiplyAlpha"
			],
			main: `
vec2 c = vec2(${this.uniformName("centerX")}, ${this.uniformName("centerY")});
vec2 d = uv - c;
float ar = ${angle} * PI / 180.0;
vec2 dir = vec2(cos(ar), sin(ar));
float proj = dot(d, dir);
vec2 perp = d - dir * proj;
float fall = smoothstep(${falloff}, 0.0, abs(proj));
float scale = 1.0 + ${strength} * fall;
vec2 newD = dir * (proj * scale) + perp;
vec2 finalUV = c + newD;
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`
		};
	}
};
register(Stretch);
//#endregion
//#region src/shaders/distortion/twirl.ts
var config$21 = z.object({
	centerX: zCenterAxis().default(.5).describe("Center X"),
	centerY: zCenterAxis().default(.5).describe("Center Y"),
	radius: zFloat(.05, 1.5).default(.4).describe("Radius"),
	angle: zFloat(-720, 720, 1).default(90).describe("Angle (deg)"),
	edges: zEdges().default("stretch").describe("Edges")
});
var inputs$21 = z.object({});
var meta$21 = {
	name: "Twirl",
	description: "Local rotation, falls off with distance",
	color: "#22d3ee",
	category: "distortion",
	defaultBlendMode: "normal"
};
var Twirl = class extends EffectNode {
	static typeId = "twirl";
	static config = config$21;
	static inputs = inputs$21;
	static meta = meta$21;
	glsl() {
		return {
			dependencies: ["applyEdgeHandling", "unpremultiplyAlpha"],
			main: `
vec2 c = vec2(${this.uniformName("centerX")}, ${this.uniformName("centerY")});
vec2 d = uv - c;
float r = length(d);
float falloff = 1.0 - smoothstep(0.0, ${this.uniformName("radius")}, r);
float a = ${this.uniformName("angle")} * 3.14159 / 180.0 * falloff;
float ca = cos(a), sa = sin(a);
vec2 rd = vec2(ca * d.x - sa * d.y, sa * d.x + ca * d.y);
vec2 finalUV = c + rd;
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`
		};
	}
};
register(Twirl);
//#endregion
//#region src/shaders/distortion/wave-distortion.ts
var WaveTypeSchema = z.enum([
	"sine",
	"triangle",
	"square",
	"sawtooth",
	"bounce"
]);
var config$20 = z.object({
	waveType: WaveTypeSchema.default("sine").describe("Wave Type"),
	amplitude: zFloat(0, 1, .005).default(.05).describe("Amplitude"),
	frequency: zFloat(0, 50, .5).default(5).describe("Frequency"),
	speed: zFloat(0, 5, .05).default(1).describe("Speed"),
	angle: zAngle().default(0).describe("Direction (deg)"),
	edges: zEdges().default("stretch").describe("Edges")
});
var inputs$20 = z.object({});
var meta$20 = {
	name: "Wave Distortion",
	description: "Periodic UV displacement along a direction",
	color: "#22d3ee",
	category: "distortion",
	defaultBlendMode: "normal"
};
var WAVE_INDEX = {
	sine: 0,
	triangle: 1,
	square: 2,
	sawtooth: 3,
	bounce: 4
};
var WaveDistortion = class extends EffectNode {
	static typeId = "wave-distortion";
	static config = config$20;
	static inputs = inputs$20;
	static meta = meta$20;
	glsl() {
		const amplitude = this.uniformName("amplitude");
		const frequency = this.uniformName("frequency");
		const speed = this.uniformName("speed");
		const angle = this.uniformName("angle");
		const waveIdx = WAVE_INDEX[this.config.waveType];
		let waveExpr;
		switch (waveIdx) {
			case 0:
				waveExpr = `sin(phase * 2.0 * PI)`;
				break;
			case 1:
				waveExpr = `(2.0 * abs(2.0 * (phase - floor(phase + 0.5))) - 1.0)`;
				break;
			case 2:
				waveExpr = `sign(sin(phase * 2.0 * PI))`;
				break;
			case 3:
				waveExpr = `(2.0 * (phase - floor(phase + 0.5)))`;
				break;
			default:
				waveExpr = `(1.0 - 2.0 * abs(fract(phase) - 0.5) * 2.0)`;
				break;
		}
		return {
			dependencies: [
				"pi",
				"applyEdgeHandling",
				"unpremultiplyAlpha"
			],
			main: `
float ar = ${angle} * PI / 180.0;
vec2 dir = vec2(cos(ar), sin(ar));
vec2 perp = vec2(-dir.y, dir.x);
float phase = dot(dir, uv) * ${frequency} + u_time * ${speed};
float w = ${waveExpr};
vec2 finalUV = uv + perp * w * ${amplitude};
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`
		};
	}
};
register(WaveDistortion);
//#endregion
//#region src/shaders/blurs/angular-blur.ts
var config$19 = z.object({
	intensity: zFloat(0, 1, .01).default(.5).describe("Intensity"),
	centerX: zCenterAxis().default(.5).describe("Center X"),
	centerY: zCenterAxis().default(.5).describe("Center Y")
});
var inputs$19 = z.object({});
var meta$19 = {
	name: "Angular Blur",
	description: "Circular blur around a focal point",
	color: "#94a3b8",
	category: "blurs",
	defaultBlendMode: "normal"
};
var WEIGHTS$2 = `const float W[32] = float[32](
  0.018339, 0.020218, 0.022146, 0.024100, 0.026056, 0.027988, 0.029869, 0.031669,
  0.033361, 0.034915, 0.036304, 0.037504, 0.038492, 0.039251, 0.039765, 0.040024,
  0.040024, 0.039765, 0.039251, 0.038492, 0.037504, 0.036304, 0.034915, 0.033361,
  0.031669, 0.029869, 0.027988, 0.026056, 0.024100, 0.022146, 0.020218, 0.018339
);`;
var AngularBlur = class extends EffectNode {
	static typeId = "angular-blur";
	static config = config$19;
	static inputs = inputs$19;
	static meta = meta$19;
	glsl() {
		const intensity = this.uniformName("intensity");
		return {
			dependencies: ["pi"],
			main: `
${WEIGHTS$2}
vec2 center = vec2(${this.uniformName("centerX")}, ${this.uniformName("centerY")});
float aspect = u_resolution.x / u_resolution.y;
vec2 d = uv - center;
vec2 dc = vec2(d.x * aspect, d.y);
float arc = ${intensity} * PI;
float step = arc / 31.0;
vec4 acc = vec4(0.0);
for (int i = 0; i < 32; i++) {
  float a = (float(i) - 15.5) * step;
  float ca = cos(a);
  float sa = sin(a);
  vec2 rd = vec2(dc.x * ca - dc.y * sa, dc.x * sa + dc.y * ca);
  vec2 sc = vec2(rd.x / aspect, rd.y) + center;
  acc += texture(u_prevPass, sc) * W[i];
}
return acc;`
		};
	}
};
register(AngularBlur);
//#endregion
//#region src/shaders/blurs/blur.ts
var config$18 = z.object({ intensity: zFloat(0, 200, 1).default(50).describe("Intensity") });
var inputs$18 = z.object({});
var meta$18 = {
	name: "Blur",
	description: "Symmetric Gaussian blur",
	color: "#94a3b8",
	category: "blurs",
	defaultBlendMode: "normal"
};
var Blur = class extends EffectNode {
	static typeId = "blur";
	static config = config$18;
	static inputs = inputs$18;
	static meta = meta$18;
	glsl() {
		const intensity = this.uniformName("intensity");
		const deps = ["gaussian13"];
		return [{
			dependencies: deps,
			main: `
vec2 texel = 1.0 / u_resolution;
float r = ${intensity} * 0.36;
return gaussian13(u_prevPass, uv, vec2(texel.x * r, 0.0));`
		}, {
			dependencies: deps,
			main: `
vec2 texel = 1.0 / u_resolution;
float r = ${intensity} * 0.36;
return gaussian13(u_prevPass, uv, vec2(0.0, texel.y * r));`
		}];
	}
};
register(Blur);
//#endregion
//#region src/shaders/blurs/channel-blur.ts
var config$17 = z.object({
	redIntensity: zFloat(0, 100, 1).default(0).describe("Red Intensity"),
	greenIntensity: zFloat(0, 100, 1).default(0).describe("Green Intensity"),
	blueIntensity: zFloat(0, 100, 1).default(0).describe("Blue Intensity")
});
var inputs$17 = z.object({});
var meta$17 = {
	name: "Channel Blur",
	description: "Independent blur for red, green, and blue channels",
	color: "#94a3b8",
	category: "blurs",
	defaultBlendMode: "normal"
};
var ChannelBlur = class extends EffectNode {
	static typeId = "channel-blur";
	static config = config$17;
	static inputs = inputs$17;
	static meta = meta$17;
	glsl() {
		const r = this.uniformName("redIntensity");
		const g = this.uniformName("greenIntensity");
		const b = this.uniformName("blueIntensity");
		const deps = ["gaussian13"];
		return [{
			dependencies: deps,
			main: `
vec2 texel = 1.0 / u_resolution;
vec4 rH = gaussian13(u_prevPass, uv, vec2(texel.x * ${r} * 0.36, 0.0));
vec4 gH = gaussian13(u_prevPass, uv, vec2(texel.x * ${g} * 0.36, 0.0));
vec4 bH = gaussian13(u_prevPass, uv, vec2(texel.x * ${b} * 0.36, 0.0));
return vec4(rH.r, gH.g, bH.b, texture(u_prevPass, uv).a);`
		}, {
			dependencies: deps,
			main: `
vec2 texel = 1.0 / u_resolution;
vec4 rV = gaussian13(u_prevPass, uv, vec2(0.0, texel.y * ${r} * 0.36));
vec4 gV = gaussian13(u_prevPass, uv, vec2(0.0, texel.y * ${g} * 0.36));
vec4 bV = gaussian13(u_prevPass, uv, vec2(0.0, texel.y * ${b} * 0.36));
return vec4(rV.r, gV.g, bV.b, texture(u_prevPass, uv).a);`
		}];
	}
};
register(ChannelBlur);
//#endregion
//#region src/shaders/blurs/diffuse-blur.ts
var config$16 = z.object({
	intensity: zFloat(0, 2, .01).default(.5).describe("Intensity"),
	seed: zFloat(0, 1, .01).default(0).describe("Seed")
});
var inputs$16 = z.object({});
var meta$16 = {
	name: "Diffuse Blur",
	description: "Random-jitter blur (painterly softness)",
	color: "#94a3b8",
	category: "blurs",
	defaultBlendMode: "normal"
};
var DiffuseBlur = class extends EffectNode {
	static typeId = "diffuse-blur";
	static config = config$16;
	static inputs = inputs$16;
	static meta = meta$16;
	glsl() {
		const intensity = this.uniformName("intensity");
		const seed = this.uniformName("seed");
		return { main: `
vec2 texel = 1.0 / u_resolution;
vec2 jitter = vec2(
  sin(dot(uv * 50.0 + ${seed}, vec2(12.9898, 78.233))),
  sin(dot(uv * 50.0 + ${seed} + 1.0, vec2(39.346, 11.135)))
);
vec2 offset = jitter * ${intensity} * texel * 50.0;
return texture(u_prevPass, clamp(uv + offset, 0.0, 1.0));` };
	}
};
register(DiffuseBlur);
//#endregion
//#region src/shaders/blurs/linear-blur.ts
var config$15 = z.object({
	intensity: zFloat(0, 1, .01).default(.3).describe("Intensity"),
	angle: zAngle().default(0).describe("Angle")
});
var inputs$15 = z.object({});
var meta$15 = {
	name: "Linear Blur",
	description: "Directional motion blur",
	color: "#94a3b8",
	category: "blurs",
	defaultBlendMode: "normal"
};
var WEIGHTS$1 = `const float W[32] = float[32](
  0.018339, 0.020218, 0.022146, 0.024100, 0.026056, 0.027988, 0.029869, 0.031669,
  0.033361, 0.034915, 0.036304, 0.037504, 0.038492, 0.039251, 0.039765, 0.040024,
  0.040024, 0.039765, 0.039251, 0.038492, 0.037504, 0.036304, 0.034915, 0.033361,
  0.031669, 0.029869, 0.027988, 0.026056, 0.024100, 0.022146, 0.020218, 0.018339
);`;
var LinearBlur = class extends EffectNode {
	static typeId = "linear-blur";
	static config = config$15;
	static inputs = inputs$15;
	static meta = meta$15;
	glsl() {
		const intensity = this.uniformName("intensity");
		return { main: `
${WEIGHTS$1}
vec2 texel = 1.0 / u_resolution;
float aspect = u_resolution.x / u_resolution.y;
float a = ${this.uniformName("angle")} * 3.14159265 / 180.0;
vec2 dir = vec2(cos(a) / aspect, sin(a)) * ${intensity} * 100.0;
vec2 step = dir * texel;
vec4 acc = vec4(0.0);
for (int i = 0; i < 32; i++) {
  float t = float(i) / 31.0 - 0.5;
  acc += texture(u_prevPass, uv + step * t * 2.0) * W[i];
}
return acc;` };
	}
};
register(LinearBlur);
//#endregion
//#region src/shaders/blurs/progressive-blur.ts
var config$14 = z.object({
	intensity: zFloat(0, 1, .01).default(.5).describe("Intensity"),
	angle: zAngle().default(90).describe("Angle"),
	centerX: zCenterAxis().default(.5).describe("Center X"),
	centerY: zCenterAxis().default(.5).describe("Center Y"),
	falloff: zFloat(0, 1, .01).default(.5).describe("Falloff")
});
var inputs$14 = z.object({});
var meta$14 = {
	name: "Progressive Blur",
	description: "Blur strength ramps along an axis",
	color: "#94a3b8",
	category: "blurs",
	defaultBlendMode: "normal"
};
var ProgressiveBlur = class extends EffectNode {
	static typeId = "progressive-blur";
	static config = config$14;
	static inputs = inputs$14;
	static meta = meta$14;
	glsl() {
		const intensity = this.uniformName("intensity");
		return {
			dependencies: ["gaussian13"],
			main: `
vec2 texel = 1.0 / u_resolution;
float aspect = u_resolution.x / u_resolution.y;
float a = ${this.uniformName("angle")} * 3.14159265 / 180.0;
vec2 dir = vec2(cos(a) / aspect, sin(a));
vec2 d = uv - vec2(${this.uniformName("centerX")}, ${this.uniformName("centerY")});
float proj = max(0.0, dot(d, dir));
float fo = max(0.001, ${this.uniformName("falloff")});
float t = smoothstep(0.0, fo, proj);
float r = t * ${intensity} * 100.0 * 0.36;
vec4 h = gaussian13(u_prevPass, uv, vec2(texel.x * r, 0.0));
vec4 v = gaussian13(u_prevPass, uv, vec2(0.0, texel.y * r));
return (h + v) * 0.5;`
		};
	}
};
register(ProgressiveBlur);
//#endregion
//#region src/shaders/blurs/tilt-shift.ts
var config$13 = z.object({
	intensity: zFloat(0, 1, .01).default(.5).describe("Intensity"),
	width: zFloat(0, 1, .01).default(.3).describe("Width"),
	falloff: zFloat(0, 1, .01).default(.3).describe("Falloff"),
	angle: zAngle().default(0).describe("Angle"),
	centerX: zCenterAxis().default(.5).describe("Center X"),
	centerY: zCenterAxis().default(.5).describe("Center Y")
});
var inputs$13 = z.object({});
var meta$13 = {
	name: "Tilt Shift",
	description: "Selective focus band (tilt-shift miniature)",
	color: "#0ea5e9",
	category: "blurs",
	defaultBlendMode: "normal"
};
var TiltShift = class extends EffectNode {
	static typeId = "tilt-shift";
	static config = config$13;
	static inputs = inputs$13;
	static meta = meta$13;
	glsl() {
		const intensity = this.uniformName("intensity");
		const width = this.uniformName("width");
		const falloff = this.uniformName("falloff");
		return {
			dependencies: ["gaussian13"],
			main: `
vec2 texel = 1.0 / u_resolution;
float aspect = u_resolution.x / u_resolution.y;
float a = ${this.uniformName("angle")} * 3.14159265 / 180.0;
vec2 perp = vec2(-sin(a), cos(a));
vec2 d = uv - vec2(${this.uniformName("centerX")}, ${this.uniformName("centerY")});
float dist = abs(dot(vec2(d.x * aspect, d.y), perp));
float fw = ${width} * 0.5;
float t = smoothstep(fw, fw + ${falloff}, dist);
float r = t * ${intensity} * 100.0 * 0.36;
vec4 h = gaussian13(u_prevPass, uv, vec2(texel.x * r, 0.0));
vec4 v = gaussian13(u_prevPass, uv, vec2(0.0, texel.y * r));
return (h + v) * 0.5;`
		};
	}
};
register(TiltShift);
//#endregion
//#region src/shaders/blurs/zoom-blur.ts
var config$12 = z.object({
	intensity: zFloat(0, 1, .01).default(.3).describe("Intensity"),
	centerX: zCenterAxis().default(.5).describe("Center X"),
	centerY: zCenterAxis().default(.5).describe("Center Y")
});
var inputs$12 = z.object({});
var meta$12 = {
	name: "Zoom Blur",
	description: "Radial zoom blur from a focal point",
	color: "#94a3b8",
	category: "blurs",
	defaultBlendMode: "normal"
};
var WEIGHTS = `const float W[32] = float[32](
  0.018339, 0.020218, 0.022146, 0.024100, 0.026056, 0.027988, 0.029869, 0.031669,
  0.033361, 0.034915, 0.036304, 0.037504, 0.038492, 0.039251, 0.039765, 0.040024,
  0.040024, 0.039765, 0.039251, 0.038492, 0.037504, 0.036304, 0.034915, 0.033361,
  0.031669, 0.029869, 0.027988, 0.026056, 0.024100, 0.022146, 0.020218, 0.018339
);`;
var ZoomBlur = class extends EffectNode {
	static typeId = "zoom-blur";
	static config = config$12;
	static inputs = inputs$12;
	static meta = meta$12;
	glsl() {
		const intensity = this.uniformName("intensity");
		return { main: `
${WEIGHTS}
float aspect = u_resolution.x / u_resolution.y;
vec2 center = vec2(${this.uniformName("centerX")}, ${this.uniformName("centerY")});
vec2 d = uv - center;
vec2 dc = vec2(d.x * aspect, d.y);
vec4 acc = vec4(0.0);
for (int i = 0; i < 32; i++) {
  float ti = float(i) / 31.0 - 0.5;
  float scale = 1.0 + ${intensity} * ti;
  vec2 sd = dc * scale;
  vec2 sc = vec2(sd.x / aspect, sd.y) + center;
  acc += texture(u_prevPass, sc) * W[i];
}
return acc;` };
	}
};
register(ZoomBlur);
//#endregion
//#region src/shaders/adjustments/brightness-contrast.ts
var config$11 = z.object({
	brightness: zFloat(-1, 1).default(0).describe("Brightness"),
	contrast: zFloat(-1, 1).default(0).describe("Contrast")
});
var inputs$11 = z.object({});
var meta$11 = {
	name: "Brightness/Contrast",
	description: "Brightness and contrast adjustment",
	color: "#a855f7",
	category: "adjustments",
	defaultBlendMode: "normal"
};
var BrightnessContrast = class extends EffectNode {
	static typeId = "brightness-contrast";
	static config = config$11;
	static inputs = inputs$11;
	static meta = meta$11;
	glsl() {
		const brightness = this.uniformName("brightness");
		return { main: `
base = texture(u_prevPass, uv);
vec3 col = (base.rgb - 0.5) * (${this.uniformName("contrast")} + 1.0) + 0.5 + ${brightness};
return vec4(col, base.a);` };
	}
};
register(BrightnessContrast);
//#endregion
//#region src/shaders/adjustments/duotone.ts
var config$10 = z.object({
	colorA: zColor().default([
		1,
		0,
		0
	]).describe("Color A (shadows)"),
	colorB: zColor().default([
		.008,
		.227,
		.957
	]).describe("Color B (highlights)"),
	blend: zFloat(0, 1).default(.5).describe("Blend")
});
var inputs$10 = z.object({});
var meta$10 = {
	name: "Duotone",
	description: "Map colors to two tones based on luminance",
	color: "#a855f7",
	category: "adjustments",
	defaultBlendMode: "normal"
};
var Duotone = class extends EffectNode {
	static typeId = "duotone";
	static config = config$10;
	static inputs = inputs$10;
	static meta = meta$10;
	glsl() {
		const colorA = this.uniformName("colorA");
		const colorB = this.uniformName("colorB");
		const blend = this.uniformName("blend");
		return { main: `
base = texture(u_prevPass, uv);
float lum = dot(base.rgb, vec3(0.299, 0.587, 0.114));
float t = smoothstep(${blend} - 0.5, ${blend} + 0.5, lum);
return vec4(mix(${colorA}, ${colorB}, t), base.a);` };
	}
};
register(Duotone);
//#endregion
//#region src/shaders/adjustments/grayscale.ts
var config$9 = z.object({ amount: zFloat(0, 1).default(1).describe("Amount") });
var inputs$9 = z.object({});
var meta$9 = {
	name: "Grayscale",
	description: "Convert colors to black and white",
	color: "#a855f7",
	category: "adjustments",
	defaultBlendMode: "normal"
};
var Grayscale = class extends EffectNode {
	static typeId = "grayscale";
	static config = config$9;
	static inputs = inputs$9;
	static meta = meta$9;
	glsl() {
		return { main: `
base = texture(u_prevPass, uv);
float lum = dot(base.rgb, vec3(0.2126, 0.7152, 0.0722));
return vec4(mix(base.rgb, vec3(lum), ${this.uniformName("amount")}), base.a);` };
	}
};
register(Grayscale);
//#endregion
//#region src/shaders/adjustments/hue-shift.ts
var config$8 = z.object({ shift: zFloat(-180, 180, 1).default(0).describe("Shift") });
var inputs$8 = z.object({});
var meta$8 = {
	name: "Hue Shift",
	description: "Rotate hue around the color wheel",
	color: "#a855f7",
	category: "adjustments",
	defaultBlendMode: "normal"
};
var HueShift = class extends EffectNode {
	static typeId = "hue-shift";
	static config = config$8;
	static inputs = inputs$8;
	static meta = meta$8;
	glsl() {
		return {
			dependencies: ["rgb2hsv", "hsv2rgb"],
			main: `
base = texture(u_prevPass, uv);
vec3 hsv = rgb2hsv(base.rgb);
hsv.x = fract(hsv.x + ${this.uniformName("shift")} / 360.0);
return vec4(hsv2rgb(hsv), base.a);`
		};
	}
};
register(HueShift);
//#endregion
//#region src/shaders/adjustments/invert.ts
var config$7 = z.object({ amount: zFloat(0, 1).default(1).describe("Amount") });
var inputs$7 = z.object({});
var meta$7 = {
	name: "Invert",
	description: "Color inversion",
	color: "#a855f7",
	category: "adjustments",
	defaultBlendMode: "normal"
};
var Invert = class extends EffectNode {
	static typeId = "invert";
	static config = config$7;
	static inputs = inputs$7;
	static meta = meta$7;
	glsl() {
		return { main: `
base = texture(u_prevPass, uv);
return vec4(mix(base.rgb, 1.0 - base.rgb, ${this.uniformName("amount")}), base.a);` };
	}
};
register(Invert);
//#endregion
//#region src/shaders/adjustments/posterize.ts
var config$6 = z.object({ levels: zInt(2, 16).default(6).describe("Levels") });
var inputs$6 = z.object({});
var meta$6 = {
	name: "Posterize",
	description: "Reduce color depth to create a poster effect",
	color: "#475569",
	category: "adjustments",
	defaultBlendMode: "normal"
};
var Posterize = class extends EffectNode {
	static typeId = "posterize";
	static config = config$6;
	static inputs = inputs$6;
	static meta = meta$6;
	glsl() {
		return { main: `
base = texture(u_prevPass, uv);
float steps = float(${this.uniformName("levels")});
vec3 col = floor(base.rgb * steps + 0.5) / steps;
return vec4(col, base.a);` };
	}
};
register(Posterize);
//#endregion
//#region src/shaders/adjustments/saturation.ts
var config$5 = z.object({ intensity: zFloat(0, 3).default(1).describe("Intensity") });
var inputs$5 = z.object({});
var meta$5 = {
	name: "Saturation",
	description: "Adjust color saturation intensity",
	color: "#a855f7",
	category: "adjustments",
	defaultBlendMode: "normal"
};
var Saturation = class extends EffectNode {
	static typeId = "saturation";
	static config = config$5;
	static inputs = inputs$5;
	static meta = meta$5;
	glsl() {
		return { main: `
base = texture(u_prevPass, uv);
float lum = dot(base.rgb, vec3(0.2126, 0.7152, 0.0722));
return vec4(mix(vec3(lum), base.rgb, ${this.uniformName("intensity")}), base.a);` };
	}
};
register(Saturation);
//#endregion
//#region src/shaders/adjustments/sharpness.ts
var config$4 = z.object({ amount: zFloat(0, 1).default(.5).describe("Sharpness") });
var inputs$4 = z.object({});
var meta$4 = {
	name: "Sharpness",
	description: "Adjust image sharpness using a convolution kernel",
	color: "#a855f7",
	category: "adjustments",
	defaultBlendMode: "normal"
};
var Sharpness = class extends EffectNode {
	static typeId = "sharpness";
	static config = config$4;
	static inputs = inputs$4;
	static meta = meta$4;
	glsl() {
		const amount = this.uniformName("amount");
		return { main: `
vec2 texel = 1.0 / u_resolution;
vec4 center = texture(u_prevPass, uv);
vec4 top = texture(u_prevPass, uv + vec2(0.0, texel.y));
vec4 bottom = texture(u_prevPass, uv - vec2(0.0, texel.y));
vec4 left = texture(u_prevPass, uv - vec2(texel.x, 0.0));
vec4 right = texture(u_prevPass, uv + vec2(texel.x, 0.0));
float centerWeight = 1.0 + 4.0 * ${amount};
float neighborWeight = -${amount};
vec3 col = clamp(
  center.rgb * centerWeight
    + top.rgb * neighborWeight
    + bottom.rgb * neighborWeight
    + left.rgb * neighborWeight
    + right.rgb * neighborWeight,
  0.0, 1.0
);
return vec4(col, center.a);` };
	}
};
register(Sharpness);
//#endregion
//#region src/shaders/adjustments/solarize.ts
var config$3 = z.object({
	threshold: zFloat(0, 1).default(.5).describe("Threshold"),
	strength: zFloat(0, 1).default(1).describe("Strength")
});
var inputs$3 = z.object({});
var meta$3 = {
	name: "Solarize",
	description: "Inverts tones above a luminance threshold",
	color: "#a855f7",
	category: "adjustments",
	defaultBlendMode: "normal"
};
var Solarize = class extends EffectNode {
	static typeId = "solarize";
	static config = config$3;
	static inputs = inputs$3;
	static meta = meta$3;
	glsl() {
		return {
			dependencies: ["luma"],
			main: `
base = texture(u_prevPass, uv);
float lum = luma(base.rgb);
vec3 inverted = vec3(1.0) - base.rgb;
vec3 solarized = lum > ${this.uniformName("threshold")} ? inverted : base.rgb;
return vec4(mix(base.rgb, solarized, ${this.uniformName("strength")}), base.a);`
		};
	}
};
register(Solarize);
//#endregion
//#region src/shaders/adjustments/tint.ts
var config$2 = z.object({
	color: zColor().default([
		.5,
		.5,
		.8
	]).describe("Tint Color"),
	amount: zFloat(0, 1).default(.5).describe("Amount"),
	preserveLuminosity: zBool().default(false).describe("Preserve Luminosity")
});
var inputs$2 = z.object({});
var meta$2 = {
	name: "Tint",
	description: "Apply a color tint to the image",
	color: "#a855f7",
	category: "adjustments",
	defaultBlendMode: "normal"
};
var Tint = class extends EffectNode {
	static typeId = "tint";
	static config = config$2;
	static inputs = inputs$2;
	static meta = meta$2;
	glsl() {
		return { main: `
base = texture(u_prevPass, uv);
vec3 tinted = mix(base.rgb, ${this.uniformName("color")}, ${this.uniformName("amount")});
vec3 result = tinted;
if (${this.uniformName("preserveLuminosity")}) {
  vec3 w = vec3(0.299, 0.587, 0.114);
  float originalLum = dot(base.rgb, w);
  float tintedLum = dot(tinted, w);
  result = tinted * (originalLum / max(tintedLum, 1e-4));
}
return vec4(result, base.a);` };
	}
};
register(Tint);
//#endregion
//#region src/shaders/adjustments/tritone.ts
var config$1 = z.object({
	colorA: zColor().default([
		.808,
		.106,
		.918
	]).describe("Color A (shadows)"),
	colorB: zColor().default([
		.184,
		1,
		0
	]).describe("Color B (midtones)"),
	colorC: zColor().default([
		1,
		1,
		0
	]).describe("Color C (highlights)"),
	blendMid: zFloat(0, 1).default(.5).describe("Midpoint"),
	softness: zFloat(0, 1).default(.25).describe("Softness")
});
var inputs$1 = z.object({});
var meta$1 = {
	name: "Tritone",
	description: "Map colors to three tones: shadows, midtones, highlights",
	color: "#a855f7",
	category: "adjustments",
	defaultBlendMode: "normal"
};
var Tritone = class extends EffectNode {
	static typeId = "tritone";
	static config = config$1;
	static inputs = inputs$1;
	static meta = meta$1;
	glsl() {
		const colorA = this.uniformName("colorA");
		const colorB = this.uniformName("colorB");
		const colorC = this.uniformName("colorC");
		const blendMid = this.uniformName("blendMid");
		return { main: `
base = texture(u_prevPass, uv);
float lum = dot(base.rgb, vec3(0.299, 0.587, 0.114));
float w = ${this.uniformName("softness")};
float shadowToMid = smoothstep(${blendMid} - w, ${blendMid}, lum);
vec3 lower = mix(${colorA}, ${colorB}, shadowToMid);
float midToHi = smoothstep(${blendMid}, ${blendMid} + w, lum);
vec3 upper = mix(${colorB}, ${colorC}, midToHi);
float blend = smoothstep(${blendMid} - w * 0.4, ${blendMid} + w * 0.4, lum);
return vec4(mix(lower, upper, blend), base.a);` };
	}
};
register(Tritone);
//#endregion
//#region src/shaders/adjustments/vibrance.ts
var config = z.object({ intensity: zFloat(-2, 2).default(0).describe("Intensity") });
var inputs = z.object({});
var meta = {
	name: "Vibrance",
	description: "Selective saturation adjustment protecting skin tones",
	color: "#a855f7",
	category: "adjustments",
	defaultBlendMode: "normal"
};
var Vibrance = class extends EffectNode {
	static typeId = "vibrance";
	static config = config;
	static inputs = inputs;
	static meta = meta;
	glsl() {
		return { main: `
base = texture(u_prevPass, uv);
float mx = max(base.r, max(base.g, base.b));
float avg = (base.r + base.g + base.b) / 3.0;
float amt = (mx - avg) * ${this.uniformName("intensity")} * -3.0;
vec3 col = mix(base.rgb, vec3(mx), amt);
return vec4(col, base.a);` };
	}
};
register(Vibrance);
//#endregion
//#region src/shaders/index.ts
function smokeRingChain() {
	return chain().pipe(new Ring({ config: {
		x: .5,
		y: .5,
		width: .4,
		height: .4,
		rotation: 0,
		thickness: .6,
		innerShape: 1,
		fillColor: [
			1,
			1,
			1
		],
		strokeColor: [
			0,
			0,
			0
		],
		strokeWidth: 0,
		strokeMode: "center"
	} })).pipe(new PolarFlowField({ config: {
		mode: "radial-dilate",
		centerX: .5,
		centerY: .5,
		intensity: 1,
		detail: 1.5,
		evolutionSpeed: .5,
		loopDuration: 3,
		edges: "transparent"
	} }));
}
[{
	slug: "paper-design",
	name: "Paper Design",
	description: "Recreations of paper-design/shaders presets",
	presets: [{
		name: "Smoke Ring",
		fidelity: "approx",
		chain: smokeRingChain()
	}]
}].flatMap((g) => g.presets);
//#endregion
//#region node_modules/@dnd-kit/svelte/dist/core/context/renderer.svelte.js
function createRenderer() {
	let transitionCount = 0;
	let rendering = null;
	const renderer = { get rendering() {
		return rendering !== null && rendering !== void 0 ? rendering : Promise.resolve();
	} };
	function trackRendering(callback) {
		if (!rendering) rendering = new Promise((resolve) => {});
		callback();
		(/* @__PURE__ */ tick()).then(() => {
			transitionCount++;
		});
	}
	return {
		renderer,
		trackRendering
	};
}
//#endregion
//#region node_modules/@dnd-kit/svelte/dist/core/context/context.js
var DND_CONTEXT_KEY = Symbol("DragDropProvider");
function setDragDropContext(manager) {
	setContext(DND_CONTEXT_KEY, manager);
}
function getDragDropContext() {
	const manager = getContext(DND_CONTEXT_KEY);
	if (!manager) throw new Error("getDragDropManager was called outside of a DragDropProvider. Make sure your component is wrapped in a DragDropProvider.");
	return manager;
}
//#endregion
//#region node_modules/@dnd-kit/svelte/dist/core/context/DragDropProvider.svelte
function DragDropProvider($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { manager: managerProp, plugins, sensors, modifiers, children, onBeforeDragStart, onDragStart, onDragMove, onDragOver, onDragEnd, onCollision } = $$props;
		const { renderer, trackRendering } = createRenderer();
		const manager = managerProp ?? new DragDropManager({});
		manager.renderer = renderer;
		setDragDropContext(manager);
		onDestroy(() => {
			if (!managerProp) manager.destroy();
		});
		children?.($$renderer);
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/@dnd-kit/svelte/dist/utilities/createDeepSignal.svelte.js
function createDeepSignal(getTarget) {
	const tracked = /* @__PURE__ */ new Map();
	return { get current() {
		const target = getTarget();
		return target ? new Proxy(target, { get(obj, key) {
			const value = obj[key];
			tracked.set(key, value);
			return value;
		} }) : target;
	} };
}
//#endregion
//#region node_modules/@dnd-kit/svelte/dist/core/hooks/getDragDropManager.js
function getDragDropManager() {
	return getDragDropContext();
}
//#endregion
//#region node_modules/@dnd-kit/svelte/dist/core/hooks/createInstance.svelte.js
function createInstance(initializer) {
	return initializer(getDragDropManager());
}
//#endregion
//#region node_modules/@dnd-kit/svelte/dist/core/droppable/createDroppable.svelte.js
function createDroppable(input) {
	const droppable = createInstance((manager) => new Droppable(Object.assign(Object.assign({}, input), { register: false }), manager));
	const tracked = createDeepSignal(() => droppable);
	return {
		get droppable() {
			return droppable;
		},
		get isDropTarget() {
			return tracked.current.isDropTarget;
		},
		attach(node) {
			droppable.element = node;
			return () => {
				droppable.element = void 0;
			};
		}
	};
}
//#endregion
//#region src/lib/state/composer.svelte.ts
function fallbackSelection(scene) {
	const lastLayer = scene.layers[scene.layers.length - 1];
	if (!lastLayer) return null;
	return (lastLayer.effects[lastLayer.effects.length - 1] ?? lastLayer.source).id;
}
var ComposerStore = class {
	scene = new Scene();
	selectedNodeId = null;
	#chain = derived(() => new ShaderChain(flattenSceneToChain(this.scene)));
	get chain() {
		return this.#chain();
	}
	set chain($$value) {
		return this.#chain($$value);
	}
	get selectedNode() {
		return this.selectedNodeId ? this.scene.findNode(this.selectedNodeId)?.node ?? null : null;
	}
	addLayer(generatorTypeId) {
		const cls = getNodeClass(generatorTypeId);
		if (!cls) return;
		const node = new cls();
		if (!isGeneratorNode(node)) return;
		this.scene.layers.push(new Layer({
			source: node,
			blendMode: node.blendMode,
			opacity: node.opacity,
			enabled: node.enabled
		}));
		this.selectedNodeId = node.id;
	}
	removeLayer(id) {
		if (!this.detachLayer(id)) return;
		this.selectedNodeId = fallbackSelection(this.scene);
	}
	/**
	* Pull a layer out of wherever it lives in the tree (top-level or any
	* descendant's children list) and return it. Used by reparenting / removal
	* paths so they don't have to know whether the layer is currently a clip
	* child or a top-level layer.
	*/
	detachLayer(id) {
		const idx = this.scene.layers.findIndex((l) => l.id === id);
		if (idx >= 0) return this.scene.layers.splice(idx, 1)[0];
		const walk = (parent) => {
			const ci = parent.children.findIndex((c) => c.id === id);
			if (ci >= 0) return parent.children.splice(ci, 1)[0];
			for (const c of parent.children) {
				const found = walk(c);
				if (found) return found;
			}
			return null;
		};
		for (const l of this.scene.layers) {
			const found = walk(l);
			if (found) return found;
		}
		return null;
	}
	reorderLayers(orderedIds) {
		const byId = new Map(this.scene.layers.map((l) => [l.id, l]));
		const reordered = orderedIds.map((id) => byId.get(id)).filter((l) => Boolean(l));
		for (const l of this.scene.layers) if (!orderedIds.includes(l.id)) reordered.push(l);
		this.scene.layers = reordered;
	}
	/**
	* Reparent `childId` into `parentId`'s children list (clip-mask group).
	* No-op if either id is missing, or if `parentId` is a descendant of
	* `childId` (would create a cycle).
	*/
	nestLayerAsChild(childId, parentId) {
		if (childId === parentId) return;
		const parent = this.scene.findLayer(parentId);
		if (!parent) return;
		const isDescendantOfChild = (l) => {
			if (l.id === childId) return true;
			for (const c of l.children) if (isDescendantOfChild(c)) return true;
			return false;
		};
		if (isDescendantOfChild(parent)) return;
		const child = this.detachLayer(childId);
		if (!child) return;
		parent.children.push(child);
	}
	/** Move a layer out of any clip-group and back to the top level. */
	unnestLayer(layerId) {
		const layer = this.detachLayer(layerId);
		if (!layer) return;
		this.scene.layers.push(layer);
	}
	toggleLayer(id) {
		const layer = this.scene.findLayer(id);
		if (layer) layer.enabled = !layer.enabled;
	}
	toggleLayerMask(id) {
		const layer = this.scene.findLayer(id);
		if (layer) layer.useAsMask = !layer.useAsMask;
	}
	addEffectToLayer(layerId, effectTypeId) {
		const cls = getNodeClass(effectTypeId);
		if (!cls) return;
		const node = new cls();
		if (!isEffectNode(node)) return;
		const layer = this.scene.findLayer(layerId);
		if (!layer) return;
		layer.effects.push(node);
		this.selectedNodeId = node.id;
	}
	removeEffectFromLayer(layerId, effectId) {
		const layer = this.scene.findLayer(layerId);
		if (!layer) return;
		const idx = layer.effects.findIndex((e) => e.id === effectId);
		if (idx < 0) return;
		layer.effects.splice(idx, 1);
		if (this.selectedNodeId === effectId) this.selectedNodeId = fallbackSelection(this.scene);
	}
	reorderEffectsInLayer(layerId, orderedIds) {
		const layer = this.scene.findLayer(layerId);
		if (!layer) return;
		const byId = new Map(layer.effects.map((e) => [e.id, e]));
		const reordered = orderedIds.map((id) => byId.get(id)).filter((e) => Boolean(e));
		for (const e of layer.effects) if (!orderedIds.includes(e.id)) reordered.push(e);
		layer.effects = reordered;
	}
	addSceneEffect(effectTypeId) {
		const cls = getNodeClass(effectTypeId);
		if (!cls) return;
		const node = new cls();
		if (!isEffectNode(node)) return;
		this.scene.postEffects.push(node);
		this.selectedNodeId = node.id;
	}
	removeSceneEffect(effectId) {
		const idx = this.scene.postEffects.findIndex((e) => e.id === effectId);
		if (idx < 0) return;
		this.scene.postEffects.splice(idx, 1);
		if (this.selectedNodeId === effectId) this.selectedNodeId = fallbackSelection(this.scene);
	}
	moveEffect(effectId, fromLayerId, toLayerId, toIndex) {
		const fromList = fromLayerId === null ? this.scene.postEffects : this.scene.findLayer(fromLayerId)?.effects;
		if (!fromList) return;
		const fromIdx = fromList.findIndex((e) => e.id === effectId);
		if (fromIdx < 0) return;
		const [node] = fromList.splice(fromIdx, 1);
		if (!node) return;
		const toList = toLayerId === null ? this.scene.postEffects : this.scene.findLayer(toLayerId)?.effects;
		if (!toList) {
			fromList.splice(fromIdx, 0, node);
			return;
		}
		const clamped = Math.max(0, Math.min(toIndex, toList.length));
		toList.splice(clamped, 0, node);
	}
	reorderSceneEffects(orderedIds) {
		const byId = new Map(this.scene.postEffects.map((e) => [e.id, e]));
		const reordered = orderedIds.map((id) => byId.get(id)).filter((e) => Boolean(e));
		for (const e of this.scene.postEffects) if (!orderedIds.includes(e.id)) reordered.push(e);
		this.scene.postEffects = reordered;
	}
	selectNode(id) {
		this.selectedNodeId = id;
	}
	toggleNode(id) {
		const found = this.scene.findNode(id);
		if (!found) return;
		if (found.layer && found.node === found.layer.source) found.layer.enabled = !found.layer.enabled;
		else found.node.enabled = !found.node.enabled;
	}
	updateConfig(nodeId, key, value) {
		const found = this.scene.findNode(nodeId);
		if (!found) return;
		found.node.config[key] = value;
	}
	updateConfigBatch(nodeId, updates) {
		const found = this.scene.findNode(nodeId);
		if (!found) return;
		const cfg = found.node.config;
		for (const key in updates) cfg[key] = updates[key];
	}
	updateInput(nodeId, key, value) {
		const found = this.scene.findNode(nodeId);
		if (!found) return;
		found.node.inputs[key] = value;
	}
	updateBlendMode(id, blendMode) {
		const found = this.scene.findNode(id);
		if (!found) return;
		if (found.layer && found.node === found.layer.source) found.layer.blendMode = blendMode;
		found.node.blendMode = blendMode;
	}
	updateOpacity(id, opacity) {
		const found = this.scene.findNode(id);
		if (!found) return;
		if (found.layer && found.node === found.layer.source) found.layer.opacity = opacity;
		found.node.opacity = opacity;
	}
	loadChain(chain) {
		this.scene = chainToScene(chain);
		this.selectedNodeId = fallbackSelection(this.scene);
	}
	loadJson(json) {
		this.loadChain(ShaderChain.fromJSON(json));
	}
};
var composer = new ComposerStore();
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/is.js
function isFunction$1(value) {
	return typeof value === "function";
}
function isObject(value) {
	return value !== null && typeof value === "object";
}
var CLASS_VALUE_PRIMITIVE_TYPES = [
	"string",
	"number",
	"bigint",
	"boolean"
];
function isClassValue(value) {
	if (value === null || value === void 0) return true;
	if (CLASS_VALUE_PRIMITIVE_TYPES.includes(typeof value)) return true;
	if (Array.isArray(value)) return value.every((item) => isClassValue(item));
	if (typeof value === "object") {
		if (Object.getPrototypeOf(value) !== Object.prototype) return false;
		return true;
	}
	return false;
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/box/box-extras.svelte.js
var BoxSymbol = Symbol("box");
var isWritableSymbol = Symbol("is-writable");
function boxWith(getter, setter) {
	const derived$1 = derived(getter);
	if (setter) return {
		[BoxSymbol]: true,
		[isWritableSymbol]: true,
		get current() {
			return derived$1();
		},
		set current(v) {
			setter(v);
		}
	};
	return {
		[BoxSymbol]: true,
		get current() {
			return getter();
		}
	};
}
/**
* @returns Whether the value is a Box
*
* @see {@link https://runed.dev/docs/functions/box}
*/
function isBox(value) {
	return isObject(value) && BoxSymbol in value;
}
/**
* @returns Whether the value is a WritableBox
*
* @see {@link https://runed.dev/docs/functions/box}
*/
function isWritableBox(value) {
	return isBox(value) && isWritableSymbol in value;
}
function boxFrom(value) {
	if (isBox(value)) return value;
	if (isFunction$1(value)) return boxWith(value);
	return simpleBox(value);
}
/**
* Function that gets an object of boxes, and returns an object of reactive values
*
* @example
* const count = box(0)
* const flat = box.flatten({ count, double: box.with(() => count.current) })
* // type of flat is { count: number, readonly double: number }
*
* @see {@link https://runed.dev/docs/functions/box}
*/
function boxFlatten(boxes) {
	return Object.entries(boxes).reduce((acc, [key, b]) => {
		if (!isBox(b)) return Object.assign(acc, { [key]: b });
		if (isWritableBox(b)) Object.defineProperty(acc, key, {
			get() {
				return b.current;
			},
			set(v) {
				b.current = v;
			}
		});
		else Object.defineProperty(acc, key, { get() {
			return b.current;
		} });
		return acc;
	}, {});
}
/**
* Function that converts a box to a readonly box.
*
* @example
* const count = box(0) // WritableBox<number>
* const countReadonly = box.readonly(count) // ReadableBox<number>
*
* @see {@link https://runed.dev/docs/functions/box}
*/
function toReadonlyBox(b) {
	if (!isWritableBox(b)) return b;
	return {
		[BoxSymbol]: true,
		get current() {
			return b.current;
		}
	};
}
function simpleBox(initialValue) {
	let current = initialValue;
	return {
		[BoxSymbol]: true,
		[isWritableSymbol]: true,
		get current() {
			return current;
		},
		set current(v) {
			current = v;
		}
	};
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/box/box.svelte.js
function box(initialValue) {
	let current = initialValue;
	return {
		[BoxSymbol]: true,
		[isWritableSymbol]: true,
		get current() {
			return current;
		},
		set current(v) {
			current = v;
		}
	};
}
box.from = boxFrom;
box.with = boxWith;
box.flatten = boxFlatten;
box.readonly = toReadonlyBox;
box.isBox = isBox;
box.isWritableBox = isWritableBox;
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/compose-handlers.js
/**
* Composes event handlers into a single function that can be called with an event.
* If the previous handler cancels the event using `event.preventDefault()`, the handlers
* that follow will not be called.
*/
function composeHandlers(...handlers) {
	return function(e) {
		for (const handler of handlers) {
			if (!handler) continue;
			if (e.defaultPrevented) return;
			if (typeof handler === "function") handler.call(this, e);
			else handler.current?.call(this, e);
		}
	};
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/strings.js
var NUMBER_CHAR_RE = /\d/;
var STR_SPLITTERS = [
	"-",
	"_",
	"/",
	"."
];
function isUppercase(char = "") {
	if (NUMBER_CHAR_RE.test(char)) return void 0;
	return char !== char.toLowerCase();
}
function splitByCase(str) {
	const parts = [];
	let buff = "";
	let previousUpper;
	let previousSplitter;
	for (const char of str) {
		const isSplitter = STR_SPLITTERS.includes(char);
		if (isSplitter === true) {
			parts.push(buff);
			buff = "";
			previousUpper = void 0;
			continue;
		}
		const isUpper = isUppercase(char);
		if (previousSplitter === false) {
			if (previousUpper === false && isUpper === true) {
				parts.push(buff);
				buff = char;
				previousUpper = isUpper;
				continue;
			}
			if (previousUpper === true && isUpper === false && buff.length > 1) {
				const lastChar = buff.at(-1);
				parts.push(buff.slice(0, Math.max(0, buff.length - 1)));
				buff = lastChar + char;
				previousUpper = isUpper;
				continue;
			}
		}
		buff += char;
		previousUpper = isUpper;
		previousSplitter = isSplitter;
	}
	parts.push(buff);
	return parts;
}
function pascalCase(str) {
	if (!str) return "";
	return splitByCase(str).map((p) => upperFirst(p)).join("");
}
function camelCase(str) {
	return lowerFirst(pascalCase(str || ""));
}
function upperFirst(str) {
	return str ? str[0].toUpperCase() + str.slice(1) : "";
}
function lowerFirst(str) {
	return str ? str[0].toLowerCase() + str.slice(1) : "";
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/css-to-style-obj.js
function cssToStyleObj(css) {
	if (!css) return {};
	const styleObj = {};
	function iterator(name, value) {
		if (name.startsWith("-moz-") || name.startsWith("-webkit-") || name.startsWith("-ms-") || name.startsWith("-o-")) {
			styleObj[pascalCase(name)] = value;
			return;
		}
		if (name.startsWith("--")) {
			styleObj[name] = value;
			return;
		}
		styleObj[camelCase(name)] = value;
	}
	parse(css, iterator);
	return styleObj;
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/execute-callbacks.js
/**
* Executes an array of callback functions with the same arguments.
* @template T The types of the arguments that the callback functions take.
* @param callbacks array of callback functions to execute.
* @returns A new function that executes all of the original callback functions with the same arguments.
*/
function executeCallbacks(...callbacks) {
	return (...args) => {
		for (const callback of callbacks) if (typeof callback === "function") callback(...args);
	};
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/style-to-css.js
function createParser(matcher, replacer) {
	const regex = RegExp(matcher, "g");
	return (str) => {
		if (typeof str !== "string") throw new TypeError(`expected an argument of type string, but got ${typeof str}`);
		if (!str.match(regex)) return str;
		return str.replace(regex, replacer);
	};
}
var camelToKebab = createParser(/[A-Z]/, (match) => `-${match.toLowerCase()}`);
function styleToCSS(styleObj) {
	if (!styleObj || typeof styleObj !== "object" || Array.isArray(styleObj)) throw new TypeError(`expected an argument of type object, but got ${typeof styleObj}`);
	return Object.keys(styleObj).map((property) => `${camelToKebab(property)}: ${styleObj[property]};`).join("\n");
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/style.js
function styleToString(style = {}) {
	return styleToCSS(style).replace("\n", " ");
}
var EVENT_LIST_SET = new Set([
	"onabort",
	"onanimationcancel",
	"onanimationend",
	"onanimationiteration",
	"onanimationstart",
	"onauxclick",
	"onbeforeinput",
	"onbeforetoggle",
	"onblur",
	"oncancel",
	"oncanplay",
	"oncanplaythrough",
	"onchange",
	"onclick",
	"onclose",
	"oncompositionend",
	"oncompositionstart",
	"oncompositionupdate",
	"oncontextlost",
	"oncontextmenu",
	"oncontextrestored",
	"oncopy",
	"oncuechange",
	"oncut",
	"ondblclick",
	"ondrag",
	"ondragend",
	"ondragenter",
	"ondragleave",
	"ondragover",
	"ondragstart",
	"ondrop",
	"ondurationchange",
	"onemptied",
	"onended",
	"onerror",
	"onfocus",
	"onfocusin",
	"onfocusout",
	"onformdata",
	"ongotpointercapture",
	"oninput",
	"oninvalid",
	"onkeydown",
	"onkeypress",
	"onkeyup",
	"onload",
	"onloadeddata",
	"onloadedmetadata",
	"onloadstart",
	"onlostpointercapture",
	"onmousedown",
	"onmouseenter",
	"onmouseleave",
	"onmousemove",
	"onmouseout",
	"onmouseover",
	"onmouseup",
	"onpaste",
	"onpause",
	"onplay",
	"onplaying",
	"onpointercancel",
	"onpointerdown",
	"onpointerenter",
	"onpointerleave",
	"onpointermove",
	"onpointerout",
	"onpointerover",
	"onpointerup",
	"onprogress",
	"onratechange",
	"onreset",
	"onresize",
	"onscroll",
	"onscrollend",
	"onsecuritypolicyviolation",
	"onseeked",
	"onseeking",
	"onselect",
	"onselectionchange",
	"onselectstart",
	"onslotchange",
	"onstalled",
	"onsubmit",
	"onsuspend",
	"ontimeupdate",
	"ontoggle",
	"ontouchcancel",
	"ontouchend",
	"ontouchmove",
	"ontouchstart",
	"ontransitioncancel",
	"ontransitionend",
	"ontransitionrun",
	"ontransitionstart",
	"onvolumechange",
	"onwaiting",
	"onwebkitanimationend",
	"onwebkitanimationiteration",
	"onwebkitanimationstart",
	"onwebkittransitionend",
	"onwheel"
]);
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/merge-props.js
/**
* Modified from https://github.com/adobe/react-spectrum/blob/main/packages/%40react-aria/utils/src/mergeProps.ts (see NOTICE.txt for source)
*/
function isEventHandler(key) {
	return EVENT_LIST_SET.has(key);
}
/**
* Given a list of prop objects, merges them into a single object.
* - Automatically composes event handlers (e.g. `onclick`, `oninput`, etc.)
* - Chains regular functions with the same name so they are called in order
* - Merges class strings with `clsx`
* - Merges style objects and converts them to strings
* - Handles a bug with Svelte where setting the `hidden` attribute to `false` doesn't remove it
* - Overrides other values with the last one
*/
function mergeProps(...args) {
	const result = { ...args[0] };
	for (let i = 1; i < args.length; i++) {
		const props = args[i];
		if (!props) continue;
		for (const key of Object.keys(props)) {
			const a = result[key];
			const b = props[key];
			const aIsFunction = typeof a === "function";
			const bIsFunction = typeof b === "function";
			if (aIsFunction && typeof bIsFunction && isEventHandler(key)) result[key] = composeHandlers(a, b);
			else if (aIsFunction && bIsFunction) result[key] = executeCallbacks(a, b);
			else if (key === "class") {
				const aIsClassValue = isClassValue(a);
				const bIsClassValue = isClassValue(b);
				if (aIsClassValue && bIsClassValue) result[key] = clsx(a, b);
				else if (aIsClassValue) result[key] = clsx(a);
				else if (bIsClassValue) result[key] = clsx(b);
			} else if (key === "style") {
				const aIsObject = typeof a === "object";
				const bIsObject = typeof b === "object";
				const aIsString = typeof a === "string";
				const bIsString = typeof b === "string";
				if (aIsObject && bIsObject) result[key] = {
					...a,
					...b
				};
				else if (aIsObject && bIsString) {
					const parsedStyle = cssToStyleObj(b);
					result[key] = {
						...a,
						...parsedStyle
					};
				} else if (aIsString && bIsObject) result[key] = {
					...cssToStyleObj(a),
					...b
				};
				else if (aIsString && bIsString) {
					const parsedStyleA = cssToStyleObj(a);
					const parsedStyleB = cssToStyleObj(b);
					result[key] = {
						...parsedStyleA,
						...parsedStyleB
					};
				} else if (aIsObject) result[key] = a;
				else if (bIsObject) result[key] = b;
				else if (aIsString) result[key] = a;
				else if (bIsString) result[key] = b;
			} else result[key] = b !== void 0 ? b : a;
		}
		for (const key of Object.getOwnPropertySymbols(props)) {
			const a = result[key];
			const b = props[key];
			result[key] = b !== void 0 ? b : a;
		}
	}
	if (typeof result.style === "object") result.style = styleToString(result.style).replaceAll("\n", " ");
	if (result.hidden === false) {
		result.hidden = void 0;
		delete result.hidden;
	}
	if (result.disabled === false) {
		result.disabled = void 0;
		delete result.disabled;
	}
	return result;
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/sr-only-styles.js
var srOnlyStyles = {
	position: "absolute",
	width: "1px",
	height: "1px",
	padding: "0",
	margin: "-1px",
	overflow: "hidden",
	clip: "rect(0, 0, 0, 0)",
	whiteSpace: "nowrap",
	borderWidth: "0",
	transform: "translateX(-100%)"
};
styleToString(srOnlyStyles);
//#endregion
//#region node_modules/runed/dist/internal/configurable-globals.js
var defaultWindow = void 0;
//#endregion
//#region node_modules/runed/dist/internal/utils/dom.js
/**
* Handles getting the active element in a document or shadow root.
* If the active element is within a shadow root, it will traverse the shadow root
* to find the active element.
* If not, it will return the active element in the document.
*
* @param document A document or shadow root to get the active element from.
* @returns The active element in the document or shadow root.
*/
function getActiveElement$1(document) {
	let activeElement = document.activeElement;
	while (activeElement?.shadowRoot) {
		const node = activeElement.shadowRoot.activeElement;
		if (node === activeElement) break;
		else activeElement = node;
	}
	return activeElement;
}
globalThis.Date;
globalThis.Set;
var SvelteMap = globalThis.Map;
globalThis.URL;
globalThis.URLSearchParams;
/**
* @param {any} _
*/
function createSubscriber(_) {
	return () => {};
}
//#endregion
//#region node_modules/runed/dist/utilities/active-element/active-element.svelte.js
var ActiveElement = class {
	#document;
	#subscribe;
	constructor(options = {}) {
		const { window = defaultWindow, document = window?.document } = options;
		if (window === void 0) return;
		this.#document = document;
		this.#subscribe = createSubscriber((update) => {
			const cleanupFocusIn = on(window, "focusin", update);
			const cleanupFocusOut = on(window, "focusout", update);
			return () => {
				cleanupFocusIn();
				cleanupFocusOut();
			};
		});
	}
	get current() {
		this.#subscribe?.();
		if (!this.#document) return null;
		return getActiveElement$1(this.#document);
	}
};
new ActiveElement();
//#endregion
//#region node_modules/runed/dist/internal/utils/is.js
function isFunction(value) {
	return typeof value === "function";
}
//#endregion
//#region node_modules/runed/dist/utilities/extract/extract.svelte.js
function extract(value, defaultValue) {
	if (isFunction(value)) {
		const gotten = value();
		if (gotten === void 0) return defaultValue;
		return gotten;
	}
	if (value === void 0) return defaultValue;
	return value;
}
//#endregion
//#region node_modules/runed/dist/utilities/context/context.js
var Context = class {
	#name;
	#key;
	/**
	* @param name The name of the context.
	* This is used for generating the context key and error messages.
	*/
	constructor(name) {
		this.#name = name;
		this.#key = Symbol(name);
	}
	/**
	* The key used to get and set the context.
	*
	* It is not recommended to use this value directly.
	* Instead, use the methods provided by this class.
	*/
	get key() {
		return this.#key;
	}
	/**
	* Checks whether this has been set in the context of a parent component.
	*
	* Must be called during component initialisation.
	*/
	exists() {
		return hasContext(this.#key);
	}
	/**
	* Retrieves the context that belongs to the closest parent component.
	*
	* Must be called during component initialisation.
	*
	* @throws An error if the context does not exist.
	*/
	get() {
		const context = getContext(this.#key);
		if (context === void 0) throw new Error(`Context "${this.#name}" not found`);
		return context;
	}
	/**
	* Retrieves the context that belongs to the closest parent component,
	* or the given fallback value if the context does not exist.
	*
	* Must be called during component initialisation.
	*/
	getOr(fallback) {
		const context = getContext(this.#key);
		if (context === void 0) return fallback;
		return context;
	}
	/**
	* Associates the given value with the current component and returns it.
	*
	* Must be called during component initialisation.
	*/
	set(context) {
		return setContext(this.#key, context);
	}
};
//#endregion
//#region node_modules/runed/dist/utilities/use-debounce/use-debounce.svelte.js
function useDebounce(callback, wait) {
	let context = null;
	const wait$ = derived(() => extract(wait, 250));
	function debounced(...args) {
		if (context) {
			if (context.timeout) clearTimeout(context.timeout);
		} else {
			let resolve;
			let reject;
			context = {
				timeout: null,
				runner: null,
				promise: new Promise((res, rej) => {
					resolve = res;
					reject = rej;
				}),
				resolve,
				reject
			};
		}
		context.runner = async () => {
			if (!context) return;
			const ctx = context;
			context = null;
			try {
				ctx.resolve(await callback.apply(this, args));
			} catch (error) {
				ctx.reject(error);
			}
		};
		context.timeout = setTimeout(context.runner, wait$());
		return context.promise;
	}
	debounced.cancel = async () => {
		if (!context || context.timeout === null) {
			await new Promise((resolve) => setTimeout(resolve, 0));
			if (!context || context.timeout === null) return;
		}
		clearTimeout(context.timeout);
		context.reject("Cancelled");
		context = null;
	};
	debounced.runScheduledNow = async () => {
		if (!context || !context.timeout) {
			await new Promise((resolve) => setTimeout(resolve, 0));
			if (!context || !context.timeout) return;
		}
		clearTimeout(context.timeout);
		context.timeout = null;
		await context.runner?.();
	};
	Object.defineProperty(debounced, "pending", {
		enumerable: true,
		get() {
			return !!context?.timeout;
		}
	});
	return debounced;
}
//#endregion
//#region node_modules/runed/dist/utilities/watch/watch.svelte.js
function runWatcher(sources, flush, effect, options = {}) {
	const { lazy = false } = options;
}
function watch(sources, effect, options) {
	runWatcher(sources, "post", effect, options);
}
function watchPre(sources, effect, options) {
	runWatcher(sources, "pre", effect, options);
}
watch.pre = watchPre;
function watchOnce(source, effect) {}
function watchOncePre(source, effect) {}
watchOnce.pre = watchOncePre;
//#endregion
//#region node_modules/runed/dist/internal/utils/get.js
function get$1(value) {
	if (isFunction(value)) return value();
	return value;
}
//#endregion
//#region node_modules/runed/dist/utilities/element-size/element-size.svelte.js
var ElementSize = class {
	#size = {
		width: 0,
		height: 0
	};
	#observed = false;
	#options;
	#node;
	#window;
	#width = derived(() => {
		this.#subscribe()?.();
		return this.getSize().width;
	});
	#height = derived(() => {
		this.#subscribe()?.();
		return this.getSize().height;
	});
	#subscribe = derived(() => {
		const node$ = get$1(this.#node);
		if (!node$) return;
		return createSubscriber((update) => {
			if (!this.#window) return;
			const observer = new this.#window.ResizeObserver((entries) => {
				this.#observed = true;
				for (const entry of entries) {
					const boxSize = this.#options.box === "content-box" ? entry.contentBoxSize : entry.borderBoxSize;
					const boxSizeArr = Array.isArray(boxSize) ? boxSize : [boxSize];
					this.#size.width = boxSizeArr.reduce((acc, size) => Math.max(acc, size.inlineSize), 0);
					this.#size.height = boxSizeArr.reduce((acc, size) => Math.max(acc, size.blockSize), 0);
				}
				update();
			});
			observer.observe(node$);
			return () => {
				this.#observed = false;
				observer.disconnect();
			};
		});
	});
	constructor(node, options = { box: "border-box" }) {
		this.#window = options.window ?? defaultWindow;
		this.#options = options;
		this.#node = node;
		this.#size = {
			width: 0,
			height: 0
		};
	}
	calculateSize() {
		const element = get$1(this.#node);
		if (!element || !this.#window) return;
		const offsetWidth = element.offsetWidth;
		const offsetHeight = element.offsetHeight;
		if (this.#options.box === "border-box") return {
			width: offsetWidth,
			height: offsetHeight
		};
		const style = this.#window.getComputedStyle(element);
		const paddingWidth = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
		const paddingHeight = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
		const borderWidth = parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
		const borderHeight = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
		return {
			width: offsetWidth - paddingWidth - borderWidth,
			height: offsetHeight - paddingHeight - borderHeight
		};
	}
	getSize() {
		return this.#observed ? this.#size : this.calculateSize() ?? this.#size;
	}
	get current() {
		this.#subscribe()?.();
		return this.getSize();
	}
	get width() {
		return this.#width();
	}
	get height() {
		return this.#height();
	}
};
//#endregion
//#region node_modules/runed/dist/utilities/is-mounted/is-mounted.svelte.js
var IsMounted = class {
	#isMounted = false;
	constructor() {}
	get current() {
		return this.#isMounted;
	}
};
//#endregion
//#region node_modules/runed/dist/utilities/previous/previous.svelte.js
var Previous = class {
	#previousCallback = () => void 0;
	#previous = derived(() => this.#previousCallback());
	constructor(getter, initialValue) {
		let actualPrevious = void 0;
		if (initialValue !== void 0) actualPrevious = initialValue;
		this.#previousCallback = () => {
			try {
				return actualPrevious;
			} finally {
				actualPrevious = getter();
			}
		};
	}
	get current() {
		return this.#previous();
	}
};
//#endregion
//#region node_modules/runed/dist/utilities/resource/resource.svelte.js
function debounce$1(fn, delay) {
	let timeoutId;
	let lastResolve = null;
	return (...args) => {
		return new Promise((resolve) => {
			if (lastResolve) lastResolve(void 0);
			lastResolve = resolve;
			clearTimeout(timeoutId);
			timeoutId = setTimeout(async () => {
				const result = await fn(...args);
				if (lastResolve) {
					lastResolve(result);
					lastResolve = null;
				}
			}, delay);
		});
	};
}
function throttle(fn, delay) {
	let lastRun = 0;
	let lastPromise = null;
	return (...args) => {
		const now = Date.now();
		if (lastRun && now - lastRun < delay) return lastPromise ?? Promise.resolve(void 0);
		lastRun = now;
		lastPromise = fn(...args);
		return lastPromise;
	};
}
function runResource(source, fetcher, options = {}, effectFn) {
	const { lazy = false, once = false, initialValue, debounce: debounceTime, throttle: throttleTime } = options;
	let current = initialValue;
	let loading = false;
	let error = void 0;
	let cleanupFns = [];
	const runCleanup = () => {
		cleanupFns.forEach((fn) => fn());
		cleanupFns = [];
	};
	const onCleanup = (fn) => {
		cleanupFns = [...cleanupFns, fn];
	};
	const baseFetcher = async (value, previousValue, refetching = false) => {
		try {
			loading = true;
			error = void 0;
			runCleanup();
			const controller = new AbortController();
			onCleanup(() => controller.abort());
			const result = await fetcher(value, previousValue, {
				data: current,
				refetching,
				onCleanup,
				signal: controller.signal
			});
			current = result;
			return result;
		} catch (e) {
			if (!(e instanceof DOMException && e.name === "AbortError")) error = e;
			return;
		} finally {
			loading = false;
		}
	};
	const runFetcher = debounceTime ? debounce$1(baseFetcher, debounceTime) : throttleTime ? throttle(baseFetcher, throttleTime) : baseFetcher;
	const sources = Array.isArray(source) ? source : [source];
	let prevValues;
	effectFn((values, previousValues) => {
		if (once && prevValues) return;
		prevValues = values;
		runFetcher(Array.isArray(source) ? values : values[0], Array.isArray(source) ? previousValues : previousValues?.[0]);
	}, { lazy });
	return {
		get current() {
			return current;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		mutate: (value) => {
			current = value;
		},
		refetch: (info) => {
			const values = sources.map((s) => s());
			return runFetcher(Array.isArray(source) ? values : values[0], Array.isArray(source) ? values : values[0], info ?? true);
		}
	};
}
function resource(source, fetcher, options) {
	return runResource(source, fetcher, options, (fn, options) => {
		const sources = Array.isArray(source) ? source : [source];
		const getters = () => sources.map((s) => s());
		watch(getters, (values, previousValues) => {
			fn(values, previousValues ?? []);
		}, options);
	});
}
function resourcePre(source, fetcher, options) {
	return runResource(source, fetcher, options, (fn, options) => {
		const sources = Array.isArray(source) ? source : [source];
		const getter = () => sources.map((s) => s());
		watch.pre(getter, (values, previousValues) => {
			fn(values, previousValues ?? []);
		}, options);
	});
}
resource.pre = resourcePre;
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/after-sleep.js
/**
* A utility function that executes a callback after a specified number of milliseconds.
*/
function afterSleep(ms, cb) {
	return setTimeout(cb, ms);
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/after-tick.js
function afterTick(fn) {
	(/* @__PURE__ */ tick()).then(fn);
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/dom.js
var ELEMENT_NODE = 1;
var DOCUMENT_NODE = 9;
var DOCUMENT_FRAGMENT_NODE = 11;
function isHTMLElement$1(node) {
	return isObject(node) && node.nodeType === ELEMENT_NODE && typeof node.nodeName === "string";
}
function isDocument(node) {
	return isObject(node) && node.nodeType === DOCUMENT_NODE;
}
function isWindow(node) {
	return isObject(node) && node.constructor?.name === "VisualViewport";
}
function isNode(node) {
	return isObject(node) && node.nodeType !== void 0;
}
function isShadowRoot(node) {
	return isNode(node) && node.nodeType === DOCUMENT_FRAGMENT_NODE && "host" in node;
}
function contains(parent, child) {
	if (!parent || !child) return false;
	if (!isHTMLElement$1(parent) || !isHTMLElement$1(child)) return false;
	const rootNode = child.getRootNode?.();
	if (parent === child) return true;
	if (parent.contains(child)) return true;
	if (rootNode && isShadowRoot(rootNode)) {
		let next = child;
		while (next) {
			if (parent === next) return true;
			next = next.parentNode || next.host;
		}
	}
	return false;
}
function getDocument(node) {
	if (isDocument(node)) return node;
	if (isWindow(node)) return node.document;
	return node?.ownerDocument ?? document;
}
function getWindow(node) {
	if (isShadowRoot(node)) return getWindow(node.host);
	if (isDocument(node)) return node.defaultView ?? window;
	if (isHTMLElement$1(node)) return node.ownerDocument?.defaultView ?? window;
	return window;
}
function getActiveElement(rootNode) {
	let activeElement = rootNode.activeElement;
	while (activeElement?.shadowRoot) {
		const el = activeElement.shadowRoot.activeElement;
		if (el === activeElement) break;
		else activeElement = el;
	}
	return activeElement;
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/dom-context.svelte.js
var DOMContext = class {
	element;
	#root = derived(() => {
		if (!this.element.current) return document;
		return this.element.current.getRootNode() ?? document;
	});
	get root() {
		return this.#root();
	}
	set root($$value) {
		return this.#root($$value);
	}
	constructor(element) {
		if (typeof element === "function") this.element = boxWith(element);
		else this.element = element;
	}
	getDocument = () => {
		return getDocument(this.root);
	};
	getWindow = () => {
		return this.getDocument().defaultView ?? window;
	};
	getActiveElement = () => {
		return getActiveElement(this.root);
	};
	isActiveElement = (node) => {
		return node === this.getActiveElement();
	};
	getElementById(id) {
		return this.root.getElementById(id);
	}
	querySelector = (selector) => {
		if (!this.root) return null;
		return this.root.querySelector(selector);
	};
	querySelectorAll = (selector) => {
		if (!this.root) return [];
		return this.root.querySelectorAll(selector);
	};
	setTimeout = (callback, delay) => {
		return this.getWindow().setTimeout(callback, delay);
	};
	clearTimeout = (timeoutId) => {
		return this.getWindow().clearTimeout(timeoutId);
	};
};
if (typeof HTMLElement === "function");
//#endregion
//#region node_modules/svelte/src/attachments/index.js
/**
* Creates an object key that will be recognised as an attachment when the object is spread onto an element,
* as a programmatic alternative to using `{@attach ...}`. This can be useful for library authors, though
* is generally not needed when building an app.
*
* ```svelte
* <script>
* 	import { createAttachmentKey } from 'svelte/attachments';
*
* 	const props = {
* 		class: 'cool',
* 		onclick: () => alert('clicked'),
* 		[createAttachmentKey()]: (node) => {
* 			node.textContent = 'attached!';
* 		}
* 	};
* <\/script>
*
* <button {...props}>click me</button>
* ```
* @since 5.29
*/
function createAttachmentKey() {
	return Symbol(ATTACHMENT_KEY);
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/attach-ref.js
/**
* Creates a Svelte Attachment that attaches a DOM element to a ref.
* The ref can be either a WritableBox or a callback function.
*
* @param ref - Either a WritableBox to store the element in, or a callback function that receives the element
* @param onChange - Optional callback that fires when the ref changes
* @returns An object with a spreadable attachment key that should be spread onto the element
*
* @example
* // Using with WritableBox
* const ref = box<HTMLDivElement | null>(null);
* <div {...attachRef(ref)}>Content</div>
*
* @example
* // Using with callback
* <div {...attachRef((node) => myNode = node)}>Content</div>
*
* @example
* // Using with onChange
* <div {...attachRef(ref, (node) => console.log(node))}>Content</div>
*/
function attachRef(ref, onChange) {
	return { [createAttachmentKey()]: (node) => {
		if (isBox(ref)) {
			ref.current = node;
			run(() => onChange?.(node));
			return () => {
				if ("isConnected" in node && node.isConnected) return;
				ref.current = null;
				onChange?.(null);
			};
		}
		ref(node);
		run(() => onChange?.(node));
		return () => {
			if ("isConnected" in node && node.isConnected) return;
			ref(null);
			onChange?.(null);
		};
	} };
}
//#endregion
//#region node_modules/bits-ui/dist/internal/attrs.js
function boolToStr(condition) {
	return condition ? "true" : "false";
}
function boolToStrTrueOrUndef(condition) {
	return condition ? "true" : void 0;
}
function boolToEmptyStrOrUndef(condition) {
	return condition ? "" : void 0;
}
function boolToTrueOrUndef(condition) {
	return condition ? true : void 0;
}
function getDataOpenClosed(condition) {
	return condition ? "open" : "closed";
}
function getDataTransitionAttrs(state) {
	if (state === "starting") return { "data-starting-style": "" };
	if (state === "ending") return { "data-ending-style": "" };
	return {};
}
function getAriaChecked(checked, indeterminate) {
	if (indeterminate) return "mixed";
	return checked ? "true" : "false";
}
var BitsAttrs = class {
	#variant;
	#prefix;
	attrs;
	constructor(config) {
		this.#variant = config.getVariant ? config.getVariant() : null;
		this.#prefix = this.#variant ? `data-${this.#variant}-` : `data-${config.component}-`;
		this.getAttr = this.getAttr.bind(this);
		this.selector = this.selector.bind(this);
		this.attrs = Object.fromEntries(config.parts.map((part) => [part, this.getAttr(part)]));
	}
	getAttr(part, variantOverride) {
		if (variantOverride) return `data-${variantOverride}-${part}`;
		return `${this.#prefix}${part}`;
	}
	selector(part, variantOverride) {
		return `[${this.getAttr(part, variantOverride)}]`;
	}
};
function createBitsAttrs(config) {
	const bitsAttrs = new BitsAttrs(config);
	return {
		...bitsAttrs.attrs,
		selector: bitsAttrs.selector,
		getAttr: bitsAttrs.getAttr
	};
}
var ARROW_DOWN = "ArrowDown";
var ARROW_LEFT = "ArrowLeft";
var ARROW_RIGHT = "ArrowRight";
var ARROW_UP = "ArrowUp";
var ENTER = "Enter";
var HOME = "Home";
var PAGE_DOWN = "PageDown";
var PAGE_UP = "PageUp";
//#endregion
//#region node_modules/bits-ui/dist/internal/locale.js
/**
* Detects the text direction in the element.
* @returns {Direction} The text direction ('ltr' for left-to-right or 'rtl' for right-to-left).
*/
function getElemDirection(elem) {
	return window.getComputedStyle(elem).getPropertyValue("direction");
}
//#endregion
//#region node_modules/bits-ui/dist/internal/get-directional-keys.js
var FIRST_KEYS$2 = [
	ARROW_DOWN,
	PAGE_UP,
	HOME
];
var LAST_KEYS$2 = [
	ARROW_UP,
	PAGE_DOWN,
	"End"
];
[...FIRST_KEYS$2, ...LAST_KEYS$2];
/**
* A utility function that returns the next key based on the direction and orientation.
*/
function getNextKey(dir = "ltr", orientation = "horizontal") {
	return {
		horizontal: dir === "rtl" ? ARROW_LEFT : ARROW_RIGHT,
		vertical: ARROW_DOWN
	}[orientation];
}
/**
* A utility function that returns the previous key based on the direction and orientation.
*/
function getPrevKey(dir = "ltr", orientation = "horizontal") {
	return {
		horizontal: dir === "rtl" ? ARROW_RIGHT : ARROW_LEFT,
		vertical: ARROW_UP
	}[orientation];
}
/**
* A utility function that returns the next and previous keys based on the direction
* and orientation.
*/
function getDirectionalKeys(dir = "ltr", orientation = "horizontal") {
	if (!["ltr", "rtl"].includes(dir)) dir = "ltr";
	if (!["horizontal", "vertical"].includes(orientation)) orientation = "horizontal";
	return {
		nextKey: getNextKey(dir, orientation),
		prevKey: getPrevKey(dir, orientation)
	};
}
//#endregion
//#region node_modules/bits-ui/dist/internal/is.js
var isBrowser = typeof document !== "undefined";
var isIOS = getIsIOS();
function getIsIOS() {
	return isBrowser && window?.navigator?.userAgent && (/iP(ad|hone|od)/.test(window.navigator.userAgent) || window?.navigator?.maxTouchPoints > 2 && /iPad|Macintosh/.test(window?.navigator.userAgent));
}
function isHTMLElement(element) {
	return element instanceof HTMLElement;
}
function isElement(element) {
	return element instanceof Element;
}
function isElementOrSVGElement(element) {
	return element instanceof Element || element instanceof SVGElement;
}
function isNotNull(value) {
	return value !== null;
}
/**
* Determines if the provided object is a valid `HTMLInputElement` with
* a `select` method available.
*/
function isSelectableInput(element) {
	return element instanceof HTMLInputElement && "select" in element;
}
//#endregion
//#region node_modules/bits-ui/dist/internal/roving-focus-group.js
var RovingFocusGroup = class {
	#opts;
	#currentTabStopId = box(null);
	constructor(opts) {
		this.#opts = opts;
	}
	getCandidateNodes() {
		return [];
	}
	focusFirstCandidate() {
		const items = this.getCandidateNodes();
		if (!items.length) return;
		items[0]?.focus();
	}
	handleKeydown(node, e, both = false) {
		const rootNode = this.#opts.rootNode.current;
		if (!rootNode || !node) return;
		const items = this.getCandidateNodes();
		if (!items.length) return;
		const currentIndex = items.indexOf(node);
		const { nextKey, prevKey } = getDirectionalKeys(getElemDirection(rootNode), this.#opts.orientation.current);
		const loop = this.#opts.loop.current;
		const keyToIndex = {
			[nextKey]: currentIndex + 1,
			[prevKey]: currentIndex - 1,
			[HOME]: 0,
			["End"]: items.length - 1
		};
		if (both) {
			const altNextKey = nextKey === "ArrowDown" ? ARROW_RIGHT : ARROW_DOWN;
			const altPrevKey = prevKey === "ArrowUp" ? ARROW_LEFT : ARROW_UP;
			keyToIndex[altNextKey] = currentIndex + 1;
			keyToIndex[altPrevKey] = currentIndex - 1;
		}
		let itemIndex = keyToIndex[e.key];
		if (itemIndex === void 0) return;
		e.preventDefault();
		if (itemIndex < 0 && loop) itemIndex = items.length - 1;
		else if (itemIndex === items.length && loop) itemIndex = 0;
		const itemToFocus = items[itemIndex];
		if (!itemToFocus) return;
		itemToFocus.focus();
		this.#currentTabStopId.current = itemToFocus.id;
		this.#opts.onCandidateFocus?.(itemToFocus);
		return itemToFocus;
	}
	getTabIndex(node) {
		const items = this.getCandidateNodes();
		const anyActive = this.#currentTabStopId.current !== null;
		if (node && !anyActive && items[0] === node) {
			this.#currentTabStopId.current = node.id;
			return 0;
		} else if (node?.id === this.#currentTabStopId.current) return 0;
		return -1;
	}
	setCurrentTabStopId(id) {
		this.#currentTabStopId.current = id;
	}
	focusCurrentTabStop() {
		const currentTabStopId = this.#currentTabStopId.current;
		if (!currentTabStopId) return;
		const currentTabStop = this.#opts.rootNode.current?.querySelector(`#${currentTabStopId}`);
		if (!currentTabStop || !isHTMLElement(currentTabStop)) return;
		currentTabStop.focus();
	}
};
//#endregion
//#region node_modules/bits-ui/dist/internal/animations-complete.js
var AnimationsComplete = class {
	#opts;
	#currentFrame = null;
	#observer = null;
	#runId = 0;
	constructor(opts) {
		this.#opts = opts;
	}
	#cleanup() {
		if (this.#currentFrame !== null) {
			window.cancelAnimationFrame(this.#currentFrame);
			this.#currentFrame = null;
		}
		this.#observer?.disconnect();
		this.#observer = null;
		this.#runId++;
	}
	run(fn) {
		this.#cleanup();
		const node = this.#opts.ref.current;
		if (!node) return;
		if (typeof node.getAnimations !== "function") {
			this.#executeCallback(fn);
			return;
		}
		const runId = this.#runId;
		const executeIfCurrent = () => {
			if (runId !== this.#runId) return;
			this.#executeCallback(fn);
		};
		const waitForAnimations = () => {
			if (runId !== this.#runId) return;
			const animations = node.getAnimations();
			if (animations.length === 0) {
				executeIfCurrent();
				return;
			}
			Promise.all(animations.map((animation) => animation.finished)).then(() => {
				executeIfCurrent();
			}).catch(() => {
				if (runId !== this.#runId) return;
				if (node.getAnimations().some((animation) => animation.pending || animation.playState !== "finished")) {
					waitForAnimations();
					return;
				}
				executeIfCurrent();
			});
		};
		const requestWaitForAnimations = () => {
			this.#currentFrame = window.requestAnimationFrame(() => {
				this.#currentFrame = null;
				waitForAnimations();
			});
		};
		if (!this.#opts.afterTick.current) {
			requestWaitForAnimations();
			return;
		}
		this.#currentFrame = window.requestAnimationFrame(() => {
			this.#currentFrame = null;
			const startingStyleAttr = "data-starting-style";
			if (!node.hasAttribute(startingStyleAttr)) {
				requestWaitForAnimations();
				return;
			}
			this.#observer = new MutationObserver(() => {
				if (runId !== this.#runId) return;
				if (node.hasAttribute(startingStyleAttr)) return;
				this.#observer?.disconnect();
				this.#observer = null;
				requestWaitForAnimations();
			});
			this.#observer.observe(node, {
				attributes: true,
				attributeFilter: [startingStyleAttr]
			});
		});
	}
	#executeCallback(fn) {
		const execute = () => {
			fn();
		};
		if (this.#opts.afterTick) afterTick(execute);
		else execute();
	}
};
//#endregion
//#region node_modules/bits-ui/dist/internal/presence-manager.svelte.js
var PresenceManager = class {
	#opts;
	#enabled;
	#afterAnimations;
	#shouldRender = false;
	#transitionStatus = void 0;
	#hasMounted = false;
	#transitionFrame = null;
	constructor(opts) {
		this.#opts = opts;
		this.#shouldRender = opts.open.current;
		this.#enabled = opts.enabled ?? true;
		this.#afterAnimations = new AnimationsComplete({
			ref: this.#opts.ref,
			afterTick: this.#opts.open
		});
		watch(() => this.#opts.open.current, (isOpen) => {
			if (!this.#hasMounted) {
				this.#hasMounted = true;
				return;
			}
			this.#clearTransitionFrame();
			if (!isOpen && this.#opts.shouldSkipExitAnimation?.()) {
				this.#shouldRender = false;
				this.#transitionStatus = void 0;
				this.#opts.onComplete?.();
				return;
			}
			if (isOpen) this.#shouldRender = true;
			this.#transitionStatus = isOpen ? "starting" : "ending";
			if (isOpen) this.#transitionFrame = window.requestAnimationFrame(() => {
				this.#transitionFrame = null;
				if (this.#opts.open.current) this.#transitionStatus = void 0;
			});
			if (!this.#enabled) {
				if (!isOpen) this.#shouldRender = false;
				this.#transitionStatus = void 0;
				this.#opts.onComplete?.();
				return;
			}
			this.#afterAnimations.run(() => {
				if (isOpen === this.#opts.open.current) {
					if (!this.#opts.open.current) this.#shouldRender = false;
					this.#transitionStatus = void 0;
					this.#opts.onComplete?.();
				}
			});
		});
	}
	get shouldRender() {
		return this.#shouldRender;
	}
	get transitionStatus() {
		return this.#transitionStatus;
	}
	#clearTransitionFrame() {
		if (this.#transitionFrame === null) return;
		window.cancelAnimationFrame(this.#transitionFrame);
		this.#transitionFrame = null;
	}
};
//#endregion
//#region node_modules/bits-ui/dist/internal/noop.js
/**
* A no operation function (does nothing)
*/
function noop() {}
//#endregion
//#region node_modules/bits-ui/dist/internal/create-id.js
function createId(prefixOrUid, uid) {
	if (uid === void 0) return `bits-${prefixOrUid}`;
	return `bits-${prefixOrUid}-${uid}`;
}
//#endregion
//#region node_modules/bits-ui/dist/bits/dialog/dialog.svelte.js
var dialogAttrs = createBitsAttrs({
	component: "dialog",
	parts: [
		"content",
		"trigger",
		"overlay",
		"title",
		"description",
		"close",
		"cancel",
		"action"
	]
});
var DialogRootContext = new Context("Dialog.Root | AlertDialog.Root");
var DialogRootState = class DialogRootState {
	static create(opts) {
		const parent = DialogRootContext.getOr(null);
		return DialogRootContext.set(new DialogRootState(opts, parent));
	}
	opts;
	triggerNode = null;
	contentNode = null;
	overlayNode = null;
	descriptionNode = null;
	contentId = void 0;
	titleId = void 0;
	triggerId = void 0;
	descriptionId = void 0;
	cancelNode = null;
	nestedOpenCount = 0;
	depth;
	parent;
	contentPresence;
	overlayPresence;
	constructor(opts, parent) {
		this.opts = opts;
		this.parent = parent;
		this.depth = parent ? parent.depth + 1 : 0;
		this.handleOpen = this.handleOpen.bind(this);
		this.handleClose = this.handleClose.bind(this);
		this.contentPresence = new PresenceManager({
			ref: boxWith(() => this.contentNode),
			open: this.opts.open,
			enabled: true,
			onComplete: () => {
				this.opts.onOpenChangeComplete.current(this.opts.open.current);
			}
		});
		this.overlayPresence = new PresenceManager({
			ref: boxWith(() => this.overlayNode),
			open: this.opts.open,
			enabled: true
		});
		watch(() => this.opts.open.current, (isOpen) => {
			if (!this.parent) return;
			if (isOpen) this.parent.incrementNested();
			else this.parent.decrementNested();
		}, { lazy: true });
	}
	handleOpen() {
		if (this.opts.open.current) return;
		this.opts.open.current = true;
	}
	handleClose() {
		if (!this.opts.open.current) return;
		this.opts.open.current = false;
	}
	getBitsAttr = (part) => {
		return dialogAttrs.getAttr(part, this.opts.variant.current);
	};
	incrementNested() {
		this.nestedOpenCount++;
		this.parent?.incrementNested();
	}
	decrementNested() {
		if (this.nestedOpenCount === 0) return;
		this.nestedOpenCount--;
		this.parent?.decrementNested();
	}
	#sharedProps = derived(() => ({ "data-state": getDataOpenClosed(this.opts.open.current) }));
	get sharedProps() {
		return this.#sharedProps();
	}
	set sharedProps($$value) {
		return this.#sharedProps($$value);
	}
};
var DialogCloseState = class DialogCloseState {
	static create(opts) {
		return new DialogCloseState(opts, DialogRootContext.get());
	}
	opts;
	root;
	attachment;
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(this.opts.ref);
		this.onclick = this.onclick.bind(this);
		this.onkeydown = this.onkeydown.bind(this);
	}
	onclick(e) {
		if (this.opts.disabled.current) return;
		if (e.button > 0) return;
		this.root.handleClose();
	}
	onkeydown(e) {
		if (this.opts.disabled.current) return;
		if (e.key === " " || e.key === "Enter") {
			e.preventDefault();
			this.root.handleClose();
		}
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		[this.root.getBitsAttr(this.opts.variant.current)]: "",
		onclick: this.onclick,
		onkeydown: this.onkeydown,
		disabled: this.opts.disabled.current ? true : void 0,
		tabindex: 0,
		...this.root.sharedProps,
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var DialogTitleState = class DialogTitleState {
	static create(opts) {
		return new DialogTitleState(opts, DialogRootContext.get());
	}
	opts;
	root;
	attachment;
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.root.titleId = this.opts.id.current;
		this.attachment = attachRef(this.opts.ref);
		watch.pre(() => this.opts.id.current, (id) => {
			this.root.titleId = id;
		});
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		role: "heading",
		"aria-level": this.opts.level.current,
		[this.root.getBitsAttr("title")]: "",
		...this.root.sharedProps,
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var DialogDescriptionState = class DialogDescriptionState {
	static create(opts) {
		return new DialogDescriptionState(opts, DialogRootContext.get());
	}
	opts;
	root;
	attachment;
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.root.descriptionId = this.opts.id.current;
		this.attachment = attachRef(this.opts.ref, (v) => {
			this.root.descriptionNode = v;
		});
		watch.pre(() => this.opts.id.current, (id) => {
			this.root.descriptionId = id;
		});
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		[this.root.getBitsAttr("description")]: "",
		...this.root.sharedProps,
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var DialogContentState = class DialogContentState {
	static create(opts) {
		return new DialogContentState(opts, DialogRootContext.get());
	}
	opts;
	root;
	attachment;
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(this.opts.ref, (v) => {
			this.root.contentNode = v;
			this.root.contentId = v?.id;
		});
	}
	#snippetProps = derived(() => ({ open: this.root.opts.open.current }));
	get snippetProps() {
		return this.#snippetProps();
	}
	set snippetProps($$value) {
		return this.#snippetProps($$value);
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		role: this.root.opts.variant.current === "alert-dialog" ? "alertdialog" : "dialog",
		"aria-modal": "true",
		"aria-describedby": this.root.descriptionId,
		"aria-labelledby": this.root.titleId,
		[this.root.getBitsAttr("content")]: "",
		style: {
			pointerEvents: "auto",
			outline: this.root.opts.variant.current === "alert-dialog" ? "none" : void 0,
			"--bits-dialog-depth": this.root.depth,
			"--bits-dialog-nested-count": this.root.nestedOpenCount,
			contain: "layout style"
		},
		tabindex: this.root.opts.variant.current === "alert-dialog" ? -1 : void 0,
		"data-nested-open": boolToEmptyStrOrUndef(this.root.nestedOpenCount > 0),
		"data-nested": boolToEmptyStrOrUndef(this.root.parent !== null),
		...getDataTransitionAttrs(this.root.contentPresence.transitionStatus),
		...this.root.sharedProps,
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
	get shouldRender() {
		return this.root.contentPresence.shouldRender;
	}
};
var DialogOverlayState = class DialogOverlayState {
	static create(opts) {
		return new DialogOverlayState(opts, DialogRootContext.get());
	}
	opts;
	root;
	attachment;
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(this.opts.ref, (v) => this.root.overlayNode = v);
	}
	#snippetProps = derived(() => ({ open: this.root.opts.open.current }));
	get snippetProps() {
		return this.#snippetProps();
	}
	set snippetProps($$value) {
		return this.#snippetProps($$value);
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		[this.root.getBitsAttr("overlay")]: "",
		style: {
			pointerEvents: "auto",
			"--bits-dialog-depth": this.root.depth,
			"--bits-dialog-nested-count": this.root.nestedOpenCount
		},
		"data-nested-open": boolToEmptyStrOrUndef(this.root.nestedOpenCount > 0),
		"data-nested": boolToEmptyStrOrUndef(this.root.parent !== null),
		...getDataTransitionAttrs(this.root.overlayPresence.transitionStatus),
		...this.root.sharedProps,
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
	get shouldRender() {
		return this.root.overlayPresence.shouldRender;
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/dialog/components/dialog-title.svelte
function Dialog_title$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), ref = null, child, children, level = 2, $$slots, $$events, ...restProps } = $$props;
		const titleState = DialogTitleState.create({
			id: boxWith(() => id),
			level: boxWith(() => level),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, titleState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/portal/portal-consumer.svelte
function Portal_consumer($$renderer, $$props) {
	const { children } = $$props;
	$$renderer.push(`<!---->`);
	children?.($$renderer);
	$$renderer.push(`<!---->`);
	$$renderer.push(`<!---->`);
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/config/bits-config.js
var BitsConfigContext = new Context("BitsConfig");
/**
* Gets the current Bits UI configuration state from the context.
*
* Returns a default configuration (where all values are `undefined`) if no configuration is found.
*/
function getBitsConfig() {
	const fallback = new BitsConfigState(null, {});
	return BitsConfigContext.getOr(fallback).opts;
}
/**
* Configuration state that inherits from parent configurations.
*
* @example
* Config resolution:
* ```
* Level 1: { defaultPortalTo: "#some-element", theme: "dark" }
* Level 2: { spacing: "large" } // inherits defaultPortalTo="#some-element", theme="dark"
* Level 3: { theme: "light" }   // inherits defaultPortalTo="#some-element", spacing="large", overrides theme="light"
* ```
*/
var BitsConfigState = class {
	opts;
	constructor(parent, opts) {
		const resolveConfigOption = createConfigResolver(parent, opts);
		this.opts = {
			defaultPortalTo: resolveConfigOption((config) => config.defaultPortalTo),
			defaultLocale: resolveConfigOption((config) => config.defaultLocale)
		};
	}
};
/**
* Returns a config resolver that resolves a given config option's value.
*
* The resolver creates reactive boxes that resolve config option values using this priority:
* 1. Current level's value (if defined)
* 2. Parent level's value (if defined and current is undefined)
* 3. `undefined` (if no value is found in either parent or child)
*
* @param parent - Parent configuration state (null if this is root level)
* @param currentOpts - Current level's configuration options
*
* @example
* ```typescript
* // Given this hierarchy:
* // Root: { defaultPortalTo: "#some-element" }
* // Child: { someOtherProp: "value" } // no defaultPortalTo specified
*
* const resolveConfigOption = createConfigResolver(parent, opts);
* const portalTo = resolveConfigOption(config => config.defaultPortalTo);
*
* // portalTo.current === "#some-element" (inherited from parent)
* // even when child didn't specify `defaultPortalTo`
* ```
*/
function createConfigResolver(parent, currentOpts) {
	return (getter) => {
		return boxWith(() => {
			const value = getter(currentOpts)?.current;
			if (value !== void 0) return value;
			if (parent === null) return void 0;
			return getter(parent.opts)?.current;
		});
	};
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/config/prop-resolvers.js
/**
* Creates a generic prop resolver that follows a standard priority chain:
* 1. The getter's prop value (if defined)
* 2. The config default value (if no getter prop value is defined)
* 3. The fallback value (if no config value found)
*/
function createPropResolver(configOption, fallback) {
	return (getProp) => {
		const config = getBitsConfig();
		return boxWith(() => {
			const propValue = getProp();
			if (propValue !== void 0) return propValue;
			const option = configOption(config).current;
			if (option !== void 0) return option;
			return fallback;
		});
	};
}
/**
* Resolves a portal's `to` value using the prop, the config default, or a fallback.
*
* Default value: `"body"`
*/
var resolvePortalToProp = createPropResolver((config) => config.defaultPortalTo, "body");
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/portal/portal.svelte
function Portal($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { to: toProp, children, disabled } = $$props;
		const to = resolvePortalToProp(() => toProp);
		const context = getAllContexts();
		let target = derived(getTarget);
		function getTarget() {
			if (!isBrowser || disabled) return null;
			let localTarget = null;
			if (typeof to.current === "string") localTarget = document.querySelector(to.current);
			else localTarget = to.current;
			return localTarget;
		}
		let instance;
		function unmountInstance() {
			if (instance) {
				unmount(instance);
				instance = null;
			}
		}
		watch([() => target(), () => disabled], ([target, disabled]) => {
			if (!target || disabled) {
				unmountInstance();
				return;
			}
			instance = mount(Portal_consumer, {
				target,
				props: { children },
				context
			});
			return () => {
				unmountInstance();
			};
		});
		if (disabled) {
			$$renderer.push("<!--[0-->");
			children?.($$renderer);
			$$renderer.push(`<!---->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/internal/events.js
/**
* Creates a typed event dispatcher and listener pair for custom events
* @template T - The type of data that will be passed in the event detail
* @param eventName - The name of the custom event
* @param options - CustomEvent options (bubbles, cancelable, etc.)
*/
var CustomEventDispatcher = class {
	eventName;
	options;
	constructor(eventName, options = {
		bubbles: true,
		cancelable: true
	}) {
		this.eventName = eventName;
		this.options = options;
	}
	createEvent(detail) {
		return new CustomEvent(this.eventName, {
			...this.options,
			detail
		});
	}
	dispatch(element, detail) {
		const event = this.createEvent(detail);
		element.dispatchEvent(event);
		return event;
	}
	listen(element, callback, options) {
		const handler = (event) => {
			callback(event);
		};
		return on(element, this.eventName, handler, options);
	}
};
//#endregion
//#region node_modules/bits-ui/dist/internal/debounce.js
function debounce(fn, wait = 500) {
	let timeout = null;
	const debounced = (...args) => {
		if (timeout !== null) clearTimeout(timeout);
		timeout = setTimeout(() => {
			fn(...args);
		}, wait);
	};
	debounced.destroy = () => {
		if (timeout !== null) {
			clearTimeout(timeout);
			timeout = null;
		}
	};
	return debounced;
}
//#endregion
//#region node_modules/bits-ui/dist/internal/elements.js
function isOrContainsTarget(node, target) {
	return node === target || node.contains(target);
}
function getOwnerDocument(el) {
	return el?.ownerDocument ?? document;
}
//#endregion
//#region node_modules/bits-ui/dist/internal/dom.js
/**
* Determines if the click event truly occurred outside the content node.
* This was added to handle password managers and other elements that may be injected
* into the DOM but visually appear inside the content.
*/
function isClickTrulyOutside(event, contentNode) {
	const { clientX, clientY } = event;
	const rect = contentNode.getBoundingClientRect();
	return clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom;
}
//#endregion
//#region node_modules/bits-ui/dist/bits/menu/utils.js
var SELECTION_KEYS$1 = [ENTER, " "];
var FIRST_KEYS$1 = [
	ARROW_DOWN,
	PAGE_UP,
	HOME
];
var LAST_KEYS$1 = [
	ARROW_UP,
	PAGE_DOWN,
	"End"
];
var FIRST_LAST_KEYS$1 = [...FIRST_KEYS$1, ...LAST_KEYS$1];
var SUB_OPEN_KEYS = {
	ltr: [...SELECTION_KEYS$1, ARROW_RIGHT],
	rtl: [...SELECTION_KEYS$1, ARROW_LEFT]
};
var SUB_CLOSE_KEYS = {
	ltr: [ARROW_LEFT],
	rtl: [ARROW_RIGHT]
};
function isIndeterminate(checked) {
	return checked === "indeterminate";
}
function getCheckedState(checked) {
	return isIndeterminate(checked) ? "indeterminate" : checked ? "checked" : "unchecked";
}
function isMouseEvent(event) {
	return event.pointerType === "mouse";
}
//#endregion
//#region node_modules/bits-ui/dist/internal/focus.js
/**
* A utility function that focuses an element.
*/
function focus(element, { select = false } = {}) {
	if (!element || !element.focus) return;
	const doc = getDocument(element);
	if (doc.activeElement === element) return;
	const previouslyFocusedElement = doc.activeElement;
	element.focus({ preventScroll: true });
	if (element !== previouslyFocusedElement && isSelectableInput(element) && select) element.select();
}
/**
* Attempts to focus the first element in a list of candidates.
* Stops when focus is successful.
*/
function focusFirst(candidates, { select = false } = {}, getActiveElement) {
	const previouslyFocusedElement = getActiveElement();
	for (const candidate of candidates) {
		focus(candidate, { select });
		if (getActiveElement() !== previouslyFocusedElement) return true;
	}
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/is-using-keyboard/is-using-keyboard.svelte.js
var isUsingKeyboard = false;
var IsUsingKeyboard = class {
	static _refs = 0;
	static _cleanup;
	constructor() {}
	get current() {
		return isUsingKeyboard;
	}
	set current(value) {
		isUsingKeyboard = value;
	}
};
//#endregion
//#region node_modules/bits-ui/dist/internal/tabbable.js
function getTabbableOptions() {
	return {
		getShadowRoot: true,
		displayCheck: typeof ResizeObserver === "function" && ResizeObserver.toString().includes("[native code]") ? "full" : "none"
	};
}
/**
* Gets all tabbable elements in the body and finds the next/previous tabbable element
* from the `currentNode` based on the `direction` provided.
* @param currentNode - the node we want to get the next/previous tabbable from
*/
function getTabbableFrom(currentNode, direction) {
	if (!isTabbable(currentNode, getTabbableOptions())) return getTabbableFromFocusable(currentNode, direction);
	const doc = getDocument(currentNode);
	const allTabbable = tabbable(doc.body, getTabbableOptions());
	if (direction === "prev") allTabbable.reverse();
	const activeIndex = allTabbable.indexOf(currentNode);
	if (activeIndex === -1) return doc.body;
	return allTabbable.slice(activeIndex + 1)[0];
}
function getTabbableFromFocusable(currentNode, direction) {
	const doc = getDocument(currentNode);
	if (!isFocusable(currentNode, getTabbableOptions())) return doc.body;
	const allFocusable = focusable(doc.body, getTabbableOptions());
	if (direction === "prev") allFocusable.reverse();
	const activeIndex = allFocusable.indexOf(currentNode);
	if (activeIndex === -1) return doc.body;
	return allFocusable.slice(activeIndex + 1).find((node) => isTabbable(node, getTabbableOptions())) ?? doc.body;
}
//#endregion
//#region node_modules/bits-ui/dist/internal/arrays.js
/**
* Checks if the given index is valid for the given array.
*
* @param index - The index to check
* @param arr - The array to check
*/
function isValidIndex(index, arr) {
	return index >= 0 && index < arr.length;
}
/**
* Returns the array element after the given index, or undefined for out-of-bounds or empty arrays.
* @param array the array.
* @param index the index of the current element.
* @param loop loop to the beginning of the array if the next index is out of bounds?
*/
/**
* Returns the array element after the given index, or undefined for out-of-bounds or empty arrays.
* For single-element arrays, returns the element if the index is 0.
* @param array the array.
* @param index the index of the current element.
* @param loop loop to the beginning of the array if the next index is out of bounds?
*/
function next(array, index, loop = true) {
	if (array.length === 0 || index < 0 || index >= array.length) return;
	if (array.length === 1 && index === 0) return array[0];
	if (index === array.length - 1) return loop ? array[0] : void 0;
	return array[index + 1];
}
/**
* Returns the array element prior to the given index, or undefined for out-of-bounds or empty arrays.
* For single-element arrays, returns the element if the index is 0.
* @param array the array.
* @param index the index of the current element.
* @param loop loop to the end of the array if the previous index is out of bounds?
*/
function prev(array, index, loop = true) {
	if (array.length === 0 || index < 0 || index >= array.length) return;
	if (array.length === 1 && index === 0) return array[0];
	if (index === 0) return loop ? array[array.length - 1] : void 0;
	return array[index - 1];
}
/**
* Returns the element some number after the given index. If the target index is out of bounds:
*   - If looping is disabled, the first or last element will be returned.
*   - If looping is enabled, it will wrap around the array.
* Returns undefined for empty arrays or out-of-bounds initial indices.
* @param array the array.
* @param index the index of the current element.
* @param increment the number of elements to move forward (can be negative).
* @param loop loop around the array if the target index is out of bounds?
*/
function forward(array, index, increment, loop = true) {
	if (array.length === 0 || index < 0 || index >= array.length) return;
	let targetIndex = index + increment;
	if (loop) targetIndex = (targetIndex % array.length + array.length) % array.length;
	else targetIndex = Math.max(0, Math.min(targetIndex, array.length - 1));
	return array[targetIndex];
}
/**
* Returns the element some number before the given index. If the target index is out of bounds:
*   - If looping is disabled, the first or last element will be returned.
*   - If looping is enabled, it will wrap around the array.
* Returns undefined for empty arrays or out-of-bounds initial indices.
* @param array the array.
* @param index the index of the current element.
* @param decrement the number of elements to move backward (can be negative).
* @param loop loop around the array if the target index is out of bounds?
*/
function backward(array, index, decrement, loop = true) {
	if (array.length === 0 || index < 0 || index >= array.length) return;
	let targetIndex = index - decrement;
	if (loop) targetIndex = (targetIndex % array.length + array.length) % array.length;
	else targetIndex = Math.max(0, Math.min(targetIndex, array.length - 1));
	return array[targetIndex];
}
/**
* Finds the next matching item from a list of values based on a search string.
*
* This function handles several special cases in typeahead behavior:
*
* 1. Space handling: When a search string ends with a space, it handles it specially:
*    - If there's only one match for the text before the space, it ignores the space
*    - If there are multiple matches and the current match already starts with the search prefix
*      followed by a space, it keeps the current match (doesn't change selection on space)
*    - Only after typing characters beyond the space will it move to a more specific match
*
* 2. Repeated character handling: If a search consists of repeated characters (e.g., "aaa"),
*    it treats it as a single character for matching purposes
*
* 3. Cycling behavior: The function wraps around the values array starting from the current match
*    to find the next appropriate match, creating a cycling selection behavior
*
* @param values - Array of string values to search through (e.g., the text content of menu items)
* @param search - The current search string typed by the user
* @param currentMatch - The currently selected/matched item, if any
* @returns The next matching value that should be selected, or undefined if no match is found
*/
function getNextMatch(values, search, currentMatch) {
	const lowerSearch = search.toLowerCase();
	if (lowerSearch.endsWith(" ")) {
		const searchWithoutSpace = lowerSearch.slice(0, -1);
		/**
		* If there's only one match for the prefix without space, we don't
		* watch to match with space.
		*/
		if (values.filter((value) => value.toLowerCase().startsWith(searchWithoutSpace)).length <= 1) return getNextMatch(values, searchWithoutSpace, currentMatch);
		const currentMatchLowercase = currentMatch?.toLowerCase();
		/**
		* If the current match already starts with the search prefix and has a space afterward,
		* and the user has only typed up to that space, keep the current match until they
		* disambiguate.
		*/
		if (currentMatchLowercase && currentMatchLowercase.startsWith(searchWithoutSpace) && currentMatchLowercase.charAt(searchWithoutSpace.length) === " " && search.trim() === searchWithoutSpace) return currentMatch;
		/**
		* With multiple matches, find items that match the full search string with space
		*/
		const spacedMatches = values.filter((value) => value.toLowerCase().startsWith(lowerSearch));
		/**
		* If we found matches with the space, use the first one that's not the current match
		*/
		if (spacedMatches.length > 0) {
			const currentMatchIndex = currentMatch ? values.indexOf(currentMatch) : -1;
			return wrapArray(spacedMatches, Math.max(currentMatchIndex, 0)).find((match) => match !== currentMatch) || currentMatch;
		}
	}
	const normalizedSearch = search.length > 1 && Array.from(search).every((char) => char === search[0]) ? search[0] : search;
	const normalizedLowerSearch = normalizedSearch.toLowerCase();
	const currentMatchIndex = currentMatch ? values.indexOf(currentMatch) : -1;
	let wrappedValues = wrapArray(values, Math.max(currentMatchIndex, 0));
	if (normalizedSearch.length === 1) wrappedValues = wrappedValues.filter((v) => v !== currentMatch);
	const nextMatch = wrappedValues.find((value) => value?.toLowerCase().startsWith(normalizedLowerSearch));
	return nextMatch !== currentMatch ? nextMatch : void 0;
}
/**
* Wraps an array around itself at a given start index
* Example: `wrapArray(['a', 'b', 'c', 'd'], 2) === ['c', 'd', 'a', 'b']`
*/
function wrapArray(array, startIndex) {
	return array.map((_, index) => array[(startIndex + index) % array.length]);
}
//#endregion
//#region node_modules/bits-ui/dist/internal/box-auto-reset.svelte.js
var defaultOptions = {
	afterMs: 1e4,
	onChange: noop
};
function boxAutoReset(defaultValue, options) {
	const { afterMs, onChange, getWindow } = {
		...defaultOptions,
		...options
	};
	let timeout = null;
	let value = defaultValue;
	function resetAfter() {
		return getWindow().setTimeout(() => {
			value = defaultValue;
			onChange?.(defaultValue);
		}, afterMs);
	}
	return boxWith(() => value, (v) => {
		value = v;
		onChange?.(v);
		if (timeout) getWindow().clearTimeout(timeout);
		timeout = resetAfter();
	});
}
//#endregion
//#region node_modules/bits-ui/dist/internal/dom-typeahead.svelte.js
var DOMTypeahead = class {
	#opts;
	#search;
	#onMatch = derived(() => {
		if (this.#opts.onMatch) return this.#opts.onMatch;
		return (node) => node.focus();
	});
	#getCurrentItem = derived(() => {
		if (this.#opts.getCurrentItem) return this.#opts.getCurrentItem;
		return this.#opts.getActiveElement;
	});
	constructor(opts) {
		this.#opts = opts;
		this.#search = boxAutoReset("", {
			afterMs: 1e3,
			getWindow: opts.getWindow
		});
		this.handleTypeaheadSearch = this.handleTypeaheadSearch.bind(this);
		this.resetTypeahead = this.resetTypeahead.bind(this);
	}
	handleTypeaheadSearch(key, candidates) {
		if (!candidates.length) return;
		this.#search.current = this.#search.current + key;
		const currentItem = this.#getCurrentItem()();
		const currentMatch = candidates.find((item) => item === currentItem)?.textContent?.trim() ?? "";
		const nextMatch = getNextMatch(candidates.map((item) => item.textContent?.trim() ?? ""), this.#search.current, currentMatch);
		const newItem = candidates.find((item) => item.textContent?.trim() === nextMatch);
		if (newItem) this.#onMatch()(newItem);
		return newItem;
	}
	resetTypeahead() {
		this.#search.current = "";
	}
	get search() {
		return this.#search.current;
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/menu/menu.svelte.js
var CONTEXT_MENU_TRIGGER_ATTR = "data-context-menu-trigger";
var CONTEXT_MENU_CONTENT_ATTR = "data-context-menu-content";
var MenuRootContext = new Context("Menu.Root");
var MenuMenuContext = new Context("Menu.Root | Menu.Sub");
var MenuContentContext = new Context("Menu.Content");
new Context("Menu.Group | Menu.RadioGroup");
new Context("Menu.RadioGroup");
var MenuCheckboxGroupContext = new Context("Menu.CheckboxGroup");
var MenuOpenEvent = new CustomEventDispatcher("bitsmenuopen", {
	bubbles: false,
	cancelable: true
});
var menuAttrs = createBitsAttrs({
	component: "menu",
	parts: [
		"trigger",
		"content",
		"sub-trigger",
		"item",
		"group",
		"group-heading",
		"checkbox-group",
		"checkbox-item",
		"radio-group",
		"radio-item",
		"separator",
		"sub-content",
		"arrow"
	]
});
var MenuSubmenuIntent = class {
	#opts;
	#cleanupDocMove = null;
	#fallbackTimer = null;
	#active = false;
	#target = null;
	#apex = null;
	#pointerPoint = null;
	#launchPoint = null;
	constructor(opts) {
		this.#opts = opts;
		watch([
			opts.triggerNode,
			opts.contentNode,
			opts.enabled
		], ([triggerNode, contentNode, enabled]) => {
			this.#reset();
			if (!triggerNode || !contentNode || !enabled) return;
			const onTriggerMove = (e) => {
				if (!isMouseEvent(e)) return;
				this.#launchPoint = {
					x: e.clientX,
					y: e.clientY
				};
				if (!this.#active) this.#preview(e, "content");
			};
			const onTriggerLeave = (e) => {
				if (!isMouseEvent(e)) return;
				this.#engage(e, "content");
			};
			const onContentMove = (e) => {
				if (!isMouseEvent(e)) return;
				if (!this.#active) this.#preview(e, "trigger");
			};
			const onContentLeave = (e) => {
				if (!isMouseEvent(e)) return;
				if (isElement(e.relatedTarget)) {
					const selector = this.#opts.subContentSelector();
					const matchedSubContent = e.relatedTarget.closest(selector);
					if (matchedSubContent && matchedSubContent !== contentNode && matchedSubContent.id) {
						if (!!contentNode.querySelector(`[aria-controls="${matchedSubContent.id}"]`)) return;
					}
				}
				this.#engage(e, "trigger");
			};
			const onTriggerEnter = (e) => {
				if (!isMouseEvent(e)) return;
				this.#disengage();
			};
			const onContentEnter = (e) => {
				if (!isMouseEvent(e)) return;
				this.#disengage();
			};
			triggerNode.addEventListener("pointermove", onTriggerMove);
			triggerNode.addEventListener("pointerleave", onTriggerLeave);
			triggerNode.addEventListener("pointerenter", onTriggerEnter);
			contentNode.addEventListener("pointermove", onContentMove);
			contentNode.addEventListener("pointerleave", onContentLeave);
			contentNode.addEventListener("pointerenter", onContentEnter);
			return () => {
				triggerNode.removeEventListener("pointermove", onTriggerMove);
				triggerNode.removeEventListener("pointerleave", onTriggerLeave);
				triggerNode.removeEventListener("pointerenter", onTriggerEnter);
				contentNode.removeEventListener("pointermove", onContentMove);
				contentNode.removeEventListener("pointerleave", onContentLeave);
				contentNode.removeEventListener("pointerenter", onContentEnter);
				this.#reset();
			};
		});
	}
	#parentTargetRect() {
		const parent = this.#opts.parentContentNode();
		if (parent) return parent.getBoundingClientRect();
		return this.#opts.triggerNode()?.getBoundingClientRect() ?? null;
	}
	#computePolygons(pointerPt, target) {
		const triggerNode = this.#opts.triggerNode();
		const contentNode = this.#opts.contentNode();
		if (!triggerNode || !contentNode) return null;
		const triggerRect = triggerNode.getBoundingClientRect();
		const contentRect = contentNode.getBoundingClientRect();
		const side = getSide(triggerRect, contentRect);
		let apex;
		let targetRect;
		let sourceRect;
		if (target === "content") {
			apex = this.#active ? this.#apex ?? pointerPt : pointerPt;
			targetRect = contentRect;
		} else {
			apex = this.#launchPoint ?? pointerPt;
			targetRect = this.#parentTargetRect() ?? triggerRect;
			sourceRect = contentRect;
		}
		this.#apex = apex;
		return {
			corridor: getCorridorPolygon(triggerRect, contentRect, side),
			intent: getIntentPolygon(apex, targetRect, side, target, sourceRect),
			targetRect,
			side
		};
	}
	#isInSafeZone(pt, corridor, intent) {
		return isPointInPolygon(pt, corridor) || isPointInPolygon(pt, intent);
	}
	#preview(e, target) {
		const pt = {
			x: e.clientX,
			y: e.clientY
		};
		if (!this.#computePolygons(pt, target)) return;
		this.#target = target;
		this.#pointerPoint = pt;
	}
	#engage(e, target) {
		if (!this.#opts.enabled()) return;
		const triggerNode = this.#opts.triggerNode();
		const contentNode = this.#opts.contentNode();
		if (!triggerNode || !contentNode) return;
		const related = e.relatedTarget;
		if (isElement(related)) {
			if (target === "content" && contentNode.contains(related)) return;
			if (target === "trigger" && triggerNode.contains(related)) return;
		}
		const pt = {
			x: e.clientX,
			y: e.clientY
		};
		const geo = this.#computePolygons(pt, target);
		if (!geo) return;
		if (!isInsideRect(pt, geo.targetRect) && !this.#isInSafeZone(pt, geo.corridor, geo.intent)) {
			this.#clearVisuals();
			return;
		}
		this.#active = true;
		this.#target = target;
		this.#pointerPoint = pt;
		this.#opts.setIsPointerInTransit(true);
		this.#attachDocMove();
		this.#startFallback();
	}
	#disengageTimer = null;
	#disengage() {
		if (!this.#active) return;
		const wasReturning = this.#target === "trigger";
		this.#detachDocMove();
		this.#clearFallback();
		this.#active = false;
		this.#clearVisuals();
		if (wasReturning) {
			this.#clearDisengageTimer();
			this.#disengageTimer = setTimeout(() => {
				this.#disengageTimer = null;
				this.#opts.setIsPointerInTransit(false);
			}, 100);
		} else this.#opts.setIsPointerInTransit(false);
	}
	#clearDisengageTimer() {
		if (this.#disengageTimer === null) return;
		clearTimeout(this.#disengageTimer);
		this.#disengageTimer = null;
	}
	#intentExit() {
		const pointerPoint = this.#pointerPoint;
		this.#detachDocMove();
		this.#clearFallback();
		this.#clearDisengageTimer();
		this.#active = false;
		this.#opts.setIsPointerInTransit(false);
		this.#clearVisuals();
		this.#opts.onIntentExit(pointerPoint);
	}
	#reset() {
		this.#detachDocMove();
		this.#clearFallback();
		this.#clearDisengageTimer();
		if (this.#active) this.#opts.setIsPointerInTransit(false);
		this.#active = false;
		this.#target = null;
		this.#apex = null;
		this.#pointerPoint = null;
		this.#launchPoint = null;
	}
	#isPointerInDescendantSubContent(pt) {
		const contentNode = this.#opts.contentNode();
		if (!contentNode) return false;
		const el = contentNode.ownerDocument.elementFromPoint(pt.x, pt.y);
		if (!el) return false;
		const selector = this.#opts.subContentSelector();
		const subContent = el.closest(selector);
		if (!subContent || subContent === contentNode) return false;
		if (subContent.id) return !!contentNode.querySelector(`[aria-controls="${subContent.id}"]`);
		return false;
	}
	#onDocMove = (e) => {
		if (!this.#active || !this.#target) return;
		if (!isMouseEvent(e)) return;
		const triggerNode = this.#opts.triggerNode();
		const contentNode = this.#opts.contentNode();
		if (!triggerNode || !contentNode) {
			this.#intentExit();
			return;
		}
		this.#clearFallback();
		const pt = {
			x: e.clientX,
			y: e.clientY
		};
		this.#pointerPoint = pt;
		const triggerRect = triggerNode.getBoundingClientRect();
		const contentRect = contentNode.getBoundingClientRect();
		if (this.#target === "content" && isInsideRect(pt, contentRect)) {
			this.#disengage();
			return;
		}
		if (this.#target === "trigger" && isInsideInsetRect(pt, triggerRect, 4)) {
			this.#disengage();
			return;
		}
		if (this.#isPointerInDescendantSubContent(pt)) {
			this.#startFallback();
			return;
		}
		const geo = this.#computePolygons(pt, this.#target);
		if (!geo) {
			this.#intentExit();
			return;
		}
		if (this.#isInSafeZone(pt, geo.corridor, geo.intent)) {
			this.#startFallback();
			return;
		}
		this.#intentExit();
	};
	#attachDocMove() {
		if (this.#cleanupDocMove) return;
		const doc = getDocument(this.#opts.triggerNode() ?? this.#opts.contentNode());
		if (!doc) return;
		doc.addEventListener("pointermove", this.#onDocMove, true);
		this.#cleanupDocMove = () => {
			doc.removeEventListener("pointermove", this.#onDocMove, true);
			this.#cleanupDocMove = null;
		};
	}
	#detachDocMove() {
		this.#cleanupDocMove?.();
	}
	#startFallback() {
		this.#clearFallback();
		this.#fallbackTimer = setTimeout(() => {
			this.#fallbackTimer = null;
			if (this.#active) this.#intentExit();
		}, 500);
	}
	#clearFallback() {
		if (this.#fallbackTimer === null) return;
		clearTimeout(this.#fallbackTimer);
		this.#fallbackTimer = null;
	}
	#clearVisuals() {
		this.#target = null;
		this.#apex = null;
		this.#pointerPoint = null;
	}
};
function isPointInPolygon(point, polygon) {
	const { x, y } = point;
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i].x;
		const yi = polygon[i].y;
		const xj = polygon[j].x;
		const yj = polygon[j].y;
		if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
	}
	return inside;
}
function isInsideRect(point, rect) {
	return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}
function isInsideInsetRect(point, rect, inset) {
	return point.x >= rect.left + inset && point.x <= rect.right - inset && point.y >= rect.top + inset && point.y <= rect.bottom - inset;
}
function getSide(triggerRect, contentRect) {
	const triggerCenterX = triggerRect.left + triggerRect.width / 2;
	const triggerCenterY = triggerRect.top + triggerRect.height / 2;
	const contentCenterX = contentRect.left + contentRect.width / 2;
	const contentCenterY = contentRect.top + contentRect.height / 2;
	const deltaX = contentCenterX - triggerCenterX;
	const deltaY = contentCenterY - triggerCenterY;
	if (Math.abs(deltaX) > Math.abs(deltaY)) return deltaX > 0 ? "right" : "left";
	return deltaY > 0 ? "bottom" : "top";
}
function getCorridorPolygon(triggerRect, contentRect, side) {
	const buffer = 2;
	switch (side) {
		case "top": return [
			{
				x: Math.min(triggerRect.left, contentRect.left) - buffer,
				y: triggerRect.top
			},
			{
				x: Math.min(triggerRect.left, contentRect.left) - buffer,
				y: contentRect.bottom
			},
			{
				x: Math.max(triggerRect.right, contentRect.right) + buffer,
				y: contentRect.bottom
			},
			{
				x: Math.max(triggerRect.right, contentRect.right) + buffer,
				y: triggerRect.top
			}
		];
		case "bottom": return [
			{
				x: Math.min(triggerRect.left, contentRect.left) - buffer,
				y: triggerRect.bottom
			},
			{
				x: Math.min(triggerRect.left, contentRect.left) - buffer,
				y: contentRect.top
			},
			{
				x: Math.max(triggerRect.right, contentRect.right) + buffer,
				y: contentRect.top
			},
			{
				x: Math.max(triggerRect.right, contentRect.right) + buffer,
				y: triggerRect.bottom
			}
		];
		case "left": return [
			{
				x: triggerRect.left,
				y: Math.min(triggerRect.top, contentRect.top) - buffer
			},
			{
				x: contentRect.right,
				y: Math.min(triggerRect.top, contentRect.top) - buffer
			},
			{
				x: contentRect.right,
				y: Math.max(triggerRect.bottom, contentRect.bottom) + buffer
			},
			{
				x: triggerRect.left,
				y: Math.max(triggerRect.bottom, contentRect.bottom) + buffer
			}
		];
		case "right": return [
			{
				x: triggerRect.right,
				y: Math.min(triggerRect.top, contentRect.top) - buffer
			},
			{
				x: contentRect.left,
				y: Math.min(triggerRect.top, contentRect.top) - buffer
			},
			{
				x: contentRect.left,
				y: Math.max(triggerRect.bottom, contentRect.bottom) + buffer
			},
			{
				x: triggerRect.right,
				y: Math.max(triggerRect.bottom, contentRect.bottom) + buffer
			}
		];
	}
}
function getIntentPolygon(exitPoint, targetRect, side, target, sourceRect) {
	const edgeBuffer = 8;
	const effectiveSide = target === "trigger" ? flipSide(side) : side;
	const top = sourceRect ? Math.min(targetRect.top, sourceRect.top) - edgeBuffer : targetRect.top - edgeBuffer;
	const bottom = sourceRect ? Math.max(targetRect.bottom, sourceRect.bottom) + edgeBuffer : targetRect.bottom + edgeBuffer;
	const left = sourceRect ? Math.min(targetRect.left, sourceRect.left) - edgeBuffer : targetRect.left - edgeBuffer;
	const right = sourceRect ? Math.max(targetRect.right, sourceRect.right) + edgeBuffer : targetRect.right + edgeBuffer;
	switch (effectiveSide) {
		case "right": return [
			exitPoint,
			{
				x: targetRect.left,
				y: top
			},
			{
				x: targetRect.left,
				y: bottom
			}
		];
		case "left": return [
			exitPoint,
			{
				x: targetRect.right,
				y: top
			},
			{
				x: targetRect.right,
				y: bottom
			}
		];
		case "bottom": return [
			exitPoint,
			{
				x: left,
				y: targetRect.top
			},
			{
				x: right,
				y: targetRect.top
			}
		];
		case "top": return [
			exitPoint,
			{
				x: left,
				y: targetRect.bottom
			},
			{
				x: right,
				y: targetRect.bottom
			}
		];
	}
}
function flipSide(side) {
	switch (side) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}
var MenuRootState = class MenuRootState {
	static create(opts) {
		const root = new MenuRootState(opts);
		return MenuRootContext.set(root);
	}
	opts;
	isUsingKeyboard = new IsUsingKeyboard();
	ignoreCloseAutoFocus = false;
	isPointerInTransit = false;
	constructor(opts) {
		this.opts = opts;
	}
	getBitsAttr = (part) => {
		return menuAttrs.getAttr(part, this.opts.variant.current);
	};
};
var MenuMenuState = class MenuMenuState {
	static create(opts, root) {
		return MenuMenuContext.set(new MenuMenuState(opts, root, null));
	}
	opts;
	root;
	parentMenu;
	contentId = boxWith(() => "");
	contentNode = null;
	contentPresence;
	triggerNode = null;
	constructor(opts, root, parentMenu) {
		this.opts = opts;
		this.root = root;
		this.parentMenu = parentMenu;
		this.contentPresence = new PresenceManager({
			ref: boxWith(() => this.contentNode),
			open: this.opts.open,
			onComplete: () => {
				this.opts.onOpenChangeComplete.current(this.opts.open.current);
			},
			shouldSkipExitAnimation: () => {
				if (this.root.opts.variant.current !== "menubar" || this.parentMenu !== null) return false;
				return this.root.opts.shouldSkipExitAnimation?.() ?? false;
			}
		});
		if (parentMenu) watch(() => parentMenu.opts.open.current, () => {
			if (parentMenu.opts.open.current) return;
			this.opts.open.current = false;
		});
	}
	toggleOpen() {
		this.opts.open.current = !this.opts.open.current;
	}
	onOpen() {
		this.opts.open.current = true;
	}
	onClose() {
		this.opts.open.current = false;
	}
};
var MenuContentState = class MenuContentState {
	static create(opts) {
		return MenuContentContext.set(new MenuContentState(opts, MenuMenuContext.get()));
	}
	opts;
	parentMenu;
	rovingFocusGroup;
	domContext;
	attachment;
	search = "";
	#timer = 0;
	#handleTypeaheadSearch;
	mounted = false;
	#isSub;
	constructor(opts, parentMenu) {
		this.opts = opts;
		this.parentMenu = parentMenu;
		this.domContext = new DOMContext(opts.ref);
		this.attachment = attachRef(this.opts.ref, (v) => {
			if (this.parentMenu.contentNode !== v) this.parentMenu.contentNode = v;
		});
		parentMenu.contentId = opts.id;
		this.#isSub = opts.isSub ?? false;
		this.onkeydown = this.onkeydown.bind(this);
		this.onblur = this.onblur.bind(this);
		this.onfocus = this.onfocus.bind(this);
		this.handleInteractOutside = this.handleInteractOutside.bind(this);
		new MenuSubmenuIntent({
			contentNode: () => this.parentMenu.contentNode,
			triggerNode: () => this.parentMenu.triggerNode,
			parentContentNode: () => this.parentMenu.parentMenu?.contentNode ?? null,
			subContentSelector: () => `[${this.parentMenu.root.getBitsAttr("sub-content")}]`,
			enabled: () => this.parentMenu.opts.open.current && Boolean(this.parentMenu.triggerNode?.hasAttribute(this.parentMenu.root.getBitsAttr("sub-trigger"))),
			onIntentExit: (pointerPoint) => {
				this.parentMenu.opts.open.current = false;
				this.#dispatchPointerMoveToHoveredSubTrigger(pointerPoint);
			},
			setIsPointerInTransit: (value) => {
				this.parentMenu.root.isPointerInTransit = value;
			}
		});
		this.#handleTypeaheadSearch = new DOMTypeahead({
			getActiveElement: () => this.domContext.getActiveElement(),
			getWindow: () => this.domContext.getWindow()
		}).handleTypeaheadSearch;
		this.rovingFocusGroup = new RovingFocusGroup({
			rootNode: boxWith(() => this.parentMenu.contentNode),
			candidateAttr: this.parentMenu.root.getBitsAttr("item"),
			loop: this.opts.loop,
			orientation: boxWith(() => "vertical")
		});
		watch(() => this.parentMenu.contentNode, (contentNode) => {
			if (!contentNode) return;
			const handler = () => {
				afterTick(() => {
					if (!this.parentMenu.root.isUsingKeyboard.current) return;
					this.rovingFocusGroup.focusFirstCandidate();
				});
			};
			return MenuOpenEvent.listen(contentNode, handler);
		});
	}
	#getCandidateNodes() {
		const node = this.parentMenu.contentNode;
		if (!node) return [];
		return Array.from(node.querySelectorAll(`[${this.parentMenu.root.getBitsAttr("item")}]:not([data-disabled])`));
	}
	#isPointerMovingToSubmenu() {
		return this.parentMenu.root.isPointerInTransit;
	}
	#dispatchPointerMoveToHoveredSubTrigger(pointerPoint) {
		if (!pointerPoint) return;
		const parentContentNode = this.parentMenu.parentMenu?.contentNode;
		if (!parentContentNode) return;
		const hoveredNode = this.domContext.getDocument().elementFromPoint(pointerPoint.x, pointerPoint.y);
		if (!isElement(hoveredNode)) return;
		const hoveredSubTrigger = hoveredNode.closest(`[${this.parentMenu.root.getBitsAttr("sub-trigger")}]`);
		if (!hoveredSubTrigger || !parentContentNode.contains(hoveredSubTrigger)) return;
		if (hoveredSubTrigger === this.parentMenu.triggerNode) return;
		hoveredSubTrigger.dispatchEvent(new PointerEvent("pointermove", {
			bubbles: true,
			cancelable: true,
			pointerType: "mouse",
			clientX: pointerPoint.x,
			clientY: pointerPoint.y
		}));
	}
	onCloseAutoFocus = (e) => {
		this.opts.onCloseAutoFocus.current?.(e);
		if (e.defaultPrevented || this.#isSub) return;
		if (this.parentMenu.root.ignoreCloseAutoFocus) {
			e.preventDefault();
			return;
		}
		if (this.parentMenu.triggerNode && isTabbable(this.parentMenu.triggerNode)) {
			e.preventDefault();
			this.parentMenu.triggerNode.focus();
		}
	};
	handleTabKeyDown(e) {
		/**
		* We locate the root `menu`'s trigger by going up the tree until
		* we find a menu that has no parent. This will allow us to focus the next
		* tabbable element before/after the root trigger.
		*/
		let rootMenu = this.parentMenu;
		while (rootMenu.parentMenu !== null) rootMenu = rootMenu.parentMenu;
		if (!rootMenu.triggerNode) return;
		e.preventDefault();
		const nodeToFocus = getTabbableFrom(rootMenu.triggerNode, e.shiftKey ? "prev" : "next");
		if (nodeToFocus) {
			/**
			* We set a flag to ignore the `onCloseAutoFocus` event handler
			* as well as the fallbacks inside the focus scope to prevent
			* race conditions causing focus to fall back to the body even
			* though we're trying to focus the next tabbable element.
			*/
			this.parentMenu.root.ignoreCloseAutoFocus = true;
			rootMenu.onClose();
			afterTick(() => {
				nodeToFocus.focus();
				afterTick(() => {
					this.parentMenu.root.ignoreCloseAutoFocus = false;
				});
			});
		} else this.domContext.getDocument().body.focus();
	}
	onkeydown(e) {
		if (e.defaultPrevented) return;
		if (e.key === "Tab") {
			this.handleTabKeyDown(e);
			return;
		}
		const target = e.target;
		const currentTarget = e.currentTarget;
		if (!isHTMLElement(target) || !isHTMLElement(currentTarget)) return;
		const isKeydownInside = target.closest(`[${this.parentMenu.root.getBitsAttr("content")}]`)?.id === this.parentMenu.contentId.current;
		const isModifierKey = e.ctrlKey || e.altKey || e.metaKey;
		const isCharacterKey = e.key.length === 1;
		if (this.rovingFocusGroup.handleKeydown(target, e)) return;
		if (e.code === "Space") return;
		const candidateNodes = this.#getCandidateNodes();
		if (isKeydownInside) {
			if (!isModifierKey && isCharacterKey) this.#handleTypeaheadSearch(e.key, candidateNodes);
		}
		if (e.target?.id !== this.parentMenu.contentId.current) return;
		if (!FIRST_LAST_KEYS$1.includes(e.key)) return;
		e.preventDefault();
		if (LAST_KEYS$1.includes(e.key)) candidateNodes.reverse();
		focusFirst(candidateNodes, { select: false }, () => this.domContext.getActiveElement());
	}
	onblur(e) {
		if (!isElement(e.currentTarget)) return;
		if (!isElement(e.target)) return;
		if (!e.currentTarget.contains?.(e.target)) {
			this.domContext.getWindow().clearTimeout(this.#timer);
			this.search = "";
		}
	}
	onfocus(_) {
		if (!this.parentMenu.root.isUsingKeyboard.current) return;
		afterTick(() => this.rovingFocusGroup.focusFirstCandidate());
	}
	onItemEnter() {
		return this.#isPointerMovingToSubmenu();
	}
	onItemLeave(e) {
		if (e.currentTarget.hasAttribute(this.parentMenu.root.getBitsAttr("sub-trigger"))) return;
		if (this.#isPointerMovingToSubmenu() || this.parentMenu.root.isUsingKeyboard.current) return;
		this.parentMenu.contentNode?.focus({ preventScroll: true });
		this.rovingFocusGroup.setCurrentTabStopId("");
	}
	onTriggerLeave() {
		if (this.#isPointerMovingToSubmenu()) return true;
		return false;
	}
	handleInteractOutside(e) {
		if (!isElementOrSVGElement(e.target)) return;
		const triggerId = this.parentMenu.triggerNode?.id;
		if (e.target.id === triggerId) {
			e.preventDefault();
			return;
		}
		if (e.target.closest(`#${triggerId}`)) {
			e.preventDefault();
			return;
		}
		/**
		* when the menu closes due to an outside pointer interaction (for example,
		* clicking another dropdown trigger), avoid focusing this menu's trigger
		* to prevent stealing focus from the new interaction target.
		*/
		this.parentMenu.root.ignoreCloseAutoFocus = true;
		afterTick(() => {
			this.parentMenu.root.ignoreCloseAutoFocus = false;
		});
	}
	get shouldRender() {
		return this.parentMenu.contentPresence.shouldRender;
	}
	#snippetProps = derived(() => ({ open: this.parentMenu.opts.open.current }));
	get snippetProps() {
		return this.#snippetProps();
	}
	set snippetProps($$value) {
		return this.#snippetProps($$value);
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		role: "menu",
		"aria-orientation": "vertical",
		[this.parentMenu.root.getBitsAttr("content")]: "",
		"data-state": getDataOpenClosed(this.parentMenu.opts.open.current),
		...getDataTransitionAttrs(this.parentMenu.contentPresence.transitionStatus),
		onkeydown: this.onkeydown,
		onblur: this.onblur,
		onfocus: this.onfocus,
		dir: this.parentMenu.root.opts.dir.current,
		style: {
			pointerEvents: "auto",
			contain: "layout style"
		},
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
	popperProps = { onCloseAutoFocus: (e) => this.onCloseAutoFocus(e) };
};
var MenuItemSharedState = class {
	opts;
	content;
	attachment;
	#isFocused = false;
	constructor(opts, content) {
		this.opts = opts;
		this.content = content;
		this.attachment = attachRef(this.opts.ref);
		this.onpointermove = this.onpointermove.bind(this);
		this.onpointerleave = this.onpointerleave.bind(this);
		this.onfocus = this.onfocus.bind(this);
		this.onblur = this.onblur.bind(this);
	}
	onpointermove(e) {
		if (e.defaultPrevented) return;
		if (!isMouseEvent(e)) return;
		if (this.opts.disabled.current) this.content.onItemLeave(e);
		else {
			if (this.content.onItemEnter()) return;
			const item = e.currentTarget;
			if (!isHTMLElement(item)) return;
			item.focus({ preventScroll: true });
		}
	}
	onpointerleave(e) {
		if (e.defaultPrevented) return;
		if (!isMouseEvent(e)) return;
		this.content.onItemLeave(e);
	}
	onfocus(e) {
		afterTick(() => {
			if (e.defaultPrevented || this.opts.disabled.current) return;
			this.#isFocused = true;
		});
	}
	onblur(e) {
		afterTick(() => {
			if (e.defaultPrevented) return;
			this.#isFocused = false;
		});
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		tabindex: -1,
		role: "menuitem",
		"aria-disabled": boolToStr(this.opts.disabled.current),
		"data-disabled": boolToEmptyStrOrUndef(this.opts.disabled.current),
		"data-highlighted": this.#isFocused ? "" : void 0,
		[this.content.parentMenu.root.getBitsAttr("item")]: "",
		onpointermove: this.onpointermove,
		onpointerleave: this.onpointerleave,
		onfocus: this.onfocus,
		onblur: this.onblur,
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var MenuItemState = class MenuItemState {
	static create(opts) {
		return new MenuItemState(opts, new MenuItemSharedState(opts, MenuContentContext.get()));
	}
	opts;
	item;
	root;
	#isPointerDown = false;
	constructor(opts, item) {
		this.opts = opts;
		this.item = item;
		this.root = item.content.parentMenu.root;
		this.onkeydown = this.onkeydown.bind(this);
		this.onclick = this.onclick.bind(this);
		this.onpointerdown = this.onpointerdown.bind(this);
		this.onpointerup = this.onpointerup.bind(this);
	}
	#handleSelect() {
		if (this.item.opts.disabled.current) return;
		const selectEvent = new CustomEvent("menuitemselect", {
			bubbles: true,
			cancelable: true
		});
		this.opts.onSelect.current(selectEvent);
		if (selectEvent.defaultPrevented) {
			this.item.content.parentMenu.root.isUsingKeyboard.current = false;
			return;
		}
		if (this.opts.closeOnSelect.current) this.item.content.parentMenu.root.opts.onClose();
	}
	onkeydown(e) {
		const isTypingAhead = this.item.content.search !== "";
		if (this.item.opts.disabled.current || isTypingAhead && e.key === " ") return;
		if (SELECTION_KEYS$1.includes(e.key)) {
			if (!isHTMLElement(e.currentTarget)) return;
			e.currentTarget.click();
			/**
			* We prevent default browser behavior for selection keys as they should trigger
			* a selection only:
			* - prevents space from scrolling the page.
			* - if keydown causes focus to move, prevents keydown from firing on the new target.
			*/
			e.preventDefault();
		}
	}
	onclick(_) {
		if (this.item.opts.disabled.current) return;
		this.#handleSelect();
	}
	onpointerup(e) {
		if (e.defaultPrevented) return;
		if (!this.#isPointerDown) {
			if (!isHTMLElement(e.currentTarget)) return;
			e.currentTarget?.click();
		}
	}
	onpointerdown(_) {
		this.#isPointerDown = true;
	}
	#props = derived(() => mergeProps(this.item.props, {
		onclick: this.onclick,
		onpointerdown: this.onpointerdown,
		onpointerup: this.onpointerup,
		onkeydown: this.onkeydown
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var MenuSubTriggerState = class MenuSubTriggerState {
	static create(opts) {
		const content = MenuContentContext.get();
		return new MenuSubTriggerState(opts, new MenuItemSharedState(opts, content), content, MenuMenuContext.get());
	}
	opts;
	item;
	content;
	submenu;
	attachment;
	#openTimer = null;
	constructor(opts, item, content, submenu) {
		this.opts = opts;
		this.item = item;
		this.content = content;
		this.submenu = submenu;
		this.attachment = attachRef(this.opts.ref, (v) => this.submenu.triggerNode = v);
		this.onpointerleave = this.onpointerleave.bind(this);
		this.onpointermove = this.onpointermove.bind(this);
		this.onkeydown = this.onkeydown.bind(this);
		this.onclick = this.onclick.bind(this);
	}
	#clearOpenTimer() {
		if (this.#openTimer === null) return;
		this.content.domContext.getWindow().clearTimeout(this.#openTimer);
		this.#openTimer = null;
	}
	onpointermove(e) {
		if (!isMouseEvent(e)) return;
		if (this.submenu.root.isPointerInTransit) {
			if (this.#openTimer !== null) this.#clearOpenTimer();
			return;
		}
		if (!this.item.opts.disabled.current && !this.submenu.opts.open.current && !this.#openTimer) {
			const openDelay = this.opts.openDelay.current;
			if (openDelay <= 0) {
				this.submenu.onOpen();
				return;
			}
			this.#openTimer = this.content.domContext.setTimeout(() => {
				if (this.submenu.root.isPointerInTransit) {
					this.#clearOpenTimer();
					return;
				}
				this.submenu.onOpen();
				this.#clearOpenTimer();
			}, openDelay);
		}
	}
	onpointerleave(e) {
		if (!isMouseEvent(e)) return;
		this.#clearOpenTimer();
	}
	onkeydown(e) {
		const isTypingAhead = this.content.search !== "";
		if (this.item.opts.disabled.current || isTypingAhead && e.key === " ") return;
		if (SUB_OPEN_KEYS[this.submenu.root.opts.dir.current].includes(e.key)) {
			e.currentTarget.click();
			e.preventDefault();
		}
	}
	onclick(e) {
		if (this.item.opts.disabled.current) return;
		/**
		* We manually focus because iOS Safari doesn't always focus on click (e.g. buttons)
		* and we rely heavily on `onFocusOutside` for submenus to close when switching
		* between separate submenus.
		*/
		if (!isHTMLElement(e.currentTarget)) return;
		e.currentTarget.focus();
		const selectEvent = new CustomEvent("menusubtriggerselect", {
			bubbles: true,
			cancelable: true
		});
		this.opts.onSelect.current(selectEvent);
		if (!this.submenu.opts.open.current) {
			this.submenu.onOpen();
			afterTick(() => {
				const contentNode = this.submenu.contentNode;
				if (!contentNode) return;
				MenuOpenEvent.dispatch(contentNode);
			});
		}
	}
	#props = derived(() => mergeProps({
		"aria-haspopup": "menu",
		"aria-expanded": boolToStr(this.submenu.opts.open.current),
		"data-state": getDataOpenClosed(this.submenu.opts.open.current),
		"aria-controls": this.submenu.opts.open.current ? this.submenu.contentId.current : void 0,
		[this.submenu.root.getBitsAttr("sub-trigger")]: "",
		onclick: this.onclick,
		onpointermove: this.onpointermove,
		onpointerleave: this.onpointerleave,
		onkeydown: this.onkeydown,
		...this.attachment
	}, this.item.props));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var MenuCheckboxItemState = class MenuCheckboxItemState {
	static create(opts, checkboxGroup) {
		return new MenuCheckboxItemState(opts, new MenuItemState(opts, new MenuItemSharedState(opts, MenuContentContext.get())), checkboxGroup);
	}
	opts;
	item;
	group;
	constructor(opts, item, group = null) {
		this.opts = opts;
		this.item = item;
		this.group = group;
		if (this.group) {
			watch(() => this.group.opts.value.current, (groupValues) => {
				this.opts.checked.current = groupValues.includes(this.opts.value.current);
			});
			watch(() => this.opts.checked.current, (checked) => {
				if (checked) this.group.addValue(this.opts.value.current);
				else this.group.removeValue(this.opts.value.current);
			});
		}
	}
	toggleChecked() {
		if (this.opts.indeterminate.current) {
			this.opts.indeterminate.current = false;
			this.opts.checked.current = true;
		} else this.opts.checked.current = !this.opts.checked.current;
	}
	#snippetProps = derived(() => ({
		checked: this.opts.checked.current,
		indeterminate: this.opts.indeterminate.current
	}));
	get snippetProps() {
		return this.#snippetProps();
	}
	set snippetProps($$value) {
		return this.#snippetProps($$value);
	}
	#props = derived(() => ({
		...this.item.props,
		role: "menuitemcheckbox",
		"aria-checked": getAriaChecked(this.opts.checked.current, this.opts.indeterminate.current),
		"data-state": getCheckedState(this.opts.checked.current),
		[this.item.root.getBitsAttr("checkbox-item")]: ""
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var MenuSeparatorState = class MenuSeparatorState {
	static create(opts) {
		return new MenuSeparatorState(opts, MenuRootContext.get());
	}
	opts;
	root;
	attachment;
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(this.opts.ref);
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		role: "group",
		[this.root.getBitsAttr("separator")]: "",
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var ContextMenuTriggerState = class ContextMenuTriggerState {
	static create(opts) {
		return new ContextMenuTriggerState(opts, MenuMenuContext.get());
	}
	opts;
	parentMenu;
	attachment;
	#point = {
		x: 0,
		y: 0
	};
	virtualElement = simpleBox({ getBoundingClientRect: () => DOMRect.fromRect({
		width: 0,
		height: 0,
		...this.#point
	}) });
	#longPressTimer = null;
	constructor(opts, parentMenu) {
		this.opts = opts;
		this.parentMenu = parentMenu;
		this.attachment = attachRef(this.opts.ref, (v) => this.parentMenu.triggerNode = v);
		this.oncontextmenu = this.oncontextmenu.bind(this);
		this.onpointerdown = this.onpointerdown.bind(this);
		this.onpointermove = this.onpointermove.bind(this);
		this.onpointercancel = this.onpointercancel.bind(this);
		this.onpointerup = this.onpointerup.bind(this);
		watch(() => this.#point, (point) => {
			this.virtualElement.current = { getBoundingClientRect: () => DOMRect.fromRect({
				width: 0,
				height: 0,
				...point
			}) };
		});
		watch(() => this.opts.disabled.current, (isDisabled) => {
			if (isDisabled) this.#clearLongPressTimer();
		});
	}
	#clearLongPressTimer() {
		if (this.#longPressTimer === null) return;
		getWindow(this.opts.ref.current).clearTimeout(this.#longPressTimer);
	}
	#handleOpen(e) {
		this.#point = {
			x: e.clientX,
			y: e.clientY
		};
		this.parentMenu.onOpen();
	}
	oncontextmenu(e) {
		if (e.defaultPrevented || this.opts.disabled.current) return;
		this.#clearLongPressTimer();
		this.#handleOpen(e);
		e.preventDefault();
		this.parentMenu.contentNode?.focus();
	}
	onpointerdown(e) {
		if (this.opts.disabled.current || isMouseEvent(e)) return;
		this.#clearLongPressTimer();
		this.#longPressTimer = getWindow(this.opts.ref.current).setTimeout(() => this.#handleOpen(e), 700);
	}
	onpointermove(e) {
		if (this.opts.disabled.current || isMouseEvent(e)) return;
		this.#clearLongPressTimer();
	}
	onpointercancel(e) {
		if (this.opts.disabled.current || isMouseEvent(e)) return;
		this.#clearLongPressTimer();
	}
	onpointerup(e) {
		if (this.opts.disabled.current || isMouseEvent(e)) return;
		this.#clearLongPressTimer();
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		disabled: this.opts.disabled.current,
		"data-disabled": boolToEmptyStrOrUndef(this.opts.disabled.current),
		"data-state": getDataOpenClosed(this.parentMenu.opts.open.current),
		[CONTEXT_MENU_TRIGGER_ATTR]: "",
		tabindex: -1,
		onpointerdown: this.onpointerdown,
		onpointermove: this.onpointermove,
		onpointercancel: this.onpointercancel,
		onpointerup: this.onpointerup,
		oncontextmenu: this.oncontextmenu,
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var MenuSubmenuState = class {
	static create(opts) {
		const menu = MenuMenuContext.get();
		return MenuMenuContext.set(new MenuMenuState(opts, menu.root, menu));
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/dismissible-layer/use-dismissable-layer.svelte.js
globalThis.bitsDismissableLayers ??= /* @__PURE__ */ new Map();
var DismissibleLayerState = class DismissibleLayerState {
	static create(opts) {
		return new DismissibleLayerState(opts);
	}
	opts;
	#interactOutsideProp;
	#behaviorType;
	#interceptedEvents = { pointerdown: false };
	#isResponsibleLayer = false;
	#isFocusInsideDOMTree = false;
	#documentObj = void 0;
	#onFocusOutside;
	#unsubClickListener = noop;
	constructor(opts) {
		this.opts = opts;
		this.#behaviorType = opts.interactOutsideBehavior;
		this.#interactOutsideProp = opts.onInteractOutside;
		this.#onFocusOutside = opts.onFocusOutside;
		let unsubEvents = noop;
		const cleanup = () => {
			this.#resetState();
			globalThis.bitsDismissableLayers.delete(this);
			this.#handleInteractOutside.destroy();
			unsubEvents();
		};
		watch([() => this.opts.enabled.current, () => this.opts.ref.current], () => {
			if (!this.opts.enabled.current || !this.opts.ref.current) return;
			afterSleep(1, () => {
				if (!this.opts.ref.current) return;
				globalThis.bitsDismissableLayers.set(this, this.#behaviorType);
				unsubEvents();
				unsubEvents = this.#addEventListeners();
			});
			return cleanup;
		});
	}
	#handleFocus = (event) => {
		if (event.defaultPrevented) return;
		if (!this.opts.ref.current) return;
		afterTick(() => {
			if (!this.opts.ref.current || this.#isTargetWithinLayer(event.target)) return;
			if (event.target && !this.#isFocusInsideDOMTree) this.#onFocusOutside.current?.(event);
		});
	};
	#addEventListeners() {
		return executeCallbacks(
			/**
			* CAPTURE INTERACTION START
			* mark interaction-start event as intercepted.
			* mark responsible layer during interaction start
			* to avoid checking if is responsible layer during interaction end
			* when a new floating element may have been opened.
			*/
			on(this.#documentObj, "pointerdown", executeCallbacks(this.#markInterceptedEvent, this.#markResponsibleLayer), { capture: true }),
			/**
			* BUBBLE INTERACTION START
			* Mark interaction-start event as non-intercepted. Debounce `onInteractOutsideStart`
			* to avoid prematurely checking if other events were intercepted.
			*/
			on(this.#documentObj, "pointerdown", executeCallbacks(this.#markNonInterceptedEvent, this.#handleInteractOutside)),
			/**
			* HANDLE FOCUS OUTSIDE
			*/
			on(this.#documentObj, "focusin", this.#handleFocus)
		);
	}
	#handleDismiss = (e) => {
		let event = e;
		if (event.defaultPrevented) event = createWrappedEvent(e);
		this.#interactOutsideProp.current(e);
	};
	#handleInteractOutside = debounce((e) => {
		if (!this.opts.ref.current) {
			this.#unsubClickListener();
			return;
		}
		const isEventValid = this.opts.isValidEvent.current(e, this.opts.ref.current) || isValidEvent(e, this.opts.ref.current);
		if (!this.#isResponsibleLayer || this.#isAnyEventIntercepted() || !isEventValid) {
			this.#unsubClickListener();
			return;
		}
		let event = e;
		if (event.defaultPrevented) event = createWrappedEvent(event);
		if (this.#behaviorType.current !== "close" && this.#behaviorType.current !== "defer-otherwise-close") {
			this.#unsubClickListener();
			return;
		}
		if (e.pointerType === "touch") {
			this.#unsubClickListener();
			this.#unsubClickListener = on(this.#documentObj, "click", this.#handleDismiss, { once: true });
		} else this.#interactOutsideProp.current(event);
	}, 10);
	#markInterceptedEvent = (e) => {
		this.#interceptedEvents[e.type] = true;
	};
	#markNonInterceptedEvent = (e) => {
		this.#interceptedEvents[e.type] = false;
	};
	#markResponsibleLayer = () => {
		if (!this.opts.ref.current) return;
		this.#isResponsibleLayer = isResponsibleLayer(this.opts.ref.current);
	};
	#isTargetWithinLayer = (target) => {
		if (!this.opts.ref.current) return false;
		return isOrContainsTarget(this.opts.ref.current, target);
	};
	#resetState = debounce(() => {
		for (const eventType in this.#interceptedEvents) this.#interceptedEvents[eventType] = false;
		this.#isResponsibleLayer = false;
	}, 20);
	#isAnyEventIntercepted() {
		return Object.values(this.#interceptedEvents).some(Boolean);
	}
	#onfocuscapture = () => {
		this.#isFocusInsideDOMTree = true;
	};
	#onblurcapture = () => {
		this.#isFocusInsideDOMTree = false;
	};
	props = {
		onfocuscapture: this.#onfocuscapture,
		onblurcapture: this.#onblurcapture
	};
};
function getTopMostDismissableLayer(layersArr = [...globalThis.bitsDismissableLayers]) {
	return layersArr.findLast(([_, { current: behaviorType }]) => behaviorType === "close" || behaviorType === "ignore");
}
function isResponsibleLayer(node) {
	const layersArr = [...globalThis.bitsDismissableLayers];
	/**
	* We first check if we can find a top layer with `close` or `ignore`.
	* If that top layer was found and matches the provided node, then the node is
	* responsible for the outside interaction. Otherwise, we know that all layers defer so
	* the first layer is the responsible one.
	*/
	const topMostLayer = getTopMostDismissableLayer(layersArr);
	if (topMostLayer) return topMostLayer[0].opts.ref.current === node;
	const [firstLayerNode] = layersArr[0];
	return firstLayerNode.opts.ref.current === node;
}
function isValidEvent(e, node) {
	const target = e.target;
	if (!isElementOrSVGElement(target)) return false;
	const targetIsContextMenuTrigger = Boolean(target.closest(`[${CONTEXT_MENU_TRIGGER_ATTR}]`));
	const nodeIsContextMenu = Boolean(node.closest(`[${CONTEXT_MENU_CONTENT_ATTR}]`));
	if ("button" in e && e.button > 0 && !targetIsContextMenuTrigger) return false;
	if ("button" in e && e.button === 0 && targetIsContextMenuTrigger && nodeIsContextMenu) return true;
	if (targetIsContextMenuTrigger && nodeIsContextMenu) return false;
	return getOwnerDocument(target).documentElement.contains(target) && !isOrContainsTarget(node, target) && isClickTrulyOutside(e, node);
}
function createWrappedEvent(e) {
	const capturedCurrentTarget = e.currentTarget;
	const capturedTarget = e.target;
	let newEvent;
	if (e instanceof PointerEvent) newEvent = new PointerEvent(e.type, e);
	else newEvent = new PointerEvent("pointerdown", e);
	let isPrevented = false;
	return new Proxy(newEvent, { get: (target, prop) => {
		if (prop === "currentTarget") return capturedCurrentTarget;
		if (prop === "target") return capturedTarget;
		if (prop === "preventDefault") return () => {
			isPrevented = true;
			if (typeof target.preventDefault === "function") target.preventDefault();
		};
		if (prop === "defaultPrevented") return isPrevented;
		if (prop in target) return target[prop];
		return e[prop];
	} });
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/dismissible-layer/dismissible-layer.svelte
function Dismissible_layer($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { interactOutsideBehavior = "close", onInteractOutside = noop, onFocusOutside = noop, id, children, enabled, isValidEvent = () => false, ref } = $$props;
		const dismissibleLayerState = DismissibleLayerState.create({
			id: boxWith(() => id),
			interactOutsideBehavior: boxWith(() => interactOutsideBehavior),
			onInteractOutside: boxWith(() => onInteractOutside),
			enabled: boxWith(() => enabled),
			onFocusOutside: boxWith(() => onFocusOutside),
			isValidEvent: boxWith(() => isValidEvent),
			ref
		});
		children?.($$renderer, { props: dismissibleLayerState.props });
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/escape-layer/use-escape-layer.svelte.js
globalThis.bitsEscapeLayers ??= /* @__PURE__ */ new Map();
var EscapeLayerState = class EscapeLayerState {
	static create(opts) {
		return new EscapeLayerState(opts);
	}
	opts;
	domContext;
	constructor(opts) {
		this.opts = opts;
		this.domContext = new DOMContext(this.opts.ref);
		let unsubEvents = noop;
		watch(() => opts.enabled.current, (enabled) => {
			if (enabled) {
				globalThis.bitsEscapeLayers.set(this, opts.escapeKeydownBehavior);
				unsubEvents = this.#addEventListener();
			}
			return () => {
				unsubEvents();
				globalThis.bitsEscapeLayers.delete(this);
			};
		});
	}
	#addEventListener = () => {
		return on(this.domContext.getDocument(), "keydown", this.#onkeydown, { passive: false });
	};
	#onkeydown = (e) => {
		if (e.key !== "Escape" || !isResponsibleEscapeLayer(this)) return;
		const clonedEvent = new KeyboardEvent(e.type, e);
		e.preventDefault();
		const behaviorType = this.opts.escapeKeydownBehavior.current;
		if (behaviorType !== "close" && behaviorType !== "defer-otherwise-close") return;
		this.opts.onEscapeKeydown.current(clonedEvent);
	};
};
function isResponsibleEscapeLayer(instance) {
	const layersArr = [...globalThis.bitsEscapeLayers];
	/**
	* We first check if we can find a top layer with `close` or `ignore`.
	* If that top layer was found and matches the provided node, then the node is
	* responsible for the escape. Otherwise, we know that all layers defer so
	* the first layer is the responsible one.
	*/
	const topMostLayer = layersArr.findLast(([_, { current: behaviorType }]) => behaviorType === "close" || behaviorType === "ignore");
	if (topMostLayer) return topMostLayer[0] === instance;
	const [firstLayerNode] = layersArr[0];
	return firstLayerNode === instance;
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/escape-layer/escape-layer.svelte
function Escape_layer($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { escapeKeydownBehavior = "close", onEscapeKeydown = noop, children, enabled, ref } = $$props;
		EscapeLayerState.create({
			escapeKeydownBehavior: boxWith(() => escapeKeydownBehavior),
			onEscapeKeydown: boxWith(() => onEscapeKeydown),
			enabled: boxWith(() => enabled),
			ref
		});
		children?.($$renderer);
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/focus-scope/focus-scope-manager.js
var FocusScopeManager = class FocusScopeManager {
	static instance;
	#scopeStack = simpleBox([]);
	#focusHistory = /* @__PURE__ */ new WeakMap();
	#preFocusHistory = /* @__PURE__ */ new WeakMap();
	static getInstance() {
		if (!this.instance) this.instance = new FocusScopeManager();
		return this.instance;
	}
	register(scope) {
		const current = this.getActive();
		if (current && current !== scope) current.pause();
		const activeElement = document.activeElement;
		if (activeElement && activeElement !== document.body) this.#preFocusHistory.set(scope, activeElement);
		this.#scopeStack.current = this.#scopeStack.current.filter((s) => s !== scope);
		this.#scopeStack.current.unshift(scope);
	}
	unregister(scope) {
		this.#scopeStack.current = this.#scopeStack.current.filter((s) => s !== scope);
		const next = this.getActive();
		if (next) next.resume();
	}
	getActive() {
		return this.#scopeStack.current[0];
	}
	setFocusMemory(scope, element) {
		this.#focusHistory.set(scope, element);
	}
	getFocusMemory(scope) {
		return this.#focusHistory.get(scope);
	}
	isActiveScope(scope) {
		return this.getActive() === scope;
	}
	setPreFocusMemory(scope, element) {
		this.#preFocusHistory.set(scope, element);
	}
	getPreFocusMemory(scope) {
		return this.#preFocusHistory.get(scope);
	}
	clearPreFocusMemory(scope) {
		this.#preFocusHistory.delete(scope);
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/focus-scope/focus-scope.svelte.js
var FocusScope = class FocusScope {
	#paused = false;
	#container = null;
	#manager = FocusScopeManager.getInstance();
	#cleanupFns = [];
	#opts;
	constructor(opts) {
		this.#opts = opts;
	}
	get paused() {
		return this.#paused;
	}
	pause() {
		this.#paused = true;
	}
	resume() {
		this.#paused = false;
	}
	#cleanup() {
		for (const fn of this.#cleanupFns) fn();
		this.#cleanupFns = [];
	}
	mount(container) {
		if (this.#container) this.unmount();
		this.#container = container;
		this.#manager.register(this);
		this.#setupEventListeners();
		this.#handleOpenAutoFocus();
	}
	unmount() {
		if (!this.#container) return;
		this.#cleanup();
		this.#handleCloseAutoFocus();
		this.#manager.unregister(this);
		this.#manager.clearPreFocusMemory(this);
		this.#container = null;
	}
	#handleOpenAutoFocus() {
		if (!this.#container) return;
		const event = new CustomEvent("focusScope.onOpenAutoFocus", {
			bubbles: false,
			cancelable: true
		});
		this.#opts.onOpenAutoFocus.current(event);
		if (!event.defaultPrevented) requestAnimationFrame(() => {
			if (!this.#container) return;
			const firstTabbable = this.#getFirstTabbable();
			if (firstTabbable) {
				firstTabbable.focus();
				this.#manager.setFocusMemory(this, firstTabbable);
			} else this.#container.focus();
		});
	}
	#handleCloseAutoFocus() {
		const event = new CustomEvent("focusScope.onCloseAutoFocus", {
			bubbles: false,
			cancelable: true
		});
		this.#opts.onCloseAutoFocus.current?.(event);
		if (!event.defaultPrevented) {
			const preFocusedElement = this.#manager.getPreFocusMemory(this);
			if (preFocusedElement && document.contains(preFocusedElement)) try {
				preFocusedElement.focus();
			} catch {
				document.body.focus();
			}
		}
	}
	#setupEventListeners() {
		if (!this.#container || !this.#opts.trap.current) return;
		const container = this.#container;
		const doc = container.ownerDocument;
		const handleFocus = (e) => {
			if (this.#paused || !this.#manager.isActiveScope(this)) return;
			const target = e.target;
			if (!target) return;
			if (container.contains(target)) this.#manager.setFocusMemory(this, target);
			else {
				const lastFocused = this.#manager.getFocusMemory(this);
				if (lastFocused && container.contains(lastFocused) && isFocusable(lastFocused)) {
					e.preventDefault();
					lastFocused.focus();
				} else {
					const firstTabbable = this.#getFirstTabbable();
					const firstFocusable = this.#getAllFocusables()[0];
					(firstTabbable || firstFocusable || container).focus();
				}
			}
		};
		const handleKeydown = (e) => {
			if (!this.#opts.loop || this.#paused || e.key !== "Tab") return;
			if (!this.#manager.isActiveScope(this)) return;
			const tabbables = this.#getTabbables();
			if (tabbables.length === 0) return;
			const first = tabbables[0];
			const last = tabbables[tabbables.length - 1];
			if (!e.shiftKey && doc.activeElement === last) {
				e.preventDefault();
				first.focus();
			} else if (e.shiftKey && doc.activeElement === first) {
				e.preventDefault();
				last.focus();
			}
		};
		this.#cleanupFns.push(on(doc, "focusin", handleFocus, { capture: true }), on(container, "keydown", handleKeydown));
		const observer = new MutationObserver(() => {
			const lastFocused = this.#manager.getFocusMemory(this);
			if (lastFocused && !container.contains(lastFocused)) {
				const firstTabbable = this.#getFirstTabbable();
				const firstFocusable = this.#getAllFocusables()[0];
				const elementToFocus = firstTabbable || firstFocusable;
				if (elementToFocus) {
					elementToFocus.focus();
					this.#manager.setFocusMemory(this, elementToFocus);
				} else container.focus();
			}
		});
		observer.observe(container, {
			childList: true,
			subtree: true
		});
		this.#cleanupFns.push(() => observer.disconnect());
	}
	#getTabbables() {
		if (!this.#container) return [];
		return tabbable(this.#container, {
			includeContainer: false,
			getShadowRoot: true
		});
	}
	#getFirstTabbable() {
		return this.#getTabbables()[0] || null;
	}
	#getAllFocusables() {
		if (!this.#container) return [];
		return focusable(this.#container, {
			includeContainer: false,
			getShadowRoot: true
		});
	}
	static use(opts) {
		let scope = null;
		watch([() => opts.ref.current, () => opts.enabled.current], ([ref, enabled]) => {
			if (ref && enabled) {
				if (!scope) scope = new FocusScope(opts);
				scope.mount(ref);
			} else if (scope) {
				scope.unmount();
				scope = null;
			}
		});
		return { get props() {
			return { tabindex: -1 };
		} };
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/focus-scope/focus-scope.svelte
function Focus_scope($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { enabled = false, trapFocus = false, loop = false, onCloseAutoFocus = noop, onOpenAutoFocus = noop, focusScope, ref } = $$props;
		const focusScopeState = FocusScope.use({
			enabled: boxWith(() => enabled),
			trap: boxWith(() => trapFocus),
			loop,
			onCloseAutoFocus: boxWith(() => onCloseAutoFocus),
			onOpenAutoFocus: boxWith(() => onOpenAutoFocus),
			ref
		});
		focusScope?.($$renderer, { props: focusScopeState.props });
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/text-selection-layer/use-text-selection-layer.svelte.js
var noopPointer = () => {};
globalThis.bitsTextSelectionLayers ??= /* @__PURE__ */ new Map();
var TextSelectionLayerState = class TextSelectionLayerState {
	static create(opts) {
		return new TextSelectionLayerState(opts);
	}
	opts;
	domContext;
	#unsubSelectionLock = noop;
	#enabledSnapshot = false;
	#onPointerDownSnapshot = noopPointer;
	#onPointerUpSnapshot = noopPointer;
	constructor(opts) {
		this.opts = opts;
		this.domContext = new DOMContext(opts.ref);
		let unsubEvents = noop;
		watch(() => [
			this.opts.enabled.current,
			this.opts.onPointerDown.current,
			this.opts.onPointerUp.current
		], ([enabled, onPointerDown, onPointerUp]) => {
			this.#enabledSnapshot = enabled;
			this.#onPointerDownSnapshot = onPointerDown;
			this.#onPointerUpSnapshot = onPointerUp;
			if (enabled) {
				globalThis.bitsTextSelectionLayers.set(this, this.opts.enabled);
				unsubEvents();
				unsubEvents = this.#addEventListeners();
			}
			return () => {
				this.#enabledSnapshot = false;
				unsubEvents();
				this.#resetSelectionLock();
				globalThis.bitsTextSelectionLayers.delete(this);
			};
		});
	}
	#addEventListeners() {
		return executeCallbacks(on(this.domContext.getDocument(), "pointerdown", this.#pointerdown), on(this.domContext.getDocument(), "pointerup", composeHandlers(this.#resetSelectionLock, this.#pointerupUserHandler)));
	}
	#pointerupUserHandler = (e) => {
		this.#onPointerUpSnapshot(e);
	};
	#pointerdown = (e) => {
		const node = this.opts.ref.current;
		const target = e.target;
		if (!isHTMLElement(node) || !isHTMLElement(target) || !this.#enabledSnapshot) return;
		/**
		* We only lock user-selection overflow if layer is the top most layer and
		* pointerdown occurred inside the node. You are still allowed to select text
		* outside the node provided pointerdown occurs outside the node.
		*/
		if (!isHighestLayer(this) || !contains(node, target)) return;
		this.#onPointerDownSnapshot(e);
		if (e.defaultPrevented) return;
		this.#unsubSelectionLock = preventTextSelectionOverflow(node, this.domContext.getDocument().body);
	};
	#resetSelectionLock = () => {
		this.#unsubSelectionLock();
		this.#unsubSelectionLock = noop;
	};
};
var getUserSelect = (node) => node.style.userSelect || node.style.webkitUserSelect;
function preventTextSelectionOverflow(node, body) {
	const originalBodyUserSelect = getUserSelect(body);
	const originalNodeUserSelect = getUserSelect(node);
	setUserSelect(body, "none");
	setUserSelect(node, "text");
	return () => {
		setUserSelect(body, originalBodyUserSelect);
		setUserSelect(node, originalNodeUserSelect);
	};
}
function setUserSelect(node, value) {
	node.style.userSelect = value;
	node.style.webkitUserSelect = value;
}
function isHighestLayer(instance) {
	const layersArr = [...globalThis.bitsTextSelectionLayers];
	if (!layersArr.length) return false;
	const highestLayer = layersArr.at(-1);
	if (!highestLayer) return false;
	return highestLayer[0] === instance;
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/text-selection-layer/text-selection-layer.svelte
function Text_selection_layer($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { preventOverflowTextSelection = true, onPointerDown = noop, onPointerUp = noop, id, children, enabled, ref } = $$props;
		TextSelectionLayerState.create({
			id: boxWith(() => id),
			onPointerDown: boxWith(() => onPointerDown),
			onPointerUp: boxWith(() => onPointerUp),
			enabled: boxWith(() => enabled && preventOverflowTextSelection),
			ref
		});
		children?.($$renderer);
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/internal/use-id.js
globalThis.bitsIdCounter ??= { current: 0 };
/**
* Generates a unique ID based on a global counter.
*/
function useId(prefix = "bits") {
	globalThis.bitsIdCounter.current++;
	return `${prefix}-${globalThis.bitsIdCounter.current}`;
}
//#endregion
//#region node_modules/bits-ui/dist/internal/shared-state.svelte.js
var SharedState = class {
	#factory;
	#subscribers = 0;
	#state;
	#scope;
	constructor(factory) {
		this.#factory = factory;
	}
	#dispose() {
		this.#subscribers -= 1;
		if (this.#scope && this.#subscribers <= 0) {
			this.#scope();
			this.#state = void 0;
			this.#scope = void 0;
		}
	}
	get(...args) {
		this.#subscribers += 1;
		if (this.#state === void 0) this.#scope = () => {};
		return this.#state;
	}
};
//#endregion
//#region node_modules/bits-ui/dist/internal/body-scroll-lock.svelte.js
var lockMap = new SvelteMap();
var initialBodyStyle = null;
var cleanupTimeoutId = null;
var isInCleanupTransition = false;
var anyLocked = boxWith(() => {
	for (const value of lockMap.values()) if (value) return true;
	return false;
});
/**
* We track the time we scheduled the cleanup to prevent race conditions
* when multiple locks are created/destroyed in the same tick, ensuring
* only the last one to schedule the cleanup will run.
*
* reference: https://github.com/huntabyte/bits-ui/issues/1639
*/
var cleanupScheduledAt = null;
var bodyLockStackCount = new SharedState(() => {
	function resetBodyStyle() {}
	function cancelPendingCleanup() {
		if (cleanupTimeoutId === null) return;
		window.clearTimeout(cleanupTimeoutId);
		cleanupTimeoutId = null;
	}
	function scheduleCleanupIfNoNewLocks(delay, callback) {
		cancelPendingCleanup();
		isInCleanupTransition = true;
		cleanupScheduledAt = Date.now();
		const currentCleanupId = cleanupScheduledAt;
		/**
		* We schedule the cleanup to run after a delay to allow new locks to register
		* that might have been added in the same tick as the current cleanup.
		*
		* If a new lock is added in the same tick, the cleanup will be cancelled and
		* a new cleanup will be scheduled.
		*
		* This is to prevent the cleanup from running too early and resetting the body
		* style before the new lock has had a chance to apply its styles.
		*/
		const cleanupFn = () => {
			cleanupTimeoutId = null;
			if (cleanupScheduledAt !== currentCleanupId) return;
			if (!isAnyLocked(lockMap)) {
				isInCleanupTransition = false;
				callback();
			} else isInCleanupTransition = false;
		};
		const actualDelay = delay === null ? 24 : delay;
		cleanupTimeoutId = window.setTimeout(cleanupFn, actualDelay);
	}
	function ensureInitialStyleCaptured() {
		if (initialBodyStyle === null && lockMap.size === 0 && !isInCleanupTransition) initialBodyStyle = document.body.getAttribute("style");
	}
	watch(() => anyLocked.current, () => {
		if (!anyLocked.current) return;
		ensureInitialStyleCaptured();
		isInCleanupTransition = false;
		const htmlStyle = getComputedStyle(document.documentElement);
		const bodyStyle = getComputedStyle(document.body);
		const hasStableGutter = htmlStyle.scrollbarGutter?.includes("stable") || bodyStyle.scrollbarGutter?.includes("stable");
		const verticalScrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
		const config = {
			padding: Number.parseInt(bodyStyle.paddingRight ?? "0", 10) + verticalScrollbarWidth,
			margin: Number.parseInt(bodyStyle.marginRight ?? "0", 10)
		};
		if (verticalScrollbarWidth > 0 && !hasStableGutter) {
			document.body.style.paddingRight = `${config.padding}px`;
			document.body.style.marginRight = `${config.margin}px`;
			document.body.style.setProperty("--scrollbar-width", `${verticalScrollbarWidth}px`);
		}
		document.body.style.overflow = "hidden";
		if (isIOS) on(document, "touchmove", (e) => {
			if (e.target !== document.documentElement) return;
			if (e.touches.length > 1) return;
			e.preventDefault();
		}, { passive: false });
		/**
		* We ensure pointer-events: none is applied _after_ DOM updates, so that any focus/
		* interaction changes from opening overlays/menus complete _before_ we block pointer
		* events.
		*
		* this avoids race conditions where pointer-events could be set too early and break
		* focus/interaction.
		*/
		afterTick(() => {
			document.body.style.pointerEvents = "none";
			document.body.style.overflow = "hidden";
		});
	});
	return {
		get lockMap() {
			return lockMap;
		},
		resetBodyStyle,
		scheduleCleanupIfNoNewLocks,
		cancelPendingCleanup,
		ensureInitialStyleCaptured
	};
});
var BodyScrollLock = class {
	#id = useId();
	#initialState;
	#restoreScrollDelay = () => null;
	#countState;
	locked;
	constructor(initialState, restoreScrollDelay = () => null) {
		this.#initialState = initialState;
		this.#restoreScrollDelay = restoreScrollDelay;
		this.#countState = bodyLockStackCount.get();
		if (!this.#countState) return;
		/**
		* Since a new lock is being created, we cancel any pending cleanup to
		* prevent the cleanup from running too early and resetting the body style
		* before the new lock has had a chance to apply its styles.
		*
		* reference: https://github.com/huntabyte/bits-ui/issues/1639
		*/
		this.#countState.cancelPendingCleanup();
		this.#countState.ensureInitialStyleCaptured();
		this.#countState.lockMap.set(this.#id, this.#initialState ?? false);
		this.locked = boxWith(() => this.#countState.lockMap.get(this.#id) ?? false, (v) => this.#countState.lockMap.set(this.#id, v));
	}
};
function isAnyLocked(map) {
	for (const [_, value] of map) if (value) return true;
	return false;
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/scroll-lock/scroll-lock.svelte
function Scroll_lock($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { preventScroll = true, restoreScrollDelay = null } = $$props;
		if (preventScroll) new BodyScrollLock(preventScroll, () => restoreScrollDelay);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/dialog/components/dialog-overlay.svelte
function Dialog_overlay$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), forceMount = false, child, children, ref = null, $$slots, $$events, ...restProps } = $$props;
		const overlayState = DialogOverlayState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, overlayState.props));
		if (overlayState.shouldRender || forceMount) {
			$$renderer.push("<!--[0-->");
			if (child) {
				$$renderer.push("<!--[0-->");
				child($$renderer, {
					props: mergeProps(mergedProps()),
					...overlayState.snippetProps
				});
				$$renderer.push(`<!---->`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<div${attributes({ ...mergeProps(mergedProps()) })}>`);
				children?.($$renderer, overlayState.snippetProps);
				$$renderer.push(`<!----></div>`);
			}
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/dialog/components/dialog-description.svelte
function Dialog_description$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), children, child, ref = null, $$slots, $$events, ...restProps } = $$props;
		const descriptionState = DialogDescriptionState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, descriptionState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/hidden-input.svelte
function Hidden_input($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value = void 0, $$slots, $$events, ...restProps } = $$props;
		const mergedProps = derived(() => mergeProps(restProps, {
			"aria-hidden": "true",
			tabindex: -1,
			style: {
				...srOnlyStyles,
				position: "absolute",
				top: "0",
				left: "0"
			}
		}));
		if (mergedProps().type === "checkbox") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<input${attributes({
				...mergedProps(),
				value
			}, void 0, void 0, void 0, 4)}/>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<input${attributes({
				value,
				...mergedProps()
			}, void 0, void 0, void 0, 4)}/>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { value });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/internal/floating-svelte/floating-utils.svelte.js
function get(valueOrGetValue) {
	return typeof valueOrGetValue === "function" ? valueOrGetValue() : valueOrGetValue;
}
function getDPR(element) {
	if (typeof window === "undefined") return 1;
	return (element.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function roundByDPR(element, value) {
	const dpr = getDPR(element);
	return Math.round(value * dpr) / dpr;
}
function getFloatingContentCSSVars(name) {
	return {
		[`--bits-${name}-content-transform-origin`]: `var(--bits-floating-transform-origin)`,
		[`--bits-${name}-content-available-width`]: `var(--bits-floating-available-width)`,
		[`--bits-${name}-content-available-height`]: `var(--bits-floating-available-height)`,
		[`--bits-${name}-anchor-width`]: `var(--bits-floating-anchor-width)`,
		[`--bits-${name}-anchor-height`]: `var(--bits-floating-anchor-height)`
	};
}
//#endregion
//#region node_modules/bits-ui/dist/internal/floating-svelte/use-floating.svelte.js
function useFloating(options) {
	options.whileElementsMounted;
	const openOption = derived(() => get(options.open) ?? true);
	const middlewareOption = derived(() => get(options.middleware));
	const transformOption = derived(() => get(options.transform) ?? true);
	const placementOption = derived(() => get(options.placement) ?? "bottom");
	const strategyOption = derived(() => get(options.strategy) ?? "absolute");
	const sideOffsetOption = derived(() => get(options.sideOffset) ?? 0);
	const alignOffsetOption = derived(() => get(options.alignOffset) ?? 0);
	const reference = options.reference;
	/** State */
	let x = 0;
	let y = 0;
	const floating = simpleBox(null);
	let strategy = strategyOption();
	let placement = placementOption();
	let middlewareData = {};
	let isPositioned = false;
	let updateRequestId = 0;
	const floatingStyles = derived(() => {
		const xVal = floating.current ? roundByDPR(floating.current, x) : x;
		const yVal = floating.current ? roundByDPR(floating.current, y) : y;
		if (transformOption()) return {
			position: strategy,
			left: "0",
			top: "0",
			transform: `translate(${xVal}px, ${yVal}px)`,
			...floating.current && getDPR(floating.current) >= 1.5 && { willChange: "transform" }
		};
		return {
			position: strategy,
			left: `${xVal}px`,
			top: `${yVal}px`
		};
	});
	function update() {
		if (reference.current === null || floating.current === null) return;
		const referenceNode = reference.current;
		const floatingNode = floating.current;
		const requestId = ++updateRequestId;
		computePosition(referenceNode, floatingNode, {
			middleware: middlewareOption(),
			placement: placementOption(),
			strategy: strategyOption()
		}).then((position) => {
			if (requestId !== updateRequestId) return;
			if (reference.current !== referenceNode || floating.current !== floatingNode) return;
			if (isReferenceHidden(referenceNode)) {
				middlewareData = {
					...middlewareData,
					hide: {
						...middlewareData.hide,
						referenceHidden: true
					}
				};
				return;
			}
			if (!openOption() && x !== 0 && y !== 0) {
				const maxExpectedOffset = Math.max(Math.abs(sideOffsetOption()), Math.abs(alignOffsetOption()), 15);
				if (position.x <= maxExpectedOffset && position.y <= maxExpectedOffset) return;
			}
			x = position.x;
			y = position.y;
			strategy = position.strategy;
			placement = position.placement;
			middlewareData = position.middlewareData;
			isPositioned = true;
		});
	}
	return {
		floating,
		reference,
		get strategy() {
			return strategy;
		},
		get placement() {
			return placement;
		},
		get middlewareData() {
			return middlewareData;
		},
		get isPositioned() {
			return isPositioned;
		},
		get floatingStyles() {
			return floatingStyles();
		},
		get update() {
			return update;
		}
	};
}
function isReferenceHidden(node) {
	if (!(node instanceof Element)) return false;
	if (!node.isConnected) return true;
	if (node instanceof HTMLElement && node.hidden) return true;
	return node.getClientRects().length === 0;
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/floating-layer/use-floating-layer.svelte.js
var OPPOSITE_SIDE = {
	top: "bottom",
	right: "left",
	bottom: "top",
	left: "right"
};
var FloatingRootContext = new Context("Floating.Root");
var FloatingContentContext = new Context("Floating.Content");
var FloatingTooltipRootContext = new Context("Floating.Root");
var FloatingRootState = class FloatingRootState {
	static create(tooltip = false) {
		return tooltip ? FloatingTooltipRootContext.set(new FloatingRootState()) : FloatingRootContext.set(new FloatingRootState());
	}
	anchorNode = simpleBox(null);
	customAnchorNode = simpleBox(null);
	triggerNode = simpleBox(null);
	constructor() {}
};
var FloatingContentState = class FloatingContentState {
	static create(opts, tooltip = false) {
		return tooltip ? FloatingContentContext.set(new FloatingContentState(opts, FloatingTooltipRootContext.get())) : FloatingContentContext.set(new FloatingContentState(opts, FloatingRootContext.get()));
	}
	opts;
	root;
	contentRef = simpleBox(null);
	wrapperRef = simpleBox(null);
	arrowRef = simpleBox(null);
	contentAttachment = attachRef(this.contentRef);
	wrapperAttachment = attachRef(this.wrapperRef);
	arrowAttachment = attachRef(this.arrowRef);
	arrowId = simpleBox(useId());
	#transformedStyle = derived(() => {
		if (typeof this.opts.style === "string") return cssToStyleObj(this.opts.style);
		if (!this.opts.style) return {};
	});
	#updatePositionStrategy = void 0;
	#arrowSize = new ElementSize(() => this.arrowRef.current ?? void 0);
	#arrowWidth = derived(() => this.#arrowSize?.width ?? 0);
	#arrowHeight = derived(() => this.#arrowSize?.height ?? 0);
	#desiredPlacement = derived(() => this.opts.side?.current + (this.opts.align.current !== "center" ? `-${this.opts.align.current}` : ""));
	#boundary = derived(() => Array.isArray(this.opts.collisionBoundary.current) ? this.opts.collisionBoundary.current : [this.opts.collisionBoundary.current]);
	#hasExplicitBoundaries = derived(() => this.#boundary().length > 0);
	get hasExplicitBoundaries() {
		return this.#hasExplicitBoundaries();
	}
	set hasExplicitBoundaries($$value) {
		return this.#hasExplicitBoundaries($$value);
	}
	#detectOverflowOptions = derived(() => ({
		padding: this.opts.collisionPadding.current,
		boundary: this.#boundary().filter(isNotNull),
		altBoundary: this.hasExplicitBoundaries
	}));
	get detectOverflowOptions() {
		return this.#detectOverflowOptions();
	}
	set detectOverflowOptions($$value) {
		return this.#detectOverflowOptions($$value);
	}
	#availableWidth = void 0;
	#availableHeight = void 0;
	#anchorWidth = void 0;
	#anchorHeight = void 0;
	#middleware = derived(() => [
		offset({
			mainAxis: this.opts.sideOffset.current + this.#arrowHeight(),
			alignmentAxis: this.opts.alignOffset.current
		}),
		this.opts.avoidCollisions.current && shift({
			mainAxis: true,
			crossAxis: false,
			limiter: this.opts.sticky.current === "partial" ? limitShift() : void 0,
			...this.detectOverflowOptions
		}),
		this.opts.avoidCollisions.current && flip({ ...this.detectOverflowOptions }),
		size({
			...this.detectOverflowOptions,
			apply: ({ rects, availableWidth, availableHeight }) => {
				const { width: anchorWidth, height: anchorHeight } = rects.reference;
				this.#availableWidth = availableWidth;
				this.#availableHeight = availableHeight;
				this.#anchorWidth = anchorWidth;
				this.#anchorHeight = anchorHeight;
			}
		}),
		this.arrowRef.current && arrow({
			element: this.arrowRef.current,
			padding: this.opts.arrowPadding.current
		}),
		transformOrigin({
			arrowWidth: this.#arrowWidth(),
			arrowHeight: this.#arrowHeight()
		}),
		this.opts.hideWhenDetached.current && hide({
			strategy: "referenceHidden",
			...this.detectOverflowOptions
		})
	].filter(Boolean));
	get middleware() {
		return this.#middleware();
	}
	set middleware($$value) {
		return this.#middleware($$value);
	}
	floating;
	#placedSide = derived(() => getSideFromPlacement(this.floating.placement));
	get placedSide() {
		return this.#placedSide();
	}
	set placedSide($$value) {
		return this.#placedSide($$value);
	}
	#placedAlign = derived(() => getAlignFromPlacement(this.floating.placement));
	get placedAlign() {
		return this.#placedAlign();
	}
	set placedAlign($$value) {
		return this.#placedAlign($$value);
	}
	#arrowX = derived(() => this.floating.middlewareData.arrow?.x ?? 0);
	get arrowX() {
		return this.#arrowX();
	}
	set arrowX($$value) {
		return this.#arrowX($$value);
	}
	#arrowY = derived(() => this.floating.middlewareData.arrow?.y ?? 0);
	get arrowY() {
		return this.#arrowY();
	}
	set arrowY($$value) {
		return this.#arrowY($$value);
	}
	#cannotCenterArrow = derived(() => this.floating.middlewareData.arrow?.centerOffset !== 0);
	get cannotCenterArrow() {
		return this.#cannotCenterArrow();
	}
	set cannotCenterArrow($$value) {
		return this.#cannotCenterArrow($$value);
	}
	contentZIndex;
	#arrowBaseSide = derived(() => OPPOSITE_SIDE[this.placedSide]);
	get arrowBaseSide() {
		return this.#arrowBaseSide();
	}
	set arrowBaseSide($$value) {
		return this.#arrowBaseSide($$value);
	}
	#wrapperProps = derived(() => ({
		id: this.opts.wrapperId.current,
		"data-bits-floating-content-wrapper": "",
		style: {
			...this.floating.floatingStyles,
			transform: this.floating.isPositioned ? this.floating.floatingStyles.transform : "translate(0, -200%)",
			minWidth: "max-content",
			zIndex: this.contentZIndex,
			"--bits-floating-transform-origin": `${this.floating.middlewareData.transformOrigin?.x} ${this.floating.middlewareData.transformOrigin?.y}`,
			"--bits-floating-available-width": `${this.#availableWidth}px`,
			"--bits-floating-available-height": `${this.#availableHeight}px`,
			"--bits-floating-anchor-width": `${this.#anchorWidth}px`,
			"--bits-floating-anchor-height": `${this.#anchorHeight}px`,
			...this.floating.middlewareData.hide?.referenceHidden && {
				visibility: "hidden",
				"pointer-events": "none"
			},
			...this.#transformedStyle()
		},
		dir: this.opts.dir.current,
		...this.wrapperAttachment
	}));
	get wrapperProps() {
		return this.#wrapperProps();
	}
	set wrapperProps($$value) {
		return this.#wrapperProps($$value);
	}
	#props = derived(() => ({
		"data-side": this.placedSide,
		"data-align": this.placedAlign,
		style: styleToString({ ...this.#transformedStyle() }),
		...this.contentAttachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
	#arrowStyle = derived(() => ({
		position: "absolute",
		left: this.arrowX ? `${this.arrowX}px` : void 0,
		top: this.arrowY ? `${this.arrowY}px` : void 0,
		[this.arrowBaseSide]: 0,
		"transform-origin": {
			top: "",
			right: "0 0",
			bottom: "center 0",
			left: "100% 0"
		}[this.placedSide],
		transform: {
			top: "translateY(100%)",
			right: "translateY(50%) rotate(90deg) translateX(-50%)",
			bottom: "rotate(180deg)",
			left: "translateY(50%) rotate(-90deg) translateX(50%)"
		}[this.placedSide],
		visibility: this.cannotCenterArrow ? "hidden" : void 0
	}));
	get arrowStyle() {
		return this.#arrowStyle();
	}
	set arrowStyle($$value) {
		return this.#arrowStyle($$value);
	}
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.#updatePositionStrategy = opts.updatePositionStrategy;
		if (opts.customAnchor) this.root.customAnchorNode.current = opts.customAnchor.current;
		watch(() => opts.customAnchor.current, (customAnchor) => {
			this.root.customAnchorNode.current = customAnchor;
		});
		this.floating = useFloating({
			strategy: () => this.opts.strategy.current,
			placement: () => this.#desiredPlacement(),
			middleware: () => this.middleware,
			reference: this.root.anchorNode,
			whileElementsMounted: (...args) => {
				return autoUpdate(...args, { animationFrame: this.#updatePositionStrategy?.current === "always" });
			},
			open: () => this.opts.enabled.current,
			sideOffset: () => this.opts.sideOffset.current,
			alignOffset: () => this.opts.alignOffset.current
		});
		watch(() => this.contentRef.current, (contentNode) => {
			if (!contentNode || !this.opts.enabled.current) return;
			const win = getWindow(contentNode);
			const rafId = win.requestAnimationFrame(() => {
				if (this.contentRef.current !== contentNode || !this.opts.enabled.current) return;
				const zIndex = win.getComputedStyle(contentNode).zIndex;
				if (zIndex !== this.contentZIndex) this.contentZIndex = zIndex;
			});
			return () => {
				win.cancelAnimationFrame(rafId);
			};
		});
	}
};
var FloatingAnchorState = class FloatingAnchorState {
	static create(opts, tooltip = false) {
		return tooltip ? new FloatingAnchorState(opts, FloatingTooltipRootContext.get()) : new FloatingAnchorState(opts, FloatingRootContext.get());
	}
	opts;
	root;
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		if (opts.virtualEl && opts.virtualEl.current) root.triggerNode = boxFrom(opts.virtualEl.current);
		else root.triggerNode = opts.ref;
	}
};
function transformOrigin(options) {
	return {
		name: "transformOrigin",
		options,
		fn(data) {
			const { placement, rects, middlewareData } = data;
			const isArrowHidden = middlewareData.arrow?.centerOffset !== 0;
			const arrowWidth = isArrowHidden ? 0 : options.arrowWidth;
			const arrowHeight = isArrowHidden ? 0 : options.arrowHeight;
			const [placedSide, placedAlign] = getSideAndAlignFromPlacement(placement);
			const noArrowAlign = {
				start: "0%",
				center: "50%",
				end: "100%"
			}[placedAlign];
			const arrowXCenter = (middlewareData.arrow?.x ?? 0) + arrowWidth / 2;
			const arrowYCenter = (middlewareData.arrow?.y ?? 0) + arrowHeight / 2;
			let x = "";
			let y = "";
			if (placedSide === "bottom") {
				x = isArrowHidden ? noArrowAlign : `${arrowXCenter}px`;
				y = `${-arrowHeight}px`;
			} else if (placedSide === "top") {
				x = isArrowHidden ? noArrowAlign : `${arrowXCenter}px`;
				y = `${rects.floating.height + arrowHeight}px`;
			} else if (placedSide === "right") {
				x = `${-arrowHeight}px`;
				y = isArrowHidden ? noArrowAlign : `${arrowYCenter}px`;
			} else if (placedSide === "left") {
				x = `${rects.floating.width + arrowHeight}px`;
				y = isArrowHidden ? noArrowAlign : `${arrowYCenter}px`;
			}
			return { data: {
				x,
				y
			} };
		}
	};
}
function getSideAndAlignFromPlacement(placement) {
	const [side, align = "center"] = placement.split("-");
	return [side, align];
}
function getSideFromPlacement(placement) {
	return getSideAndAlignFromPlacement(placement)[0];
}
function getAlignFromPlacement(placement) {
	return getSideAndAlignFromPlacement(placement)[1];
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer.svelte
function Floating_layer($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { children, tooltip = false } = $$props;
		FloatingRootState.create(tooltip);
		children?.($$renderer);
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/internal/data-typeahead.svelte.js
var DataTypeahead = class {
	#opts;
	#candidateValues = derived(() => this.#opts.candidateValues());
	#search;
	constructor(opts) {
		this.#opts = opts;
		this.#search = boxAutoReset("", {
			afterMs: 1e3,
			getWindow: this.#opts.getWindow
		});
		this.handleTypeaheadSearch = this.handleTypeaheadSearch.bind(this);
		this.resetTypeahead = this.resetTypeahead.bind(this);
	}
	handleTypeaheadSearch(key) {
		if (!this.#opts.enabled() || !this.#candidateValues().length) return;
		this.#search.current = this.#search.current + key;
		const currentItem = this.#opts.getCurrentItem();
		const currentMatch = this.#candidateValues().find((item) => item === currentItem) ?? "";
		const nextMatch = getNextMatch(this.#candidateValues().map((item) => item ?? ""), this.#search.current, currentMatch);
		const newItem = this.#candidateValues().find((item) => item === nextMatch);
		if (newItem) this.#opts.onMatch(newItem);
		return newItem;
	}
	resetTypeahead() {
		this.#search.current = "";
	}
};
var FIRST_KEYS = [
	ARROW_DOWN,
	PAGE_UP,
	HOME
];
var LAST_KEYS = [
	ARROW_UP,
	PAGE_DOWN,
	"End"
];
var FIRST_LAST_KEYS = [...FIRST_KEYS, ...LAST_KEYS];
var selectAttrs = createBitsAttrs({
	component: "select",
	parts: [
		"trigger",
		"content",
		"item",
		"viewport",
		"scroll-up-button",
		"scroll-down-button",
		"group",
		"group-label",
		"separator",
		"arrow",
		"input",
		"content-wrapper",
		"item-text",
		"value"
	]
});
var SelectRootContext = new Context("Select.Root | Combobox.Root");
new Context("Select.Group | Combobox.Group");
var SelectContentContext = new Context("Select.Content | Combobox.Content");
var SelectBaseRootState = class {
	opts;
	touchedInput = false;
	inputNode = null;
	contentNode = null;
	contentPresence;
	viewportNode = null;
	triggerNode = null;
	valueNode = null;
	valueId = "";
	highlightedNode = null;
	#highlightedValue = derived(() => {
		if (!this.highlightedNode) return null;
		return this.highlightedNode.getAttribute("data-value");
	});
	get highlightedValue() {
		return this.#highlightedValue();
	}
	set highlightedValue($$value) {
		return this.#highlightedValue($$value);
	}
	#highlightedId = derived(() => {
		if (!this.highlightedNode) return void 0;
		return this.highlightedNode.id;
	});
	get highlightedId() {
		return this.#highlightedId();
	}
	set highlightedId($$value) {
		return this.#highlightedId($$value);
	}
	#highlightedLabel = derived(() => {
		if (!this.highlightedNode) return null;
		return this.highlightedNode.getAttribute("data-label");
	});
	get highlightedLabel() {
		return this.#highlightedLabel();
	}
	set highlightedLabel($$value) {
		return this.#highlightedLabel($$value);
	}
	contentIsPositioned = false;
	isUsingKeyboard = false;
	isCombobox = false;
	domContext = new DOMContext(() => null);
	constructor(opts) {
		this.opts = opts;
		this.isCombobox = opts.isCombobox;
		this.contentPresence = new PresenceManager({
			ref: boxWith(() => this.contentNode),
			open: this.opts.open,
			onComplete: () => {
				this.opts.onOpenChangeComplete.current(this.opts.open.current);
			}
		});
	}
	setHighlightedNode(node, initial = false) {
		this.highlightedNode = node;
		if (node && (this.isUsingKeyboard || initial)) this.scrollHighlightedNodeIntoView(node);
	}
	scrollHighlightedNodeIntoView(node) {
		if (!this.viewportNode || !this.contentIsPositioned) return;
		node.scrollIntoView({ block: this.opts.scrollAlignment.current });
	}
	getCandidateNodes() {
		const node = this.contentNode;
		if (!node) return [];
		return Array.from(node.querySelectorAll(`[${this.getBitsAttr("item")}]:not([data-disabled])`));
	}
	setHighlightedToFirstCandidate(initial = false) {
		this.setHighlightedNode(null);
		let nodes = this.getCandidateNodes();
		if (!nodes.length) return;
		if (this.viewportNode) {
			const viewportRect = this.viewportNode.getBoundingClientRect();
			nodes = nodes.filter((node) => {
				if (!this.viewportNode) return false;
				const nodeRect = node.getBoundingClientRect();
				return nodeRect.right <= viewportRect.right && nodeRect.left >= viewportRect.left && nodeRect.bottom <= viewportRect.bottom && nodeRect.top >= viewportRect.top;
			});
		}
		this.setHighlightedNode(nodes[0], initial);
	}
	getNodeByValue(value) {
		return this.getCandidateNodes().find((node) => node.dataset.value === value) ?? null;
	}
	/**
	* Resolves the display label for a value: `items` entry when present, otherwise the
	* mounted item's `data-label` or its text content.
	*/
	getLabelForValue(value) {
		if (value === "") return "";
		const fromItems = this.opts.items.current.find((item) => item.value === value)?.label;
		if (fromItems !== void 0) return fromItems;
		const node = this.getNodeByValue(value);
		if (node) {
			const dataLabel = node.getAttribute("data-label");
			if (dataLabel !== null && dataLabel !== "") return dataLabel;
			return node.textContent?.trim() ?? value;
		}
		return value;
	}
	setOpen(open) {
		this.opts.open.current = open;
	}
	toggleOpen() {
		this.opts.open.current = !this.opts.open.current;
	}
	handleOpen() {
		this.setOpen(true);
	}
	handleClose() {
		this.setHighlightedNode(null);
		this.setOpen(false);
	}
	toggleMenu() {
		this.toggleOpen();
	}
	getBitsAttr = (part) => {
		return selectAttrs.getAttr(part, this.isCombobox ? "combobox" : void 0);
	};
};
var SelectSingleRootState = class extends SelectBaseRootState {
	opts;
	isMulti = false;
	#hasValue = derived(() => this.opts.value.current !== "");
	get hasValue() {
		return this.#hasValue();
	}
	set hasValue($$value) {
		return this.#hasValue($$value);
	}
	#currentLabel = derived(() => {
		if (!this.opts.items.current.length) return "";
		return this.opts.items.current.find((item) => item.value === this.opts.value.current)?.label ?? "";
	});
	get currentLabel() {
		return this.#currentLabel();
	}
	set currentLabel($$value) {
		return this.#currentLabel($$value);
	}
	#candidateLabels = derived(() => {
		if (!this.opts.items.current.length) return [];
		return this.opts.items.current.filter((item) => !item.disabled).map((item) => item.label);
	});
	get candidateLabels() {
		return this.#candidateLabels();
	}
	set candidateLabels($$value) {
		return this.#candidateLabels($$value);
	}
	#dataTypeaheadEnabled = derived(() => {
		if (this.isMulti) return false;
		if (this.opts.items.current.length === 0) return false;
		return true;
	});
	get dataTypeaheadEnabled() {
		return this.#dataTypeaheadEnabled();
	}
	set dataTypeaheadEnabled($$value) {
		return this.#dataTypeaheadEnabled($$value);
	}
	constructor(opts) {
		super(opts);
		this.opts = opts;
		watch(() => this.opts.open.current, () => {
			if (!this.opts.open.current) return;
			this.setInitialHighlightedNode();
		});
	}
	includesItem(itemValue) {
		return this.opts.value.current === itemValue;
	}
	toggleItem(itemValue, itemLabel = itemValue) {
		const newValue = this.includesItem(itemValue) ? "" : itemValue;
		this.opts.value.current = newValue;
		if (newValue !== "") this.opts.inputValue.current = itemLabel;
	}
	setInitialHighlightedNode() {
		afterTick(() => {
			if (this.highlightedNode && this.domContext.getDocument().contains(this.highlightedNode)) return;
			if (this.opts.value.current !== "") {
				const node = this.getNodeByValue(this.opts.value.current);
				if (node) {
					this.setHighlightedNode(node, true);
					return;
				}
			}
			this.setHighlightedToFirstCandidate(true);
		});
	}
};
var SelectMultipleRootState = class extends SelectBaseRootState {
	opts;
	isMulti = true;
	#hasValue = derived(() => this.opts.value.current.length > 0);
	get hasValue() {
		return this.#hasValue();
	}
	set hasValue($$value) {
		return this.#hasValue($$value);
	}
	constructor(opts) {
		super(opts);
		this.opts = opts;
		watch(() => this.opts.open.current, () => {
			if (!this.opts.open.current) return;
			this.setInitialHighlightedNode();
		});
	}
	includesItem(itemValue) {
		return this.opts.value.current.includes(itemValue);
	}
	toggleItem(itemValue, itemLabel = itemValue) {
		if (this.includesItem(itemValue)) this.opts.value.current = this.opts.value.current.filter((v) => v !== itemValue);
		else this.opts.value.current = [...this.opts.value.current, itemValue];
		this.opts.inputValue.current = itemLabel;
	}
	setInitialHighlightedNode() {
		afterTick(() => {
			if (!this.domContext) return;
			if (this.highlightedNode && this.domContext.getDocument().contains(this.highlightedNode)) return;
			if (this.opts.value.current.length && this.opts.value.current[0] !== "") {
				const node = this.getNodeByValue(this.opts.value.current[0]);
				if (node) {
					this.setHighlightedNode(node, true);
					return;
				}
			}
			this.setHighlightedToFirstCandidate(true);
		});
	}
};
var SelectRootState = class {
	static create(props) {
		const { type, ...rest } = props;
		const rootState = type === "single" ? new SelectSingleRootState(rest) : new SelectMultipleRootState(rest);
		return SelectRootContext.set(rootState);
	}
};
var SelectTriggerState = class SelectTriggerState {
	static create(opts) {
		return new SelectTriggerState(opts, SelectRootContext.get());
	}
	opts;
	root;
	attachment;
	#domTypeahead;
	#dataTypeahead;
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(opts.ref, (v) => this.root.triggerNode = v);
		this.root.domContext = new DOMContext(opts.ref);
		this.#domTypeahead = new DOMTypeahead({
			getCurrentItem: () => this.root.highlightedNode,
			onMatch: (node) => {
				this.root.setHighlightedNode(node);
			},
			getActiveElement: () => this.root.domContext.getActiveElement(),
			getWindow: () => this.root.domContext.getWindow()
		});
		this.#dataTypeahead = new DataTypeahead({
			getCurrentItem: () => {
				if (this.root.isMulti) return "";
				return this.root.currentLabel;
			},
			onMatch: (label) => {
				if (this.root.isMulti) return;
				if (!this.root.opts.items.current) return;
				const matchedItem = this.root.opts.items.current.find((item) => item.label === label);
				if (!matchedItem) return;
				this.root.opts.value.current = matchedItem.value;
			},
			enabled: () => !this.root.isMulti && this.root.dataTypeaheadEnabled,
			candidateValues: () => this.root.isMulti ? [] : this.root.candidateLabels,
			getWindow: () => this.root.domContext.getWindow()
		});
		this.onkeydown = this.onkeydown.bind(this);
		this.onpointerdown = this.onpointerdown.bind(this);
		this.onpointerup = this.onpointerup.bind(this);
		this.onclick = this.onclick.bind(this);
	}
	#handleOpen() {
		this.root.opts.open.current = true;
		this.#dataTypeahead.resetTypeahead();
		this.#domTypeahead.resetTypeahead();
	}
	#handlePointerOpen(_) {
		this.#handleOpen();
	}
	/**
	* Logic used to handle keyboard selection/deselection.
	*
	* If it returns true, it means the item was selected and whatever is calling
	* this function should return early
	*
	*/
	#handleKeyboardSelection() {
		const isCurrentSelectedValue = this.root.highlightedValue === this.root.opts.value.current;
		if (!this.root.opts.allowDeselect.current && isCurrentSelectedValue && !this.root.isMulti) {
			this.root.handleClose();
			return true;
		}
		if (this.root.highlightedValue !== null) this.root.toggleItem(this.root.highlightedValue, this.root.highlightedLabel ?? void 0);
		if (!this.root.isMulti && !isCurrentSelectedValue) {
			this.root.handleClose();
			return true;
		}
		return false;
	}
	onkeydown(e) {
		this.root.isUsingKeyboard = true;
		if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
		if (!this.root.opts.open.current) {
			if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
				e.preventDefault();
				this.root.handleOpen();
			} else if (!this.root.isMulti && this.root.dataTypeaheadEnabled) {
				this.#dataTypeahead.handleTypeaheadSearch(e.key);
				return;
			}
			if (this.root.hasValue) return;
			const candidateNodes = this.root.getCandidateNodes();
			if (!candidateNodes.length) return;
			if (e.key === "ArrowDown") {
				const firstCandidate = candidateNodes[0];
				this.root.setHighlightedNode(firstCandidate);
			} else if (e.key === "ArrowUp") {
				const lastCandidate = candidateNodes[candidateNodes.length - 1];
				this.root.setHighlightedNode(lastCandidate);
			}
			return;
		}
		if (e.key === "Tab") {
			this.root.handleClose();
			return;
		}
		if ((e.key === "Enter" || e.key === " " && this.#domTypeahead.search === "") && !e.isComposing) {
			e.preventDefault();
			if (this.#handleKeyboardSelection()) return;
		}
		if (e.key === "ArrowUp" && e.altKey) this.root.handleClose();
		if (FIRST_LAST_KEYS.includes(e.key)) {
			e.preventDefault();
			const candidateNodes = this.root.getCandidateNodes();
			const currHighlightedNode = this.root.highlightedNode;
			const currIndex = currHighlightedNode ? candidateNodes.indexOf(currHighlightedNode) : -1;
			const loop = this.root.opts.loop.current;
			let nextItem;
			if (e.key === "ArrowDown") nextItem = next(candidateNodes, currIndex, loop);
			else if (e.key === "ArrowUp") nextItem = prev(candidateNodes, currIndex, loop);
			else if (e.key === "PageDown") nextItem = forward(candidateNodes, currIndex, 10, loop);
			else if (e.key === "PageUp") nextItem = backward(candidateNodes, currIndex, 10, loop);
			else if (e.key === "Home") nextItem = candidateNodes[0];
			else if (e.key === "End") nextItem = candidateNodes[candidateNodes.length - 1];
			if (!nextItem) return;
			this.root.setHighlightedNode(nextItem);
			return;
		}
		const isModifierKey = e.ctrlKey || e.altKey || e.metaKey;
		const isCharacterKey = e.key.length === 1;
		const isSpaceKey = e.key === " ";
		const candidateNodes = this.root.getCandidateNodes();
		if (e.key === "Tab") return;
		if (!isModifierKey && (isCharacterKey || isSpaceKey)) {
			if (!this.#domTypeahead.handleTypeaheadSearch(e.key, candidateNodes) && isSpaceKey) {
				e.preventDefault();
				this.#handleKeyboardSelection();
			}
			return;
		}
		if (!this.root.highlightedNode) this.root.setHighlightedToFirstCandidate();
	}
	onclick(e) {
		e.currentTarget.focus();
	}
	onpointerdown(e) {
		if (this.root.opts.disabled.current) return;
		if (e.pointerType === "touch") return e.preventDefault();
		const target = e.target;
		if (target?.hasPointerCapture(e.pointerId)) target?.releasePointerCapture(e.pointerId);
		if (e.button === 0 && e.ctrlKey === false) if (this.root.opts.open.current === false) this.#handlePointerOpen(e);
		else this.root.handleClose();
	}
	onpointerup(e) {
		if (this.root.opts.disabled.current) return;
		e.preventDefault();
		if (e.pointerType === "touch") if (this.root.opts.open.current === false) this.#handlePointerOpen(e);
		else this.root.handleClose();
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		disabled: this.root.opts.disabled.current ? true : void 0,
		"aria-haspopup": "listbox",
		"aria-expanded": boolToStr(this.root.opts.open.current),
		"aria-activedescendant": this.root.highlightedId,
		"data-state": getDataOpenClosed(this.root.opts.open.current),
		"data-disabled": boolToEmptyStrOrUndef(this.root.opts.disabled.current),
		"data-placeholder": this.root.hasValue ? void 0 : "",
		[this.root.getBitsAttr("trigger")]: "",
		onpointerdown: this.onpointerdown,
		onkeydown: this.onkeydown,
		onclick: this.onclick,
		onpointerup: this.onpointerup,
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var SelectContentState = class SelectContentState {
	static create(opts) {
		return SelectContentContext.set(new SelectContentState(opts, SelectRootContext.get()));
	}
	opts;
	root;
	attachment;
	isPositioned = false;
	domContext;
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(opts.ref, (v) => this.root.contentNode = v);
		this.domContext = new DOMContext(this.opts.ref);
		if (this.root.domContext === null) this.root.domContext = this.domContext;
		watch(() => this.root.opts.open.current, () => {
			if (this.root.opts.open.current) return;
			this.root.contentIsPositioned = false;
			this.isPositioned = false;
		});
		watch([() => this.isPositioned, () => this.root.highlightedNode], () => {
			if (!this.isPositioned || !this.root.highlightedNode) return;
			this.root.scrollHighlightedNodeIntoView(this.root.highlightedNode);
		});
		this.onpointermove = this.onpointermove.bind(this);
	}
	onpointermove(_) {
		this.root.isUsingKeyboard = false;
	}
	#styles = derived(() => {
		return getFloatingContentCSSVars(this.root.isCombobox ? "combobox" : "select");
	});
	onInteractOutside = (e) => {
		if (e.target === this.root.triggerNode || e.target === this.root.inputNode) {
			e.preventDefault();
			return;
		}
		this.opts.onInteractOutside.current(e);
		if (e.defaultPrevented) return;
		this.root.handleClose();
	};
	onEscapeKeydown = (e) => {
		this.opts.onEscapeKeydown.current(e);
		if (e.defaultPrevented) return;
		this.root.handleClose();
	};
	onOpenAutoFocus = (e) => {
		e.preventDefault();
	};
	onCloseAutoFocus = (e) => {
		e.preventDefault();
	};
	get shouldRender() {
		return this.root.contentPresence.shouldRender;
	}
	#snippetProps = derived(() => ({ open: this.root.opts.open.current }));
	get snippetProps() {
		return this.#snippetProps();
	}
	set snippetProps($$value) {
		return this.#snippetProps($$value);
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		role: "listbox",
		"aria-multiselectable": this.root.isMulti ? "true" : void 0,
		"data-state": getDataOpenClosed(this.root.opts.open.current),
		...getDataTransitionAttrs(this.root.contentPresence.transitionStatus),
		[this.root.getBitsAttr("content")]: "",
		style: {
			display: "flex",
			flexDirection: "column",
			outline: "none",
			boxSizing: "border-box",
			pointerEvents: "auto",
			...this.#styles()
		},
		onpointermove: this.onpointermove,
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
	popperProps = {
		onInteractOutside: this.onInteractOutside,
		onEscapeKeydown: this.onEscapeKeydown,
		onOpenAutoFocus: this.onOpenAutoFocus,
		onCloseAutoFocus: this.onCloseAutoFocus,
		trapFocus: false,
		loop: false,
		onPlaced: () => {
			if (this.root.opts.open.current) {
				this.root.contentIsPositioned = true;
				this.isPositioned = true;
			}
		}
	};
};
var SelectItemState = class SelectItemState {
	static create(opts) {
		return new SelectItemState(opts, SelectRootContext.get());
	}
	opts;
	root;
	attachment;
	#isSelected = derived(() => this.root.includesItem(this.opts.value.current));
	get isSelected() {
		return this.#isSelected();
	}
	set isSelected($$value) {
		return this.#isSelected($$value);
	}
	#isHighlighted = derived(() => this.root.highlightedValue === this.opts.value.current);
	get isHighlighted() {
		return this.#isHighlighted();
	}
	set isHighlighted($$value) {
		return this.#isHighlighted($$value);
	}
	prevHighlighted = new Previous(() => this.isHighlighted);
	mounted = false;
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(opts.ref);
		watch([() => this.isHighlighted, () => this.prevHighlighted.current], () => {
			if (this.isHighlighted) this.opts.onHighlight.current();
			else if (this.prevHighlighted.current) this.opts.onUnhighlight.current();
		});
		watch(() => this.mounted, () => {
			if (!this.mounted) return;
			this.root.setInitialHighlightedNode();
		});
		this.onpointerdown = this.onpointerdown.bind(this);
		this.onpointerup = this.onpointerup.bind(this);
		this.onpointermove = this.onpointermove.bind(this);
	}
	handleSelect() {
		if (this.opts.disabled.current) return;
		const isCurrentSelectedValue = this.opts.value.current === this.root.opts.value.current;
		if (!this.root.opts.allowDeselect.current && isCurrentSelectedValue && !this.root.isMulti) {
			this.root.handleClose();
			return;
		}
		this.root.toggleItem(this.opts.value.current, this.opts.label.current);
		if (!this.root.isMulti && !isCurrentSelectedValue) this.root.handleClose();
	}
	#snippetProps = derived(() => ({
		selected: this.isSelected,
		highlighted: this.isHighlighted
	}));
	get snippetProps() {
		return this.#snippetProps();
	}
	set snippetProps($$value) {
		return this.#snippetProps($$value);
	}
	onpointerdown(e) {
		e.preventDefault();
	}
	/**
	* Using `pointerup` instead of `click` allows power users to pointerdown
	* the trigger, then release pointerup on an item to select it vs having to do
	* multiple clicks.
	*/
	onpointerup(e) {
		if (e.defaultPrevented || !this.opts.ref.current) return;
		/**
		* For one reason or another, when it's a touch pointer and _not_ on IOS,
		* we need to listen for the immediate click event to handle the selection,
		* otherwise a click event will fire on the element _behind_ the item.
		*/
		if (e.pointerType === "touch" && !isIOS) {
			on(this.opts.ref.current, "click", () => {
				this.handleSelect();
				this.root.setHighlightedNode(this.opts.ref.current);
			}, { once: true });
			return;
		}
		e.preventDefault();
		this.handleSelect();
		if (e.pointerType === "touch") this.root.setHighlightedNode(this.opts.ref.current);
	}
	onpointermove(e) {
		/**
		* We don't want to highlight items on touch devices when scrolling,
		* as this is confusing behavior, so we return here and instead handle
		* the highlighting on the `pointerup` (or following `click`) event for
		* touch devices only.
		*/
		if (e.pointerType === "touch") return;
		if (this.root.highlightedNode !== this.opts.ref.current) this.root.setHighlightedNode(this.opts.ref.current);
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		role: "option",
		"aria-selected": this.root.includesItem(this.opts.value.current) ? "true" : void 0,
		"data-value": this.opts.value.current,
		"data-disabled": boolToEmptyStrOrUndef(this.opts.disabled.current),
		"data-highlighted": this.root.highlightedValue === this.opts.value.current && !this.opts.disabled.current ? "" : void 0,
		"data-selected": this.root.includesItem(this.opts.value.current) ? "" : void 0,
		"data-label": this.opts.label.current,
		[this.root.getBitsAttr("item")]: "",
		onpointermove: this.onpointermove,
		onpointerdown: this.onpointerdown,
		onpointerup: this.onpointerup,
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var SelectHiddenInputState = class SelectHiddenInputState {
	static create(opts) {
		return new SelectHiddenInputState(opts, SelectRootContext.get());
	}
	opts;
	root;
	#shouldRender = derived(() => this.root.opts.name.current !== "");
	get shouldRender() {
		return this.#shouldRender();
	}
	set shouldRender($$value) {
		return this.#shouldRender($$value);
	}
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.onfocus = this.onfocus.bind(this);
	}
	onfocus(e) {
		e.preventDefault();
		if (!this.root.isCombobox) this.root.triggerNode?.focus();
		else this.root.inputNode?.focus();
	}
	#props = derived(() => ({
		disabled: boolToTrueOrUndef(this.root.opts.disabled.current),
		required: boolToTrueOrUndef(this.root.opts.required.current),
		name: this.root.opts.name.current,
		value: this.opts.value.current,
		onfocus: this.onfocus
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var SelectViewportState = class SelectViewportState {
	static create(opts) {
		return new SelectViewportState(opts, SelectContentContext.get());
	}
	opts;
	content;
	root;
	attachment;
	prevScrollTop = 0;
	constructor(opts, content) {
		this.opts = opts;
		this.content = content;
		this.root = content.root;
		this.attachment = attachRef(opts.ref, (v) => {
			this.root.viewportNode = v;
		});
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		role: "presentation",
		[this.root.getBitsAttr("viewport")]: "",
		style: {
			position: "relative",
			flex: 1,
			overflow: "auto"
		},
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var SelectScrollButtonImplState = class {
	opts;
	content;
	root;
	attachment;
	autoScrollTimer = null;
	userScrollTimer = -1;
	isUserScrolling = false;
	onAutoScroll = noop;
	mounted = false;
	constructor(opts, content) {
		this.opts = opts;
		this.content = content;
		this.root = content.root;
		this.attachment = attachRef(opts.ref);
		watch([() => this.mounted], () => {
			if (!this.mounted) {
				this.isUserScrolling = false;
				return;
			}
			if (this.isUserScrolling) return;
		});
		this.onpointerdown = this.onpointerdown.bind(this);
		this.onpointermove = this.onpointermove.bind(this);
		this.onpointerleave = this.onpointerleave.bind(this);
	}
	handleUserScroll() {
		this.content.domContext.clearTimeout(this.userScrollTimer);
		this.isUserScrolling = true;
		this.userScrollTimer = this.content.domContext.setTimeout(() => {
			this.isUserScrolling = false;
		}, 200);
	}
	clearAutoScrollInterval() {
		if (this.autoScrollTimer === null) return;
		this.content.domContext.clearTimeout(this.autoScrollTimer);
		this.autoScrollTimer = null;
	}
	onpointerdown(_) {
		if (this.autoScrollTimer !== null) return;
		const autoScroll = (tick) => {
			this.onAutoScroll();
			this.autoScrollTimer = this.content.domContext.setTimeout(() => autoScroll(tick + 1), this.opts.delay.current(tick));
		};
		this.autoScrollTimer = this.content.domContext.setTimeout(() => autoScroll(1), this.opts.delay.current(0));
	}
	onpointermove(e) {
		this.onpointerdown(e);
	}
	onpointerleave(_) {
		this.clearAutoScrollInterval();
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		"aria-hidden": boolToStrTrueOrUndef(true),
		style: { flexShrink: 0 },
		onpointerdown: this.onpointerdown,
		onpointermove: this.onpointermove,
		onpointerleave: this.onpointerleave,
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var SelectScrollDownButtonState = class SelectScrollDownButtonState {
	static create(opts) {
		return new SelectScrollDownButtonState(new SelectScrollButtonImplState(opts, SelectContentContext.get()));
	}
	scrollButtonState;
	content;
	root;
	canScrollDown = false;
	scrollIntoViewTimer = null;
	constructor(scrollButtonState) {
		this.scrollButtonState = scrollButtonState;
		this.content = scrollButtonState.content;
		this.root = scrollButtonState.root;
		this.scrollButtonState.onAutoScroll = this.handleAutoScroll;
		watch([() => this.root.viewportNode, () => this.content.isPositioned], () => {
			if (!this.root.viewportNode || !this.content.isPositioned) return;
			this.handleScroll(true);
			return on(this.root.viewportNode, "scroll", () => this.handleScroll());
		});
		/**
		* If the input value changes, this means that the filtered items may have changed,
		* so we need to re-evaluate the scroll-ability of the list.
		*/
		watch([
			() => this.root.opts.inputValue.current,
			() => this.root.viewportNode,
			() => this.content.isPositioned
		], () => {
			if (!this.root.viewportNode || !this.content.isPositioned) return;
			this.handleScroll(true);
		});
		watch(() => this.scrollButtonState.mounted, () => {
			if (!this.scrollButtonState.mounted) return;
			if (this.scrollIntoViewTimer) clearTimeout(this.scrollIntoViewTimer);
			this.scrollIntoViewTimer = afterSleep(5, () => {
				const activeItem = this.root.highlightedNode;
				if (!activeItem) return;
				this.root.scrollHighlightedNodeIntoView(activeItem);
			});
		});
	}
	/**
	* @param manual - if true, it means the function was invoked manually outside of an event
	* listener, so we don't call `handleUserScroll` to prevent the auto scroll from kicking in.
	*/
	handleScroll = (manual = false) => {
		if (!manual) this.scrollButtonState.handleUserScroll();
		if (!this.root.viewportNode) return;
		const maxScroll = this.root.viewportNode.scrollHeight - this.root.viewportNode.clientHeight;
		const paddingTop = Number.parseInt(getComputedStyle(this.root.viewportNode).paddingTop, 10);
		this.canScrollDown = Math.ceil(this.root.viewportNode.scrollTop) < maxScroll - paddingTop;
	};
	handleAutoScroll = () => {
		const viewport = this.root.viewportNode;
		const selectedItem = this.root.highlightedNode;
		if (!viewport || !selectedItem) return;
		viewport.scrollTop = viewport.scrollTop + selectedItem.offsetHeight;
	};
	#props = derived(() => ({
		...this.scrollButtonState.props,
		[this.root.getBitsAttr("scroll-down-button")]: ""
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var SelectScrollUpButtonState = class SelectScrollUpButtonState {
	static create(opts) {
		return new SelectScrollUpButtonState(new SelectScrollButtonImplState(opts, SelectContentContext.get()));
	}
	scrollButtonState;
	content;
	root;
	canScrollUp = false;
	constructor(scrollButtonState) {
		this.scrollButtonState = scrollButtonState;
		this.content = scrollButtonState.content;
		this.root = scrollButtonState.root;
		this.scrollButtonState.onAutoScroll = this.handleAutoScroll;
		watch([() => this.root.viewportNode, () => this.content.isPositioned], () => {
			if (!this.root.viewportNode || !this.content.isPositioned) return;
			this.handleScroll(true);
			return on(this.root.viewportNode, "scroll", () => this.handleScroll());
		});
	}
	/**
	* @param manual - if true, it means the function was invoked manually outside of an event
	* listener, so we don't call `handleUserScroll` to prevent the auto scroll from kicking in.
	*/
	handleScroll = (manual = false) => {
		if (!manual) this.scrollButtonState.handleUserScroll();
		if (!this.root.viewportNode) return;
		const paddingTop = Number.parseInt(getComputedStyle(this.root.viewportNode).paddingTop, 10);
		this.canScrollUp = this.root.viewportNode.scrollTop - paddingTop > .1;
	};
	handleAutoScroll = () => {
		if (!this.root.viewportNode || !this.root.highlightedNode) return;
		this.root.viewportNode.scrollTop = this.root.viewportNode.scrollTop - this.root.highlightedNode.offsetHeight;
	};
	#props = derived(() => ({
		...this.scrollButtonState.props,
		[this.root.getBitsAttr("scroll-up-button")]: ""
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/select/components/select-hidden-input.svelte
function Select_hidden_input($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value = void 0, autocomplete } = $$props;
		const hiddenInputState = SelectHiddenInputState.create({ value: boxWith(() => value) });
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (hiddenInputState.shouldRender) {
				$$renderer.push("<!--[0-->");
				Hidden_input($$renderer, spread_props([hiddenInputState.props, {
					autocomplete,
					get value() {
						return value;
					},
					set value($$value) {
						value = $$value;
						$$settled = false;
					}
				}]));
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { value });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-anchor.svelte
function Floating_layer_anchor($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { id, children, virtualEl, ref, tooltip = false } = $$props;
		FloatingAnchorState.create({
			id: boxWith(() => id),
			virtualEl: boxWith(() => virtualEl),
			ref
		}, tooltip);
		children?.($$renderer);
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-content.svelte
function Floating_layer_content($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { content, side = "bottom", sideOffset = 0, align = "center", alignOffset = 0, id, arrowPadding = 0, avoidCollisions = true, collisionBoundary = [], collisionPadding = 0, hideWhenDetached = false, onPlaced = () => {}, sticky = "partial", updatePositionStrategy = "optimized", strategy = "fixed", dir = "ltr", style = {}, wrapperId = useId(), customAnchor = null, enabled, tooltip = false } = $$props;
		const contentState = FloatingContentState.create({
			side: boxWith(() => side),
			sideOffset: boxWith(() => sideOffset),
			align: boxWith(() => align),
			alignOffset: boxWith(() => alignOffset),
			id: boxWith(() => id),
			arrowPadding: boxWith(() => arrowPadding),
			avoidCollisions: boxWith(() => avoidCollisions),
			collisionBoundary: boxWith(() => collisionBoundary),
			collisionPadding: boxWith(() => collisionPadding),
			hideWhenDetached: boxWith(() => hideWhenDetached),
			onPlaced: boxWith(() => onPlaced),
			sticky: boxWith(() => sticky),
			updatePositionStrategy: boxWith(() => updatePositionStrategy),
			strategy: boxWith(() => strategy),
			dir: boxWith(() => dir),
			style: boxWith(() => style),
			enabled: boxWith(() => enabled),
			wrapperId: boxWith(() => wrapperId),
			customAnchor: boxWith(() => customAnchor)
		}, tooltip);
		const mergedProps = derived(() => mergeProps(contentState.wrapperProps, { style: { pointerEvents: "auto" } }));
		content?.($$renderer, {
			props: contentState.props,
			wrapperProps: mergedProps()
		});
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-content-static.svelte
function Floating_layer_content_static($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { content, onPlaced } = $$props;
		content?.($$renderer, {
			props: {},
			wrapperProps: {}
		});
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-content.svelte
function Popper_content($$renderer, $$props) {
	let { content, isStatic = false, onPlaced, $$slots, $$events, ...restProps } = $$props;
	if (isStatic) {
		$$renderer.push("<!--[0-->");
		Floating_layer_content_static($$renderer, {
			content,
			onPlaced
		});
	} else {
		$$renderer.push("<!--[-1-->");
		Floating_layer_content($$renderer, spread_props([{
			content,
			onPlaced
		}, restProps]));
	}
	$$renderer.push(`<!--]-->`);
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-layer-inner.svelte
function Popper_layer_inner($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { popper, onEscapeKeydown, escapeKeydownBehavior, preventOverflowTextSelection, id, onPointerDown, onPointerUp, side, sideOffset, align, alignOffset, arrowPadding, avoidCollisions, collisionBoundary, collisionPadding, sticky, hideWhenDetached, updatePositionStrategy, strategy, dir, preventScroll, wrapperId, style, onPlaced, onInteractOutside, onCloseAutoFocus, onOpenAutoFocus, onFocusOutside, interactOutsideBehavior = "close", loop, trapFocus = true, isValidEvent = () => false, customAnchor = null, isStatic = false, enabled, ref, tooltip = false, contentPointerEvents = "auto", $$slots, $$events, ...restProps } = $$props;
		const resolvedPreventScroll = derived(() => preventScroll ?? true);
		const effectiveStrategy = derived(() => strategy ?? (resolvedPreventScroll() ? "fixed" : "absolute"));
		{
			function content($$renderer, { props: floatingProps, wrapperProps }) {
				if (restProps.forceMount && enabled) {
					$$renderer.push("<!--[0-->");
					Scroll_lock($$renderer, { preventScroll: resolvedPreventScroll() });
				} else if (!restProps.forceMount) {
					$$renderer.push("<!--[1-->");
					Scroll_lock($$renderer, { preventScroll: resolvedPreventScroll() });
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				{
					function focusScope($$renderer, { props: focusScopeProps }) {
						Escape_layer($$renderer, {
							onEscapeKeydown,
							escapeKeydownBehavior,
							enabled,
							ref,
							children: ($$renderer) => {
								{
									function children($$renderer, { props: dismissibleProps }) {
										Text_selection_layer($$renderer, {
											id,
											preventOverflowTextSelection,
											onPointerDown,
											onPointerUp,
											enabled,
											ref,
											children: ($$renderer) => {
												popper?.($$renderer, {
													props: mergeProps(restProps, floatingProps, dismissibleProps, focusScopeProps, { style: { pointerEvents: contentPointerEvents } }),
													wrapperProps
												});
												$$renderer.push(`<!---->`);
											},
											$$slots: { default: true }
										});
									}
									Dismissible_layer($$renderer, {
										id,
										onInteractOutside,
										onFocusOutside,
										interactOutsideBehavior,
										isValidEvent,
										enabled,
										ref,
										children,
										$$slots: { default: true }
									});
								}
							},
							$$slots: { default: true }
						});
					}
					Focus_scope($$renderer, {
						onOpenAutoFocus,
						onCloseAutoFocus,
						loop,
						enabled,
						trapFocus,
						forceMount: restProps.forceMount,
						ref,
						focusScope,
						$$slots: { focusScope: true }
					});
				}
				$$renderer.push(`<!---->`);
			}
			Popper_content($$renderer, {
				isStatic,
				id,
				side,
				sideOffset,
				align,
				alignOffset,
				arrowPadding,
				avoidCollisions,
				collisionBoundary,
				collisionPadding,
				sticky,
				hideWhenDetached,
				updatePositionStrategy,
				strategy: effectiveStrategy(),
				dir,
				wrapperId,
				style,
				onPlaced,
				customAnchor,
				enabled,
				tooltip,
				content,
				$$slots: { content: true }
			});
		}
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-layer.svelte
function Popper_layer($$renderer, $$props) {
	let { popper, open, onEscapeKeydown, escapeKeydownBehavior, preventOverflowTextSelection, id, onPointerDown, onPointerUp, side, sideOffset, align, alignOffset, arrowPadding, avoidCollisions, collisionBoundary, collisionPadding, sticky, hideWhenDetached, updatePositionStrategy, strategy, dir, preventScroll, wrapperId, style, onPlaced, onInteractOutside, onCloseAutoFocus, onOpenAutoFocus, onFocusOutside, interactOutsideBehavior = "close", loop, trapFocus = true, isValidEvent = () => false, customAnchor = null, isStatic = false, ref, shouldRender, $$slots, $$events, ...restProps } = $$props;
	if (shouldRender) {
		$$renderer.push("<!--[0-->");
		Popper_layer_inner($$renderer, spread_props([{
			popper,
			onEscapeKeydown,
			escapeKeydownBehavior,
			preventOverflowTextSelection,
			id,
			onPointerDown,
			onPointerUp,
			side,
			sideOffset,
			align,
			alignOffset,
			arrowPadding,
			avoidCollisions,
			collisionBoundary,
			collisionPadding,
			sticky,
			hideWhenDetached,
			updatePositionStrategy,
			strategy,
			dir,
			preventScroll,
			wrapperId,
			style,
			onPlaced,
			customAnchor,
			isStatic,
			enabled: open,
			onInteractOutside,
			onCloseAutoFocus,
			onOpenAutoFocus,
			interactOutsideBehavior,
			loop,
			trapFocus,
			isValidEvent,
			onFocusOutside,
			forceMount: false,
			ref
		}, restProps]));
	} else $$renderer.push("<!--[-1-->");
	$$renderer.push(`<!--]-->`);
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/popper-layer/popper-layer-force-mount.svelte
function Popper_layer_force_mount($$renderer, $$props) {
	let { popper, onEscapeKeydown, escapeKeydownBehavior, preventOverflowTextSelection, id, onPointerDown, onPointerUp, side, sideOffset, align, alignOffset, arrowPadding, avoidCollisions, collisionBoundary, collisionPadding, sticky, hideWhenDetached, updatePositionStrategy, strategy, dir, preventScroll, wrapperId, style, onPlaced, onInteractOutside, onCloseAutoFocus, onOpenAutoFocus, onFocusOutside, interactOutsideBehavior = "close", loop, trapFocus = true, isValidEvent = () => false, customAnchor = null, isStatic = false, enabled, $$slots, $$events, ...restProps } = $$props;
	Popper_layer_inner($$renderer, spread_props([
		{
			popper,
			onEscapeKeydown,
			escapeKeydownBehavior,
			preventOverflowTextSelection,
			id,
			onPointerDown,
			onPointerUp,
			side,
			sideOffset,
			align,
			alignOffset,
			arrowPadding,
			avoidCollisions,
			collisionBoundary,
			collisionPadding,
			sticky,
			hideWhenDetached,
			updatePositionStrategy,
			strategy,
			dir,
			preventScroll,
			wrapperId,
			style,
			onPlaced,
			customAnchor,
			isStatic,
			enabled,
			onInteractOutside,
			onCloseAutoFocus,
			onOpenAutoFocus,
			interactOutsideBehavior,
			loop,
			trapFocus,
			isValidEvent,
			onFocusOutside
		},
		restProps,
		{ forceMount: true }
	]));
}
//#endregion
//#region node_modules/bits-ui/dist/bits/select/components/select-content.svelte
function Select_content$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), ref = null, forceMount = false, side = "bottom", onInteractOutside = noop, onEscapeKeydown = noop, children, child, preventScroll = false, style, $$slots, $$events, ...restProps } = $$props;
		const contentState = SelectContentState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v),
			onInteractOutside: boxWith(() => onInteractOutside),
			onEscapeKeydown: boxWith(() => onEscapeKeydown)
		});
		const mergedProps = derived(() => mergeProps(restProps, contentState.props));
		if (forceMount) {
			$$renderer.push("<!--[0-->");
			{
				function popper($$renderer, { props, wrapperProps }) {
					const finalProps = mergeProps(props, { style: contentState.props.style }, { style });
					if (child) {
						$$renderer.push("<!--[0-->");
						child($$renderer, {
							props: finalProps,
							wrapperProps,
							...contentState.snippetProps
						});
						$$renderer.push(`<!---->`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<div${attributes({ ...wrapperProps })}><div${attributes({ ...finalProps })}>`);
						children?.($$renderer);
						$$renderer.push(`<!----></div></div>`);
					}
					$$renderer.push(`<!--]-->`);
				}
				Popper_layer_force_mount($$renderer, spread_props([
					mergedProps(),
					contentState.popperProps,
					{
						ref: contentState.opts.ref,
						side,
						enabled: contentState.root.opts.open.current,
						id,
						preventScroll,
						forceMount: true,
						shouldRender: contentState.shouldRender,
						popper,
						$$slots: { popper: true }
					}
				]));
			}
		} else if (!forceMount) {
			$$renderer.push("<!--[1-->");
			{
				function popper($$renderer, { props, wrapperProps }) {
					const finalProps = mergeProps(props, { style: contentState.props.style }, { style });
					if (child) {
						$$renderer.push("<!--[0-->");
						child($$renderer, {
							props: finalProps,
							wrapperProps,
							...contentState.snippetProps
						});
						$$renderer.push(`<!---->`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<div${attributes({ ...wrapperProps })}><div${attributes({ ...finalProps })}>`);
						children?.($$renderer);
						$$renderer.push(`<!----></div></div>`);
					}
					$$renderer.push(`<!--]-->`);
				}
				Popper_layer($$renderer, spread_props([
					mergedProps(),
					contentState.popperProps,
					{
						ref: contentState.opts.ref,
						side,
						open: contentState.root.opts.open.current,
						id,
						preventScroll,
						forceMount: false,
						shouldRender: contentState.shouldRender,
						popper,
						$$slots: { popper: true }
					}
				]));
			}
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/mounted.svelte
function Mounted($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { mounted = false, onMountedChange = noop } = $$props;
		bind_props($$props, { mounted });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/select/components/select-item.svelte
function Select_item$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), ref = null, value, label = value, disabled = false, children, child, onHighlight = noop, onUnhighlight = noop, $$slots, $$events, ...restProps } = $$props;
		const itemState = SelectItemState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v),
			value: boxWith(() => value),
			disabled: boxWith(() => disabled),
			label: boxWith(() => label),
			onHighlight: boxWith(() => onHighlight),
			onUnhighlight: boxWith(() => onUnhighlight)
		});
		const mergedProps = derived(() => mergeProps(restProps, itemState.props));
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (child) {
				$$renderer.push("<!--[0-->");
				child($$renderer, {
					props: mergedProps(),
					...itemState.snippetProps
				});
				$$renderer.push(`<!---->`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<div${attributes({ ...mergedProps() })}>`);
				children?.($$renderer, itemState.snippetProps);
				$$renderer.push(`<!----></div>`);
			}
			$$renderer.push(`<!--]--> `);
			Mounted($$renderer, {
				get mounted() {
					return itemState.mounted;
				},
				set mounted($$value) {
					itemState.mounted = $$value;
					$$settled = false;
				}
			});
			$$renderer.push(`<!---->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/select/components/select-viewport.svelte
function Select_viewport($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), ref = null, children, child, $$slots, $$events, ...restProps } = $$props;
		const viewportState = SelectViewportState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, viewportState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/select/components/select-scroll-down-button.svelte
function Select_scroll_down_button$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), ref = null, delay = () => 50, child, children, $$slots, $$events, ...restProps } = $$props;
		const scrollButtonState = SelectScrollDownButtonState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v),
			delay: boxWith(() => delay)
		});
		const mergedProps = derived(() => mergeProps(restProps, scrollButtonState.props));
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (scrollButtonState.canScrollDown) {
				$$renderer.push("<!--[0-->");
				Mounted($$renderer, {
					get mounted() {
						return scrollButtonState.scrollButtonState.mounted;
					},
					set mounted($$value) {
						scrollButtonState.scrollButtonState.mounted = $$value;
						$$settled = false;
					}
				});
				$$renderer.push(`<!----> `);
				if (child) {
					$$renderer.push("<!--[0-->");
					child($$renderer, { props: restProps });
					$$renderer.push(`<!---->`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<div${attributes({ ...mergedProps() })}>`);
					children?.($$renderer);
					$$renderer.push(`<!----></div>`);
				}
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/select/components/select-scroll-up-button.svelte
function Select_scroll_up_button$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), ref = null, delay = () => 50, child, children, $$slots, $$events, ...restProps } = $$props;
		const scrollButtonState = SelectScrollUpButtonState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v),
			delay: boxWith(() => delay)
		});
		const mergedProps = derived(() => mergeProps(restProps, scrollButtonState.props));
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (scrollButtonState.canScrollUp) {
				$$renderer.push("<!--[0-->");
				Mounted($$renderer, {
					get mounted() {
						return scrollButtonState.scrollButtonState.mounted;
					},
					set mounted($$value) {
						scrollButtonState.scrollButtonState.mounted = $$value;
						$$settled = false;
					}
				});
				$$renderer.push(`<!----> `);
				if (child) {
					$$renderer.push("<!--[0-->");
					child($$renderer, { props: restProps });
					$$renderer.push(`<!---->`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<div${attributes({ ...mergedProps() })}>`);
					children?.($$renderer);
					$$renderer.push(`<!----></div>`);
				}
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/context-menu/components/context-menu.svelte
function Context_menu$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { open = false, dir = "ltr", onOpenChange = noop, onOpenChangeComplete = noop, children } = $$props;
		const root = MenuRootState.create({
			variant: boxWith(() => "context-menu"),
			dir: boxWith(() => dir),
			onClose: () => {
				open = false;
				onOpenChange?.(false);
			}
		});
		MenuMenuState.create({
			open: boxWith(() => open, (v) => {
				open = v;
				onOpenChange(v);
			}),
			onOpenChangeComplete: boxWith(() => onOpenChangeComplete)
		}, root);
		Floating_layer($$renderer, {
			children: ($$renderer) => {
				children?.($$renderer);
				$$renderer.push(`<!---->`);
			},
			$$slots: { default: true }
		});
		bind_props($$props, { open });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/menu/components/menu-sub.svelte
function Menu_sub($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { open = false, onOpenChange = noop, onOpenChangeComplete = noop, children } = $$props;
		MenuSubmenuState.create({
			open: boxWith(() => open, (v) => {
				open = v;
				onOpenChange?.(v);
			}),
			onOpenChangeComplete: boxWith(() => onOpenChangeComplete)
		});
		Floating_layer($$renderer, {
			children: ($$renderer) => {
				children?.($$renderer);
				$$renderer.push(`<!---->`);
			},
			$$slots: { default: true }
		});
		bind_props($$props, { open });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/menu/components/menu-item.svelte
function Menu_item($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { child, children, ref = null, id = createId(uid), disabled = false, onSelect = noop, closeOnSelect = true, $$slots, $$events, ...restProps } = $$props;
		const itemState = MenuItemState.create({
			id: boxWith(() => id),
			disabled: boxWith(() => disabled),
			onSelect: boxWith(() => onSelect),
			ref: boxWith(() => ref, (v) => ref = v),
			closeOnSelect: boxWith(() => closeOnSelect)
		});
		const mergedProps = derived(() => mergeProps(restProps, itemState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/context-menu/components/context-menu-content.svelte
function Context_menu_content$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { id = useId(), child, children, ref = null, loop = true, onInteractOutside = noop, onCloseAutoFocus = noop, onOpenAutoFocus = noop, preventScroll = true, side = "right", sideOffset = 2, align = "start", onEscapeKeydown = noop, forceMount = false, trapFocus = false, style, $$slots, $$events, ...restProps } = $$props;
		const contentState = MenuContentState.create({
			id: boxWith(() => id),
			loop: boxWith(() => loop),
			ref: boxWith(() => ref, (v) => ref = v),
			onCloseAutoFocus: boxWith(() => onCloseAutoFocus)
		});
		const mergedProps = derived(() => mergeProps(restProps, contentState.props, {
			side,
			sideOffset,
			align,
			onOpenAutoFocus,
			isValidEvent,
			trapFocus,
			loop,
			id,
			ref: contentState.opts.ref,
			preventScroll,
			onInteractOutside: handleInteractOutside,
			onEscapeKeydown: handleEscapeKeydown,
			shouldRender: contentState.shouldRender
		}));
		function handleInteractOutside(e) {
			onInteractOutside(e);
			if (e.defaultPrevented) return;
			if (e.target && e.target instanceof Element) {
				const subContentSelector = `[${contentState.parentMenu.root.getBitsAttr("sub-content")}]`;
				if (e.target.closest(subContentSelector)) return;
			}
			contentState.parentMenu.onClose();
		}
		function handleEscapeKeydown(e) {
			onEscapeKeydown(e);
			if (e.defaultPrevented) return;
			contentState.parentMenu.onClose();
		}
		function isValidEvent(e) {
			if ("button" in e && e.button === 2) {
				const target = e.target;
				if (!target) return false;
				return target.closest(`[${CONTEXT_MENU_TRIGGER_ATTR}]`) !== contentState.parentMenu.triggerNode;
			}
			return false;
		}
		if (forceMount) {
			$$renderer.push("<!--[0-->");
			{
				function popper($$renderer, { props, wrapperProps }) {
					const finalProps = mergeProps(props, { style: getFloatingContentCSSVars("context-menu") }, { style });
					if (child) {
						$$renderer.push("<!--[0-->");
						child($$renderer, {
							props: finalProps,
							wrapperProps,
							...contentState.snippetProps
						});
						$$renderer.push(`<!---->`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<div${attributes({ ...wrapperProps })}><div${attributes({ ...finalProps })}>`);
						children?.($$renderer);
						$$renderer.push(`<!----></div></div>`);
					}
					$$renderer.push(`<!--]-->`);
				}
				Popper_layer_force_mount($$renderer, spread_props([
					mergedProps(),
					contentState.popperProps,
					{
						enabled: contentState.parentMenu.opts.open.current,
						popper,
						$$slots: { popper: true }
					}
				]));
			}
		} else if (!forceMount) {
			$$renderer.push("<!--[1-->");
			{
				function popper($$renderer, { props, wrapperProps }) {
					const finalProps = mergeProps(props, { style: getFloatingContentCSSVars("context-menu") }, { style });
					if (child) {
						$$renderer.push("<!--[0-->");
						child($$renderer, {
							props: finalProps,
							wrapperProps,
							...contentState.snippetProps
						});
						$$renderer.push(`<!---->`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<div${attributes({ ...wrapperProps })}><div${attributes({ ...finalProps })}>`);
						children?.($$renderer);
						$$renderer.push(`<!----></div></div>`);
					}
					$$renderer.push(`<!--]-->`);
				}
				Popper_layer($$renderer, spread_props([
					mergedProps(),
					contentState.popperProps,
					{
						open: contentState.parentMenu.opts.open.current,
						popper,
						$$slots: { popper: true }
					}
				]));
			}
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/context-menu/components/context-menu-trigger.svelte
function Context_menu_trigger$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { id = useId(), ref = null, child, children, disabled = false, $$slots, $$events, ...restProps } = $$props;
		const triggerState = ContextMenuTriggerState.create({
			id: boxWith(() => id),
			disabled: boxWith(() => disabled),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, triggerState.props, { style: { pointerEvents: "auto" } }, {
			style: restProps.style,
			tabindex: restProps.tabindex
		}));
		if (Floating_layer_anchor) {
			$$renderer.push("<!--[-->");
			Floating_layer_anchor($$renderer, {
				id,
				virtualEl: triggerState.virtualElement,
				ref: triggerState.opts.ref,
				children: ($$renderer) => {
					if (child) {
						$$renderer.push("<!--[0-->");
						child($$renderer, { props: mergedProps() });
						$$renderer.push(`<!---->`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<div${attributes({ ...mergedProps() })}>`);
						children?.($$renderer);
						$$renderer.push(`<!----></div>`);
					}
					$$renderer.push(`<!--]-->`);
				},
				$$slots: { default: true }
			});
			$$renderer.push("<!--]-->");
		} else {
			$$renderer.push("<!--[!-->");
			$$renderer.push("<!--]-->");
		}
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/menu/components/menu-separator.svelte
function Menu_separator($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { ref = null, id = createId(uid), child, children, $$slots, $$events, ...restProps } = $$props;
		const separatorState = MenuSeparatorState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, separatorState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/menu/components/menu-sub-content.svelte
function Menu_sub_content($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), ref = null, children, child, loop = true, onInteractOutside = noop, forceMount = false, onEscapeKeydown = noop, interactOutsideBehavior = "defer-otherwise-close", escapeKeydownBehavior = "defer-otherwise-close", onOpenAutoFocus: onOpenAutoFocusProp = noop, onCloseAutoFocus: onCloseAutoFocusProp = noop, onFocusOutside = noop, side = "right", trapFocus = false, style, $$slots, $$events, ...restProps } = $$props;
		const subContentState = MenuContentState.create({
			id: boxWith(() => id),
			loop: boxWith(() => loop),
			ref: boxWith(() => ref, (v) => ref = v),
			isSub: true,
			onCloseAutoFocus: boxWith(() => handleCloseAutoFocus)
		});
		function onkeydown(e) {
			const isKeyDownInside = e.currentTarget.contains(e.target);
			const isCloseKey = SUB_CLOSE_KEYS[subContentState.parentMenu.root.opts.dir.current].includes(e.key);
			if (isKeyDownInside && isCloseKey) {
				subContentState.parentMenu.onClose();
				subContentState.parentMenu.triggerNode?.focus();
				e.preventDefault();
			}
		}
		const dataAttr = derived(() => subContentState.parentMenu.root.getBitsAttr("sub-content"));
		const mergedProps = derived(() => mergeProps(restProps, subContentState.props, {
			side,
			onkeydown,
			[dataAttr()]: ""
		}));
		function handleOpenAutoFocus(e) {
			onOpenAutoFocusProp(e);
			if (e.defaultPrevented) return;
			e.preventDefault();
			if (subContentState.parentMenu.root.isUsingKeyboard && subContentState.parentMenu.contentNode) MenuOpenEvent.dispatch(subContentState.parentMenu.contentNode);
		}
		function handleCloseAutoFocus(e) {
			onCloseAutoFocusProp(e);
			if (e.defaultPrevented) return;
			e.preventDefault();
		}
		function handleInteractOutside(e) {
			onInteractOutside(e);
			if (e.defaultPrevented) return;
			subContentState.parentMenu.onClose();
		}
		function handleEscapeKeydown(e) {
			onEscapeKeydown(e);
			if (e.defaultPrevented) return;
			subContentState.parentMenu.onClose();
		}
		function handleOnFocusOutside(e) {
			onFocusOutside(e);
			if (e.defaultPrevented) return;
			if (!isHTMLElement(e.target)) return;
			if (e.target.id === subContentState.parentMenu.triggerNode?.id) return;
			if ((subContentState.parentMenu.parentMenu?.contentNode)?.contains(e.target)) {
				subContentState.parentMenu.onClose();
				e.preventDefault();
				return;
			}
			const subContentSelector = `[${subContentState.parentMenu.root.getBitsAttr("sub-content")}]`;
			if (e.target.closest(subContentSelector)) {
				e.preventDefault();
				return;
			}
			subContentState.parentMenu.onClose();
		}
		if (forceMount) {
			$$renderer.push("<!--[0-->");
			{
				function popper($$renderer, { props, wrapperProps }) {
					const finalProps = mergeProps(props, mergedProps(), { style: getFloatingContentCSSVars("menu") }, { style });
					if (child) {
						$$renderer.push("<!--[0-->");
						child($$renderer, {
							props: finalProps,
							wrapperProps,
							...subContentState.snippetProps
						});
						$$renderer.push(`<!---->`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<div${attributes({ ...wrapperProps })}><div${attributes({ ...finalProps })}>`);
						children?.($$renderer);
						$$renderer.push(`<!----></div></div>`);
					}
					$$renderer.push(`<!--]-->`);
				}
				Popper_layer_force_mount($$renderer, spread_props([mergedProps(), {
					ref: subContentState.opts.ref,
					interactOutsideBehavior,
					escapeKeydownBehavior,
					onOpenAutoFocus: handleOpenAutoFocus,
					enabled: subContentState.parentMenu.opts.open.current,
					onInteractOutside: handleInteractOutside,
					onEscapeKeydown: handleEscapeKeydown,
					onFocusOutside: handleOnFocusOutside,
					preventScroll: false,
					loop,
					trapFocus,
					shouldRender: subContentState.shouldRender,
					popper,
					$$slots: { popper: true }
				}]));
			}
		} else if (!forceMount) {
			$$renderer.push("<!--[1-->");
			{
				function popper($$renderer, { props, wrapperProps }) {
					const finalProps = mergeProps(props, mergedProps(), { style: getFloatingContentCSSVars("menu") }, { style });
					if (child) {
						$$renderer.push("<!--[0-->");
						child($$renderer, {
							props: finalProps,
							wrapperProps,
							...subContentState.snippetProps
						});
						$$renderer.push(`<!---->`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<div${attributes({ ...wrapperProps })}><div${attributes({ ...finalProps })}>`);
						children?.($$renderer);
						$$renderer.push(`<!----></div></div>`);
					}
					$$renderer.push(`<!--]-->`);
				}
				Popper_layer($$renderer, spread_props([mergedProps(), {
					ref: subContentState.opts.ref,
					interactOutsideBehavior,
					escapeKeydownBehavior,
					onCloseAutoFocus: handleCloseAutoFocus,
					onOpenAutoFocus: handleOpenAutoFocus,
					open: subContentState.parentMenu.opts.open.current,
					onInteractOutside: handleInteractOutside,
					onEscapeKeydown: handleEscapeKeydown,
					onFocusOutside: handleOnFocusOutside,
					preventScroll: false,
					loop,
					trapFocus,
					shouldRender: subContentState.shouldRender,
					popper,
					$$slots: { popper: true }
				}]));
			}
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/menu/components/menu-sub-trigger.svelte
function Menu_sub_trigger($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), disabled = false, ref = null, children, child, onSelect = noop, openDelay = 0, $$slots, $$events, ...restProps } = $$props;
		const subTriggerState = MenuSubTriggerState.create({
			disabled: boxWith(() => disabled),
			onSelect: boxWith(() => onSelect),
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v),
			openDelay: boxWith(() => openDelay)
		});
		const mergedProps = derived(() => mergeProps(restProps, subTriggerState.props));
		Floating_layer_anchor($$renderer, {
			id,
			ref: subTriggerState.opts.ref,
			children: ($$renderer) => {
				if (child) {
					$$renderer.push("<!--[0-->");
					child($$renderer, { props: mergedProps() });
					$$renderer.push(`<!---->`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<div${attributes({ ...mergedProps() })}>`);
					children?.($$renderer);
					$$renderer.push(`<!----></div>`);
				}
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		});
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/menu/components/menu-checkbox-item.svelte
function Menu_checkbox_item($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { child, children, ref = null, checked = false, id = createId(uid), onCheckedChange = noop, disabled = false, onSelect = noop, closeOnSelect = true, indeterminate = false, onIndeterminateChange = noop, value = "", $$slots, $$events, ...restProps } = $$props;
		const group = MenuCheckboxGroupContext.getOr(null);
		if (group && value) if (group.opts.value.current.includes(value)) checked = true;
		else checked = false;
		watch.pre(() => value, () => {
			if (group && value) if (group.opts.value.current.includes(value)) checked = true;
			else checked = false;
		});
		const checkboxItemState = MenuCheckboxItemState.create({
			checked: boxWith(() => checked, (v) => {
				if (v !== checked) {
					checked = v;
					onCheckedChange(v);
				}
			}),
			id: boxWith(() => id),
			disabled: boxWith(() => disabled),
			onSelect: boxWith(() => handleSelect),
			ref: boxWith(() => ref, (v) => ref = v),
			closeOnSelect: boxWith(() => closeOnSelect),
			indeterminate: boxWith(() => indeterminate, (v) => {
				if (v !== indeterminate) {
					indeterminate = v;
					onIndeterminateChange(v);
				}
			}),
			value: boxWith(() => value)
		}, group);
		function handleSelect(e) {
			onSelect(e);
			if (e.defaultPrevented) return;
			checkboxItemState.toggleChecked();
		}
		const mergedProps = derived(() => mergeProps(restProps, checkboxItemState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, {
				checked,
				indeterminate,
				props: mergedProps()
			});
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer, {
				checked,
				indeterminate
			});
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, {
			ref,
			checked,
			indeterminate
		});
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/dialog/components/dialog.svelte
function Dialog$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { open = false, onOpenChange = noop, onOpenChangeComplete = noop, children } = $$props;
		DialogRootState.create({
			variant: boxWith(() => "dialog"),
			open: boxWith(() => open, (v) => {
				open = v;
				onOpenChange(v);
			}),
			onOpenChangeComplete: boxWith(() => onOpenChangeComplete)
		});
		children?.($$renderer);
		$$renderer.push(`<!---->`);
		bind_props($$props, { open });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/dialog/components/dialog-close.svelte
function Dialog_close($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { children, child, id = createId(uid), ref = null, disabled = false, $$slots, $$events, ...restProps } = $$props;
		const closeState = DialogCloseState.create({
			variant: boxWith(() => "close"),
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v),
			disabled: boxWith(() => Boolean(disabled))
		});
		const mergedProps = derived(() => mergeProps(restProps, closeState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<button${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></button>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/dialog/components/dialog-content.svelte
function Dialog_content$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), children, child, ref = null, forceMount = false, onCloseAutoFocus = noop, onOpenAutoFocus = noop, onEscapeKeydown = noop, onInteractOutside = noop, trapFocus = true, preventScroll = true, restoreScrollDelay = null, $$slots, $$events, ...restProps } = $$props;
		const contentState = DialogContentState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, contentState.props));
		if (contentState.shouldRender || forceMount) {
			$$renderer.push("<!--[0-->");
			{
				function focusScope($$renderer, { props: focusScopeProps }) {
					Escape_layer($$renderer, spread_props([mergedProps(), {
						enabled: contentState.root.opts.open.current,
						ref: contentState.opts.ref,
						onEscapeKeydown: (e) => {
							onEscapeKeydown(e);
							if (e.defaultPrevented) return;
							contentState.root.handleClose();
						},
						children: ($$renderer) => {
							Dismissible_layer($$renderer, spread_props([mergedProps(), {
								ref: contentState.opts.ref,
								enabled: contentState.root.opts.open.current,
								onInteractOutside: (e) => {
									onInteractOutside(e);
									if (e.defaultPrevented) return;
									contentState.root.handleClose();
								},
								children: ($$renderer) => {
									Text_selection_layer($$renderer, spread_props([mergedProps(), {
										ref: contentState.opts.ref,
										enabled: contentState.root.opts.open.current,
										children: ($$renderer) => {
											if (child) {
												$$renderer.push("<!--[0-->");
												if (contentState.root.opts.open.current) {
													$$renderer.push("<!--[0-->");
													Scroll_lock($$renderer, {
														preventScroll,
														restoreScrollDelay
													});
												} else $$renderer.push("<!--[-1-->");
												$$renderer.push(`<!--]--> `);
												child($$renderer, {
													props: mergeProps(mergedProps(), focusScopeProps),
													...contentState.snippetProps
												});
												$$renderer.push(`<!---->`);
											} else {
												$$renderer.push("<!--[-1-->");
												Scroll_lock($$renderer, { preventScroll });
												$$renderer.push(`<!----> <div${attributes({ ...mergeProps(mergedProps(), focusScopeProps) })}>`);
												children?.($$renderer);
												$$renderer.push(`<!----></div>`);
											}
											$$renderer.push(`<!--]-->`);
										},
										$$slots: { default: true }
									}]));
								},
								$$slots: { default: true }
							}]));
						},
						$$slots: { default: true }
					}]));
				}
				Focus_scope($$renderer, {
					ref: contentState.opts.ref,
					loop: true,
					trapFocus,
					enabled: contentState.root.opts.open.current,
					onOpenAutoFocus,
					onCloseAutoFocus,
					focusScope,
					$$slots: { focusScope: true }
				});
			}
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/label/label.svelte.js
var labelAttrs = createBitsAttrs({
	component: "label",
	parts: ["root"]
});
var LabelRootState = class LabelRootState {
	static create(opts) {
		return new LabelRootState(opts);
	}
	opts;
	attachment;
	constructor(opts) {
		this.opts = opts;
		this.attachment = attachRef(this.opts.ref);
		this.onmousedown = this.onmousedown.bind(this);
	}
	onmousedown(e) {
		if (e.detail > 1) e.preventDefault();
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		[labelAttrs.root]: "",
		onmousedown: this.onmousedown,
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/label/components/label.svelte
function Label$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { children, child, id = createId(uid), ref = null, for: forProp, $$slots, $$events, ...restProps } = $$props;
		const rootState = LabelRootState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, rootState.props, { for: forProp }));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<label${attributes({
				...mergedProps(),
				for: forProp
			})}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></label>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/internal/svelte-resize-observer.svelte.js
var SvelteResizeObserver = class {
	#node;
	#onResize;
	constructor(node, onResize) {
		this.#node = node;
		this.#onResize = onResize;
		this.handler = this.handler.bind(this);
	}
	handler() {
		let rAF = 0;
		const _node = this.#node();
		if (!_node) return;
		const resizeObserver = new ResizeObserver(() => {
			cancelAnimationFrame(rAF);
			rAF = window.requestAnimationFrame(this.#onResize);
		});
		resizeObserver.observe(_node);
		return () => {
			window.cancelAnimationFrame(rAF);
			resizeObserver.unobserve(_node);
		};
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/presence-layer/presence.svelte.js
var Presence = class {
	opts;
	present;
	#afterAnimations;
	#isPresent = false;
	#hasMounted = false;
	#transitionStatus = void 0;
	#transitionFrame = null;
	constructor(opts) {
		this.opts = opts;
		this.present = this.opts.open;
		this.#isPresent = opts.open.current;
		this.#afterAnimations = new AnimationsComplete({
			ref: this.opts.ref,
			afterTick: this.opts.open
		});
		watch(() => this.present.current, (isOpen) => {
			if (!this.#hasMounted) {
				this.#hasMounted = true;
				return;
			}
			this.#clearTransitionFrame();
			if (isOpen) this.#isPresent = true;
			this.#transitionStatus = isOpen ? "starting" : "ending";
			if (isOpen) this.#transitionFrame = window.requestAnimationFrame(() => {
				this.#transitionFrame = null;
				if (this.present.current) this.#transitionStatus = void 0;
			});
			this.#afterAnimations.run(() => {
				if (isOpen !== this.present.current) return;
				if (!isOpen) this.#isPresent = false;
				this.#transitionStatus = void 0;
			});
		});
	}
	#_isPresent = derived(() => {
		return this.#isPresent;
	});
	get isPresent() {
		return this.#_isPresent();
	}
	set isPresent($$value) {
		return this.#_isPresent($$value);
	}
	get transitionStatus() {
		return this.#transitionStatus;
	}
	#clearTransitionFrame() {
		if (this.#transitionFrame === null) return;
		window.cancelAnimationFrame(this.#transitionFrame);
		this.#transitionFrame = null;
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/utilities/presence-layer/presence-layer.svelte
function Presence_layer($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { open, forceMount, presence, ref } = $$props;
		const presenceState = new Presence({
			open: boxWith(() => open),
			ref
		});
		if (forceMount || open || presenceState.isPresent) {
			$$renderer.push("<!--[0-->");
			presence?.($$renderer, {
				present: presenceState.isPresent,
				transitionStatus: presenceState.transitionStatus
			});
			$$renderer.push(`<!---->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/internal/clamp.js
/**
* Clamps a number between a minimum and maximum value.
*/
function clamp(n, min, max) {
	return Math.min(max, Math.max(min, n));
}
//#endregion
//#region node_modules/bits-ui/dist/internal/state-machine.js
var StateMachine = class {
	state;
	#machine;
	constructor(initialState, machine) {
		this.state = simpleBox(initialState);
		this.#machine = machine;
		this.dispatch = this.dispatch.bind(this);
	}
	#reducer(event) {
		return this.#machine[this.state.current][event] ?? this.state.current;
	}
	dispatch(event) {
		this.state.current = this.#reducer(event);
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/scroll-area.svelte.js
var scrollAreaAttrs = createBitsAttrs({
	component: "scroll-area",
	parts: [
		"root",
		"viewport",
		"corner",
		"thumb",
		"scrollbar"
	]
});
var ScrollAreaRootContext = new Context("ScrollArea.Root");
var ScrollAreaScrollbarContext = new Context("ScrollArea.Scrollbar");
var ScrollAreaScrollbarVisibleContext = new Context("ScrollArea.ScrollbarVisible");
var ScrollAreaScrollbarAxisContext = new Context("ScrollArea.ScrollbarAxis");
var ScrollAreaScrollbarSharedContext = new Context("ScrollArea.ScrollbarShared");
var ScrollAreaRootState = class ScrollAreaRootState {
	static create(opts) {
		return ScrollAreaRootContext.set(new ScrollAreaRootState(opts));
	}
	opts;
	attachment;
	scrollAreaNode = null;
	viewportNode = null;
	contentNode = null;
	scrollbarXNode = null;
	scrollbarYNode = null;
	cornerWidth = 0;
	cornerHeight = 0;
	scrollbarXEnabled = false;
	scrollbarYEnabled = false;
	domContext;
	constructor(opts) {
		this.opts = opts;
		this.attachment = attachRef(opts.ref, (v) => this.scrollAreaNode = v);
		this.domContext = new DOMContext(opts.ref);
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		dir: this.opts.dir.current,
		style: {
			position: "relative",
			"--bits-scroll-area-corner-height": `${this.cornerHeight}px`,
			"--bits-scroll-area-corner-width": `${this.cornerWidth}px`
		},
		[scrollAreaAttrs.root]: "",
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var ScrollAreaViewportState = class ScrollAreaViewportState {
	static create(opts) {
		return new ScrollAreaViewportState(opts, ScrollAreaRootContext.get());
	}
	opts;
	root;
	attachment;
	#contentId = simpleBox(useId());
	#contentRef = simpleBox(null);
	contentAttachment = attachRef(this.#contentRef, (v) => this.root.contentNode = v);
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(opts.ref, (v) => this.root.viewportNode = v);
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		style: {
			overflowX: this.root.scrollbarXEnabled ? "scroll" : "hidden",
			overflowY: this.root.scrollbarYEnabled ? "scroll" : "hidden"
		},
		[scrollAreaAttrs.viewport]: "",
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
	#contentProps = derived(() => ({
		id: this.#contentId.current,
		"data-scroll-area-content": "",
		style: { minWidth: this.root.scrollbarXEnabled ? "fit-content" : void 0 },
		...this.contentAttachment
	}));
	get contentProps() {
		return this.#contentProps();
	}
	set contentProps($$value) {
		return this.#contentProps($$value);
	}
};
var ScrollAreaScrollbarState = class ScrollAreaScrollbarState {
	static create(opts) {
		return ScrollAreaScrollbarContext.set(new ScrollAreaScrollbarState(opts, ScrollAreaRootContext.get()));
	}
	opts;
	root;
	#isHorizontal = derived(() => this.opts.orientation.current === "horizontal");
	get isHorizontal() {
		return this.#isHorizontal();
	}
	set isHorizontal($$value) {
		return this.#isHorizontal($$value);
	}
	hasThumb = false;
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		watch(() => this.isHorizontal, (isHorizontal) => {
			if (isHorizontal) {
				this.root.scrollbarXEnabled = true;
				return () => {
					this.root.scrollbarXEnabled = false;
				};
			} else {
				this.root.scrollbarYEnabled = true;
				return () => {
					this.root.scrollbarYEnabled = false;
				};
			}
		});
	}
};
var ScrollAreaScrollbarHoverState = class ScrollAreaScrollbarHoverState {
	static create() {
		return new ScrollAreaScrollbarHoverState(ScrollAreaScrollbarContext.get());
	}
	scrollbar;
	root;
	isVisible = false;
	constructor(scrollbar) {
		this.scrollbar = scrollbar;
		this.root = scrollbar.root;
	}
	#props = derived(() => ({ "data-state": this.isVisible ? "visible" : "hidden" }));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var ScrollAreaScrollbarScrollState = class ScrollAreaScrollbarScrollState {
	static create() {
		return new ScrollAreaScrollbarScrollState(ScrollAreaScrollbarContext.get());
	}
	scrollbar;
	root;
	machine = new StateMachine("hidden", {
		hidden: { SCROLL: "scrolling" },
		scrolling: {
			SCROLL_END: "idle",
			POINTER_ENTER: "interacting"
		},
		interacting: {
			SCROLL: "interacting",
			POINTER_LEAVE: "idle"
		},
		idle: {
			HIDE: "hidden",
			SCROLL: "scrolling",
			POINTER_ENTER: "interacting"
		}
	});
	#isHidden = derived(() => this.machine.state.current === "hidden");
	get isHidden() {
		return this.#isHidden();
	}
	set isHidden($$value) {
		return this.#isHidden($$value);
	}
	constructor(scrollbar) {
		this.scrollbar = scrollbar;
		this.root = scrollbar.root;
		useDebounce(() => this.machine.dispatch("SCROLL_END"), 100);
		this.onpointerenter = this.onpointerenter.bind(this);
		this.onpointerleave = this.onpointerleave.bind(this);
	}
	onpointerenter(_) {
		this.machine.dispatch("POINTER_ENTER");
	}
	onpointerleave(_) {
		this.machine.dispatch("POINTER_LEAVE");
	}
	#props = derived(() => ({
		"data-state": this.machine.state.current === "hidden" ? "hidden" : "visible",
		onpointerenter: this.onpointerenter,
		onpointerleave: this.onpointerleave
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var ScrollAreaScrollbarAutoState = class ScrollAreaScrollbarAutoState {
	static create() {
		return new ScrollAreaScrollbarAutoState(ScrollAreaScrollbarContext.get());
	}
	scrollbar;
	root;
	isVisible = false;
	constructor(scrollbar) {
		this.scrollbar = scrollbar;
		this.root = scrollbar.root;
		const handleResize = useDebounce(() => {
			const viewportNode = this.root.viewportNode;
			if (!viewportNode) return;
			const isOverflowX = viewportNode.offsetWidth < viewportNode.scrollWidth;
			const isOverflowY = viewportNode.offsetHeight < viewportNode.scrollHeight;
			this.isVisible = this.scrollbar.isHorizontal ? isOverflowX : isOverflowY;
		}, 10);
		new SvelteResizeObserver(() => this.root.viewportNode, handleResize);
		new SvelteResizeObserver(() => this.root.contentNode, handleResize);
	}
	#props = derived(() => ({ "data-state": this.isVisible ? "visible" : "hidden" }));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var ScrollAreaScrollbarVisibleState = class ScrollAreaScrollbarVisibleState {
	static create() {
		return ScrollAreaScrollbarVisibleContext.set(new ScrollAreaScrollbarVisibleState(ScrollAreaScrollbarContext.get()));
	}
	scrollbar;
	root;
	thumbNode = null;
	pointerOffset = 0;
	sizes = {
		content: 0,
		viewport: 0,
		scrollbar: {
			size: 0,
			paddingStart: 0,
			paddingEnd: 0
		}
	};
	#thumbRatio = derived(() => getThumbRatio(this.sizes.viewport, this.sizes.content));
	get thumbRatio() {
		return this.#thumbRatio();
	}
	set thumbRatio($$value) {
		return this.#thumbRatio($$value);
	}
	#hasThumb = derived(() => Boolean(this.thumbRatio > 0 && this.thumbRatio < 1));
	get hasThumb() {
		return this.#hasThumb();
	}
	set hasThumb($$value) {
		return this.#hasThumb($$value);
	}
	prevTransformStyle = "";
	constructor(scrollbar) {
		this.scrollbar = scrollbar;
		this.root = scrollbar.root;
	}
	setSizes(sizes) {
		this.sizes = sizes;
	}
	getScrollPosition(pointerPos, dir) {
		return getScrollPositionFromPointer({
			pointerPos,
			pointerOffset: this.pointerOffset,
			sizes: this.sizes,
			dir
		});
	}
	onThumbPointerUp() {
		this.pointerOffset = 0;
	}
	onThumbPointerDown(pointerPos) {
		this.pointerOffset = pointerPos;
	}
	xOnThumbPositionChange() {
		if (!(this.root.viewportNode && this.thumbNode)) return;
		const scrollPos = this.root.viewportNode.scrollLeft;
		const transformStyle = `translate3d(${getThumbOffsetFromScroll({
			scrollPos,
			sizes: this.sizes,
			dir: this.root.opts.dir.current
		})}px, 0, 0)`;
		this.thumbNode.style.transform = transformStyle;
		this.prevTransformStyle = transformStyle;
	}
	xOnWheelScroll(scrollPos) {
		if (!this.root.viewportNode) return;
		this.root.viewportNode.scrollLeft = scrollPos;
	}
	xOnDragScroll(pointerPos) {
		if (!this.root.viewportNode) return;
		this.root.viewportNode.scrollLeft = this.getScrollPosition(pointerPos, this.root.opts.dir.current);
	}
	yOnThumbPositionChange() {
		if (!(this.root.viewportNode && this.thumbNode)) return;
		const scrollPos = this.root.viewportNode.scrollTop;
		const transformStyle = `translate3d(0, ${getThumbOffsetFromScroll({
			scrollPos,
			sizes: this.sizes
		})}px, 0)`;
		this.thumbNode.style.transform = transformStyle;
		this.prevTransformStyle = transformStyle;
	}
	yOnWheelScroll(scrollPos) {
		if (!this.root.viewportNode) return;
		this.root.viewportNode.scrollTop = scrollPos;
	}
	yOnDragScroll(pointerPos) {
		if (!this.root.viewportNode) return;
		this.root.viewportNode.scrollTop = this.getScrollPosition(pointerPos, this.root.opts.dir.current);
	}
};
var ScrollAreaScrollbarXState = class ScrollAreaScrollbarXState {
	static create(opts) {
		return ScrollAreaScrollbarAxisContext.set(new ScrollAreaScrollbarXState(opts, ScrollAreaScrollbarVisibleContext.get()));
	}
	opts;
	scrollbarVis;
	root;
	scrollbar;
	attachment;
	computedStyle;
	constructor(opts, scrollbarVis) {
		this.opts = opts;
		this.scrollbarVis = scrollbarVis;
		this.root = scrollbarVis.root;
		this.scrollbar = scrollbarVis.scrollbar;
		this.attachment = attachRef(this.scrollbar.opts.ref, (v) => this.root.scrollbarXNode = v);
	}
	onThumbPointerDown = (pointerPos) => {
		this.scrollbarVis.onThumbPointerDown(pointerPos.x);
	};
	onDragScroll = (pointerPos) => {
		this.scrollbarVis.xOnDragScroll(pointerPos.x);
	};
	onThumbPointerUp = () => {
		this.scrollbarVis.onThumbPointerUp();
	};
	onThumbPositionChange = () => {
		this.scrollbarVis.xOnThumbPositionChange();
	};
	onWheelScroll = (e, maxScrollPos) => {
		if (!this.root.viewportNode) return;
		const scrollPos = this.root.viewportNode.scrollLeft + e.deltaX;
		this.scrollbarVis.xOnWheelScroll(scrollPos);
		if (isScrollingWithinScrollbarBounds(scrollPos, maxScrollPos)) e.preventDefault();
	};
	onResize = () => {
		if (!(this.scrollbar.opts.ref.current && this.root.viewportNode && this.computedStyle)) return;
		this.scrollbarVis.setSizes({
			content: this.root.viewportNode.scrollWidth,
			viewport: this.root.viewportNode.offsetWidth,
			scrollbar: {
				size: this.scrollbar.opts.ref.current.clientWidth,
				paddingStart: toInt(this.computedStyle.paddingLeft),
				paddingEnd: toInt(this.computedStyle.paddingRight)
			}
		});
	};
	#thumbSize = derived(() => {
		return getThumbSize(this.scrollbarVis.sizes);
	});
	get thumbSize() {
		return this.#thumbSize();
	}
	set thumbSize($$value) {
		return this.#thumbSize($$value);
	}
	#props = derived(() => ({
		id: this.scrollbar.opts.id.current,
		"data-orientation": "horizontal",
		style: {
			bottom: 0,
			left: this.root.opts.dir.current === "rtl" ? "var(--bits-scroll-area-corner-width)" : 0,
			right: this.root.opts.dir.current === "ltr" ? "var(--bits-scroll-area-corner-width)" : 0,
			"--bits-scroll-area-thumb-width": `${this.thumbSize}px`
		},
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var ScrollAreaScrollbarYState = class ScrollAreaScrollbarYState {
	static create(opts) {
		return ScrollAreaScrollbarAxisContext.set(new ScrollAreaScrollbarYState(opts, ScrollAreaScrollbarVisibleContext.get()));
	}
	opts;
	scrollbarVis;
	root;
	scrollbar;
	attachment;
	computedStyle;
	constructor(opts, scrollbarVis) {
		this.opts = opts;
		this.scrollbarVis = scrollbarVis;
		this.root = scrollbarVis.root;
		this.scrollbar = scrollbarVis.scrollbar;
		this.attachment = attachRef(this.scrollbar.opts.ref, (v) => this.root.scrollbarYNode = v);
		this.onThumbPointerDown = this.onThumbPointerDown.bind(this);
		this.onDragScroll = this.onDragScroll.bind(this);
		this.onThumbPointerUp = this.onThumbPointerUp.bind(this);
		this.onThumbPositionChange = this.onThumbPositionChange.bind(this);
		this.onWheelScroll = this.onWheelScroll.bind(this);
		this.onResize = this.onResize.bind(this);
	}
	onThumbPointerDown(pointerPos) {
		this.scrollbarVis.onThumbPointerDown(pointerPos.y);
	}
	onDragScroll(pointerPos) {
		this.scrollbarVis.yOnDragScroll(pointerPos.y);
	}
	onThumbPointerUp() {
		this.scrollbarVis.onThumbPointerUp();
	}
	onThumbPositionChange() {
		this.scrollbarVis.yOnThumbPositionChange();
	}
	onWheelScroll(e, maxScrollPos) {
		if (!this.root.viewportNode) return;
		const scrollPos = this.root.viewportNode.scrollTop + e.deltaY;
		this.scrollbarVis.yOnWheelScroll(scrollPos);
		if (isScrollingWithinScrollbarBounds(scrollPos, maxScrollPos)) e.preventDefault();
	}
	onResize() {
		if (!(this.scrollbar.opts.ref.current && this.root.viewportNode && this.computedStyle)) return;
		this.scrollbarVis.setSizes({
			content: this.root.viewportNode.scrollHeight,
			viewport: this.root.viewportNode.offsetHeight,
			scrollbar: {
				size: this.scrollbar.opts.ref.current.clientHeight,
				paddingStart: toInt(this.computedStyle.paddingTop),
				paddingEnd: toInt(this.computedStyle.paddingBottom)
			}
		});
	}
	#thumbSize = derived(() => {
		return getThumbSize(this.scrollbarVis.sizes);
	});
	get thumbSize() {
		return this.#thumbSize();
	}
	set thumbSize($$value) {
		return this.#thumbSize($$value);
	}
	#props = derived(() => ({
		id: this.scrollbar.opts.id.current,
		"data-orientation": "vertical",
		style: {
			top: 0,
			right: this.root.opts.dir.current === "ltr" ? 0 : void 0,
			left: this.root.opts.dir.current === "rtl" ? 0 : void 0,
			bottom: "var(--bits-scroll-area-corner-height)",
			"--bits-scroll-area-thumb-height": `${this.thumbSize}px`
		},
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var ScrollAreaScrollbarSharedState = class ScrollAreaScrollbarSharedState {
	static create() {
		return ScrollAreaScrollbarSharedContext.set(new ScrollAreaScrollbarSharedState(ScrollAreaScrollbarAxisContext.get()));
	}
	scrollbarState;
	root;
	scrollbarVis;
	scrollbar;
	rect = null;
	prevWebkitUserSelect = "";
	handleResize;
	handleThumbPositionChange;
	handleWheelScroll;
	handleThumbPointerDown;
	handleThumbPointerUp;
	#maxScrollPos = derived(() => this.scrollbarVis.sizes.content - this.scrollbarVis.sizes.viewport);
	get maxScrollPos() {
		return this.#maxScrollPos();
	}
	set maxScrollPos($$value) {
		return this.#maxScrollPos($$value);
	}
	constructor(scrollbarState) {
		this.scrollbarState = scrollbarState;
		this.root = scrollbarState.root;
		this.scrollbarVis = scrollbarState.scrollbarVis;
		this.scrollbar = scrollbarState.scrollbarVis.scrollbar;
		this.handleResize = useDebounce(() => this.scrollbarState.onResize(), 10);
		this.handleThumbPositionChange = this.scrollbarState.onThumbPositionChange;
		this.handleWheelScroll = this.scrollbarState.onWheelScroll;
		this.handleThumbPointerDown = this.scrollbarState.onThumbPointerDown;
		this.handleThumbPointerUp = this.scrollbarState.onThumbPointerUp;
		new SvelteResizeObserver(() => this.scrollbar.opts.ref.current, this.handleResize);
		new SvelteResizeObserver(() => this.root.contentNode, this.handleResize);
		this.onpointerdown = this.onpointerdown.bind(this);
		this.onpointermove = this.onpointermove.bind(this);
		this.onpointerup = this.onpointerup.bind(this);
		this.onlostpointercapture = this.onlostpointercapture.bind(this);
	}
	handleDragScroll(e) {
		if (!this.rect) return;
		const x = e.clientX - this.rect.left;
		const y = e.clientY - this.rect.top;
		this.scrollbarState.onDragScroll({
			x,
			y
		});
	}
	#cleanupPointerState() {
		if (this.rect === null) return;
		this.root.domContext.getDocument().body.style.webkitUserSelect = this.prevWebkitUserSelect;
		if (this.root.viewportNode) this.root.viewportNode.style.scrollBehavior = "";
		this.rect = null;
	}
	onpointerdown(e) {
		if (e.button !== 0) return;
		e.target.setPointerCapture(e.pointerId);
		this.rect = this.scrollbar.opts.ref.current?.getBoundingClientRect() ?? null;
		this.prevWebkitUserSelect = this.root.domContext.getDocument().body.style.webkitUserSelect;
		this.root.domContext.getDocument().body.style.webkitUserSelect = "none";
		if (this.root.viewportNode) this.root.viewportNode.style.scrollBehavior = "auto";
		this.handleDragScroll(e);
	}
	onpointermove(e) {
		this.handleDragScroll(e);
	}
	onpointerup(e) {
		const target = e.target;
		if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
		this.#cleanupPointerState();
	}
	onlostpointercapture(_) {
		this.#cleanupPointerState();
	}
	#props = derived(() => mergeProps({
		...this.scrollbarState.props,
		style: {
			position: "absolute",
			...this.scrollbarState.props.style
		},
		[scrollAreaAttrs.scrollbar]: "",
		onpointerdown: this.onpointerdown,
		onpointermove: this.onpointermove,
		onpointerup: this.onpointerup,
		onlostpointercapture: this.onlostpointercapture
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var ScrollAreaThumbImplState = class ScrollAreaThumbImplState {
	static create(opts) {
		return new ScrollAreaThumbImplState(opts, ScrollAreaScrollbarSharedContext.get());
	}
	opts;
	scrollbarState;
	attachment;
	#root;
	#removeUnlinkedScrollListener;
	#debounceScrollEnd = useDebounce(() => {
		if (this.#removeUnlinkedScrollListener) {
			this.#removeUnlinkedScrollListener();
			this.#removeUnlinkedScrollListener = void 0;
		}
	}, 100);
	constructor(opts, scrollbarState) {
		this.opts = opts;
		this.scrollbarState = scrollbarState;
		this.#root = scrollbarState.root;
		this.attachment = attachRef(this.opts.ref, (v) => this.scrollbarState.scrollbarVis.thumbNode = v);
		this.onpointerdowncapture = this.onpointerdowncapture.bind(this);
		this.onpointerup = this.onpointerup.bind(this);
	}
	onpointerdowncapture(e) {
		const thumb = e.target;
		if (!thumb) return;
		const thumbRect = thumb.getBoundingClientRect();
		const x = e.clientX - thumbRect.left;
		const y = e.clientY - thumbRect.top;
		this.scrollbarState.handleThumbPointerDown({
			x,
			y
		});
	}
	onpointerup(_) {
		this.scrollbarState.handleThumbPointerUp();
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		"data-state": this.scrollbarState.scrollbarVis.hasThumb ? "visible" : "hidden",
		style: {
			width: "var(--bits-scroll-area-thumb-width)",
			height: "var(--bits-scroll-area-thumb-height)",
			transform: this.scrollbarState.scrollbarVis.prevTransformStyle
		},
		onpointerdowncapture: this.onpointerdowncapture,
		onpointerup: this.onpointerup,
		[scrollAreaAttrs.thumb]: "",
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var ScrollAreaCornerImplState = class ScrollAreaCornerImplState {
	static create(opts) {
		return new ScrollAreaCornerImplState(opts, ScrollAreaRootContext.get());
	}
	opts;
	root;
	attachment;
	#width = 0;
	#height = 0;
	#hasSize = derived(() => Boolean(this.#width && this.#height));
	get hasSize() {
		return this.#hasSize();
	}
	set hasSize($$value) {
		return this.#hasSize($$value);
	}
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(this.opts.ref);
		new SvelteResizeObserver(() => this.root.scrollbarXNode, () => {
			const height = this.root.scrollbarXNode?.offsetHeight || 0;
			this.root.cornerHeight = height;
			this.#height = height;
		});
		new SvelteResizeObserver(() => this.root.scrollbarYNode, () => {
			const width = this.root.scrollbarYNode?.offsetWidth || 0;
			this.root.cornerWidth = width;
			this.#width = width;
		});
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		style: {
			width: this.#width,
			height: this.#height,
			position: "absolute",
			right: this.root.opts.dir.current === "ltr" ? 0 : void 0,
			left: this.root.opts.dir.current === "rtl" ? 0 : void 0,
			bottom: 0
		},
		[scrollAreaAttrs.corner]: "",
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
function toInt(value) {
	return value ? Number.parseInt(value, 10) : 0;
}
function getThumbRatio(viewportSize, contentSize) {
	const ratio = viewportSize / contentSize;
	return Number.isNaN(ratio) ? 0 : ratio;
}
function getThumbSize(sizes) {
	const ratio = getThumbRatio(sizes.viewport, sizes.content);
	const scrollbarPadding = sizes.scrollbar.paddingStart + sizes.scrollbar.paddingEnd;
	const thumbSize = (sizes.scrollbar.size - scrollbarPadding) * ratio;
	return Math.max(thumbSize, 18);
}
function getScrollPositionFromPointer({ pointerPos, pointerOffset, sizes, dir = "ltr" }) {
	const thumbSizePx = getThumbSize(sizes);
	const thumbCenter = thumbSizePx / 2;
	const offset = pointerOffset || thumbCenter;
	const thumbOffsetFromEnd = thumbSizePx - offset;
	const minPointerPos = sizes.scrollbar.paddingStart + offset;
	const maxPointerPos = sizes.scrollbar.size - sizes.scrollbar.paddingEnd - thumbOffsetFromEnd;
	const maxScrollPos = sizes.content - sizes.viewport;
	const scrollRange = dir === "ltr" ? [0, maxScrollPos] : [maxScrollPos * -1, 0];
	return linearScale$1([minPointerPos, maxPointerPos], scrollRange)(pointerPos);
}
function getThumbOffsetFromScroll({ scrollPos, sizes, dir = "ltr" }) {
	const thumbSizePx = getThumbSize(sizes);
	const scrollbarPadding = sizes.scrollbar.paddingStart + sizes.scrollbar.paddingEnd;
	const scrollbar = sizes.scrollbar.size - scrollbarPadding;
	const maxScrollPos = sizes.content - sizes.viewport;
	const maxThumbPos = scrollbar - thumbSizePx;
	const scrollClampRange = dir === "ltr" ? [0, maxScrollPos] : [maxScrollPos * -1, 0];
	const scrollWithoutMomentum = clamp(scrollPos, scrollClampRange[0], scrollClampRange[1]);
	return linearScale$1([0, maxScrollPos], [0, maxThumbPos])(scrollWithoutMomentum);
}
function linearScale$1(input, output) {
	return (value) => {
		if (input[0] === input[1] || output[0] === output[1]) return output[0];
		const ratio = (output[1] - output[0]) / (input[1] - input[0]);
		return output[0] + ratio * (value - input[0]);
	};
}
function isScrollingWithinScrollbarBounds(scrollPos, maxScrollPos) {
	return scrollPos > 0 && scrollPos < maxScrollPos;
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area.svelte
function Scroll_area$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { ref = null, id = createId(uid), type = "hover", dir = "ltr", scrollHideDelay = 600, children, child, $$slots, $$events, ...restProps } = $$props;
		const rootState = ScrollAreaRootState.create({
			type: boxWith(() => type),
			dir: boxWith(() => dir),
			scrollHideDelay: boxWith(() => scrollHideDelay),
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, rootState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-viewport.svelte
function Scroll_area_viewport($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { ref = null, id = createId(uid), children, $$slots, $$events, ...restProps } = $$props;
		const viewportState = ScrollAreaViewportState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, viewportState.props));
		const mergedContentProps = derived(() => mergeProps({}, viewportState.contentProps));
		$$renderer.push(`<div${attributes({ ...mergedProps() })}><div${attributes({ ...mergedContentProps() })}>`);
		children?.($$renderer);
		$$renderer.push(`<!----></div></div>`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-scrollbar-shared.svelte
function Scroll_area_scrollbar_shared($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { child, children, $$slots, $$events, ...restProps } = $$props;
		const scrollbarSharedState = ScrollAreaScrollbarSharedState.create();
		const mergedProps = derived(() => mergeProps(restProps, scrollbarSharedState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-scrollbar-x.svelte
function Scroll_area_scrollbar_x($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { $$slots, $$events, ...restProps } = $$props;
		const isMounted = new IsMounted();
		const scrollbarXState = ScrollAreaScrollbarXState.create({ mounted: boxWith(() => isMounted.current) });
		Scroll_area_scrollbar_shared($$renderer, spread_props([derived(() => mergeProps(restProps, scrollbarXState.props))()]));
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-scrollbar-y.svelte
function Scroll_area_scrollbar_y($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { $$slots, $$events, ...restProps } = $$props;
		const isMounted = new IsMounted();
		const scrollbarYState = ScrollAreaScrollbarYState.create({ mounted: boxWith(() => isMounted.current) });
		Scroll_area_scrollbar_shared($$renderer, spread_props([derived(() => mergeProps(restProps, scrollbarYState.props))()]));
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-scrollbar-visible.svelte
function Scroll_area_scrollbar_visible($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { $$slots, $$events, ...restProps } = $$props;
		if (ScrollAreaScrollbarVisibleState.create().scrollbar.opts.orientation.current === "horizontal") {
			$$renderer.push("<!--[0-->");
			Scroll_area_scrollbar_x($$renderer, spread_props([restProps]));
		} else {
			$$renderer.push("<!--[-1-->");
			Scroll_area_scrollbar_y($$renderer, spread_props([restProps]));
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-scrollbar-auto.svelte
function Scroll_area_scrollbar_auto($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { forceMount = false, $$slots, $$events, ...restProps } = $$props;
		const scrollbarAutoState = ScrollAreaScrollbarAutoState.create();
		const mergedProps = derived(() => mergeProps(restProps, scrollbarAutoState.props));
		{
			function presence($$renderer) {
				Scroll_area_scrollbar_visible($$renderer, spread_props([mergedProps()]));
			}
			Presence_layer($$renderer, {
				open: forceMount || scrollbarAutoState.isVisible,
				ref: scrollbarAutoState.scrollbar.opts.ref,
				presence,
				$$slots: { presence: true }
			});
		}
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-scrollbar-scroll.svelte
function Scroll_area_scrollbar_scroll($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { forceMount = false, $$slots, $$events, ...restProps } = $$props;
		const scrollbarScrollState = ScrollAreaScrollbarScrollState.create();
		const mergedProps = derived(() => mergeProps(restProps, scrollbarScrollState.props));
		{
			function presence($$renderer) {
				Scroll_area_scrollbar_visible($$renderer, spread_props([mergedProps()]));
			}
			Presence_layer($$renderer, spread_props([mergedProps(), {
				open: forceMount || !scrollbarScrollState.isHidden,
				ref: scrollbarScrollState.scrollbar.opts.ref,
				presence,
				$$slots: { presence: true }
			}]));
		}
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-scrollbar-hover.svelte
function Scroll_area_scrollbar_hover($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { forceMount = false, $$slots, $$events, ...restProps } = $$props;
		const scrollbarHoverState = ScrollAreaScrollbarHoverState.create();
		const scrollbarAutoState = ScrollAreaScrollbarAutoState.create();
		const mergedProps = derived(() => mergeProps(restProps, scrollbarHoverState.props, scrollbarAutoState.props, { "data-state": scrollbarHoverState.isVisible ? "visible" : "hidden" }));
		const open = derived(() => forceMount || scrollbarHoverState.isVisible && scrollbarAutoState.isVisible);
		{
			function presence($$renderer) {
				Scroll_area_scrollbar_visible($$renderer, spread_props([mergedProps()]));
			}
			Presence_layer($$renderer, {
				open: open(),
				ref: scrollbarAutoState.scrollbar.opts.ref,
				presence,
				$$slots: { presence: true }
			});
		}
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-scrollbar.svelte
function Scroll_area_scrollbar$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { ref = null, id = createId(uid), orientation, $$slots, $$events, ...restProps } = $$props;
		const scrollbarState = ScrollAreaScrollbarState.create({
			orientation: boxWith(() => orientation),
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const type = derived(() => scrollbarState.root.opts.type.current);
		if (type() === "hover") {
			$$renderer.push("<!--[0-->");
			Scroll_area_scrollbar_hover($$renderer, spread_props([restProps, { id }]));
		} else if (type() === "scroll") {
			$$renderer.push("<!--[1-->");
			Scroll_area_scrollbar_scroll($$renderer, spread_props([restProps, { id }]));
		} else if (type() === "auto") {
			$$renderer.push("<!--[2-->");
			Scroll_area_scrollbar_auto($$renderer, spread_props([restProps, { id }]));
		} else if (type() === "always") {
			$$renderer.push("<!--[3-->");
			Scroll_area_scrollbar_visible($$renderer, spread_props([restProps, { id }]));
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-thumb-impl.svelte
function Scroll_area_thumb_impl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, id, child, children, present, $$slots, $$events, ...restProps } = $$props;
		const isMounted = new IsMounted();
		const thumbState = ScrollAreaThumbImplState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v),
			mounted: boxWith(() => isMounted.current)
		});
		const mergedProps = derived(() => mergeProps(restProps, thumbState.props, { style: { hidden: !present } }));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-thumb.svelte
function Scroll_area_thumb($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), ref = null, forceMount = false, $$slots, $$events, ...restProps } = $$props;
		const scrollbarState = ScrollAreaScrollbarVisibleContext.get();
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			{
				function presence($$renderer, { present }) {
					Scroll_area_thumb_impl($$renderer, spread_props([restProps, {
						id,
						present,
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						}
					}]));
				}
				Presence_layer($$renderer, {
					open: forceMount || scrollbarState.hasThumb,
					ref: scrollbarState.scrollbar.opts.ref,
					presence,
					$$slots: { presence: true }
				});
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-corner-impl.svelte
function Scroll_area_corner_impl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, id, children, child, $$slots, $$events, ...restProps } = $$props;
		const cornerState = ScrollAreaCornerImplState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, cornerState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/scroll-area/components/scroll-area-corner.svelte
function Scroll_area_corner($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { ref = null, id = createId(uid), $$slots, $$events, ...restProps } = $$props;
		const scrollAreaState = ScrollAreaRootContext.get();
		const hasBothScrollbarsVisible = derived(() => Boolean(scrollAreaState.scrollbarXNode && scrollAreaState.scrollbarYNode));
		const hasCorner = derived(() => scrollAreaState.opts.type.current !== "scroll" && hasBothScrollbarsVisible());
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (hasCorner()) {
				$$renderer.push("<!--[0-->");
				Scroll_area_corner_impl($$renderer, spread_props([restProps, {
					id,
					get ref() {
						return ref;
					},
					set ref($$value) {
						ref = $$value;
						$$settled = false;
					}
				}]));
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/select/components/select.svelte
function Select$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value = void 0, onValueChange = noop, name = "", disabled = false, type, open = false, onOpenChange = noop, onOpenChangeComplete = noop, loop = false, scrollAlignment = "nearest", required = false, items = [], allowDeselect = false, autocomplete, children } = $$props;
		function handleDefaultValue() {
			if (value !== void 0) return;
			value = type === "single" ? "" : [];
		}
		handleDefaultValue();
		watch.pre(() => value, () => {
			handleDefaultValue();
		});
		let inputValue = "";
		const rootState = SelectRootState.create({
			type,
			value: boxWith(() => value, (v) => {
				value = v;
				onValueChange(v);
			}),
			disabled: boxWith(() => disabled),
			required: boxWith(() => required),
			open: boxWith(() => open, (v) => {
				open = v;
				onOpenChange(v);
			}),
			loop: boxWith(() => loop),
			scrollAlignment: boxWith(() => scrollAlignment),
			name: boxWith(() => name),
			isCombobox: false,
			items: boxWith(() => items),
			allowDeselect: boxWith(() => allowDeselect),
			inputValue: boxWith(() => inputValue, (v) => inputValue = v),
			onOpenChangeComplete: boxWith(() => onOpenChangeComplete)
		});
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Floating_layer($$renderer, {
				children: ($$renderer) => {
					children?.($$renderer);
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> `);
			if (Array.isArray(rootState.opts.value.current)) {
				$$renderer.push("<!--[0-->");
				if (rootState.opts.value.current.length === 0) {
					$$renderer.push("<!--[0-->");
					Select_hidden_input($$renderer, { autocomplete });
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--[-->`);
					const each_array = ensure_array_like(rootState.opts.value.current);
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let item = each_array[$$index];
						Select_hidden_input($$renderer, {
							value: item,
							autocomplete
						});
					}
					$$renderer.push(`<!--]-->`);
				}
				$$renderer.push(`<!--]-->`);
			} else {
				$$renderer.push("<!--[-1-->");
				Select_hidden_input($$renderer, {
					autocomplete,
					get value() {
						return rootState.opts.value.current;
					},
					set value($$value) {
						rootState.opts.value.current = $$value;
						$$settled = false;
					}
				});
			}
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, {
			value,
			open
		});
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/select/components/select-trigger.svelte
function Select_trigger$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), ref = null, child, children, type = "button", $$slots, $$events, ...restProps } = $$props;
		const triggerState = SelectTriggerState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, triggerState.props, { type }));
		if (Floating_layer_anchor) {
			$$renderer.push("<!--[-->");
			Floating_layer_anchor($$renderer, {
				id,
				ref: triggerState.opts.ref,
				children: ($$renderer) => {
					if (child) {
						$$renderer.push("<!--[0-->");
						child($$renderer, { props: mergedProps() });
						$$renderer.push(`<!---->`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<button${attributes({ ...mergedProps() })}>`);
						children?.($$renderer);
						$$renderer.push(`<!----></button>`);
					}
					$$renderer.push(`<!--]-->`);
				},
				$$slots: { default: true }
			});
			$$renderer.push("<!--]-->");
		} else {
			$$renderer.push("<!--[!-->");
			$$renderer.push("<!--]-->");
		}
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/slider/helpers.js
function getRangeStyles(direction, min, max) {
	const styles = { position: "absolute" };
	if (direction === "lr") {
		styles.left = `${min}%`;
		styles.right = `${max}%`;
	} else if (direction === "rl") {
		styles.right = `${min}%`;
		styles.left = `${max}%`;
	} else if (direction === "bt") {
		styles.bottom = `${min}%`;
		styles.top = `${max}%`;
	} else {
		styles.top = `${min}%`;
		styles.bottom = `${max}%`;
	}
	return styles;
}
function getThumbStyles(direction, thumbPos) {
	const styles = { position: "absolute" };
	if (direction === "lr") {
		styles.left = `${thumbPos}%`;
		styles.translate = "-50% 0";
	} else if (direction === "rl") {
		styles.right = `${thumbPos}%`;
		styles.translate = "50% 0";
	} else if (direction === "bt") {
		styles.bottom = `${thumbPos}%`;
		styles.translate = "0 50%";
	} else {
		styles.top = `${thumbPos}%`;
		styles.translate = "0 -50%";
	}
	return styles;
}
function getTickStyles(direction, tickPosition, offsetPercentage) {
	const style = { position: "absolute" };
	if (direction === "lr") {
		style.left = `${tickPosition}%`;
		style.translate = `${offsetPercentage}% 0`;
	} else if (direction === "rl") {
		style.right = `${tickPosition}%`;
		style.translate = `${-offsetPercentage}% 0`;
	} else if (direction === "bt") {
		style.bottom = `${tickPosition}%`;
		style.translate = `0 ${-offsetPercentage}%`;
	} else {
		style.top = `${tickPosition}%`;
		style.translate = `0 ${offsetPercentage}%`;
	}
	return style;
}
/**
* Gets the number of decimal places in a number
*/
function getDecimalPlaces(num) {
	if (Math.floor(num) === num) return 0;
	const str = num.toString();
	if (str.indexOf(".") !== -1 && str.indexOf("e-") === -1) return str.split(".")[1].length;
	else if (str.indexOf("e-") !== -1) {
		const parts = str.split("e-");
		return parseInt(parts[1], 10);
	}
	return 0;
}
/**
* Rounds a number to the specified number of decimal places
*/
function roundToPrecision(num, precision) {
	const factor = Math.pow(10, precision);
	return Math.round(num * factor) / factor;
}
/**
* Normalizes step to always be a sorted array of valid values within min/max range
*/
function normalizeSteps(step, min, max) {
	if (typeof step === "number") {
		const difference = max - min;
		let count = Math.ceil(difference / step);
		const precision = getDecimalPlaces(step);
		const factor = Math.pow(10, precision);
		if (Math.round(difference * factor) % Math.round(step * factor) === 0) count++;
		const steps = [];
		for (let i = 0; i < count; i++) {
			const roundedValue = roundToPrecision(min + i * step, precision);
			steps.push(roundedValue);
		}
		return steps;
	}
	return [...new Set(step)].filter((value) => value >= min && value <= max).sort((a, b) => a - b);
}
/**
* Snaps a value to the nearest step in a custom steps array
*/
function snapValueToCustomSteps(value, steps) {
	if (steps.length === 0) return value;
	let closest = steps[0];
	let minDistance = Math.abs(value - closest);
	for (const step of steps) {
		const distance = Math.abs(value - step);
		if (distance < minDistance) {
			minDistance = distance;
			closest = step;
		}
	}
	return closest;
}
/**
* Gets the next/previous step value for keyboard navigation
*/
function getAdjacentStepValue(currentValue, steps, direction) {
	const currentIndex = steps.indexOf(currentValue);
	if (currentIndex === -1) return snapValueToCustomSteps(currentValue, steps);
	if (direction === "next") return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : currentValue;
	else return currentIndex > 0 ? steps[currentIndex - 1] : currentValue;
}
//#endregion
//#region node_modules/bits-ui/dist/internal/math.js
function linearScale(domain, range, clamp = true) {
	const [d0, d1] = domain;
	const [r0, r1] = range;
	const slope = (r1 - r0) / (d1 - d0);
	return (x) => {
		const result = r0 + slope * (x - d0);
		if (!clamp) return result;
		if (result > Math.max(r0, r1)) return Math.max(r0, r1);
		if (result < Math.min(r0, r1)) return Math.min(r0, r1);
		return result;
	};
}
//#endregion
//#region node_modules/bits-ui/dist/bits/slider/slider.svelte.js
var sliderAttrs = createBitsAttrs({
	component: "slider",
	parts: [
		"root",
		"thumb",
		"range",
		"tick",
		"tick-label",
		"thumb-label"
	]
});
var SliderRootContext = new Context("Slider.Root");
var SliderBaseRootState = class {
	opts;
	attachment;
	isActive = false;
	#layoutVersion = 0;
	#direction = derived(() => {
		if (this.opts.orientation.current === "horizontal") return this.opts.dir.current === "rtl" ? "rl" : "lr";
		else return this.opts.dir.current === "rtl" ? "tb" : "bt";
	});
	get direction() {
		return this.#direction();
	}
	set direction($$value) {
		return this.#direction($$value);
	}
	#normalizedSteps = derived(() => {
		return normalizeSteps(this.opts.step.current, this.opts.min.current, this.opts.max.current);
	});
	get normalizedSteps() {
		return this.#normalizedSteps();
	}
	set normalizedSteps($$value) {
		return this.#normalizedSteps($$value);
	}
	domContext;
	constructor(opts) {
		this.opts = opts;
		this.attachment = attachRef(opts.ref);
		this.domContext = new DOMContext(this.opts.ref);
		new SvelteResizeObserver(() => this.opts.ref.current, this.#handleLayoutChange);
	}
	#handleLayoutChange = () => {
		this.#layoutVersion += 1;
	};
	isThumbActive(_index) {
		return this.isActive;
	}
	#touchAction = derived(() => {
		if (this.opts.disabled.current) return void 0;
		return this.opts.orientation.current === "horizontal" ? "pan-y" : "pan-x";
	});
	getAllThumbs = () => {
		const node = this.opts.ref.current;
		if (!node) return [];
		return Array.from(node.querySelectorAll(sliderAttrs.selector("thumb")));
	};
	getThumbScale = () => {
		this.#layoutVersion;
		const trackPadding = this.opts.trackPadding?.current;
		if (trackPadding !== void 0 && trackPadding > 0) return [trackPadding, 100 - trackPadding];
		if (this.opts.thumbPositioning.current === "exact") return [0, 100];
		const isVertical = this.opts.orientation.current === "vertical";
		const activeThumb = this.getAllThumbs()[0];
		const thumbSize = isVertical ? activeThumb?.offsetHeight : activeThumb?.offsetWidth;
		if (thumbSize === void 0 || Number.isNaN(thumbSize) || thumbSize === 0) return [0, 100];
		const trackSize = isVertical ? this.opts.ref.current?.offsetHeight : this.opts.ref.current?.offsetWidth;
		if (trackSize === void 0 || Number.isNaN(trackSize) || trackSize === 0) return [0, 100];
		const percentPadding = thumbSize / 2 / trackSize * 100;
		return [percentPadding, 100 - percentPadding];
	};
	getPositionFromValue = (thumbValue) => {
		const thumbScale = this.getThumbScale();
		return linearScale([this.opts.min.current, this.opts.max.current], thumbScale)(thumbValue);
	};
	#props = derived(() => ({
		id: this.opts.id.current,
		"data-orientation": this.opts.orientation.current,
		"data-disabled": boolToEmptyStrOrUndef(this.opts.disabled.current),
		style: { touchAction: this.#touchAction() },
		[sliderAttrs.root]: "",
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var SliderSingleRootState = class extends SliderBaseRootState {
	opts;
	isMulti = false;
	constructor(opts) {
		super(opts);
		this.opts = opts;
		watch([
			() => this.opts.step.current,
			() => this.opts.min.current,
			() => this.opts.max.current,
			() => this.opts.value.current
		], ([step, min, max, value]) => {
			const steps = normalizeSteps(step, min, max);
			const isValidValue = (v) => {
				return steps.includes(v);
			};
			const gcv = (v) => {
				return snapValueToCustomSteps(v, steps);
			};
			if (!isValidValue(value)) this.opts.value.current = gcv(value);
		});
	}
	isTickValueSelected = (tickValue) => {
		return this.opts.value.current === tickValue;
	};
	applyPosition({ clientXY, start, end }) {
		const min = this.opts.min.current;
		const max = this.opts.max.current;
		const val = (clientXY - start) / (end - start) * (max - min) + min;
		if (val < min) this.updateValue(min);
		else if (val > max) this.updateValue(max);
		else {
			const steps = this.normalizedSteps;
			const newValue = snapValueToCustomSteps(val, steps);
			this.updateValue(newValue);
		}
	}
	updateValue = (newValue) => {
		this.opts.value.current = snapValueToCustomSteps(newValue, this.normalizedSteps);
	};
	handlePointerMove = (e) => {
		if (!this.isActive || this.opts.disabled.current) return;
		e.preventDefault();
		e.stopPropagation();
		const sliderNode = this.opts.ref.current;
		const activeThumb = this.getAllThumbs()[0];
		if (!sliderNode || !activeThumb) return;
		activeThumb.focus();
		const { left, right, top, bottom } = sliderNode.getBoundingClientRect();
		if (this.direction === "lr") this.applyPosition({
			clientXY: e.clientX,
			start: left,
			end: right
		});
		else if (this.direction === "rl") this.applyPosition({
			clientXY: e.clientX,
			start: right,
			end: left
		});
		else if (this.direction === "bt") this.applyPosition({
			clientXY: e.clientY,
			start: bottom,
			end: top
		});
		else if (this.direction === "tb") this.applyPosition({
			clientXY: e.clientY,
			start: top,
			end: bottom
		});
	};
	handlePointerDown = (e) => {
		if (e.button !== 0 || this.opts.disabled.current) return;
		const sliderNode = this.opts.ref.current;
		const closestThumb = this.getAllThumbs()[0];
		if (!closestThumb || !sliderNode) return;
		const target = e.composedPath()[0] ?? e.target;
		if (!isElementOrSVGElement(target) || !sliderNode.contains(target)) return;
		e.preventDefault();
		closestThumb.focus();
		this.isActive = true;
		this.handlePointerMove(e);
	};
	handlePointerUp = () => {
		if (this.opts.disabled.current) return;
		if (this.isActive) this.opts.onValueCommit.current(run(() => this.opts.value.current));
		this.isActive = false;
	};
	#thumbsPropsArr = derived(() => {
		const currValue = this.opts.value.current;
		return Array.from({ length: 1 }, () => {
			const thumbValue = currValue;
			const thumbPosition = this.getPositionFromValue(thumbValue);
			const style = getThumbStyles(this.direction, thumbPosition);
			return {
				role: "slider",
				"aria-valuemin": this.opts.min.current,
				"aria-valuemax": this.opts.max.current,
				"aria-valuenow": thumbValue,
				"aria-disabled": boolToStr(this.opts.disabled.current),
				"aria-orientation": this.opts.orientation.current,
				"data-value": thumbValue,
				"data-orientation": this.opts.orientation.current,
				style,
				[sliderAttrs.thumb]: ""
			};
		});
	});
	get thumbsPropsArr() {
		return this.#thumbsPropsArr();
	}
	set thumbsPropsArr($$value) {
		return this.#thumbsPropsArr($$value);
	}
	#thumbsRenderArr = derived(() => {
		return this.thumbsPropsArr.map((_, i) => i);
	});
	get thumbsRenderArr() {
		return this.#thumbsRenderArr();
	}
	set thumbsRenderArr($$value) {
		return this.#thumbsRenderArr($$value);
	}
	#ticksPropsArr = derived(() => {
		const steps = this.normalizedSteps;
		const currValue = this.opts.value.current;
		return steps.map((tickValue, i) => {
			const tickPosition = this.getPositionFromValue(tickValue);
			const isFirst = i === 0;
			const isLast = i === steps.length - 1;
			const offsetPercentage = isFirst ? 0 : isLast ? -100 : -50;
			const style = getTickStyles(this.direction, tickPosition, offsetPercentage);
			const bounded = tickValue <= currValue;
			return {
				"data-disabled": boolToEmptyStrOrUndef(this.opts.disabled.current),
				"data-orientation": this.opts.orientation.current,
				"data-bounded": bounded ? "" : void 0,
				"data-value": tickValue,
				"data-selected": this.isTickValueSelected(tickValue) ? "" : void 0,
				style,
				[sliderAttrs.tick]: ""
			};
		});
	});
	get ticksPropsArr() {
		return this.#ticksPropsArr();
	}
	set ticksPropsArr($$value) {
		return this.#ticksPropsArr($$value);
	}
	#ticksRenderArr = derived(() => {
		return this.ticksPropsArr.map((_, i) => i);
	});
	get ticksRenderArr() {
		return this.#ticksRenderArr();
	}
	set ticksRenderArr($$value) {
		return this.#ticksRenderArr($$value);
	}
	#tickItemsArr = derived(() => {
		return this.ticksPropsArr.map((tick, i) => ({
			value: tick["data-value"],
			index: i
		}));
	});
	get tickItemsArr() {
		return this.#tickItemsArr();
	}
	set tickItemsArr($$value) {
		return this.#tickItemsArr($$value);
	}
	#thumbItemsArr = derived(() => {
		return [{
			value: this.opts.value.current,
			index: 0
		}];
	});
	get thumbItemsArr() {
		return this.#thumbItemsArr();
	}
	set thumbItemsArr($$value) {
		return this.#thumbItemsArr($$value);
	}
	#snippetProps = derived(() => ({
		ticks: this.ticksRenderArr,
		thumbs: this.thumbsRenderArr,
		tickItems: this.tickItemsArr,
		thumbItems: this.thumbItemsArr
	}));
	get snippetProps() {
		return this.#snippetProps();
	}
	set snippetProps($$value) {
		return this.#snippetProps($$value);
	}
};
var SliderMultiRootState = class extends SliderBaseRootState {
	opts;
	isMulti = true;
	activeThumb = null;
	currentThumbIdx = 0;
	constructor(opts) {
		super(opts);
		this.opts = opts;
		watch([
			() => this.opts.step.current,
			() => this.opts.min.current,
			() => this.opts.max.current,
			() => this.opts.value.current
		], ([step, min, max, value]) => {
			const steps = normalizeSteps(step, min, max);
			const isValidValue = (v) => {
				return steps.includes(v);
			};
			const gcv = (v) => {
				return snapValueToCustomSteps(v, steps);
			};
			if (value.some((v) => !isValidValue(v))) this.opts.value.current = value.map(gcv);
		});
	}
	isTickValueSelected = (tickValue) => {
		return this.opts.value.current.includes(tickValue);
	};
	isThumbActive(index) {
		return this.isActive && this.activeThumb?.idx === index;
	}
	applyPosition({ clientXY, activeThumbIdx, start, end }) {
		const min = this.opts.min.current;
		const max = this.opts.max.current;
		const val = (clientXY - start) / (end - start) * (max - min) + min;
		if (val < min) this.updateValue(min, activeThumbIdx);
		else if (val > max) this.updateValue(max, activeThumbIdx);
		else {
			const steps = this.normalizedSteps;
			const newValue = snapValueToCustomSteps(val, steps);
			this.updateValue(newValue, activeThumbIdx);
		}
	}
	#getClosestThumb = (e) => {
		const thumbs = this.getAllThumbs();
		if (!thumbs.length) return;
		for (const thumb of thumbs) thumb.blur();
		const distances = thumbs.map((thumb) => {
			if (this.opts.orientation.current === "horizontal") {
				const { left, right } = thumb.getBoundingClientRect();
				return Math.abs(e.clientX - (left + right) / 2);
			} else {
				const { top, bottom } = thumb.getBoundingClientRect();
				return Math.abs(e.clientY - (top + bottom) / 2);
			}
		});
		const node = thumbs[distances.indexOf(Math.min(...distances))];
		return {
			node,
			idx: thumbs.indexOf(node)
		};
	};
	handlePointerMove = (e) => {
		if (!this.isActive || this.opts.disabled.current) return;
		e.preventDefault();
		e.stopPropagation();
		const sliderNode = this.opts.ref.current;
		const activeThumb = this.activeThumb;
		if (!sliderNode || !activeThumb) return;
		activeThumb.node.focus();
		const { left, right, top, bottom } = sliderNode.getBoundingClientRect();
		const direction = this.direction;
		if (direction === "lr") this.applyPosition({
			clientXY: e.clientX,
			activeThumbIdx: activeThumb.idx,
			start: left,
			end: right
		});
		else if (direction === "rl") this.applyPosition({
			clientXY: e.clientX,
			activeThumbIdx: activeThumb.idx,
			start: right,
			end: left
		});
		else if (direction === "bt") this.applyPosition({
			clientXY: e.clientY,
			activeThumbIdx: activeThumb.idx,
			start: bottom,
			end: top
		});
		else if (direction === "tb") this.applyPosition({
			clientXY: e.clientY,
			activeThumbIdx: activeThumb.idx,
			start: top,
			end: bottom
		});
	};
	handlePointerDown = (e) => {
		if (e.button !== 0 || this.opts.disabled.current) return;
		const sliderNode = this.opts.ref.current;
		const closestThumb = this.#getClosestThumb(e);
		if (!closestThumb || !sliderNode) return;
		const target = e.composedPath()[0] ?? e.target;
		if (!isElementOrSVGElement(target) || !sliderNode.contains(target)) return;
		e.preventDefault();
		this.activeThumb = closestThumb;
		closestThumb.node.focus();
		this.isActive = true;
		this.handlePointerMove(e);
	};
	handlePointerUp = () => {
		if (this.opts.disabled.current) return;
		if (this.isActive) this.opts.onValueCommit.current(run(() => this.opts.value.current));
		this.isActive = false;
	};
	getAllThumbs = () => {
		const node = this.opts.ref.current;
		if (!node) return [];
		return Array.from(node.querySelectorAll(sliderAttrs.selector("thumb")));
	};
	updateValue = (thumbValue, idx) => {
		const currValue = this.opts.value.current;
		if (!currValue.length) {
			this.opts.value.current.push(thumbValue);
			return;
		}
		if (currValue[idx] === thumbValue) return;
		const newValue = [...currValue];
		if (!isValidIndex(idx, newValue)) return;
		const direction = newValue[idx] > thumbValue ? -1 : 1;
		const swap = () => {
			const diffIndex = idx + direction;
			newValue[idx] = newValue[diffIndex];
			newValue[diffIndex] = thumbValue;
			const thumbs = this.getAllThumbs();
			if (!thumbs.length) return;
			thumbs[diffIndex]?.focus();
			this.activeThumb = {
				node: thumbs[diffIndex],
				idx: diffIndex
			};
		};
		if (this.opts.autoSort.current && (direction === -1 && thumbValue < newValue[idx - 1] || direction === 1 && thumbValue > newValue[idx + 1])) {
			swap();
			this.opts.value.current = newValue;
			return;
		}
		const steps = this.normalizedSteps;
		newValue[idx] = snapValueToCustomSteps(thumbValue, steps);
		this.opts.value.current = newValue;
	};
	#thumbsPropsArr = derived(() => {
		const currValue = this.opts.value.current;
		return Array.from({ length: currValue.length || 1 }, (_, i) => {
			const currThumb = run(() => this.currentThumbIdx);
			if (currThumb < currValue.length) run(() => {
				this.currentThumbIdx = currThumb + 1;
			});
			const thumbValue = currValue[i];
			const thumbPosition = this.getPositionFromValue(thumbValue ?? 0);
			const style = getThumbStyles(this.direction, thumbPosition);
			return {
				role: "slider",
				"aria-valuemin": this.opts.min.current,
				"aria-valuemax": this.opts.max.current,
				"aria-valuenow": thumbValue,
				"aria-disabled": boolToStr(this.opts.disabled.current),
				"aria-orientation": this.opts.orientation.current,
				"data-value": thumbValue,
				"data-orientation": this.opts.orientation.current,
				style,
				[sliderAttrs.thumb]: ""
			};
		});
	});
	get thumbsPropsArr() {
		return this.#thumbsPropsArr();
	}
	set thumbsPropsArr($$value) {
		return this.#thumbsPropsArr($$value);
	}
	#thumbsRenderArr = derived(() => {
		return this.thumbsPropsArr.map((_, i) => i);
	});
	get thumbsRenderArr() {
		return this.#thumbsRenderArr();
	}
	set thumbsRenderArr($$value) {
		return this.#thumbsRenderArr($$value);
	}
	#ticksPropsArr = derived(() => {
		const steps = this.normalizedSteps;
		const currValue = this.opts.value.current;
		return steps.map((tickValue, i) => {
			const tickPosition = this.getPositionFromValue(tickValue);
			const isFirst = i === 0;
			const isLast = i === steps.length - 1;
			const offsetPercentage = isFirst ? 0 : isLast ? -100 : -50;
			const style = getTickStyles(this.direction, tickPosition, offsetPercentage);
			const bounded = currValue.length === 1 ? tickValue <= currValue[0] : currValue[0] <= tickValue && tickValue <= currValue[currValue.length - 1];
			return {
				"data-disabled": boolToEmptyStrOrUndef(this.opts.disabled.current),
				"data-orientation": this.opts.orientation.current,
				"data-bounded": bounded ? "" : void 0,
				"data-value": tickValue,
				style,
				[sliderAttrs.tick]: ""
			};
		});
	});
	get ticksPropsArr() {
		return this.#ticksPropsArr();
	}
	set ticksPropsArr($$value) {
		return this.#ticksPropsArr($$value);
	}
	#ticksRenderArr = derived(() => {
		return this.ticksPropsArr.map((_, i) => i);
	});
	get ticksRenderArr() {
		return this.#ticksRenderArr();
	}
	set ticksRenderArr($$value) {
		return this.#ticksRenderArr($$value);
	}
	#tickItemsArr = derived(() => {
		return this.ticksPropsArr.map((tick, i) => ({
			value: tick["data-value"],
			index: i
		}));
	});
	get tickItemsArr() {
		return this.#tickItemsArr();
	}
	set tickItemsArr($$value) {
		return this.#tickItemsArr($$value);
	}
	#thumbItemsArr = derived(() => {
		return this.opts.value.current.map((value, index) => ({
			value,
			index
		}));
	});
	get thumbItemsArr() {
		return this.#thumbItemsArr();
	}
	set thumbItemsArr($$value) {
		return this.#thumbItemsArr($$value);
	}
	#snippetProps = derived(() => ({
		ticks: this.ticksRenderArr,
		thumbs: this.thumbsRenderArr,
		tickItems: this.tickItemsArr,
		thumbItems: this.thumbItemsArr
	}));
	get snippetProps() {
		return this.#snippetProps();
	}
	set snippetProps($$value) {
		return this.#snippetProps($$value);
	}
};
var SliderRootState = class {
	static create(opts) {
		const { type, ...rest } = opts;
		const rootState = type === "single" ? new SliderSingleRootState(rest) : new SliderMultiRootState(rest);
		return SliderRootContext.set(rootState);
	}
};
var VALID_SLIDER_KEYS = [
	ARROW_LEFT,
	ARROW_RIGHT,
	ARROW_UP,
	ARROW_DOWN,
	HOME,
	"End"
];
var SliderRangeState = class SliderRangeState {
	static create(opts) {
		return new SliderRangeState(opts, SliderRootContext.get());
	}
	opts;
	root;
	attachment;
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(opts.ref);
	}
	#rangeStyles = derived(() => {
		if (Array.isArray(this.root.opts.value.current)) {
			const min = this.root.opts.value.current.length > 1 ? this.root.getPositionFromValue(Math.min(...this.root.opts.value.current) ?? 0) : 0;
			const max = 100 - this.root.getPositionFromValue(Math.max(...this.root.opts.value.current) ?? 0);
			return {
				position: "absolute",
				...getRangeStyles(this.root.direction, min, max)
			};
		} else {
			const trackPadding = this.root.opts.trackPadding?.current;
			const currentValue = this.root.opts.value.current;
			const maxValue = this.root.opts.max.current;
			const min = 0;
			const max = trackPadding !== void 0 && trackPadding > 0 && currentValue === maxValue ? 0 : 100 - this.root.getPositionFromValue(currentValue);
			return {
				position: "absolute",
				...getRangeStyles(this.root.direction, min, max)
			};
		}
	});
	get rangeStyles() {
		return this.#rangeStyles();
	}
	set rangeStyles($$value) {
		return this.#rangeStyles($$value);
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		"data-orientation": this.root.opts.orientation.current,
		"data-disabled": boolToEmptyStrOrUndef(this.root.opts.disabled.current),
		style: this.rangeStyles,
		[sliderAttrs.range]: "",
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var SliderThumbState = class SliderThumbState {
	static create(opts) {
		return new SliderThumbState(opts, SliderRootContext.get());
	}
	opts;
	root;
	attachment;
	#isDisabled = derived(() => this.root.opts.disabled.current || this.opts.disabled.current);
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(opts.ref);
		this.onkeydown = this.onkeydown.bind(this);
	}
	#updateValue(newValue) {
		if (this.root.isMulti) this.root.updateValue(newValue, this.opts.index.current);
		else this.root.updateValue(newValue);
	}
	onkeydown(e) {
		if (this.#isDisabled()) return;
		const currNode = this.opts.ref.current;
		if (!currNode) return;
		const thumbs = this.root.getAllThumbs();
		if (!thumbs.length) return;
		const idx = thumbs.indexOf(currNode);
		if (this.root.isMulti) this.root.currentThumbIdx = idx;
		if (!VALID_SLIDER_KEYS.includes(e.key)) return;
		e.preventDefault();
		const min = this.root.opts.min.current;
		const max = this.root.opts.max.current;
		const value = this.root.opts.value.current;
		const thumbValue = Array.isArray(value) ? value[idx] : value;
		const orientation = this.root.opts.orientation.current;
		const direction = this.root.direction;
		const steps = this.root.normalizedSteps;
		switch (e.key) {
			case HOME:
				this.#updateValue(min);
				break;
			case "End":
				this.#updateValue(max);
				break;
			case ARROW_LEFT:
				if (orientation !== "horizontal") break;
				if (e.metaKey) {
					const newValue = direction === "rl" ? max : min;
					this.#updateValue(newValue);
				} else {
					const newValue = getAdjacentStepValue(thumbValue, steps, direction === "rl" ? "next" : "prev");
					this.#updateValue(newValue);
				}
				break;
			case ARROW_RIGHT:
				if (orientation !== "horizontal") break;
				if (e.metaKey) {
					const newValue = direction === "rl" ? min : max;
					this.#updateValue(newValue);
				} else {
					const newValue = getAdjacentStepValue(thumbValue, steps, direction === "rl" ? "prev" : "next");
					this.#updateValue(newValue);
				}
				break;
			case ARROW_UP:
				if (e.metaKey) {
					const newValue = direction === "tb" ? min : max;
					this.#updateValue(newValue);
				} else {
					const newValue = getAdjacentStepValue(thumbValue, steps, direction === "tb" ? "prev" : "next");
					this.#updateValue(newValue);
				}
				break;
			case ARROW_DOWN:
				if (e.metaKey) {
					const newValue = direction === "tb" ? max : min;
					this.#updateValue(newValue);
				} else {
					const newValue = getAdjacentStepValue(thumbValue, steps, direction === "tb" ? "next" : "prev");
					this.#updateValue(newValue);
				}
				break;
		}
		this.root.opts.onValueCommit.current(this.root.opts.value.current);
	}
	#props = derived(() => ({
		...this.root.thumbsPropsArr[this.opts.index.current],
		id: this.opts.id.current,
		onkeydown: this.onkeydown,
		"data-active": this.root.isThumbActive(this.opts.index.current) ? "" : void 0,
		"data-disabled": boolToEmptyStrOrUndef(this.opts.disabled.current || this.root.opts.disabled.current),
		tabindex: this.opts.disabled.current || this.root.opts.disabled.current ? -1 : 0,
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/slider/components/slider.svelte
function Slider$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { children, child, id = createId(uid), ref = null, value = void 0, type, onValueChange = noop, onValueCommit = noop, disabled = false, min: minProp, max: maxProp, step = 1, dir = "ltr", autoSort = true, orientation = "horizontal", thumbPositioning = "contain", trackPadding, $$slots, $$events, ...restProps } = $$props;
		const min = derived(() => {
			if (minProp !== void 0) return minProp;
			if (Array.isArray(step)) return Math.min(...step);
			return 0;
		});
		const max = derived(() => {
			if (maxProp !== void 0) return maxProp;
			if (Array.isArray(step)) return Math.max(...step);
			return 100;
		});
		function handleDefaultValue() {
			if (value !== void 0) return;
			if (type === "single") return min();
			return [];
		}
		handleDefaultValue();
		watch.pre(() => value, () => {
			handleDefaultValue();
		});
		const rootState = SliderRootState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v),
			value: boxWith(() => value, (v) => {
				value = v;
				onValueChange(v);
			}),
			onValueCommit: boxWith(() => onValueCommit),
			disabled: boxWith(() => disabled),
			min: boxWith(() => min()),
			max: boxWith(() => max()),
			step: boxWith(() => step),
			dir: boxWith(() => dir),
			autoSort: boxWith(() => autoSort),
			orientation: boxWith(() => orientation),
			thumbPositioning: boxWith(() => thumbPositioning),
			type,
			trackPadding: boxWith(() => trackPadding)
		});
		const mergedProps = derived(() => mergeProps(restProps, rootState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, {
				props: mergedProps(),
				...rootState.snippetProps
			});
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<span${attributes({ ...mergedProps() })}>`);
			children?.($$renderer, rootState.snippetProps);
			$$renderer.push(`<!----></span>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, {
			ref,
			value
		});
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/slider/components/slider-range.svelte
function Slider_range($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { children, child, ref = null, id = createId(uid), $$slots, $$events, ...restProps } = $$props;
		const rangeState = SliderRangeState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, rangeState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<span${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></span>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/slider/components/slider-thumb.svelte
function Slider_thumb($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { children, child, ref = null, id = createId(uid), index, disabled = false, $$slots, $$events, ...restProps } = $$props;
		const thumbState = SliderThumbState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v),
			index: boxWith(() => index),
			disabled: boxWith(() => disabled)
		});
		const mergedProps = derived(() => mergeProps(restProps, thumbState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, {
				active: thumbState.root.isThumbActive(thumbState.opts.index.current),
				props: mergedProps()
			});
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<span${attributes({ ...mergedProps() })}>`);
			children?.($$renderer, { active: thumbState.root.isThumbActive(thumbState.opts.index.current) });
			$$renderer.push(`<!----></span>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/tabs/tabs.svelte.js
var tabsAttrs = createBitsAttrs({
	component: "tabs",
	parts: [
		"root",
		"list",
		"trigger",
		"content"
	]
});
var TabsRootContext = new Context("Tabs.Root");
var TabsRootState = class TabsRootState {
	static create(opts) {
		return TabsRootContext.set(new TabsRootState(opts));
	}
	opts;
	attachment;
	rovingFocusGroup;
	triggerIds = [];
	valueToTriggerId = new SvelteMap();
	valueToContentId = new SvelteMap();
	constructor(opts) {
		this.opts = opts;
		this.attachment = attachRef(opts.ref);
		this.rovingFocusGroup = new RovingFocusGroup({
			candidateAttr: tabsAttrs.trigger,
			rootNode: this.opts.ref,
			loop: this.opts.loop,
			orientation: this.opts.orientation
		});
	}
	registerTrigger(id, value) {
		this.triggerIds.push(id);
		this.valueToTriggerId.set(value, id);
		return () => {
			this.triggerIds = this.triggerIds.filter((triggerId) => triggerId !== id);
			this.valueToTriggerId.delete(value);
		};
	}
	registerContent(id, value) {
		this.valueToContentId.set(value, id);
		return () => {
			this.valueToContentId.delete(value);
		};
	}
	setValue(v) {
		this.opts.value.current = v;
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		"data-orientation": this.opts.orientation.current,
		[tabsAttrs.root]: "",
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var TabsListState = class TabsListState {
	static create(opts) {
		return new TabsListState(opts, TabsRootContext.get());
	}
	opts;
	root;
	attachment;
	#isDisabled = derived(() => this.root.opts.disabled.current);
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(opts.ref);
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		role: "tablist",
		"aria-orientation": this.root.opts.orientation.current,
		"data-orientation": this.root.opts.orientation.current,
		[tabsAttrs.list]: "",
		"data-disabled": boolToEmptyStrOrUndef(this.#isDisabled()),
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var TabsTriggerState = class TabsTriggerState {
	static create(opts) {
		return new TabsTriggerState(opts, TabsRootContext.get());
	}
	opts;
	root;
	attachment;
	#tabIndex = 0;
	#isActive = derived(() => this.root.opts.value.current === this.opts.value.current);
	#isDisabled = derived(() => this.opts.disabled.current || this.root.opts.disabled.current);
	#ariaControls = derived(() => this.root.valueToContentId.get(this.opts.value.current));
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(opts.ref);
		watch([() => this.opts.id.current, () => this.opts.value.current], ([id, value]) => {
			return this.root.registerTrigger(id, value);
		});
		this.onfocus = this.onfocus.bind(this);
		this.onclick = this.onclick.bind(this);
		this.onkeydown = this.onkeydown.bind(this);
	}
	#activate() {
		if (this.root.opts.value.current === this.opts.value.current) return;
		this.root.setValue(this.opts.value.current);
	}
	onfocus(_) {
		if (this.root.opts.activationMode.current !== "automatic" || this.#isDisabled()) return;
		this.#activate();
	}
	onclick(_) {
		if (this.#isDisabled()) return;
		this.#activate();
	}
	onkeydown(e) {
		if (this.#isDisabled()) return;
		if (e.key === " " || e.key === "Enter") {
			e.preventDefault();
			this.#activate();
			return;
		}
		this.root.rovingFocusGroup.handleKeydown(this.opts.ref.current, e);
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		role: "tab",
		"data-state": getTabDataState(this.#isActive()),
		"data-value": this.opts.value.current,
		"data-orientation": this.root.opts.orientation.current,
		"data-disabled": boolToEmptyStrOrUndef(this.#isDisabled()),
		"aria-selected": boolToStr(this.#isActive()),
		"aria-controls": this.#ariaControls(),
		[tabsAttrs.trigger]: "",
		disabled: boolToTrueOrUndef(this.#isDisabled()),
		tabindex: this.#tabIndex,
		onclick: this.onclick,
		onfocus: this.onfocus,
		onkeydown: this.onkeydown,
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
function getTabDataState(condition) {
	return condition ? "active" : "inactive";
}
//#endregion
//#region node_modules/bits-ui/dist/bits/tabs/components/tabs.svelte
function Tabs$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId(uid), ref = null, value = "", onValueChange = noop, orientation = "horizontal", loop = true, activationMode = "automatic", disabled = false, children, child, $$slots, $$events, ...restProps } = $$props;
		const rootState = TabsRootState.create({
			id: boxWith(() => id),
			value: boxWith(() => value, (v) => {
				value = v;
				onValueChange(v);
			}),
			orientation: boxWith(() => orientation),
			loop: boxWith(() => loop),
			activationMode: boxWith(() => activationMode),
			disabled: boxWith(() => disabled),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, rootState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, {
			ref,
			value
		});
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/tabs/components/tabs-list.svelte
function Tabs_list$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { child, children, id = createId(uid), ref = null, $$slots, $$events, ...restProps } = $$props;
		const listState = TabsListState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, listState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/tabs/components/tabs-trigger.svelte
function Tabs_trigger$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { child, children, disabled = false, id = createId(uid), type = "button", value, ref = null, $$slots, $$events, ...restProps } = $$props;
		const triggerState = TabsTriggerState.create({
			id: boxWith(() => id),
			disabled: boxWith(() => disabled ?? false),
			value: boxWith(() => value),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, triggerState.props, { type }));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<button${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></button>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/lib/utils.ts
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
//#endregion
//#region src/components/ui/scroll-area/scroll-area-scrollbar.svelte
function Scroll_area_scrollbar($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, orientation = "vertical", children, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Scroll_area_scrollbar$1) {
				$$renderer.push("<!--[-->");
				Scroll_area_scrollbar$1($$renderer, spread_props([
					{
						"data-slot": "scroll-area-scrollbar",
						"data-orientation": orientation,
						orientation,
						class: cn("data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent flex touch-none p-px transition-colors select-none", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						},
						children: ($$renderer) => {
							children?.($$renderer);
							$$renderer.push(`<!----> `);
							if (Scroll_area_thumb) {
								$$renderer.push("<!--[-->");
								Scroll_area_thumb($$renderer, {
									"data-slot": "scroll-area-thumb",
									class: "rounded-full bg-border relative flex-1"
								});
								$$renderer.push("<!--]-->");
							} else {
								$$renderer.push("<!--[!-->");
								$$renderer.push("<!--]-->");
							}
						},
						$$slots: { default: true }
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/components/ui/scroll-area/scroll-area.svelte
function Scroll_area($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, viewportRef = null, class: className, orientation = "vertical", scrollbarXClasses = "", scrollbarYClasses = "", children, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Scroll_area$1) {
				$$renderer.push("<!--[-->");
				Scroll_area$1($$renderer, spread_props([
					{
						"data-slot": "scroll-area",
						class: cn("relative", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						},
						children: ($$renderer) => {
							if (Scroll_area_viewport) {
								$$renderer.push("<!--[-->");
								Scroll_area_viewport($$renderer, {
									"data-slot": "scroll-area-viewport",
									class: "cn-scroll-area-viewport focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1",
									get ref() {
										return viewportRef;
									},
									set ref($$value) {
										viewportRef = $$value;
										$$settled = false;
									},
									children: ($$renderer) => {
										children?.($$renderer);
										$$renderer.push(`<!---->`);
									},
									$$slots: { default: true }
								});
								$$renderer.push("<!--]-->");
							} else {
								$$renderer.push("<!--[!-->");
								$$renderer.push("<!--]-->");
							}
							$$renderer.push(` `);
							if (orientation === "vertical" || orientation === "both") {
								$$renderer.push("<!--[0-->");
								Scroll_area_scrollbar($$renderer, {
									orientation: "vertical",
									class: scrollbarYClasses
								});
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--> `);
							if (orientation === "horizontal" || orientation === "both") {
								$$renderer.push("<!--[0-->");
								Scroll_area_scrollbar($$renderer, {
									orientation: "horizontal",
									class: scrollbarXClasses
								});
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--> `);
							if (Scroll_area_corner) {
								$$renderer.push("<!--[-->");
								Scroll_area_corner($$renderer, {});
								$$renderer.push("<!--]-->");
							} else {
								$$renderer.push("<!--[!-->");
								$$renderer.push("<!--]-->");
							}
						},
						$$slots: { default: true }
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, {
			ref,
			viewportRef
		});
	});
}
//#endregion
//#region node_modules/@lucide/svelte/dist/defaultAttributes.js
/**
* @file
* @license @lucide/svelte v1.14.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var defaultAttributes = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": 2,
	"stroke-linecap": "round",
	"stroke-linejoin": "round"
};
//#endregion
//#region node_modules/@lucide/svelte/dist/utils/hasA11yProp.js
/**
* @file
* @license @lucide/svelte v1.14.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
/**
* Check if a component has an accessibility prop
*
* @param {object} props
* @returns {boolean} Whether the component has an accessibility prop
*/
var hasA11yProp = (props) => {
	for (const prop in props) if (prop.startsWith("aria-") || prop === "role" || prop === "title") return true;
	return false;
};
//#endregion
//#region node_modules/@lucide/svelte/dist/context.js
/**
* @file
* @license @lucide/svelte v1.14.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var LucideContext = Symbol("lucide-context");
var getLucideContext = () => getContext(LucideContext);
//#endregion
//#region node_modules/@lucide/svelte/dist/Icon.svelte
function Icon($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const globalProps = getLucideContext() ?? {};
		const { name, color = globalProps.color ?? "currentColor", size = globalProps.size ?? 24, strokeWidth = globalProps.strokeWidth ?? 2, absoluteStrokeWidth = globalProps.absoluteStrokeWidth ?? false, iconNode = [], children, $$slots, $$events, ...props } = $$props;
		const calculatedStrokeWidth = derived(() => absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth);
		$$renderer.push(`<svg${attributes({
			...defaultAttributes,
			...!children && !hasA11yProp(props) && { "aria-hidden": "true" },
			...props,
			width: size,
			height: size,
			stroke: color,
			"stroke-width": calculatedStrokeWidth(),
			class: clsx$1([
				"lucide-icon lucide",
				globalProps.class,
				name && `lucide-${name}`,
				props.class
			])
		}, void 0, void 0, void 0, 3)}><!--[-->`);
		const each_array = ensure_array_like(iconNode);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let [tag, attrs] = each_array[$$index];
			element($$renderer, tag, () => {
				$$renderer.push(`${attributes({ ...attrs }, void 0, void 0, void 0, 3)}`);
			});
		}
		$$renderer.push(`<!--]-->`);
		children?.($$renderer);
		$$renderer.push(`<!----></svg>`);
	});
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/video.svelte
function Video($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "video" },
		props,
		{ iconNode: [["path", { "d": "m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" }], ["rect", {
			"x": "2",
			"y": "6",
			"width": "14",
			"height": "12",
			"rx": "2"
		}]] }
	]));
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/chevron-down.svelte
function Chevron_down($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "chevron-down" },
		props,
		{ iconNode: [["path", { "d": "m6 9 6 6 6-6" }]] }
	]));
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/chevron-right.svelte
function Chevron_right($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "chevron-right" },
		props,
		{ iconNode: [["path", { "d": "m9 18 6-6-6-6" }]] }
	]));
}
//#endregion
//#region src/components/shader-composer/scene-header.svelte
function Scene_header($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { open, onToggle } = $$props;
		const droppable = createDroppable({
			id: "scene-root",
			accept: "effect"
		});
		$$renderer.push(`<button${attr_class("flex items-center gap-2 h-9 w-full rounded-lg pl-3 pr-3 transition-colors", void 0, {
			"bg-[var(--surface-hover)]": droppable.isDropTarget,
			"hover:bg-[var(--surface-hover)]": !droppable.isDropTarget
		})}>`);
		if (open) {
			$$renderer.push("<!--[0-->");
			Chevron_down($$renderer, { class: "size-4 text-white/80 shrink-0" });
		} else {
			$$renderer.push("<!--[-1-->");
			Chevron_right($$renderer, { class: "size-4 text-white/80 shrink-0" });
		}
		$$renderer.push(`<!--]--> `);
		Video($$renderer, { class: "size-4 text-white/80 shrink-0" });
		$$renderer.push(`<!----> <span class="text-[14px] font-medium text-white">Scene</span></button>`);
	});
}
//#endregion
//#region node_modules/@dnd-kit/svelte/dist/sortable/createSortable.svelte.js
var withoutOptimisticSorting = (defaults) => defaults.filter((p) => p !== OptimisticSortingPlugin);
function createSortable(input) {
	const sortable = createInstance((manager) => {
		var _a;
		return new Sortable(Object.assign(Object.assign({}, input), {
			register: false,
			plugins: (_a = input.plugins) !== null && _a !== void 0 ? _a : withoutOptimisticSorting,
			transition: Object.assign(Object.assign({}, defaultSortableTransition), input.transition)
		}), manager);
	});
	const tracked = createDeepSignal(() => sortable);
	return {
		get sortable() {
			return sortable;
		},
		get isDragging() {
			return tracked.current.isDragging;
		},
		get isDropping() {
			return tracked.current.isDropping;
		},
		get isDragSource() {
			return tracked.current.isDragSource;
		},
		get isDropTarget() {
			return tracked.current.isDropTarget;
		},
		attach(node) {
			sortable.element = node;
			return () => {
				var _a, _b;
				if (((_a = sortable.element) === null || _a === void 0 ? void 0 : _a.isConnected) && !((_b = sortable.manager) === null || _b === void 0 ? void 0 : _b.dragOperation.status.idle)) return;
				sortable.element = void 0;
			};
		},
		attachHandle(node) {
			sortable.handle = node;
			return () => {
				sortable.handle = void 0;
			};
		},
		attachSource(node) {
			sortable.source = node;
			return () => {
				var _a, _b;
				if (((_a = sortable.source) === null || _a === void 0 ? void 0 : _a.isConnected) && !((_b = sortable.manager) === null || _b === void 0 ? void 0 : _b.dragOperation.status.idle)) return;
				sortable.source = void 0;
			};
		},
		attachTarget(node) {
			sortable.target = node;
			return () => {
				var _a, _b;
				if (((_a = sortable.target) === null || _a === void 0 ? void 0 : _a.isConnected) && !((_b = sortable.manager) === null || _b === void 0 ? void 0 : _b.dragOperation.status.idle)) return;
				sortable.target = void 0;
			};
		}
	};
}
//#endregion
//#region src/components/ui/context-menu/context-menu.svelte
function Context_menu($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { open = false, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Context_menu$1) {
				$$renderer.push("<!--[-->");
				Context_menu$1($$renderer, spread_props([restProps, {
					get open() {
						return open;
					},
					set open($$value) {
						open = $$value;
						$$settled = false;
					}
				}]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { open });
	});
}
//#endregion
//#region src/components/ui/context-menu/context-menu-sub.svelte
function Context_menu_sub($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { open = false, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Menu_sub) {
				$$renderer.push("<!--[-->");
				Menu_sub($$renderer, spread_props([restProps, {
					get open() {
						return open;
					},
					set open($$value) {
						open = $$value;
						$$settled = false;
					}
				}]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { open });
	});
}
//#endregion
//#region src/components/ui/context-menu/context-menu-portal.svelte
function Context_menu_portal($$renderer, $$props) {
	let { $$slots, $$events, ...restProps } = $$props;
	if (Portal) {
		$$renderer.push("<!--[-->");
		Portal($$renderer, spread_props([restProps]));
		$$renderer.push("<!--]-->");
	} else {
		$$renderer.push("<!--[!-->");
		$$renderer.push("<!--]-->");
	}
}
//#endregion
//#region src/components/ui/context-menu/context-menu-trigger.svelte
function Context_menu_trigger($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Context_menu_trigger$1) {
				$$renderer.push("<!--[-->");
				Context_menu_trigger$1($$renderer, spread_props([
					{
						"data-slot": "context-menu-trigger",
						class: cn("cn-context-menu-trigger select-none", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						}
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/components/ui/context-menu/context-menu-item.svelte
function Context_menu_item($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, inset, variant = "default", $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Menu_item) {
				$$renderer.push("<!--[-->");
				Menu_item($$renderer, spread_props([
					{
						"data-slot": "context-menu-item",
						"data-inset": inset,
						"data-variant": variant,
						class: cn("focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive focus:*:[svg]:text-accent-foreground gap-1.5 rounded-md px-1.5 py-1 text-sm data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4 group/context-menu-item relative flex cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						}
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/components/ui/context-menu/context-menu-content.svelte
function Context_menu_content($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, portalProps, class: className, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Context_menu_portal($$renderer, spread_props([portalProps, {
				children: ($$renderer) => {
					if (Context_menu_content$1) {
						$$renderer.push("<!--[-->");
						Context_menu_content$1($$renderer, spread_props([
							{
								"data-slot": "context-menu-content",
								class: cn("data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 bg-popover text-popover-foreground min-w-36 rounded-lg p-1 shadow-md ring-1 duration-100 z-50 overflow-x-hidden overflow-y-auto outline-none", className)
							},
							restProps,
							{
								get ref() {
									return ref;
								},
								set ref($$value) {
									ref = $$value;
									$$settled = false;
								}
							}
						]));
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
				},
				$$slots: { default: true }
			}]));
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/check.svelte
function Check($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "check" },
		props,
		{ iconNode: [["path", { "d": "M20 6 9 17l-5-5" }]] }
	]));
}
//#endregion
//#region src/components/ui/context-menu/context-menu-separator.svelte
function Context_menu_separator($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Menu_separator) {
				$$renderer.push("<!--[-->");
				Menu_separator($$renderer, spread_props([
					{
						"data-slot": "context-menu-separator",
						class: cn("bg-border -mx-1 my-1 h-px", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						}
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/components/ui/context-menu/context-menu-sub-content.svelte
function Context_menu_sub_content($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Menu_sub_content) {
				$$renderer.push("<!--[-->");
				Menu_sub_content($$renderer, spread_props([
					{
						"data-slot": "context-menu-sub-content",
						class: cn("data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 bg-popover text-popover-foreground min-w-32 rounded-lg border p-1 shadow-lg duration-100", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						}
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/components/ui/context-menu/context-menu-sub-trigger.svelte
function Context_menu_sub_trigger($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, inset, children, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Menu_sub_trigger) {
				$$renderer.push("<!--[-->");
				Menu_sub_trigger($$renderer, spread_props([
					{
						"data-slot": "context-menu-sub-trigger",
						"data-inset": inset,
						class: cn("focus:bg-accent focus:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground gap-1.5 rounded-md px-1.5 py-1 text-sm data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4 flex cursor-default items-center outline-hidden select-none data-inset:ps-8 [&_svg]:pointer-events-none [&_svg]:shrink-0", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						},
						children: ($$renderer) => {
							children?.($$renderer);
							$$renderer.push(`<!----> `);
							Chevron_right($$renderer, { class: "ml-auto" });
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/components/ui/context-menu/context-menu-checkbox-item.svelte
function Context_menu_checkbox_item($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, checked = false, indeterminate = false, class: className, inset, children: childrenProp, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			{
				function children($$renderer, { checked }) {
					$$renderer.push(`<span class="absolute right-2 pointer-events-none">`);
					if (checked) {
						$$renderer.push("<!--[0-->");
						Check($$renderer, {});
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></span> `);
					childrenProp?.($$renderer);
					$$renderer.push(`<!---->`);
				}
				if (Menu_checkbox_item) {
					$$renderer.push("<!--[-->");
					Menu_checkbox_item($$renderer, spread_props([
						{
							"data-slot": "context-menu-checkbox-item",
							"data-inset": inset,
							class: cn("focus:bg-accent focus:text-accent-foreground gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4 relative flex cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0", className)
						},
						restProps,
						{
							get ref() {
								return ref;
							},
							set ref($$value) {
								ref = $$value;
								$$settled = false;
							},
							get checked() {
								return checked;
							},
							set checked($$value) {
								checked = $$value;
								$$settled = false;
							},
							get indeterminate() {
								return indeterminate;
							},
							set indeterminate($$value) {
								indeterminate = $$value;
								$$settled = false;
							},
							children,
							$$slots: { default: true }
						}
					]));
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, {
			ref,
			checked,
			indeterminate
		});
	});
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/trash-2.svelte
function Trash_2($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "trash-2" },
		props,
		{ iconNode: [
			["path", { "d": "M10 11v6" }],
			["path", { "d": "M14 11v6" }],
			["path", { "d": "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }],
			["path", { "d": "M3 6h18" }],
			["path", { "d": "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }]
		] }
	]));
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/eye.svelte
function Eye($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "eye" },
		props,
		{ iconNode: [["path", { "d": "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" }], ["circle", {
			"cx": "12",
			"cy": "12",
			"r": "3"
		}]] }
	]));
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/eye-off.svelte
function Eye_off($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "eye-off" },
		props,
		{ iconNode: [
			["path", { "d": "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" }],
			["path", { "d": "M14.084 14.158a3 3 0 0 1-4.242-4.242" }],
			["path", { "d": "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" }],
			["path", { "d": "m2 2 20 20" }]
		] }
	]));
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/scissors.svelte
function Scissors($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "scissors" },
		props,
		{ iconNode: [
			["circle", {
				"cx": "6",
				"cy": "6",
				"r": "3"
			}],
			["path", { "d": "M8.12 8.12 12 12" }],
			["path", { "d": "M20 4 8.12 15.88" }],
			["circle", {
				"cx": "6",
				"cy": "18",
				"r": "3"
			}],
			["path", { "d": "M14.8 14.8 20 20" }]
		] }
	]));
}
//#endregion
//#region src/components/shader-composer/sortable-layer-row.svelte
function Sortable_layer_row($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { layer, index, isExpanded, onToggleExpanded, hasChildren = false, depth = 0 } = $$props;
		const sortable = createSortable({
			get id() {
				return `layer:${layer.id}`;
			},
			get index() {
				return index;
			},
			group: "layers",
			type: "layer",
			accept: ["layer"]
		});
		let isSelected = derived(() => composer.selectedNodeId === layer.source.id);
		let meta = derived(() => layer.source.meta);
		let isNestTarget = derived(() => sortable.isDropTarget && !sortable.isDragging);
		let nestCandidates = derived(() => composer.scene.layers.filter((l) => l.id !== layer.id));
		let isNested = derived(() => composer.scene.findLayerParent(layer.id) ?? null);
		let leftPad = derived(() => 36 + depth * 16);
		if (Context_menu) {
			$$renderer.push("<!--[-->");
			Context_menu($$renderer, {
				children: ($$renderer) => {
					if (Context_menu_trigger) {
						$$renderer.push("<!--[-->");
						Context_menu_trigger($$renderer, {
							children: ($$renderer) => {
								$$renderer.push(`<div${attr_class(clsx$1(cn("group/row relative flex items-center gap-2 h-9 rounded-lg pr-2 transition-colors", isSelected() ? "bg-[var(--indigo-700)] text-white" : "text-white hover:bg-[var(--surface-hover)]", !layer.enabled && "opacity-60", sortable.isDragging && "opacity-50", isNestTarget() && "ring-2 ring-inset ring-[var(--indigo-600)] bg-[var(--surface-hover)]")))}${attr_style(`padding-left: ${stringify(leftPad())}px;`)}>`);
								if (hasChildren) {
									$$renderer.push("<!--[0-->");
									$$renderer.push(`<button class="absolute top-1/2 -translate-y-1/2 p-0.5 text-white/80 hover:text-white"${attr_style(`left: ${stringify(leftPad() - 24)}px;`)}${attr("aria-label", isExpanded ? "Collapse children" : "Expand children")}>`);
									if (isExpanded) {
										$$renderer.push("<!--[0-->");
										Chevron_down($$renderer, { class: "size-4" });
									} else {
										$$renderer.push("<!--[-1-->");
										Chevron_right($$renderer, { class: "size-4" });
									}
									$$renderer.push(`<!--]--></button>`);
								} else $$renderer.push("<!--[-1-->");
								$$renderer.push(`<!--]--> `);
								if (layer.useAsMask) {
									$$renderer.push("<!--[0-->");
									Scissors($$renderer, {
										class: "size-3.5 shrink-0 text-white/80",
										"aria-label": "Mask layer"
									});
								} else {
									$$renderer.push("<!--[-1-->");
									$$renderer.push(`<span class="size-3.5 rounded-[3px] shrink-0" aria-hidden="true"${attr_style("", { "background-color": meta().color })}></span>`);
								}
								$$renderer.push(`<!--]--> <button class="flex-1 min-w-0 text-left text-[14px] font-medium truncate cursor-grab active:cursor-grabbing"${attr("title", layer.name)}>${escape_html(layer.name)}</button> <div${attr_class("flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity", void 0, { "opacity-100": isSelected() })}><button class="p-1 text-white/70 hover:text-white" aria-label="Toggle visibility">`);
								if (layer.enabled) {
									$$renderer.push("<!--[0-->");
									Eye($$renderer, { class: "size-3.5" });
								} else {
									$$renderer.push("<!--[-1-->");
									Eye_off($$renderer, { class: "size-3.5" });
								}
								$$renderer.push(`<!--]--></button> <button class="p-1 text-white/70 hover:text-white" aria-label="Remove layer">`);
								Trash_2($$renderer, { class: "size-3.5" });
								$$renderer.push(`<!----></button></div></div>`);
							},
							$$slots: { default: true }
						});
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
					$$renderer.push(` `);
					if (Context_menu_content) {
						$$renderer.push("<!--[-->");
						Context_menu_content($$renderer, {
							children: ($$renderer) => {
								if (nestCandidates().length > 0) {
									$$renderer.push("<!--[0-->");
									if (Context_menu_sub) {
										$$renderer.push("<!--[-->");
										Context_menu_sub($$renderer, {
											children: ($$renderer) => {
												if (Context_menu_sub_trigger) {
													$$renderer.push("<!--[-->");
													Context_menu_sub_trigger($$renderer, {
														children: ($$renderer) => {
															$$renderer.push(`<!---->Clip into…`);
														},
														$$slots: { default: true }
													});
													$$renderer.push("<!--]-->");
												} else {
													$$renderer.push("<!--[!-->");
													$$renderer.push("<!--]-->");
												}
												$$renderer.push(` `);
												if (Context_menu_sub_content) {
													$$renderer.push("<!--[-->");
													Context_menu_sub_content($$renderer, {
														children: ($$renderer) => {
															$$renderer.push(`<!--[-->`);
															const each_array = ensure_array_like(nestCandidates());
															for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
																let parent = each_array[$$index];
																if (Context_menu_item) {
																	$$renderer.push("<!--[-->");
																	Context_menu_item($$renderer, {
																		onclick: () => composer.nestLayerAsChild(layer.id, parent.id),
																		children: ($$renderer) => {
																			$$renderer.push(`<!---->${escape_html(parent.name)}`);
																		},
																		$$slots: { default: true }
																	});
																	$$renderer.push("<!--]-->");
																} else {
																	$$renderer.push("<!--[!-->");
																	$$renderer.push("<!--]-->");
																}
															}
															$$renderer.push(`<!--]-->`);
														},
														$$slots: { default: true }
													});
													$$renderer.push("<!--]-->");
												} else {
													$$renderer.push("<!--[!-->");
													$$renderer.push("<!--]-->");
												}
											},
											$$slots: { default: true }
										});
										$$renderer.push("<!--]-->");
									} else {
										$$renderer.push("<!--[!-->");
										$$renderer.push("<!--]-->");
									}
								} else $$renderer.push("<!--[-1-->");
								$$renderer.push(`<!--]--> `);
								if (isNested()) {
									$$renderer.push("<!--[0-->");
									if (Context_menu_item) {
										$$renderer.push("<!--[-->");
										Context_menu_item($$renderer, {
											onclick: () => composer.unnestLayer(layer.id),
											children: ($$renderer) => {
												$$renderer.push(`<!---->Move out of clip group`);
											},
											$$slots: { default: true }
										});
										$$renderer.push("<!--]-->");
									} else {
										$$renderer.push("<!--[!-->");
										$$renderer.push("<!--]-->");
									}
								} else $$renderer.push("<!--[-1-->");
								$$renderer.push(`<!--]--> `);
								if (Context_menu_checkbox_item) {
									$$renderer.push("<!--[-->");
									Context_menu_checkbox_item($$renderer, {
										checked: layer.useAsMask,
										onCheckedChange: () => composer.toggleLayerMask(layer.id),
										children: ($$renderer) => {
											$$renderer.push(`<!---->Use as mask`);
										},
										$$slots: { default: true }
									});
									$$renderer.push("<!--]-->");
								} else {
									$$renderer.push("<!--[!-->");
									$$renderer.push("<!--]-->");
								}
								$$renderer.push(` `);
								if (Context_menu_separator) {
									$$renderer.push("<!--[-->");
									Context_menu_separator($$renderer, {});
									$$renderer.push("<!--]-->");
								} else {
									$$renderer.push("<!--[!-->");
									$$renderer.push("<!--]-->");
								}
								$$renderer.push(` `);
								if (Context_menu_item) {
									$$renderer.push("<!--[-->");
									Context_menu_item($$renderer, {
										onclick: () => composer.removeLayer(layer.id),
										children: ($$renderer) => {
											$$renderer.push(`<!---->Delete layer`);
										},
										$$slots: { default: true }
									});
									$$renderer.push("<!--]-->");
								} else {
									$$renderer.push("<!--[!-->");
									$$renderer.push("<!--]-->");
								}
							},
							$$slots: { default: true }
						});
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
				},
				$$slots: { default: true }
			});
			$$renderer.push("<!--]-->");
		} else {
			$$renderer.push("<!--[!-->");
			$$renderer.push("<!--]-->");
		}
	});
}
//#endregion
//#region src/components/shader-composer/sortable-layer-with-effects.svelte
function Sortable_layer_with_effects($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { layer, layerIndex, isExpanded, onToggleExpanded, expandedLayers, onToggleChildExpanded, depth = 0 } = $$props;
		let hasChildren = derived(() => layer.children.length > 0);
		let displayChildren = derived(() => [...layer.children].reverse());
		$$renderer.push(`<div class="space-y-1">`);
		Sortable_layer_row($$renderer, {
			layer,
			index: layerIndex,
			isExpanded,
			onToggleExpanded,
			hasChildren: hasChildren(),
			depth
		});
		$$renderer.push(`<!----> `);
		if (hasChildren() && isExpanded) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="space-y-1"><!--[-->`);
			const each_array = ensure_array_like(displayChildren());
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				let child = each_array[i];
				Sortable_layer_with_effects($$renderer, {
					layer: child,
					layerIndex: i,
					isExpanded: expandedLayers[child.id] ?? true,
					onToggleExpanded: () => onToggleChildExpanded(child.id),
					expandedLayers,
					onToggleChildExpanded,
					depth: depth + 1
				});
			}
			$$renderer.push(`<!--]--></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/components/shader-composer/sortable-effect-row.svelte
function Sortable_effect_row($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { effectId, index, layerId, scope, depth = 2 } = $$props;
		let dragId = derived(() => scope === "layer" ? `effect:layer:${layerId}:${effectId}` : `effect:scene:${effectId}`);
		const sortable = createSortable({
			get id() {
				return dragId();
			},
			get index() {
				return index;
			},
			group: "effects",
			type: "effect"
		});
		let node = derived(() => composer.scene.findNode(effectId)?.node);
		let isSelected = derived(() => composer.selectedNodeId === effectId);
		let leftPad = derived(() => depth === 1 ? 36 : 60);
		if (node()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div${attr_class(clsx$1(cn("group/row relative flex items-center gap-2 h-9 rounded-lg pr-2 transition-colors", isSelected() ? "bg-[var(--indigo-700)] text-white" : "bg-[var(--surface-strong)] text-white hover:bg-[var(--surface-hover)]", !node().enabled && "opacity-60", sortable.isDragging && "opacity-50")))}${attr_style(`padding-left: ${stringify(leftPad())}px;`)}><span class="size-3 rounded-[3px] shrink-0" aria-hidden="true"${attr_style("", { "background-color": node().meta.color })}></span> <button class="flex-1 min-w-0 text-left text-[14px] font-medium truncate cursor-grab active:cursor-grabbing"${attr("title", node().meta.name)}>${escape_html(node().meta.name)}</button> <div${attr_class("flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity", void 0, { "opacity-100": isSelected() })}><button class="p-1 text-white/70 hover:text-white" aria-label="Toggle effect">`);
			if (node().enabled) {
				$$renderer.push("<!--[0-->");
				Eye($$renderer, { class: "size-3.5" });
			} else {
				$$renderer.push("<!--[-1-->");
				Eye_off($$renderer, { class: "size-3.5" });
			}
			$$renderer.push(`<!--]--></button> <button class="p-1 text-white/70 hover:text-white" aria-label="Remove effect">`);
			Trash_2($$renderer, { class: "size-3.5" });
			$$renderer.push(`<!----></button></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/components/shader-composer/layer-stack.svelte
function Layer_stack($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const sensors = [PointerSensor.configure({ activationConstraints(event) {
			if (event.pointerType === "touch") return [new PointerActivationConstraints.Delay({
				value: 250,
				tolerance: 5
			})];
			return [new PointerActivationConstraints.Distance({ value: 5 })];
		} }), KeyboardSensor];
		let sceneOpen = true;
		let expandedLayers = {};
		function toggleLayerExpanded(id) {
			expandedLayers = {
				...expandedLayers,
				[id]: !(expandedLayers[id] ?? true)
			};
		}
		let displayLayers = derived(() => [...composer.scene.layers].reverse());
		let displayPostEffects = derived(() => [...composer.scene.postEffects].reverse());
		function arrayMove(arr, from, to) {
			const next = arr.slice();
			const [it] = next.splice(from, 1);
			next.splice(to, 0, it);
			return next;
		}
		function parseEffectId(id) {
			if (!id.startsWith("effect:")) return null;
			const parts = id.split(":");
			if (parts[1] === "scene") return {
				container: "scene",
				effectId: parts[2]
			};
			if (parts[1] === "layer") return {
				container: parts[2],
				effectId: parts[3]
			};
			return null;
		}
		function effectDisplayIndex(loc) {
			if (loc.container === "scene") return displayPostEffects().findIndex((e) => e.id === loc.effectId);
			const layer = composer.scene.findLayer(loc.container);
			if (!layer) return -1;
			return [...layer.effects].reverse().findIndex((e) => e.id === loc.effectId);
		}
		function displayToStorageIndex(container, displayIndex) {
			const list = container === "scene" ? composer.scene.postEffects : composer.scene.findLayer(container)?.effects;
			if (!list) return 0;
			return Math.max(0, list.length - displayIndex);
		}
		function handleDragEnd(event) {
			if (event.canceled) return;
			const op = event.operation;
			const sourceId = op.source?.id;
			const targetId = op.target?.id;
			if (!sourceId || !targetId || sourceId === targetId) return;
			if (sourceId.startsWith("layer:") && targetId.startsWith("layer:")) {
				const oldIndex = displayLayers().findIndex((l) => `layer:${l.id}` === sourceId);
				const newIndex = displayLayers().findIndex((l) => `layer:${l.id}` === targetId);
				if (oldIndex < 0 || newIndex < 0) return;
				const next = arrayMove(displayLayers(), oldIndex, newIndex);
				composer.reorderLayers(next.slice().reverse().map((l) => l.id));
				return;
			}
			const src = parseEffectId(sourceId);
			if (!src) return;
			if (targetId === "scene-root") {
				if (src.container === "scene") return;
				composer.moveEffect(src.effectId, src.container, null, composer.scene.postEffects.length);
				return;
			}
			if (targetId.startsWith("layer:")) {
				const targetLayerId = targetId.slice(6);
				if (src.container === targetLayerId) return;
				const fromLayerId = src.container === "scene" ? null : src.container;
				composer.moveEffect(src.effectId, fromLayerId, targetLayerId, composer.scene.findLayer(targetLayerId)?.effects.length ?? 0);
				return;
			}
			const dst = parseEffectId(targetId);
			if (!dst) return;
			const dstDisplayIndex = effectDisplayIndex(dst);
			if (dstDisplayIndex < 0) return;
			if (src.container === dst.container) {
				const srcDisplayIndex = effectDisplayIndex(src);
				if (srcDisplayIndex < 0) return;
				if (src.container === "scene") {
					const next = arrayMove(displayPostEffects(), srcDisplayIndex, dstDisplayIndex);
					composer.reorderSceneEffects(next.slice().reverse().map((e) => e.id));
				} else {
					const layer = composer.scene.findLayer(src.container);
					if (!layer) return;
					const next = arrayMove([...layer.effects].reverse(), srcDisplayIndex, dstDisplayIndex);
					composer.reorderEffectsInLayer(src.container, next.slice().reverse().map((e) => e.id));
				}
				return;
			}
			const fromLayerId = src.container === "scene" ? null : src.container;
			const toLayerId = dst.container === "scene" ? null : dst.container;
			const storageIndex = displayToStorageIndex(dst.container, dstDisplayIndex);
			composer.moveEffect(src.effectId, fromLayerId, toLayerId, storageIndex);
		}
		DragDropProvider($$renderer, {
			sensors,
			onDragEnd: handleDragEnd,
			children: ($$renderer) => {
				$$renderer.push(`<div class="flex flex-col h-full min-h-0 px-3 py-3">`);
				Scene_header($$renderer, {
					open: sceneOpen,
					onToggle: () => sceneOpen = !sceneOpen
				});
				$$renderer.push(`<!----> `);
				if (sceneOpen) {
					$$renderer.push("<!--[0-->");
					Scroll_area($$renderer, {
						class: "flex-1 min-h-0 mt-2",
						children: ($$renderer) => {
							$$renderer.push(`<div class="space-y-1"><!--[-->`);
							const each_array = ensure_array_like(displayPostEffects());
							for (let i = 0, $$length = each_array.length; i < $$length; i++) {
								let fx = each_array[i];
								Sortable_effect_row($$renderer, {
									effectId: fx.id,
									index: i,
									layerId: null,
									scope: "scene",
									depth: 1
								});
							}
							$$renderer.push(`<!--]--> `);
							if (displayLayers().length === 0 && displayPostEffects().length === 0) {
								$$renderer.push("<!--[0-->");
								$$renderer.push(`<div class="text-center py-6 text-white/40 text-xs px-3">Use the toolbar below to add a shape or texture.</div>`);
							} else {
								$$renderer.push("<!--[-1-->");
								$$renderer.push(`<!--[-->`);
								const each_array_1 = ensure_array_like(displayLayers());
								for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
									let layer = each_array_1[i];
									Sortable_layer_with_effects($$renderer, {
										layer,
										layerIndex: i,
										isExpanded: expandedLayers[layer.id] ?? true,
										onToggleExpanded: () => toggleLayerExpanded(layer.id),
										expandedLayers,
										onToggleChildExpanded: toggleLayerExpanded
									});
								}
								$$renderer.push(`<!--]-->`);
							}
							$$renderer.push(`<!--]--></div>`);
						},
						$$slots: { default: true }
					});
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
			},
			$$slots: { default: true }
		});
	});
}
//#endregion
//#region src/lib/codegen/helpers/types.ts
/**
* Identity helper that narrows a helper entry's `needs` array to a literal
* tuple via `<const N>`. Use this in each helper file in place of a `:
* GlslUtilEntry` annotation:
*
*   export const fbm = helper({ code: `...`, needs: ['simplex2D'] })
*
* The literal narrowing lets the barrel cross-validate `needs` against the
* full set of helper names — a typo in `needs` becomes a compile-time error.
*/
function helper(t) {
	return t;
}
//#endregion
//#region src/lib/codegen/helpers/constants.ts
var constants_exports = /* @__PURE__ */ __exportAll({ pi: () => pi });
var pi = helper({ code: `
#ifndef TWO_PI
#define TWO_PI 6.28318530718
#endif
#ifndef PI
#define PI 3.14159265358979323846
#endif` });
//#endregion
//#region src/lib/codegen/helpers/hash.ts
var hash_exports = /* @__PURE__ */ __exportAll({
	hash: () => hash,
	hash2: () => hash2,
	hash21: () => hash21,
	hash22: () => hash22,
	hash3: () => hash3
});
var hash = helper({ code: `
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}` });
var hash2 = helper({ code: `
vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}` });
var hash3 = helper({ code: `
vec3 hash3(vec2 p) {
  vec3 q = vec3(dot(p, vec2(127.1, 311.7)),
                dot(p, vec2(269.5, 183.3)),
                dot(p, vec2(419.2, 371.9)));
  return fract(sin(q) * 43758.5453);
}` });
/** Better-distributed scalar hash, used by value-noise and grain layers. */
var hash21 = helper({ code: `
float hash21(vec2 p) {
  p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}` });
/** 2D-output hash with better distribution than two hash21 calls. */
var hash22 = helper({ code: `
vec2 hash22(vec2 p) {
  p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
  p += dot(p, p.yx + 19.19);
  return fract(vec2(p.x * p.y, p.x + p.y));
}` });
//#endregion
//#region src/lib/codegen/helpers/noise.ts
var noise_exports = /* @__PURE__ */ __exportAll({
	domainWarp: () => domainWarp,
	fbm: () => fbm,
	fiberNoise: () => fiberNoise,
	noiseTextureRandomGB: () => noiseTextureRandomGB,
	noiseTextureRandomR: () => noiseTextureRandomR,
	simplex2D: () => simplex2D,
	snoise: () => snoise,
	valueNoise: () => valueNoise
});
var simplex2D = helper({ code: `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289v2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float simplex2D(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289v2(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}` });
/** Alias for simplex2D so verbatim ports compile without renaming. */
var snoise = helper({
	code: `
float snoise(vec2 v) { return simplex2D(v); }`,
	needs: ["simplex2D"]
});
var valueNoise = helper({
	code: `
float valueNoise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}`,
	needs: ["hash21"]
});
var fbm = helper({
	code: `
float fbm(vec2 p, float octaves, float lacunarity, float gain) {
  float sum = 0.0;
  float amp = 1.0;
  float freq = 1.0;
  float maxOct = min(octaves, 8.0);
  for (float i = 0.0; i < 8.0; i += 1.0) {
    if (i >= maxOct) break;
    sum += amp * simplex2D(p * freq);
    freq *= lacunarity;
    amp *= gain;
  }
  return sum;
}`,
	needs: ["simplex2D"]
});
var noiseTextureRandomR = helper({ code: `
float noiseTextureRandomR(vec2 p) {
  return texture(u_noiseTexture, floor(p) / 100.0 + 0.5).r;
}` });
var noiseTextureRandomGB = helper({ code: `
vec2 noiseTextureRandomGB(vec2 p) {
  return texture(u_noiseTexture, floor(p) / 100.0 + 0.5).gb;
}` });
var fiberNoise = helper({
	code: `
float fiberRandom(vec2 p) {
  return texture(u_noiseTexture, fract(floor(p) / 100.0)).b;
}

float fiberValueNoise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = fiberRandom(i);
  float b = fiberRandom(i + vec2(1.0, 0.0));
  float c = fiberRandom(i + vec2(0.0, 1.0));
  float d = fiberRandom(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

float fiberNoiseFbm(vec2 n, vec2 seedOffset) {
  float total = 0.0;
  float amplitude = 1.0;
  for (int i = 0; i < 4; i++) {
    n = rotate(n, 0.7);
    total += fiberValueNoise(n + seedOffset) * amplitude;
    n *= 2.0;
    amplitude *= 0.6;
  }
  return total;
}

float fiberNoise(vec2 uv, vec2 seedOffset) {
  float epsilon = 0.001;
  float n1 = fiberNoiseFbm(uv + vec2(epsilon, 0.0), seedOffset);
  float n2 = fiberNoiseFbm(uv - vec2(epsilon, 0.0), seedOffset);
  float n3 = fiberNoiseFbm(uv + vec2(0.0, epsilon), seedOffset);
  float n4 = fiberNoiseFbm(uv - vec2(0.0, epsilon), seedOffset);
  return length(vec2(n1 - n2, n3 - n4)) / (2.0 * epsilon);
}`,
	needs: ["rotate"]
});
var domainWarp = helper({
	code: `
vec2 domainWarp(vec2 uv, float n, float amplitude) {
  return uv + vec2(cos(n * TWO_PI), sin(n * TWO_PI)) * amplitude;
}`,
	needs: ["pi"]
});
//#endregion
//#region src/lib/codegen/helpers/blend-modes.ts
var blend_modes_exports = /* @__PURE__ */ __exportAll({
	blendAdd: () => blendAdd,
	blendHardLight: () => blendHardLight,
	blendMultiply: () => blendMultiply,
	blendNormal: () => blendNormal,
	blendOverlay: () => blendOverlay,
	blendScreen: () => blendScreen,
	blendSoftLight: () => blendSoftLight
});
var blendNormal = helper({ code: `
vec4 blendNormal(vec4 base, vec4 blend, float opacity) {
  return mix(base, blend, blend.a * opacity);
}` });
var blendAdd = helper({ code: `
vec4 blendAdd(vec4 base, vec4 blend, float opacity) {
  return base + blend * opacity;
}` });
var blendMultiply = helper({ code: `
vec4 blendMultiply(vec4 base, vec4 blend, float opacity) {
  return mix(base, base * blend, opacity);
}` });
var blendScreen = helper({ code: `
vec4 blendScreen(vec4 base, vec4 blend, float opacity) {
  return mix(base, 1.0 - (1.0 - base) * (1.0 - blend), opacity);
}` });
var blendOverlay = helper({ code: `
vec4 blendOverlay(vec4 base, vec4 blend, float opacity) {
  vec4 result;
  result.rgb = mix(
    2.0 * base.rgb * blend.rgb,
    1.0 - 2.0 * (1.0 - base.rgb) * (1.0 - blend.rgb),
    step(0.5, base.rgb)
  );
  result.a = blend.a;
  return mix(base, result, opacity);
}` });
var blendSoftLight = helper({ code: `
vec4 blendSoftLight(vec4 base, vec4 blend, float opacity) {
  vec4 result;
  result.rgb = mix(
    2.0 * base.rgb * blend.rgb + base.rgb * base.rgb * (1.0 - 2.0 * blend.rgb),
    sqrt(base.rgb) * (2.0 * blend.rgb - 1.0) + 2.0 * base.rgb * (1.0 - blend.rgb),
    step(0.5, blend.rgb)
  );
  result.a = blend.a;
  return mix(base, result, opacity);
}` });
var blendHardLight = helper({ code: `
vec4 blendHardLight(vec4 base, vec4 blend, float opacity) {
  vec4 result;
  result.rgb = mix(
    2.0 * base.rgb * blend.rgb,
    1.0 - 2.0 * (1.0 - base.rgb) * (1.0 - blend.rgb),
    step(0.5, blend.rgb)
  );
  result.a = blend.a;
  return mix(base, result, opacity);
}` });
//#endregion
//#region src/lib/codegen/helpers/transform.ts
var transform_exports = /* @__PURE__ */ __exportAll({
	aastep: () => aastep,
	luma: () => luma,
	remap: () => remap,
	rotate: () => rotate,
	rotate2D: () => rotate2D,
	screenUv: () => screenUv,
	seamlessLoopBlend: () => seamlessLoopBlend,
	smin: () => smin
});
var remap = helper({ code: `
float remap(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}` });
var rotate2D = helper({ code: `
vec2 rotate2D(vec2 v, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
}` });
/** Alias kept alongside rotate2D so verbatim ports compile without rewriting. */
var rotate = helper({ code: `
vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}` });
/**
* Aspect-corrected centered UV: y in [-0.5, 0.5], x scaled by aspect.
* Use this whenever a primitive needs to look the same on any canvas shape.
*/
var screenUv = helper({ code: `
vec2 screenUv(vec2 uv) {
  return (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
}` });
/** Anti-aliased step using screen-space derivatives (WebGL2 / GLSL ES 3.00). */
var aastep = helper({ code: `
float aastep(float threshold, float value) {
  float afwidth = max(0.5 * fwidth(value), 1e-6);
  return smoothstep(threshold - afwidth, threshold + afwidth, value);
}` });
/** Smooth-min (continuous union) — k controls softness. */
var smin = helper({ code: `
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}` });
var luma = helper({ code: `
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }` });
/**
* Sin-blended dual-sample weight for seamlessly looping noise animations.
* When an effect samples noise twice — once at `t`, once at `t + duration*0.5`
* — and mixes by this weight, the result repeats perfectly every `duration`
* seconds. Pass `duration <= 0` to disable looping (returns 0 → no blend).
*/
var seamlessLoopBlend = helper({
	code: `
float seamlessLoopBlend(float t, float duration) {
  if (duration <= 0.0) return 0.0;
  return 0.5 + 0.5 * sin(t * PI / duration - 0.5 * PI);
}`,
	needs: ["pi"]
});
//#endregion
//#region src/lib/codegen/helpers/sdf.ts
var sdf_exports = /* @__PURE__ */ __exportAll({
	sdBox: () => sdBox,
	sdCircle: () => sdCircle,
	sdCross: () => sdCross,
	sdEllipse: () => sdEllipse,
	sdEquilateralTriangle: () => sdEquilateralTriangle,
	sdRegularPolygon: () => sdRegularPolygon,
	sdRoundedBox: () => sdRoundedBox,
	sdSegment: () => sdSegment,
	sdStar: () => sdStar,
	sdVesica: () => sdVesica
});
var sdCircle = helper({ code: `
float sdCircle(vec2 p, float r) { return length(p) - r; }` });
var sdBox = helper({ code: `
float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}` });
var sdRoundedBox = helper({ code: `
float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}` });
var sdEllipse = helper({ code: `
float sdEllipse(vec2 p, vec2 ab) {
  p = abs(p);
  if (p.x > p.y) { p = p.yx; ab = ab.yx; }
  float l = ab.y * ab.y - ab.x * ab.x;
  float m = ab.x * p.x / l;
  float m2 = m * m;
  float n = ab.y * p.y / l;
  float n2 = n * n;
  float c = (m2 + n2 - 1.0) / 3.0;
  float c3 = c * c * c;
  float q = c3 + m2 * n2 * 2.0;
  float d = c3 + m2 * n2;
  float g = m + m * n2;
  float co;
  if (d < 0.0) {
    float h = acos(q / c3) / 3.0;
    float s = cos(h);
    float t = sin(h) * sqrt(3.0);
    float rx = sqrt(-c * (s + t + 2.0) + m2);
    float ry = sqrt(-c * (s - t + 2.0) + m2);
    co = (ry + sign(l) * rx + abs(g) / (rx * ry) - m) / 2.0;
  } else {
    float h = 2.0 * m * n * sqrt(d);
    float s = sign(q + h) * pow(abs(q + h), 1.0 / 3.0);
    float u = sign(q - h) * pow(abs(q - h), 1.0 / 3.0);
    float rx = -s - u - c * 4.0 + 2.0 * m2;
    float ry = (s - u) * sqrt(3.0);
    float rm = sqrt(rx * rx + ry * ry);
    co = (ry / sqrt(rm - rx) + 2.0 * g / rm - m) / 2.0;
  }
  vec2 r = vec2(ab.x * co, ab.y * sqrt(1.0 - co * co));
  return length(r - p) * sign(p.y - r.y);
}` });
var sdEquilateralTriangle = helper({ code: `
float sdEquilateralTriangle(vec2 p, float r) {
  const float k = 1.7320508; // sqrt(3)
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}` });
var sdRegularPolygon = helper({ code: `
float sdRegularPolygon(vec2 p, float r, float n) {
  float an = 3.1415926 / n;
  float bn = mod(atan(p.x, p.y), 2.0 * an) - an;
  return length(p) * cos(bn) - r * cos(an);
}` });
var sdStar = helper({ code: `
float sdStar(vec2 p, float r, float n, float m) {
  float an = 3.1415926 / n;
  float en = 3.1415926 / m;
  vec2 acs = vec2(cos(an), sin(an));
  vec2 ecs = vec2(cos(en), sin(en));
  float bn = mod(atan(p.x, p.y), 2.0 * an) - an;
  p = length(p) * vec2(cos(bn), abs(sin(bn)));
  p -= r * acs;
  p += ecs * clamp(-dot(p, ecs), 0.0, r * acs.y / ecs.y);
  return length(p) * sign(p.x);
}` });
var sdSegment = helper({ code: `
float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}` });
var sdCross = helper({ code: `
float sdCross(vec2 p, vec2 b, float r) {
  p = abs(p); p = (p.y > p.x) ? p.yx : p.xy;
  vec2 q = p - b;
  float k = max(q.y, q.x);
  vec2 w = (k > 0.0) ? q : vec2(b.y - p.x, -k);
  return sign(k) * length(max(w, 0.0)) + r;
}` });
var sdVesica = helper({ code: `
float sdVesica(vec2 p, float r, float d) {
  p = abs(p);
  float b = sqrt(r * r - d * d);
  return ((p.y - b) * d > p.x * b)
    ? length(p - vec2(0.0, b))
    : length(p - vec2(-d, 0.0)) - r;
}` });
//#endregion
//#region src/lib/codegen/helpers/color.ts
var color_exports = /* @__PURE__ */ __exportAll({
	colorBandingFix: () => colorBandingFix,
	colorRampLookup: () => colorRampLookup,
	hsv2rgb: () => hsv2rgb,
	oklchColorRampLookup: () => oklchColorRampLookup,
	oklchTransforms: () => oklchTransforms,
	rgb2hsv: () => rgb2hsv
});
var rgb2hsv = helper({ code: `
vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}` });
var hsv2rgb = helper({ code: `
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}` });
/**
* Smooth/stepped color-ramp lookup over a fixed-size vec4 palette.
* - steps=0 → smooth, steps>0 → quantised globally.
* - stepsPerColor>0 → quantise within each color segment.
* - softness controls blend sharpness (0=hard, 1=fully smooth).
* - wrap=true → palette repeats; wrap=false → clamp at last color.
*
* The fixed array length 10 must match `DEFAULT_VEC4_ARRAY_LENGTH` in
* `schema-introspection.ts`.
*/
var colorRampLookup = helper({ code: `
vec4 colorRampLookup(float t, vec4 colors[10], int count, int steps, float softness, int stepsPerColor, bool wrap) {
  int n = max(count, 1);
  if (n == 1) return colors[0];
  float tc = clamp(t, 0.0, 1.0);
  if (wrap) tc = fract(tc);
  if (steps > 0) {
    float fSteps = float(steps);
    tc = floor(tc * fSteps) / max(fSteps - 1.0, 1.0);
    tc = clamp(tc, 0.0, 1.0);
  }
  float seg = tc * float(n - 1);
  int i0 = int(floor(seg));
  int i1 = i0 + 1;
  if (i1 > n - 1) i1 = wrap ? 0 : n - 1;
  float f = seg - float(i0);
  if (stepsPerColor > 1) {
    float spc = float(stepsPerColor);
    f = floor(f * spc) / max(spc - 1.0, 1.0);
    f = clamp(f, 0.0, 1.0);
  }
  float fw = fwidth(f);
  float s = max(softness, 0.0);
  f = smoothstep(0.5 - s - fw, 0.5 + s + fw, f);
  vec4 a = colors[i0];
  vec4 b = colors[i1];
  return mix(a, b, f);
}` });
var oklchTransforms = helper({
	code: `
#ifndef OKLCH_CHROMA_THRESHOLD
#define OKLCH_CHROMA_THRESHOLD 0.001
#endif
#ifndef OKLCH_HUE_NEUTRALIZER
#define OKLCH_HUE_NEUTRALIZER -2.0
#endif

vec3 srgbToLinear(vec3 srgb) {
  return pow(max(srgb, vec3(0.0)), vec3(2.2));
}

vec3 linearToSrgb(vec3 linear) {
  return pow(max(linear, vec3(0.0)), vec3(1.0 / 2.2));
}

vec3 LrgbToOklab(vec3 rgb) {
  float L = pow(max(0.4122214708 * rgb.r + 0.5363325363 * rgb.g + 0.0514459929 * rgb.b, 0.0), 1.0 / 3.0);
  float M = pow(max(0.2119034982 * rgb.r + 0.6806995451 * rgb.g + 0.1073969566 * rgb.b, 0.0), 1.0 / 3.0);
  float S = pow(max(0.0883024619 * rgb.r + 0.2817188376 * rgb.g + 0.6299787005 * rgb.b, 0.0), 1.0 / 3.0);
  return vec3(
    0.2104542553 * L + 0.7936177850 * M - 0.0040720468 * S,
    1.9779984951 * L - 2.4285922050 * M + 0.4505937099 * S,
    0.0259040371 * L + 0.7827717662 * M - 0.8086757660 * S
  );
}

vec3 OklabToLrgb(vec3 oklab) {
  float L = oklab.x;
  float a = oklab.y;
  float b = oklab.z;
  float l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  float m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  float s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  float l = l_ * l_ * l_;
  float m = m_ * m_ * m_;
  float s = s_ * s_ * s_;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

vec3 oklabToOklch(vec3 oklab) {
  float C = length(oklab.yz);
  float H = atan(oklab.z, oklab.y);
  if (C < OKLCH_CHROMA_THRESHOLD) H = OKLCH_HUE_NEUTRALIZER;
  return vec3(oklab.x, C, H);
}

vec3 oklchToOklab(vec3 oklch) {
  return vec3(oklch.x, oklch.y * cos(oklch.z), oklch.y * sin(oklch.z));
}

float mixHue(float h1, float h2, float mixer) {
  float delta = mod(h2 - h1 + PI, TWO_PI) - PI;
  return h1 + mixer * delta;
}

vec3 srgbToOklch(vec3 rgb) {
  return oklabToOklch(LrgbToOklab(srgbToLinear(rgb)));
}

vec3 oklchToSrgb(vec3 oklch) {
  return linearToSrgb(OklabToLrgb(oklchToOklab(oklch)));
}

vec3 mixOklchVector(vec3 color1, vec3 color2, float mixer) {
  color1.x = mix(color1.x, color2.x, mixer);
  color1.y = mix(color1.y, color2.y, mixer);
  if (color1.y > OKLCH_CHROMA_THRESHOLD && color2.y > OKLCH_CHROMA_THRESHOLD) {
    color1.z = mixHue(color1.z, color2.z, mixer);
  }
  return color1;
}

vec3 oklchMix(vec3 color1, vec3 color2, float mixer) {
  vec3 o1 = srgbToOklch(color1);
  vec3 o2 = srgbToOklch(color2);
  return clamp(oklchToSrgb(mixOklchVector(o1, o2, mixer)), 0.0, 1.0);
}`,
	needs: ["pi"]
});
var oklchColorRampLookup = helper({
	code: `
vec4 oklchColorRampLookup(float t, vec4 colors[10], int count, int steps, float softness, int stepsPerColor, bool wrap) {
  int n = max(count, 1);
  if (n == 1) return colors[0];
  float tc = clamp(t, 0.0, 1.0);
  if (wrap) tc = fract(tc);
  if (steps > 0) {
    float fSteps = float(steps);
    tc = floor(tc * fSteps) / max(fSteps - 1.0, 1.0);
    tc = clamp(tc, 0.0, 1.0);
  }
  float seg = tc * float(n - 1);
  int i0 = int(floor(seg));
  int i1 = i0 + 1;
  if (i1 > n - 1) i1 = wrap ? 0 : n - 1;
  float f = seg - float(i0);
  if (stepsPerColor > 1) {
    float spc = float(stepsPerColor);
    f = floor(f * spc) / max(spc - 1.0, 1.0);
    f = clamp(f, 0.0, 1.0);
  }
  float fw = fwidth(f);
  float s = max(softness, 0.0);
  f = smoothstep(0.5 - s - fw, 0.5 + s + fw, f);
  vec4 a = colors[i0];
  vec4 b = colors[i1];
  vec3 rgb = oklchMix(a.rgb, b.rgb, f);
  return vec4(rgb, mix(a.a, b.a, f));
}`,
	needs: ["oklchTransforms"]
});
var colorBandingFix = helper({ code: `
vec3 colorBandingFix(vec3 color) {
  float n = fract(sin(dot(0.014 * gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453123) - 0.5;
  return color + n / 256.0;
}

float colorBandingFix(float value) {
  float n = fract(sin(dot(0.014 * gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453123) - 0.5;
  return value + n / 256.0;
}` });
//#endregion
//#region src/lib/codegen/helpers/image.ts
var image_exports = /* @__PURE__ */ __exportAll({
	applyEdgeHandling: () => applyEdgeHandling,
	applySizing: () => applySizing,
	gaussian13: () => gaussian13,
	gaussian9: () => gaussian9,
	unpremultiplyAlpha: () => unpremultiplyAlpha
});
/**
* Maps canvas-space UV in [0,1] to image-space UV honouring image aspect, fit
* mode (0=cover, 1=contain, 2=fill), uniform scale, rotation (radians) and
* pixel-space offset. Canvas aspect comes from u_resolution.
*
* Meta layout: (imgAspect, fitMode, scale, rotation). Offset is vec2 in UV.
*/
var applySizing = helper({ code: `
vec2 applySizing(vec2 uv, vec4 meta, vec2 offset) {
  vec2 c = uv - 0.5 - offset;
  float canvasAspect = u_resolution.x / max(u_resolution.y, 1.0);
  float imgAspect = max(meta.x, 1e-4);
  float fitMode = meta.y;
  float scale = max(meta.z, 1e-4);
  float rot = meta.w;
  // Rotate around center.
  float ca = cos(rot);
  float sa = sin(rot);
  c = vec2(c.x * ca - c.y * sa, c.x * sa + c.y * ca);
  // Aspect correction.
  vec2 ratio = vec2(1.0);
  if (fitMode < 0.5) {
    if (canvasAspect > imgAspect) {
      ratio = vec2(1.0, imgAspect / canvasAspect);
    } else {
      ratio = vec2(canvasAspect / imgAspect, 1.0);
    }
  } else if (fitMode < 1.5) {
    if (canvasAspect > imgAspect) {
      ratio = vec2(imgAspect / canvasAspect, 1.0);
    } else {
      ratio = vec2(1.0, canvasAspect / imgAspect);
    }
  }
  c /= max(scale, 1e-4);
  c /= ratio;
  return c + 0.5;
}` });
var gaussian9 = helper({ code: `
vec4 gaussian9(sampler2D src, vec2 uv, vec2 r) {
  vec4 c = texture(src, uv) * 0.227;
  c += texture(src, uv + vec2( r.x, 0.0)) * 0.194;
  c += texture(src, uv + vec2(-r.x, 0.0)) * 0.194;
  c += texture(src, uv + vec2(0.0,  r.y)) * 0.121;
  c += texture(src, uv + vec2(0.0, -r.y)) * 0.121;
  c += texture(src, uv + vec2( r.x,  r.y)) * 0.0707;
  c += texture(src, uv + vec2(-r.x,  r.y)) * 0.0707;
  c += texture(src, uv + vec2( r.x, -r.y)) * 0.0707;
  c += texture(src, uv + vec2(-r.x, -r.y)) * 0.0707;
  return c;
}` });
/**
* 13-tap separable Gaussian (single direction). Mirrors upstream's blur kernel
* weights: [0.056, 0.135, 0.265, 0.444, 0.654, 0.857, 1.0, 0.857, 0.654,
*           0.444, 0.265, 0.135, 0.056], normalized to ~6.214 total.
* `step` is the per-tap pixel offset along `direction` (pre-normalized).
*/
var gaussian13 = helper({ code: `
vec4 gaussian13(sampler2D src, vec2 uv, vec2 direction) {
  const float W0 = 1.0;
  const float W1 = 0.857;
  const float W2 = 0.654;
  const float W3 = 0.444;
  const float W4 = 0.265;
  const float W5 = 0.135;
  const float W6 = 0.056;
  const float TOTAL = W0 + 2.0 * (W1 + W2 + W3 + W4 + W5 + W6);
  vec4 acc = texture(src, uv) * W0;
  acc += texture(src, uv + direction * 1.0) * W1;
  acc += texture(src, uv - direction * 1.0) * W1;
  acc += texture(src, uv + direction * 2.0) * W2;
  acc += texture(src, uv - direction * 2.0) * W2;
  acc += texture(src, uv + direction * 3.0) * W3;
  acc += texture(src, uv - direction * 3.0) * W3;
  acc += texture(src, uv + direction * 4.0) * W4;
  acc += texture(src, uv - direction * 4.0) * W4;
  acc += texture(src, uv + direction * 5.0) * W5;
  acc += texture(src, uv - direction * 5.0) * W5;
  acc += texture(src, uv + direction * 6.0) * W6;
  acc += texture(src, uv - direction * 6.0) * W6;
  return acc / TOTAL;
}` });
/**
* Edge-handling helper. Modes (passed as int):
*   0 = stretch (clamp to [0,1])
*   1 = transparent (return vec4(0) outside)
*   2 = mirror
*   3 = wrap
* Returns the resampled color from `src` after applying the edge policy to `uv`.
*/
var applyEdgeHandling = helper({ code: `
vec4 applyEdgeHandling(sampler2D src, vec2 uv, int mode) {
  if (mode == 1) {
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      return vec4(0.0);
    }
    return texture(src, uv);
  }
  if (mode == 2) {
    vec2 m = mod(uv, 2.0);
    m = mix(m, 2.0 - m, step(1.0, m));
    return texture(src, m);
  }
  if (mode == 3) {
    return texture(src, fract(uv));
  }
  return texture(src, clamp(uv, 0.0, 1.0));
}` });
/**
* Unpremultiplies alpha. Used after edge-handled samples in distortion/effect
* nodes that need to operate on straight-alpha colors.
*/
var unpremultiplyAlpha = helper({ code: `
vec4 unpremultiplyAlpha(vec4 c) {
  return c.a > 1e-4 ? vec4(c.rgb / c.a, c.a) : c;
}` });
({
	...constants_exports,
	...hash_exports,
	...noise_exports,
	...blend_modes_exports,
	...transform_exports,
	...sdf_exports,
	...color_exports,
	...image_exports
});
/**
* Walk through wrapper types (`.optional()`, `.default(...)`, `.nullable()`,
* etc.) to reach the underlying schema.
*/
function unwrap(schema) {
	let s = schema;
	for (let next = tryUnwrap(s); next; next = tryUnwrap(s)) s = next;
	return s;
}
/**
* Infer the GLSL uniform type for a Zod schema. Returns undefined if the
* schema isn't representable as a single GLSL uniform. Pass a precomputed
* `meta` to avoid a redundant `getMetaDeep` walk in tight loops.
*/
function inferGlslType(schema, meta = getMetaDeep(schema)) {
	if (meta?.kind === "image-input" || meta?.kind === "sampler2D") return "sampler2D";
	if (meta?.kind === "palette") return "vec4Array";
	const inner = unwrap(schema);
	if (inner instanceof z.ZodNumber) return inner.format?.includes("int") ? "int" : "float";
	if (inner instanceof z.ZodBoolean) return "bool";
	if (inner instanceof z.ZodTuple) switch (inner.def.items.length) {
		case 2: return "vec2";
		case 3: return "vec3";
		case 4: return "vec4";
	}
}
function buildUniformField(key, schema, glslType, meta) {
	return {
		key,
		glslType,
		schema,
		kind: meta?.kind,
		arrayLength: glslType === "vec4Array" ? meta?.ui?.array?.maxLength ?? 10 : void 0
	};
}
/**
* Walk a Zod object schema's shape, returning one InspectedField per top-level
* field. Skips fields that aren't representable as uniforms.
*/
function inspectObjectSchema(schema) {
	const inner = unwrap(schema);
	if (!(inner instanceof z.ZodObject)) return [];
	const out = [];
	for (const [key, fieldSchema] of Object.entries(inner.shape)) {
		const meta = getMetaDeep(fieldSchema);
		const glslType = inferGlslType(fieldSchema, meta);
		if (!glslType) continue;
		out.push(buildUniformField(key, fieldSchema, glslType, meta));
	}
	return out;
}
/**
* Like `inspectObjectSchema` but additionally includes enum-string fields so
* the property panel can render dropdowns for non-uniform config fields
* (e.g. a Gradient node's `type: 'linear' | 'radial'`).
*/
function inspectUiFields(schema) {
	const inner = unwrap(schema);
	if (!(inner instanceof z.ZodObject)) return [];
	const out = [];
	for (const [key, fieldSchema] of Object.entries(inner.shape)) {
		const meta = getMetaDeep(fieldSchema);
		const glslType = inferGlslType(fieldSchema, meta);
		if (glslType) {
			out.push(buildUniformField(key, fieldSchema, glslType, meta));
			continue;
		}
		const innerField = unwrap(fieldSchema);
		if (innerField instanceof z.ZodEnum) out.push({
			key,
			glslType: "enumString",
			schema: fieldSchema,
			enumValues: innerField.options.filter((v) => typeof v === "string")
		});
	}
	return out;
}
//#endregion
//#region src/components/shader-composer/draggable-handle.svelte
function Draggable_handle($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { cx, cy, size = 8, fill = "white", cursor = "grab", onDrag } = $$props;
		$$renderer.push(`<circle role="button" tabindex="0" aria-label="Drag handle"${attr("cx", cx)}${attr("cy", cy)}${attr("r", size / 2)}${attr("fill", fill)} stroke="#0a0a0a"${attr("stroke-width", 1.5)}${attr_style("", {
			cursor,
			"pointer-events": "auto"
		})}></circle>`);
	});
}
//#endregion
//#region src/components/shader-composer/transform-widget.svelte
function Transform_widget($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { x, y, width, height, rotation, canvasWidth, canvasHeight, onChange } = $$props;
		const HANDLE_SIZE = 8;
		const ROTATE_HOT_RADIUS = 16;
		const EDGE_THICKNESS = 8;
		let centerPx = derived(() => ({
			x: x * canvasWidth,
			y: (1 - y) * canvasHeight
		}));
		let halfWPx = derived(() => width / 2 * canvasHeight);
		let halfHPx = derived(() => height / 2 * canvasHeight);
		let rotationDeg = derived(() => rotation);
		derived(() => rotation * Math.PI / 180);
		let groupTransform = derived(() => `translate(${centerPx().x} ${centerPx().y}) rotate(${rotationDeg()})`);
		const EDGES = [
			{
				axis: "y",
				sign: -1,
				cursor: "ns-resize"
			},
			{
				axis: "y",
				sign: 1,
				cursor: "ns-resize"
			},
			{
				axis: "x",
				sign: -1,
				cursor: "ew-resize"
			},
			{
				axis: "x",
				sign: 1,
				cursor: "ew-resize"
			}
		];
		const CORNERS = [
			{
				sx: -1,
				sy: -1,
				cursor: "nwse-resize"
			},
			{
				sx: 1,
				sy: -1,
				cursor: "nesw-resize"
			},
			{
				sx: -1,
				sy: 1,
				cursor: "nesw-resize"
			},
			{
				sx: 1,
				sy: 1,
				cursor: "nwse-resize"
			}
		];
		function rotateCursor() {
			return `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 12a9 9 0 1 1-3.7-7.3' /><polyline points='21 3 21 9 15 9'/></svg>`)}") 12 12, grab`;
		}
		const ROTATE_CURSOR = rotateCursor();
		$$renderer.push(`<g${attr("transform", groupTransform())}><rect${attr("x", -halfWPx())}${attr("y", -halfHPx())}${attr("width", halfWPx() * 2)}${attr("height", halfHPx() * 2)} fill="none" stroke="rgba(59, 130, 246, 0.6)" stroke-width="1" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"${attr_style("", { "pointer-events": "none" })}></rect><!--[-->`);
		const each_array = ensure_array_like(CORNERS);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let corner = each_array[$$index];
			const cx = corner.sx * (halfWPx() + ROTATE_HOT_RADIUS / 2);
			const cy = corner.sy * (halfHPx() + ROTATE_HOT_RADIUS / 2);
			$$renderer.push(`<rect role="button" tabindex="-1" aria-label="Rotate"${attr("x", cx - ROTATE_HOT_RADIUS / 2)}${attr("y", cy - ROTATE_HOT_RADIUS / 2)}${attr("width", ROTATE_HOT_RADIUS)}${attr("height", ROTATE_HOT_RADIUS)} fill="transparent"${attr_style("", {
				cursor: ROTATE_CURSOR,
				"pointer-events": "auto"
			})}></rect>`);
		}
		$$renderer.push(`<!--]--><!--[-->`);
		const each_array_1 = ensure_array_like(EDGES);
		for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
			let edge = each_array_1[$$index_1];
			if (edge.axis === "x") {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<rect role="button" tabindex="-1" aria-label="Resize"${attr("x", edge.sign * halfWPx() - EDGE_THICKNESS / 2)}${attr("y", -halfHPx())}${attr("width", EDGE_THICKNESS)}${attr("height", halfHPx() * 2)} fill="transparent"${attr_style("", {
					cursor: edge.cursor,
					"pointer-events": "auto"
				})}></rect>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<rect role="button" tabindex="-1" aria-label="Resize"${attr("x", -halfWPx())}${attr("y", edge.sign * halfHPx() - EDGE_THICKNESS / 2)}${attr("width", halfWPx() * 2)}${attr("height", EDGE_THICKNESS)} fill="transparent"${attr_style("", {
					cursor: edge.cursor,
					"pointer-events": "auto"
				})}></rect>`);
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--><!--[-->`);
		const each_array_2 = ensure_array_like(CORNERS);
		for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
			let corner = each_array_2[$$index_2];
			$$renderer.push(`<rect role="button" tabindex="-1" aria-label="Resize corner"${attr("x", corner.sx * halfWPx() - HANDLE_SIZE / 2)}${attr("y", corner.sy * halfHPx() - HANDLE_SIZE / 2)}${attr("width", HANDLE_SIZE)}${attr("height", HANDLE_SIZE)} fill="#22d3ee" stroke="#0a0a0a" stroke-width="1.5" vector-effect="non-scaling-stroke"${attr_style("", {
				cursor: corner.cursor,
				"pointer-events": "auto"
			})}></rect>`);
		}
		$$renderer.push(`<!--]--></g>`);
	});
}
//#endregion
//#region src/components/shader-composer/canvas-overlay.svelte
function Canvas_overlay($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { canvas, layer } = $$props;
		let width = 0;
		let height = 0;
		function rgbFromColor(color, fallback) {
			if (!Array.isArray(color)) return fallback;
			return `rgb(${Math.round((color[0] ?? 0) * 255)}, ${Math.round((color[1] ?? 0) * 255)}, ${Math.round((color[2] ?? 0) * 255)})`;
		}
		function toPx(v, axis) {
			return v * axis;
		}
		function fromPx(px, axis) {
			return axis > 0 ? px / axis : 0;
		}
		function toPxY(v, h) {
			return (1 - v) * h;
		}
		function fromPxY(px, h) {
			return h > 0 ? 1 - px / h : 0;
		}
		function radiusToPx(v, _w, h) {
			return v * h;
		}
		function radiusFromPx(px, _w, h) {
			return h > 0 ? px / h : 0;
		}
		let cls = derived(() => layer?.source.cls);
		let config = derived(() => layer?.source.config ?? {});
		let controls = derived(() => cls() && "spatialControls" in cls() ? resolveSpatialControls(cls().spatialControls, config()) : []);
		let sourceId = derived(() => layer?.source.id ?? "");
		function setField(key, value) {
			composer.updateConfig(sourceId(), key, value);
		}
		function setFields(updates) {
			composer.updateConfigBatch(sourceId(), updates);
		}
		const BBOX_CORNERS = [
			[
				-1,
				-1,
				"nwse-resize"
			],
			[
				1,
				-1,
				"nesw-resize"
			],
			[
				-1,
				1,
				"nesw-resize"
			],
			[
				1,
				1,
				"nwse-resize"
			]
		];
		function applyBoundingBoxDrag(c, px, py, uniformModifier) {
			const cxVal = config()[c.cx] ?? .5;
			const cyVal = config()[c.cy] ?? .5;
			const cxPx = toPx(cxVal, width);
			const cyPx = toPxY(cyVal, height);
			const base = height;
			if (base <= 0) return;
			const isUniformField = c.w === c.h;
			const newHalfWPx = Math.max(Math.abs(px - cxPx), 0);
			const newHalfHPx = Math.max(Math.abs(py - cyPx), 0);
			if (c.extents) {
				const ext = c.extents(config());
				const oldHalfWPx = ext.w * base;
				const oldHalfHPx = ext.h * base;
				let scaleW = oldHalfWPx > .5 ? newHalfWPx / oldHalfWPx : 1;
				let scaleH = oldHalfHPx > .5 ? newHalfHPx / oldHalfHPx : 1;
				if (isUniformField || uniformModifier) {
					const s = Math.max(scaleW, scaleH);
					scaleW = s;
					scaleH = s;
				}
				const oldW = config()[c.w] ?? 0;
				if (isUniformField) setField(c.w, oldW * scaleW);
				else {
					const oldH = config()[c.h] ?? 0;
					setFields({
						[c.w]: oldW * scaleW,
						[c.h]: oldH * scaleH
					});
				}
				return;
			}
			const halfMul = c.halfExtent ? 1 : .5;
			let halfWPx = newHalfWPx;
			let halfHPx = newHalfHPx;
			if (isUniformField || uniformModifier) {
				const oldW = config()[c.w] ?? 0;
				const oldH = config()[c.h] ?? 0;
				const oldHalfWPx = oldW * halfMul * base;
				const oldHalfHPx = oldH * halfMul * base;
				if (isUniformField || oldHalfWPx < .5 || oldHalfHPx < .5) {
					const m = Math.max(halfWPx, halfHPx);
					halfWPx = m;
					halfHPx = m;
				} else {
					const ratio = Math.max(halfWPx / oldHalfWPx, halfHPx / oldHalfHPx);
					halfWPx = oldHalfWPx * ratio;
					halfHPx = oldHalfHPx * ratio;
				}
			}
			const wField = halfWPx / (halfMul * base);
			const hField = halfHPx / (halfMul * base);
			if (isUniformField) setField(c.w, Math.max(wField, hField));
			else setFields({
				[c.w]: wField,
				[c.h]: hField
			});
		}
		if (layer && width > 0 && height > 0 && controls().length > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<svg class="absolute inset-0 pointer-events-none"${attr("width", width)}${attr("height", height)}${attr("viewBox", `0 0 ${width} ${height}`)} preserveAspectRatio="none"><!--[-->`);
			const each_array = ensure_array_like(controls());
			for (let idx = 0, $$length = each_array.length; idx < $$length; idx++) {
				let c = each_array[idx];
				if (c.kind === "point") {
					$$renderer.push("<!--[0-->");
					Draggable_handle($$renderer, {
						cx: toPx(config()[c.x] ?? .5, width),
						cy: toPxY(config()[c.y] ?? .5, height),
						fill: "#3b82f6",
						onDrag: (px, py) => {
							setFields({
								[c.x]: fromPx(px, width),
								[c.y]: fromPxY(py, height)
							});
						}
					});
				} else if (c.kind === "radius") {
					$$renderer.push("<!--[1-->");
					const cx = toPx(config()[c.cx] ?? .5, width);
					const cy = toPxY(config()[c.cy] ?? .5, height);
					const r = radiusToPx(config()[c.r] ?? .3, width, height);
					$$renderer.push(`<g><circle${attr("cx", cx)}${attr("cy", cy)}${attr("r", r)} fill="none" stroke="rgba(59, 130, 246, 0.5)"${attr("stroke-width", 1)} stroke-dasharray="3 3"${attr_style("", { "pointer-events": "none" })}></circle>`);
					Draggable_handle($$renderer, {
						cx: cx + r,
						cy,
						fill: "#22d3ee",
						cursor: "ew-resize",
						onDrag: (px, py) => {
							const dx = px - cx;
							const dy = py - cy;
							setField(c.r, radiusFromPx(Math.hypot(dx, dy), width, height));
						}
					});
					$$renderer.push(`<!----></g>`);
				} else if (c.kind === "transform") {
					$$renderer.push("<!--[2-->");
					Transform_widget($$renderer, {
						x: config()[c.x] ?? .5,
						y: config()[c.y] ?? .5,
						width: config()[c.w] ?? .5,
						height: config()[c.h] ?? .5,
						rotation: config()[c.rotation] ?? 0,
						canvasWidth: width,
						canvasHeight: height,
						onChange: (next) => {
							setFields({
								[c.x]: next.x,
								[c.y]: next.y,
								[c.w]: next.width,
								[c.h]: next.height,
								[c.rotation]: next.rotation
							});
						}
					});
				} else if (c.kind === "boundingBox") {
					$$renderer.push("<!--[3-->");
					const cx = toPx(config()[c.cx] ?? .5, width);
					const cy = toPxY(config()[c.cy] ?? .5, height);
					const ext = c.extents ? c.extents(config()) : null;
					const halfMul = c.halfExtent ? 1 : .5;
					const base = height;
					const halfW = ext ? ext.w * base : (config()[c.w] ?? .5) * halfMul * base;
					const halfH = ext ? ext.h * base : (config()[c.h] ?? .5) * halfMul * base;
					$$renderer.push(`<g><rect${attr("x", cx - halfW)}${attr("y", cy - halfH)}${attr("width", halfW * 2)}${attr("height", halfH * 2)} fill="none" stroke="rgba(59, 130, 246, 0.5)"${attr("stroke-width", 1)} stroke-dasharray="3 3"${attr_style("", { "pointer-events": "none" })}></rect><!--[-->`);
					const each_array_1 = ensure_array_like(BBOX_CORNERS);
					for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
						let [sx, sy, cursor] = each_array_1[$$index];
						Draggable_handle($$renderer, {
							cx: cx + sx * halfW,
							cy: cy + sy * halfH,
							fill: "#22d3ee",
							cursor,
							onDrag: (px, py, e) => applyBoundingBoxDrag(c, px, py, e.metaKey || e.ctrlKey)
						});
					}
					$$renderer.push(`<!--]--></g>`);
				} else if (c.kind === "segment") {
					$$renderer.push("<!--[4-->");
					const x1 = toPx(config()[c.from[0]] ?? 0, width);
					const y1 = toPxY(config()[c.from[1]] ?? 0, height);
					const x2 = toPx(config()[c.to[0]] ?? 1, width);
					const y2 = toPxY(config()[c.to[1]] ?? 1, height);
					$$renderer.push(`<g><line${attr("x1", x1)}${attr("y1", y1)}${attr("x2", x2)}${attr("y2", y2)} stroke="rgba(59, 130, 246, 0.6)"${attr("stroke-width", 1.5)} stroke-dasharray="4 3"${attr_style("", { "pointer-events": "none" })}></line>`);
					Draggable_handle($$renderer, {
						cx: x1,
						cy: y1,
						fill: "#3b82f6",
						onDrag: (px, py) => {
							setFields({
								[c.from[0]]: fromPx(px, width),
								[c.from[1]]: fromPxY(py, height)
							});
						}
					});
					$$renderer.push(`<!---->`);
					Draggable_handle($$renderer, {
						cx: x2,
						cy: y2,
						fill: "#a855f7",
						onDrag: (px, py) => {
							setFields({
								[c.to[0]]: fromPx(px, width),
								[c.to[1]]: fromPxY(py, height)
							});
						}
					});
					$$renderer.push(`<!----></g>`);
				} else if (c.kind === "polygon") {
					$$renderer.push("<!--[5-->");
					$$renderer.push(`<g><!--[-->`);
					const each_array_2 = ensure_array_like(c.points);
					for (let pi = 0, $$length = each_array_2.length; pi < $$length; pi++) {
						let [xKey, yKey] = each_array_2[pi];
						Draggable_handle($$renderer, {
							cx: toPx(config()[xKey] ?? .5, width),
							cy: toPxY(config()[yKey] ?? .5, height),
							fill: "#3b82f6",
							onDrag: (nx, ny) => {
								setFields({
									[xKey]: fromPx(nx, width),
									[yKey]: fromPxY(ny, height)
								});
							}
						});
					}
					$$renderer.push(`<!--]--></g>`);
				} else if (c.kind === "pointVec2") {
					$$renderer.push("<!--[6-->");
					const v = config()[c.key] ?? [.5, .5];
					Draggable_handle($$renderer, {
						cx: toPx(v[0], width),
						cy: toPxY(v[1], height),
						size: 12,
						fill: c.color ? rgbFromColor(config()[c.color], "#3b82f6") : "#3b82f6",
						onDrag: (px, py) => setField(c.key, [fromPx(px, width), fromPxY(py, height)])
					});
				} else if (c.kind === "radiusVec2") {
					$$renderer.push("<!--[7-->");
					const v = config()[c.center] ?? [.5, .5];
					const cx = toPx(v[0], width);
					const cy = toPxY(v[1], height);
					const r = radiusToPx(config()[c.r] ?? .3, width, height);
					const centerFill = c.color ? rgbFromColor(config()[c.color], "#3b82f6") : "#3b82f6";
					$$renderer.push(`<g><circle${attr("cx", cx)}${attr("cy", cy)}${attr("r", r)} fill="none" stroke="rgba(59, 130, 246, 0.5)"${attr("stroke-width", 1)} stroke-dasharray="3 3"${attr_style("", { "pointer-events": "none" })}></circle>`);
					Draggable_handle($$renderer, {
						cx,
						cy,
						fill: centerFill,
						onDrag: (px, py) => setField(c.center, [fromPx(px, width), fromPxY(py, height)])
					});
					$$renderer.push(`<!---->`);
					Draggable_handle($$renderer, {
						cx: cx + r,
						cy,
						fill: "#22d3ee",
						cursor: "ew-resize",
						onDrag: (px, py) => {
							const dx = px - cx;
							const dy = py - cy;
							setField(c.r, radiusFromPx(Math.hypot(dx, dy), width, height));
						}
					});
					$$renderer.push(`<!----></g>`);
				} else if (c.kind === "segmentVec2") {
					$$renderer.push("<!--[8-->");
					const a = config()[c.from] ?? [0, .5];
					const b = config()[c.to] ?? [1, .5];
					const x1 = toPx(a[0], width);
					const y1 = toPxY(a[1], height);
					const x2 = toPx(b[0], width);
					const y2 = toPxY(b[1], height);
					const fillFrom = c.colorFrom ? rgbFromColor(config()[c.colorFrom], "#3b82f6") : "#3b82f6";
					const fillTo = c.colorTo ? rgbFromColor(config()[c.colorTo], "#a855f7") : "#a855f7";
					$$renderer.push(`<g><line${attr("x1", x1)}${attr("y1", y1)}${attr("x2", x2)}${attr("y2", y2)} stroke="rgba(59, 130, 246, 0.6)"${attr("stroke-width", 1.5)} stroke-dasharray="4 3"${attr_style("", { "pointer-events": "none" })}></line>`);
					Draggable_handle($$renderer, {
						cx: x1,
						cy: y1,
						size: 12,
						fill: fillFrom,
						onDrag: (px, py) => setField(c.from, [fromPx(px, width), fromPxY(py, height)])
					});
					$$renderer.push(`<!---->`);
					Draggable_handle($$renderer, {
						cx: x2,
						cy: y2,
						size: 12,
						fill: fillTo,
						onDrag: (px, py) => setField(c.to, [fromPx(px, width), fromPxY(py, height)])
					});
					$$renderer.push(`<!----></g>`);
				} else if (c.kind === "colorStop") {
					$$renderer.push("<!--[9-->");
					const cx = toPx(config()[c.x] ?? .5, width);
					const cy = toPxY(config()[c.y] ?? .5, height);
					const color = config()[c.color];
					Draggable_handle($$renderer, {
						cx,
						cy,
						size: 12,
						fill: color ? `rgb(${(color[0] ?? 0) * 255}, ${(color[1] ?? 0) * 255}, ${(color[2] ?? 0) * 255})` : "#3b82f6",
						onDrag: (px, py) => {
							setFields({
								[c.x]: fromPx(px, width),
								[c.y]: fromPxY(py, height)
							});
						}
					});
				} else if (c.kind === "colorStopVec2") {
					$$renderer.push("<!--[10-->");
					const v = config()[c.key] ?? [.5, .5];
					const cx = toPx(v[0], width);
					const cy = toPxY(v[1], height);
					const color = config()[c.color];
					Draggable_handle($$renderer, {
						cx,
						cy,
						size: 12,
						fill: color ? `rgb(${(color[0] ?? 0) * 255}, ${(color[1] ?? 0) * 255}, ${(color[2] ?? 0) * 255})` : "#3b82f6",
						onDrag: (px, py) => setField(c.key, [fromPx(px, width), fromPxY(py, height)])
					});
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--></svg>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/components/shader-composer/shader-preview.svelte
function Shader_preview($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let canvas = null;
		let scene = derived(() => composer.scene);
		let selectedLayer = derived(() => {
			if (!composer.selectedNodeId) return null;
			return composer.scene.findNode(composer.selectedNodeId)?.layer ?? null;
		});
		derived(() => {
			const parts = [];
			parts.push(`bg:${scene().background.color.join(",")}`);
			for (const layer of scene().layers) {
				parts.push(`L:${layer.id}:${layer.enabled ? 1 : 0}:${layer.blendMode}:${layer.useAsMask ? 1 : 0}:${layer.source.id}:${layer.source.typeId}:${layer.source.enabled ? 1 : 0}:${layer.source.structuralKey()}`);
				for (const fx of layer.effects) parts.push(`E:${fx.id}:${fx.typeId}:${fx.enabled ? 1 : 0}:${fx.blendMode}:${fx.structuralKey()}`);
			}
			for (const fx of scene().postEffects) parts.push(`P:${fx.id}:${fx.typeId}:${fx.enabled ? 1 : 0}:${fx.blendMode}:${fx.structuralKey()}`);
			return parts.join("|");
		});
		$$renderer.push(`<div class="relative w-full h-full transparency-checker svelte-1a1gil9"><canvas class="w-full h-full"></canvas> `);
		Canvas_overlay($$renderer, {
			canvas,
			layer: selectedLayer()
		});
		$$renderer.push(`<!----></div>`);
	});
}
//#endregion
//#region src/components/ui/slider/slider.svelte
function Slider($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, value = void 0, orientation = "horizontal", class: className, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			{
				function children($$renderer, { thumbItems }) {
					$$renderer.push(`<span data-slot="slider-track"${attr("data-orientation", orientation)}${attr_class(clsx$1(cn("bg-muted rounded-full data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1 bg-muted relative grow overflow-hidden data-horizontal:w-full data-vertical:h-full")))}>`);
					if (Slider_range) {
						$$renderer.push("<!--[-->");
						Slider_range($$renderer, {
							"data-slot": "slider-range",
							class: cn("bg-primary absolute select-none data-horizontal:h-full data-vertical:w-full")
						});
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
					$$renderer.push(`</span> <!--[-->`);
					const each_array = ensure_array_like(thumbItems);
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let thumb = each_array[$$index];
						if (Slider_thumb) {
							$$renderer.push("<!--[-->");
							Slider_thumb($$renderer, {
								"data-slot": "slider-thumb",
								index: thumb.index,
								class: "border-ring ring-ring/50 relative size-3 rounded-full border bg-white transition-[color,box-shadow] after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 block shrink-0 select-none disabled:pointer-events-none disabled:opacity-50"
							});
							$$renderer.push("<!--]-->");
						} else {
							$$renderer.push("<!--[!-->");
							$$renderer.push("<!--]-->");
						}
					}
					$$renderer.push(`<!--]-->`);
				}
				if (Slider$1) {
					$$renderer.push("<!--[-->");
					Slider$1($$renderer, spread_props([
						{
							"data-slot": "slider",
							orientation,
							class: cn("data-vertical:min-h-40 relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:w-auto data-vertical:flex-col", className)
						},
						restProps,
						{
							get ref() {
								return ref;
							},
							set ref($$value) {
								ref = $$value;
								$$settled = false;
							},
							get value() {
								return value;
							},
							set value($$value) {
								value = $$value;
								$$settled = false;
							},
							children,
							$$slots: { default: true }
						}
					]));
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, {
			ref,
			value
		});
	});
}
//#endregion
//#region src/components/ui/label/label.svelte
function Label($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Label$1) {
				$$renderer.push("<!--[-->");
				Label$1($$renderer, spread_props([
					{
						"data-slot": "label",
						class: cn("gap-2 text-sm leading-none font-medium group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						}
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/components/ui/select/select.svelte
function Select($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { open = false, value = void 0, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Select$1) {
				$$renderer.push("<!--[-->");
				Select$1($$renderer, spread_props([restProps, {
					get open() {
						return open;
					},
					set open($$value) {
						open = $$value;
						$$settled = false;
					},
					get value() {
						return value;
					},
					set value($$value) {
						value = $$value;
						$$settled = false;
					}
				}]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, {
			open,
			value
		});
	});
}
//#endregion
//#region src/components/ui/select/select-item.svelte
function Select_item($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, value, label, children: childrenProp, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			{
				function children($$renderer, { selected, highlighted }) {
					$$renderer.push(`<span class="absolute end-2 flex size-3.5 items-center justify-center">`);
					if (selected) {
						$$renderer.push("<!--[0-->");
						Check($$renderer, { class: "cn-select-item-indicator-icon" });
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></span> `);
					if (childrenProp) {
						$$renderer.push("<!--[0-->");
						childrenProp($$renderer, {
							selected,
							highlighted
						});
						$$renderer.push(`<!---->`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`${escape_html(label || value)}`);
					}
					$$renderer.push(`<!--]-->`);
				}
				if (Select_item$1) {
					$$renderer.push("<!--[-->");
					Select_item$1($$renderer, spread_props([
						{
							value,
							"data-slot": "select-item",
							class: cn("focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2 focus:bg-accent data-highlighted:bg-accent data-highlighted:text-accent-foreground focus:text-accent-foreground relative flex w-full cursor-default items-center outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0", className)
						},
						restProps,
						{
							get ref() {
								return ref;
							},
							set ref($$value) {
								ref = $$value;
								$$settled = false;
							},
							children,
							$$slots: { default: true }
						}
					]));
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/components/ui/select/select-portal.svelte
function Select_portal($$renderer, $$props) {
	let { $$slots, $$events, ...restProps } = $$props;
	if (Portal) {
		$$renderer.push("<!--[-->");
		Portal($$renderer, spread_props([restProps]));
		$$renderer.push("<!--]-->");
	} else {
		$$renderer.push("<!--[!-->");
		$$renderer.push("<!--]-->");
	}
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/chevron-up.svelte
function Chevron_up($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "chevron-up" },
		props,
		{ iconNode: [["path", { "d": "m18 15-6-6-6 6" }]] }
	]));
}
//#endregion
//#region src/components/ui/select/select-scroll-up-button.svelte
function Select_scroll_up_button($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Select_scroll_up_button$1) {
				$$renderer.push("<!--[-->");
				Select_scroll_up_button$1($$renderer, spread_props([
					{
						"data-slot": "select-scroll-up-button",
						class: cn("bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4 top-0 w-full", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						},
						children: ($$renderer) => {
							Chevron_up($$renderer, {});
						},
						$$slots: { default: true }
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/components/ui/select/select-scroll-down-button.svelte
function Select_scroll_down_button($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Select_scroll_down_button$1) {
				$$renderer.push("<!--[-->");
				Select_scroll_down_button$1($$renderer, spread_props([
					{
						"data-slot": "select-scroll-down-button",
						class: cn("bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4 bottom-0 w-full", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						},
						children: ($$renderer) => {
							Chevron_down($$renderer, {});
						},
						$$slots: { default: true }
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/components/ui/select/select-content.svelte
function Select_content($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, sideOffset = 4, portalProps, children, preventScroll = true, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Select_portal($$renderer, spread_props([portalProps, {
				children: ($$renderer) => {
					if (Select_content$1) {
						$$renderer.push("<!--[-->");
						Select_content$1($$renderer, spread_props([
							{
								sideOffset,
								preventScroll,
								"data-slot": "select-content",
								class: cn("bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 min-w-36 rounded-lg shadow-md ring-1 duration-100 data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2 relative isolate z-50 overflow-x-hidden overflow-y-auto", className)
							},
							restProps,
							{
								get ref() {
									return ref;
								},
								set ref($$value) {
									ref = $$value;
									$$settled = false;
								},
								children: ($$renderer) => {
									Select_scroll_up_button($$renderer, {});
									$$renderer.push(`<!----> `);
									if (Select_viewport) {
										$$renderer.push("<!--[-->");
										Select_viewport($$renderer, {
											class: cn("h-(--bits-select-anchor-height) w-full min-w-(--bits-select-anchor-width) scroll-my-1"),
											children: ($$renderer) => {
												children?.($$renderer);
												$$renderer.push(`<!---->`);
											},
											$$slots: { default: true }
										});
										$$renderer.push("<!--]-->");
									} else {
										$$renderer.push("<!--[!-->");
										$$renderer.push("<!--]-->");
									}
									$$renderer.push(` `);
									Select_scroll_down_button($$renderer, {});
									$$renderer.push(`<!---->`);
								},
								$$slots: { default: true }
							}
						]));
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
				},
				$$slots: { default: true }
			}]));
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/components/ui/select/select-trigger.svelte
function Select_trigger($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, children, size = "default", $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Select_trigger$1) {
				$$renderer.push("<!--[-->");
				Select_trigger$1($$renderer, spread_props([
					{
						"data-slot": "select-trigger",
						"data-size": size,
						class: cn("border-input data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 gap-1.5 rounded-lg border bg-transparent py-2 pr-2 pl-2.5 text-sm transition-colors select-none focus-visible:ring-3 aria-invalid:ring-3 data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:flex *:data-[slot=select-value]:gap-1.5 [&_svg:not([class*='size-'])]:size-4 flex w-fit items-center justify-between whitespace-nowrap outline-none disabled:cursor-not-allowed disabled:opacity-50 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center [&_svg]:pointer-events-none [&_svg]:shrink-0", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						},
						children: ($$renderer) => {
							children?.($$renderer);
							$$renderer.push(`<!----> `);
							Chevron_down($$renderer, { class: "text-muted-foreground size-4 pointer-events-none" });
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/components/shader-composer/color-input.svelte
function Color_input($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value, onChange } = $$props;
		let hasAlpha = derived(() => value.length === 4);
		let hexValue = derived(() => `#${value.slice(0, 3).map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}`);
		$$renderer.push(`<div class="space-y-2"><div class="flex items-center gap-2"><input type="color"${attr("value", hexValue())} class="w-8 h-8 rounded border border-border cursor-pointer"/> <span class="text-xs text-muted-foreground font-mono">${escape_html(hexValue())} `);
		if (hasAlpha()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<span class="opacity-60">${escape_html(Math.round(value[3] * 100))}%</span>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></span></div> `);
		if (hasAlpha()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="flex items-center gap-2"><span class="text-[10px] text-muted-foreground w-4">A</span> `);
			Slider($$renderer, {
				type: "single",
				value: value[3],
				onValueChange: (a) => onChange([
					value[0],
					value[1],
					value[2],
					a
				]),
				min: 0,
				max: 1,
				step: .01,
				class: "flex-1"
			});
			$$renderer.push(`<!----></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/plus.svelte
function Plus($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "plus" },
		props,
		{ iconNode: [["path", { "d": "M5 12h14" }], ["path", { "d": "M12 5v14" }]] }
	]));
}
//#endregion
//#region src/components/shader-composer/color-array-input.svelte
function Color_array_input($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value, maxLength, minLength, onChange } = $$props;
		let colors = derived(() => value.values.slice(0, value.length));
		function rgbToHex(c) {
			return `#${c.slice(0, 3).map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")).join("")}`;
		}
		function updateColor(i, next) {
			const arr = colors().map((c, idx) => idx === i ? next : c);
			onChange({
				values: arr,
				length: arr.length
			});
		}
		$$renderer.push(`<div class="space-y-1"><!--[-->`);
		const each_array = ensure_array_like(colors());
		for (let i = 0, $$length = each_array.length; i < $$length; i++) {
			let c = each_array[i];
			const hex = rgbToHex(c);
			$$renderer.push(`<div class="flex items-center gap-2"><input type="color"${attr("value", hex)} class="w-7 h-7 rounded border border-border cursor-pointer"/> <span class="text-[11px] font-mono text-muted-foreground flex-1">${escape_html(hex)}</span> `);
			Slider($$renderer, {
				type: "single",
				value: c[3] ?? 1,
				onValueChange: (a) => updateColor(i, [
					c[0],
					c[1],
					c[2],
					a
				]),
				min: 0,
				max: 1,
				step: .01,
				class: "w-16"
			});
			$$renderer.push(`<!----> `);
			if (colors().length > minLength) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<button class="text-muted-foreground hover:text-destructive p-0.5" aria-label="Remove color">`);
				Trash_2($$renderer, { class: "h-3 w-3" });
				$$renderer.push(`<!----></button>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--> `);
		if (colors().length < maxLength) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<button class="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground py-1">`);
			Plus($$renderer, { class: "h-3 w-3" });
			$$renderer.push(`<!----> Add color</button>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/upload.svelte
function Upload($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "upload" },
		props,
		{ iconNode: [
			["path", { "d": "M12 3v12" }],
			["path", { "d": "m17 8-5-5-5 5" }],
			["path", { "d": "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }]
		] }
	]));
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/x.svelte
function X($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "x" },
		props,
		{ iconNode: [["path", { "d": "M18 6 6 18" }], ["path", { "d": "m6 6 12 12" }]] }
	]));
}
//#endregion
//#region src/components/shader-composer/image-input.svelte
function Image_input($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value, onChange } = $$props;
		$$renderer.push(`<div class="space-y-2"><div class="flex items-center gap-2 p-2 rounded border border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50" role="button" tabindex="0">`);
		if (value.url) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<img${attr("src", value.url)} alt="Preview" class="w-12 h-12 object-cover rounded"/>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="w-12 h-12 rounded bg-muted/60 flex items-center justify-center text-muted-foreground">`);
			Upload($$renderer, { class: "h-4 w-4" });
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]--> <div class="flex-1 min-w-0"><div class="text-[11px] text-muted-foreground truncate">${escape_html(value.url ? value.sourceKind === "dataUrl" ? "Uploaded file" : value.url : "Drop or paste an image")}</div> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div> `);
		if (value.url) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<button class="text-muted-foreground hover:text-destructive p-1" aria-label="Clear image">`);
			X($$renderer, { class: "h-3 w-3" });
			$$renderer.push(`<!----></button>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div> <input type="file" accept="image/*" class="hidden"/> <input type="text" placeholder="…or paste a URL" class="w-full h-7 text-[11px] px-2 rounded border border-border bg-background"/> <div class="grid grid-cols-2 gap-2"><label class="text-[10px] text-muted-foreground">Fit `);
		$$renderer.select({
			class: "w-full h-6 mt-0.5 text-[11px] bg-background border border-border rounded px-1",
			value: value.fit ?? "cover",
			onchange: (e) => onChange({
				...value,
				fit: e.currentTarget.value
			})
		}, ($$renderer) => {
			$$renderer.option({ value: "cover" }, ($$renderer) => {
				$$renderer.push(`Cover`);
			});
			$$renderer.option({ value: "contain" }, ($$renderer) => {
				$$renderer.push(`Contain`);
			});
			$$renderer.option({ value: "fill" }, ($$renderer) => {
				$$renderer.push(`Fill`);
			});
		});
		$$renderer.push(`</label> <label class="text-[10px] text-muted-foreground">Scale `);
		Slider($$renderer, {
			type: "single",
			value: value.scale ?? 1,
			onValueChange: (s) => onChange({
				...value,
				scale: s
			}),
			min: .1,
			max: 4,
			step: .01,
			class: "mt-2"
		});
		$$renderer.push(`<!----></label></div></div>`);
	});
}
//#endregion
//#region src/components/shader-composer/field-control.svelte
function Field_control($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { field, label, value, onChange } = $$props;
		let meta = derived(() => getMetaDeep(field.schema));
		let ui = derived(() => meta()?.ui);
		if (field.glslType === "enumString") {
			$$renderer.push("<!--[0-->");
			const opts = field.enumValues ?? [];
			const current = value ?? opts[0] ?? "";
			$$renderer.push(`<div class="space-y-2">`);
			Label($$renderer, {
				class: "text-xs text-muted-foreground",
				children: ($$renderer) => {
					$$renderer.push(`<!---->${escape_html(label)}`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> `);
			if (Select) {
				$$renderer.push("<!--[-->");
				Select($$renderer, {
					type: "single",
					value: current,
					onValueChange: (v) => onChange(v),
					children: ($$renderer) => {
						if (Select_trigger) {
							$$renderer.push("<!--[-->");
							Select_trigger($$renderer, {
								class: "w-full h-8 text-xs",
								children: ($$renderer) => {
									$$renderer.push(`<!---->${escape_html(current.charAt(0).toUpperCase() + current.slice(1))}`);
								},
								$$slots: { default: true }
							});
							$$renderer.push("<!--]-->");
						} else {
							$$renderer.push("<!--[!-->");
							$$renderer.push("<!--]-->");
						}
						$$renderer.push(` `);
						if (Select_content) {
							$$renderer.push("<!--[-->");
							Select_content($$renderer, {
								children: ($$renderer) => {
									$$renderer.push(`<!--[-->`);
									const each_array = ensure_array_like(opts);
									for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
										let opt = each_array[$$index];
										if (Select_item) {
											$$renderer.push("<!--[-->");
											Select_item($$renderer, {
												value: opt,
												children: ($$renderer) => {
													$$renderer.push(`<!---->${escape_html(opt.charAt(0).toUpperCase() + opt.slice(1))}`);
												},
												$$slots: { default: true }
											});
											$$renderer.push("<!--]-->");
										} else {
											$$renderer.push("<!--[!-->");
											$$renderer.push("<!--]-->");
										}
									}
									$$renderer.push(`<!--]-->`);
								},
								$$slots: { default: true }
							});
							$$renderer.push("<!--]-->");
						} else {
							$$renderer.push("<!--[!-->");
							$$renderer.push("<!--]-->");
						}
					},
					$$slots: { default: true }
				});
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
			$$renderer.push(`</div>`);
		} else if (field.glslType === "float") {
			$$renderer.push("<!--[1-->");
			const numValue = value ?? 0;
			$$renderer.push(`<div class="space-y-2"><div class="flex items-center justify-between">`);
			Label($$renderer, {
				class: "text-xs text-muted-foreground",
				children: ($$renderer) => {
					$$renderer.push(`<!---->${escape_html(label)}`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> <span class="text-xs text-muted-foreground font-mono w-12 text-right">${escape_html(numValue.toFixed(2))}</span></div> `);
			Slider($$renderer, {
				type: "single",
				value: numValue,
				onValueChange: (v) => onChange(v),
				min: ui()?.min ?? 0,
				max: ui()?.max ?? 1,
				step: ui()?.step ?? .01,
				class: "w-full"
			});
			$$renderer.push(`<!----></div>`);
		} else if (field.glslType === "int") {
			$$renderer.push("<!--[2-->");
			const intValue = value ?? 0;
			$$renderer.push(`<div class="space-y-2"><div class="flex items-center justify-between">`);
			Label($$renderer, {
				class: "text-xs text-muted-foreground",
				children: ($$renderer) => {
					$$renderer.push(`<!---->${escape_html(label)}`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> <span class="text-xs text-muted-foreground font-mono w-12 text-right">${escape_html(intValue)}</span></div> `);
			Slider($$renderer, {
				type: "single",
				value: intValue,
				onValueChange: (v) => onChange(Math.round(v)),
				min: ui()?.min ?? 0,
				max: ui()?.max ?? 10,
				step: 1,
				class: "w-full"
			});
			$$renderer.push(`<!----></div>`);
		} else if (field.glslType === "bool") {
			$$renderer.push("<!--[3-->");
			$$renderer.push(`<div class="flex items-center justify-between">`);
			Label($$renderer, {
				class: "text-xs text-muted-foreground",
				children: ($$renderer) => {
					$$renderer.push(`<!---->${escape_html(label)}`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> <input type="checkbox"${attr("checked", Boolean(value), true)}/></div>`);
		} else if (field.glslType === "vec2") {
			$$renderer.push("<!--[4-->");
			const vec2Value = value ?? [0, 0];
			$$renderer.push(`<div class="space-y-3">`);
			Label($$renderer, {
				class: "text-xs text-muted-foreground",
				children: ($$renderer) => {
					$$renderer.push(`<!---->${escape_html(label)}`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> <div class="space-y-2"><div class="flex items-center gap-2"><span class="text-xs text-muted-foreground w-4">X</span> `);
			Slider($$renderer, {
				type: "single",
				value: vec2Value[0],
				onValueChange: (v) => onChange([v, vec2Value[1]]),
				min: ui()?.min ?? 0,
				max: ui()?.max ?? 1,
				step: ui()?.step ?? .01,
				class: "flex-1"
			});
			$$renderer.push(`<!----> <span class="text-xs text-muted-foreground font-mono w-10 text-right">${escape_html(vec2Value[0].toFixed(2))}</span></div> <div class="flex items-center gap-2"><span class="text-xs text-muted-foreground w-4">Y</span> `);
			Slider($$renderer, {
				type: "single",
				value: vec2Value[1],
				onValueChange: (v) => onChange([vec2Value[0], v]),
				min: ui()?.min ?? 0,
				max: ui()?.max ?? 1,
				step: ui()?.step ?? .01,
				class: "flex-1"
			});
			$$renderer.push(`<!----> <span class="text-xs text-muted-foreground font-mono w-10 text-right">${escape_html(vec2Value[1].toFixed(2))}</span></div></div></div>`);
		} else if (field.glslType === "vec3" || field.glslType === "vec4") {
			$$renderer.push("<!--[5-->");
			const vecValue = value ?? [];
			if (ui()?.color || vecValue.every((v) => v >= 0 && v <= 1)) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="space-y-2">`);
				Label($$renderer, {
					class: "text-xs text-muted-foreground",
					children: ($$renderer) => {
						$$renderer.push(`<!---->${escape_html(label)}`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Color_input($$renderer, {
					value: vecValue,
					onChange: (next) => onChange(next)
				});
				$$renderer.push(`<!----></div>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<div class="space-y-2">`);
				Label($$renderer, {
					class: "text-xs text-muted-foreground",
					children: ($$renderer) => {
						$$renderer.push(`<!---->${escape_html(label)}`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> <!--[-->`);
				const each_array_1 = ensure_array_like(vecValue);
				for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
					let v = each_array_1[i];
					$$renderer.push(`<div class="flex items-center gap-2"><span class="text-xs text-muted-foreground w-4">${escape_html([
						"X",
						"Y",
						"Z",
						"W"
					][i])}</span> `);
					Slider($$renderer, {
						type: "single",
						value: v,
						onValueChange: (newV) => {
							const newVec = [...vecValue];
							newVec[i] = newV;
							onChange(newVec);
						},
						min: ui()?.min ?? 0,
						max: ui()?.max ?? 1,
						step: ui()?.step ?? .01,
						class: "flex-1"
					});
					$$renderer.push(`<!----></div>`);
				}
				$$renderer.push(`<!--]--></div>`);
			}
			$$renderer.push(`<!--]-->`);
		} else if (field.glslType === "sampler2D") {
			$$renderer.push("<!--[6-->");
			const imgValue = value;
			$$renderer.push(`<div class="space-y-2">`);
			Label($$renderer, {
				class: "text-xs text-muted-foreground",
				children: ($$renderer) => {
					$$renderer.push(`<!---->${escape_html(label)}`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> `);
			Image_input($$renderer, {
				value: imgValue ?? {
					url: null,
					sourceKind: "url",
					fit: "cover",
					offsetX: 0,
					offsetY: 0,
					scale: 1,
					rotation: 0
				},
				onChange: (next) => onChange(next)
			});
			$$renderer.push(`<!----></div>`);
		} else if (field.glslType === "vec4Array") {
			$$renderer.push("<!--[7-->");
			const arr = value;
			const max = ui()?.array?.maxLength ?? field.arrayLength ?? 10;
			const min = ui()?.array?.minLength ?? 1;
			$$renderer.push(`<div class="space-y-2">`);
			Label($$renderer, {
				class: "text-xs text-muted-foreground",
				children: ($$renderer) => {
					$$renderer.push(`<!---->${escape_html(label)}`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> `);
			Color_array_input($$renderer, {
				value: arr ?? {
					values: [[
						1,
						1,
						1,
						1
					]],
					length: 1
				},
				maxLength: max,
				minLength: min,
				onChange: (next) => onChange(next)
			});
			$$renderer.push(`<!----></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/components/shader-composer/layer-effects-sections.svelte
function Layer_effects_sections($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { layer } = $$props;
		const SECTIONS = [
			{
				key: "effects",
				label: "Effects",
				categories: ["shape-effects", "stylize"]
			},
			{
				key: "distortions",
				label: "Distortions",
				categories: ["distortion", "blurs"]
			},
			{
				key: "adjustments",
				label: "Adjustments",
				categories: ["adjustments"]
			}
		];
		let sourceKind = derived(() => generatorSourceKind(layer.source.cls));
		function pickerOptions(categories) {
			return listNodeClasses().filter((cls) => {
				if (!cls.prototype) return false;
				if (!(cls.prototype instanceof EffectNode)) return false;
				if (!categories.includes(cls.meta.category)) return false;
				if (getEffectScope(cls) === "scene") return false;
				const allowed = getEffectAppliesTo(cls);
				if (allowed.includes("any")) return true;
				return allowed.includes(sourceKind());
			}).sort((a, b) => a.meta.name.localeCompare(b.meta.name));
		}
		let groupedEffects = derived(() => {
			const out = {};
			for (const s of SECTIONS) out[s.key] = [];
			for (const fx of layer.effects) for (const s of SECTIONS) if (s.categories.includes(fx.meta.category)) {
				out[s.key].push(fx);
				break;
			}
			return out;
		});
		function handlePick(typeId) {
			composer.addEffectToLayer(layer.id, typeId);
		}
		$$renderer.push(`<!--[-->`);
		const each_array = ensure_array_like(SECTIONS);
		for (let $$index_2 = 0, $$length = each_array.length; $$index_2 < $$length; $$index_2++) {
			let section = each_array[$$index_2];
			const items = groupedEffects()[section.key];
			const options = pickerOptions(section.categories);
			$$renderer.push(`<section class="px-3 py-3 space-y-3 border-b border-[rgba(255,255,255,0.1)] last:border-b-0"><div class="flex items-center justify-between px-1"><p class="text-[14px] font-medium text-white">${escape_html(section.label)}</p> `);
			if (options.length > 0) {
				$$renderer.push("<!--[0-->");
				if (Select) {
					$$renderer.push("<!--[-->");
					Select($$renderer, {
						type: "single",
						value: "",
						onValueChange: (v) => v && handlePick(v),
						children: ($$renderer) => {
							if (Select_trigger) {
								$$renderer.push("<!--[-->");
								Select_trigger($$renderer, {
									class: "h-6 w-6 p-0 bg-transparent border-0 text-white/70 hover:text-white",
									"aria-label": `Add ${section.label.toLowerCase()}`,
									children: ($$renderer) => {
										Plus($$renderer, { class: "size-4" });
									},
									$$slots: { default: true }
								});
								$$renderer.push("<!--]-->");
							} else {
								$$renderer.push("<!--[!-->");
								$$renderer.push("<!--]-->");
							}
							$$renderer.push(` `);
							if (Select_content) {
								$$renderer.push("<!--[-->");
								Select_content($$renderer, {
									children: ($$renderer) => {
										$$renderer.push(`<!--[-->`);
										const each_array_1 = ensure_array_like(options);
										for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
											let cls = each_array_1[$$index];
											if (Select_item) {
												$$renderer.push("<!--[-->");
												Select_item($$renderer, {
													value: cls.typeId,
													children: ($$renderer) => {
														$$renderer.push(`<!---->${escape_html(cls.meta.name)}`);
													},
													$$slots: { default: true }
												});
												$$renderer.push("<!--]-->");
											} else {
												$$renderer.push("<!--[!-->");
												$$renderer.push("<!--]-->");
											}
										}
										$$renderer.push(`<!--]-->`);
									},
									$$slots: { default: true }
								});
								$$renderer.push("<!--]-->");
							} else {
								$$renderer.push("<!--[!-->");
								$$renderer.push("<!--]-->");
							}
						},
						$$slots: { default: true }
					});
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> `);
			if (items.length === 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<p class="px-1 text-[12px] text-white/40">${escape_html(options.length === 0 ? `No ${section.label.toLowerCase()} apply to this layer.` : `No ${section.label.toLowerCase()} added.`)}</p>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<div class="space-y-1"><!--[-->`);
				const each_array_2 = ensure_array_like(items);
				for (let $$index_1 = 0, $$length = each_array_2.length; $$index_1 < $$length; $$index_1++) {
					let fx = each_array_2[$$index_1];
					const isSelected = composer.selectedNodeId === fx.id;
					$$renderer.push(`<div${attr_class(clsx$1(cn("group/fxrow relative flex items-center gap-2 h-9 rounded-lg px-3 transition-colors", isSelected ? "bg-[var(--indigo-700)] text-white" : "bg-[var(--surface-strong)] text-white hover:bg-[var(--surface-hover)]", !fx.enabled && "opacity-60")))}><span class="size-3 rounded-[3px] shrink-0" aria-hidden="true"${attr_style("", { "background-color": fx.meta.color })}></span> <button class="flex-1 min-w-0 text-left text-[13px] font-medium truncate"${attr("title", fx.meta.name)}>${escape_html(fx.meta.name)}</button> <div${attr_class("flex items-center gap-0.5 opacity-0 group-hover/fxrow:opacity-100 transition-opacity", void 0, { "opacity-100": isSelected })}><button class="p-1 text-white/70 hover:text-white" aria-label="Toggle effect">`);
					if (fx.enabled) {
						$$renderer.push("<!--[0-->");
						Eye($$renderer, { class: "size-3.5" });
					} else {
						$$renderer.push("<!--[-1-->");
						Eye_off($$renderer, { class: "size-3.5" });
					}
					$$renderer.push(`<!--]--></button> <button class="p-1 text-white/70 hover:text-white" aria-label="Remove effect">`);
					Trash_2($$renderer, { class: "size-3.5" });
					$$renderer.push(`<!----></button></div></div>`);
				}
				$$renderer.push(`<!--]--></div>`);
			}
			$$renderer.push(`<!--]--></section>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/components/shader-composer/property-panel.svelte
function Property_panel($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const BLEND_MODES = [
			{
				value: "normal",
				label: "Normal"
			},
			{
				value: "add",
				label: "Add"
			},
			{
				value: "multiply",
				label: "Multiply"
			},
			{
				value: "screen",
				label: "Screen"
			},
			{
				value: "overlay",
				label: "Overlay"
			},
			{
				value: "softLight",
				label: "Soft Light"
			},
			{
				value: "hardLight",
				label: "Hard Light"
			}
		];
		let selectedNode = derived(() => {
			if (!composer.selectedNodeId) return null;
			return composer.scene.findNode(composer.selectedNodeId)?.node ?? null;
		});
		let selectedLayer = derived(() => {
			if (!composer.selectedNodeId) return null;
			return composer.scene.findNode(composer.selectedNodeId)?.layer ?? null;
		});
		let selectedIsLayerSource = derived(() => selectedLayer() && selectedNode() && selectedNode() === selectedLayer().source);
		let selectionScope = derived(() => {
			if (!selectedNode()) return "";
			if (selectedNode() instanceof GeneratorNode) return "Layer";
			if (selectedNode() instanceof EffectNode) return getEffectScope(selectedNode().cls) === "scene" ? "Scene Effect" : "Effect Layer";
			return "";
		});
		let fields = derived(() => {
			if (!selectedNode()) return null;
			const cls = selectedNode().cls;
			return {
				cfgFields: inspectUiFields(cls.config),
				inFields: inspectObjectSchema(cls.inputs)
			};
		});
		let visibleCfgFields = derived(() => {
			if (!selectedNode() || !fields()) return [];
			const config = selectedNode().config;
			return fields().cfgFields.filter((field) => {
				const cond = getMetaDeep(field.schema)?.ui?.visibleWhen;
				if (!cond) return true;
				for (const [siblingKey, allowed] of Object.entries(cond)) {
					const v = config[siblingKey];
					if (!allowed.some((a) => a === v)) return false;
				}
				return true;
			});
		});
		let groupedFields = derived(() => {
			const transform = [];
			const other = [];
			for (const f of visibleCfgFields()) if (getMetaDeep(f.schema)?.ui?.group === "transform") transform.push(f);
			else other.push(f);
			return [{
				key: "transform",
				label: "Transform",
				fields: transform
			}, {
				key: "",
				label: "Properties",
				fields: other
			}].filter((s) => s.fields.length > 0);
		});
		function fieldLabel(field) {
			return field.schema.description ?? field.key;
		}
		let blendModeLabel = derived(() => BLEND_MODES.find((m) => m.value === (selectedNode()?.blendMode ?? "normal"))?.label ?? "Normal");
		if (!selectedNode() || !fields()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="flex items-center justify-center h-full text-white/50 text-sm px-6 text-center">Select a layer to edit its properties.</div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			const meta = selectedNode().meta;
			const allFieldsCount = visibleCfgFields().length + fields().inFields.length;
			$$renderer.push(`<div class="flex flex-col h-full min-h-0"><div class="flex items-start gap-3 p-4 border-b border-[rgba(255,255,255,0.1)] shrink-0"><span class="size-4 rounded-[4px] mt-0.5 shrink-0" aria-hidden="true"${attr_style("", { "background-color": meta.color })}></span> <div class="flex flex-col gap-1 min-w-0"><p class="text-[14px] font-medium text-white truncate">${escape_html(meta.name)}</p> `);
			if (selectionScope()) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<p class="text-[12px] font-medium text-white/50">${escape_html(selectionScope())}</p>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div></div> `);
			Scroll_area($$renderer, {
				class: "flex-1 min-h-0",
				children: ($$renderer) => {
					$$renderer.push(`<div class="py-3"><section class="px-3 py-3 space-y-3 border-b border-[rgba(255,255,255,0.1)]"><div class="px-1"><p class="text-[12px] font-medium text-white">Blending</p></div> `);
					if (Select) {
						$$renderer.push("<!--[-->");
						Select($$renderer, {
							type: "single",
							value: selectedNode().blendMode || "normal",
							onValueChange: (v) => composer.updateBlendMode(selectedNode().id, v),
							children: ($$renderer) => {
								if (Select_trigger) {
									$$renderer.push("<!--[-->");
									Select_trigger($$renderer, {
										class: "w-full h-9 text-[14px] bg-[var(--surface-strong)] border-0 text-white",
										children: ($$renderer) => {
											$$renderer.push(`<!---->${escape_html(blendModeLabel())}`);
										},
										$$slots: { default: true }
									});
									$$renderer.push("<!--]-->");
								} else {
									$$renderer.push("<!--[!-->");
									$$renderer.push("<!--]-->");
								}
								$$renderer.push(` `);
								if (Select_content) {
									$$renderer.push("<!--[-->");
									Select_content($$renderer, {
										children: ($$renderer) => {
											$$renderer.push(`<!--[-->`);
											const each_array = ensure_array_like(BLEND_MODES);
											for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
												let mode = each_array[$$index];
												if (Select_item) {
													$$renderer.push("<!--[-->");
													Select_item($$renderer, {
														value: mode.value,
														children: ($$renderer) => {
															$$renderer.push(`<!---->${escape_html(mode.label)}`);
														},
														$$slots: { default: true }
													});
													$$renderer.push("<!--]-->");
												} else {
													$$renderer.push("<!--[!-->");
													$$renderer.push("<!--]-->");
												}
											}
											$$renderer.push(`<!--]-->`);
										},
										$$slots: { default: true }
									});
									$$renderer.push("<!--]-->");
								} else {
									$$renderer.push("<!--[!-->");
									$$renderer.push("<!--]-->");
								}
							},
							$$slots: { default: true }
						});
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
					$$renderer.push(`</section> <section class="px-3 py-3 space-y-3 border-b border-[rgba(255,255,255,0.1)]"><div class="flex items-center justify-between px-1"><p class="text-[12px] font-medium text-white">Opacity</p> <span class="text-[12px] text-white/60 font-mono">${escape_html(Math.round(selectedNode().opacity * 100))}%</span></div> `);
					Slider($$renderer, {
						type: "single",
						value: selectedNode().opacity,
						onValueChange: (v) => composer.updateOpacity(selectedNode().id, v),
						min: 0,
						max: 1,
						step: .01,
						class: "w-full"
					});
					$$renderer.push(`<!----></section> `);
					if (allFieldsCount > 0) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<!--[-->`);
						const each_array_1 = ensure_array_like(groupedFields());
						for (let $$index_3 = 0, $$length = each_array_1.length; $$index_3 < $$length; $$index_3++) {
							let section = each_array_1[$$index_3];
							$$renderer.push(`<section class="px-3 py-3 space-y-4 border-b border-[rgba(255,255,255,0.1)] last:border-b-0"><div class="px-1"><p class="text-[14px] font-medium text-white">${escape_html(section.label)}</p></div> <!--[-->`);
							const each_array_2 = ensure_array_like(section.fields);
							for (let $$index_1 = 0, $$length = each_array_2.length; $$index_1 < $$length; $$index_1++) {
								let field = each_array_2[$$index_1];
								const value = selectedNode().config[field.key];
								Field_control($$renderer, {
									field,
									label: fieldLabel(field),
									value,
									onChange: (v) => composer.updateConfig(selectedNode().id, field.key, v)
								});
							}
							$$renderer.push(`<!--]--> `);
							if (section.key === "" && fields().inFields.length > 0) {
								$$renderer.push("<!--[0-->");
								$$renderer.push(`<!--[-->`);
								const each_array_3 = ensure_array_like(fields().inFields);
								for (let $$index_2 = 0, $$length = each_array_3.length; $$index_2 < $$length; $$index_2++) {
									let field = each_array_3[$$index_2];
									const value = selectedNode().inputs[field.key];
									Field_control($$renderer, {
										field,
										label: fieldLabel(field),
										value,
										onChange: (v) => composer.updateInput(selectedNode().id, field.key, v)
									});
								}
								$$renderer.push(`<!--]-->`);
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--></section>`);
						}
						$$renderer.push(`<!--]--> `);
						if (groupedFields().every((s) => s.key !== "") && fields().inFields.length > 0) {
							$$renderer.push("<!--[0-->");
							$$renderer.push(`<section class="px-3 py-3 space-y-4 border-b border-[rgba(255,255,255,0.1)]"><div class="px-1"><p class="text-[14px] font-medium text-white">Inputs</p></div> <!--[-->`);
							const each_array_4 = ensure_array_like(fields().inFields);
							for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
								let field = each_array_4[$$index_4];
								const value = selectedNode().inputs[field.key];
								Field_control($$renderer, {
									field,
									label: fieldLabel(field),
									value,
									onChange: (v) => composer.updateInput(selectedNode().id, field.key, v)
								});
							}
							$$renderer.push(`<!--]--></section>`);
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]-->`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (selectedIsLayerSource() && selectedLayer()) {
						$$renderer.push("<!--[0-->");
						Layer_effects_sections($$renderer, { layer: selectedLayer() });
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div>`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/shapes.svelte
function Shapes($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "shapes" },
		props,
		{ iconNode: [
			["path", { "d": "M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z" }],
			["rect", {
				"x": "3",
				"y": "14",
				"width": "7",
				"height": "7",
				"rx": "1"
			}],
			["circle", {
				"cx": "17.5",
				"cy": "17.5",
				"r": "3.5"
			}]
		] }
	]));
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/sparkles.svelte
function Sparkles($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "sparkles" },
		props,
		{ iconNode: [
			["path", { "d": "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" }],
			["path", { "d": "M20 2v4" }],
			["path", { "d": "M22 4h-4" }],
			["circle", {
				"cx": "4",
				"cy": "20",
				"r": "2"
			}]
		] }
	]));
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/image.svelte
function Image($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "image" },
		props,
		{ iconNode: [
			["rect", {
				"width": "18",
				"height": "18",
				"x": "3",
				"y": "3",
				"rx": "2",
				"ry": "2"
			}],
			["circle", {
				"cx": "9",
				"cy": "9",
				"r": "2"
			}],
			["path", { "d": "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }]
		] }
	]));
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/sliders-horizontal.svelte
function Sliders_horizontal($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "sliders-horizontal" },
		props,
		{ iconNode: [
			["path", { "d": "M10 5H3" }],
			["path", { "d": "M12 19H3" }],
			["path", { "d": "M14 3v4" }],
			["path", { "d": "M16 17v4" }],
			["path", { "d": "M21 12h-9" }],
			["path", { "d": "M21 19h-5" }],
			["path", { "d": "M21 5h-7" }],
			["path", { "d": "M8 10v4" }],
			["path", { "d": "M8 12H3" }]
		] }
	]));
}
//#endregion
//#region src/components/shader-composer/canvas-toolbar.svelte
function Canvas_toolbar($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { selected, onSelect } = $$props;
		const items = [
			{
				id: "shapes",
				label: "Shapes",
				icon: Shapes
			},
			{
				id: "effects",
				label: "Effects",
				icon: Sparkles
			},
			{
				id: "textures",
				label: "Textures",
				icon: Image
			},
			{
				id: "adjustments",
				label: "Adjustments",
				icon: Sliders_horizontal
			}
		];
		$$renderer.push(`<div class="absolute bottom-4 left-1/2 -translate-x-1/2 glass-floating rounded-full flex items-center gap-2 px-4 py-3"><!--[-->`);
		const each_array = ensure_array_like(items);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let item = each_array[$$index];
			const Icon = item.icon;
			const isActive = selected === item.id;
			$$renderer.push(`<button${attr_class(clsx$1(cn("relative flex items-center justify-center p-2 rounded-full transition-colors", isActive ? "bg-[var(--indigo-700)] border border-[rgba(255,255,255,0.08)] text-white" : "text-white/85 hover:text-white hover:bg-white/5")))}${attr("title", item.label)}${attr("aria-label", item.label)}${attr("aria-pressed", isActive)}>`);
			if (Icon) {
				$$renderer.push("<!--[-->");
				Icon($$renderer, { class: "size-[22px]" });
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
			$$renderer.push(`</button>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/components/shader-composer/effects-palette.svelte
function Effects_palette($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { category, onClose } = $$props;
		const TITLES = {
			shapes: "Shapes",
			effects: "Effects",
			textures: "Textures",
			adjustments: "Adjustments"
		};
		const CATEGORIES = {
			shapes: ["shapes"],
			textures: ["textures"],
			effects: [
				"shape-effects",
				"stylize",
				"distortion",
				"blurs",
				"interactive"
			],
			adjustments: ["adjustments"]
		};
		function isEffectClass(cls) {
			return cls.prototype instanceof EffectNode;
		}
		let activeLayer = derived(() => {
			if (!composer.selectedNodeId) return null;
			return composer.scene.findNode(composer.selectedNodeId)?.layer ?? null;
		});
		let activeSourceKind = derived(() => activeLayer() ? generatorSourceKind(activeLayer().source.cls) : "any");
		let items = derived(() => {
			const cats = new Set(CATEGORIES[category] ?? []);
			return listNodeClasses().filter((cls) => {
				if (!cats.has(cls.meta.category)) return false;
				if (isEffectClass(cls)) {
					const allowed = getEffectAppliesTo(cls);
					if (activeSourceKind() !== "any" && !allowed.includes("any") && !allowed.includes(activeSourceKind())) return false;
				}
				return true;
			}).sort((a, b) => a.meta.name.localeCompare(b.meta.name));
		});
		$$renderer.push(`<div class="absolute bottom-[88px] left-1/2 -translate-x-1/2 glass-floating rounded-3xl w-[464px] max-h-[60%] flex flex-col z-10 overflow-hidden"><div class="flex items-center justify-between px-6 py-4 shrink-0"><p class="text-[16px] font-medium text-white tracking-[-0.32px]">${escape_html(TITLES[category] ?? category)}</p> <button class="p-1 text-white/60 hover:text-white" aria-label="Close palette">`);
		X($$renderer, { class: "size-4" });
		$$renderer.push(`<!----></button></div> <div class="grid grid-cols-4 gap-x-6 gap-y-4 px-4 pb-4 overflow-y-auto"><!--[-->`);
		const each_array = ensure_array_like(items());
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let cls = each_array[$$index];
			$$renderer.push(`<button class="flex flex-col items-center gap-2 group/tile"${attr("title", cls.meta.description)}><div class="w-full h-[75px] rounded-xl bg-[rgba(255,255,255,0.05)] group-hover/tile:bg-[rgba(255,255,255,0.1)] transition-colors flex items-center justify-center"><span class="size-6 rounded-md" aria-hidden="true"${attr_style("", { "background-color": cls.meta.color })}></span></div> <p class="text-[12px] font-medium text-white/90 group-hover/tile:text-white truncate w-full text-center">${escape_html(cls.meta.name)}</p></button>`);
		}
		$$renderer.push(`<!--]--> `);
		if (items().length === 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="col-span-4 text-center text-white/50 text-xs py-6">No primitives in this category yet.</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
//#region src/components/ui/button/button.svelte
var buttonVariants = tv({
	base: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-lg border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-3 active:not-aria-[haspopup]:translate-y-px aria-invalid:ring-3 [&_svg:not([class*='size-'])]:size-4 group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
			outline: "border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 aria-expanded:bg-muted aria-expanded:text-foreground",
			secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
			ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground",
			destructive: "bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
			xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
			sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
			lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
			icon: "size-8",
			"icon-xs": "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
			"icon-sm": "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
			"icon-lg": "size-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { class: className, variant = "default", size = "default", ref = null, href = void 0, type = "button", disabled, children, $$slots, $$events, ...restProps } = $$props;
		if (href) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<a${attributes({
				"data-slot": "button",
				class: clsx$1(cn(buttonVariants({
					variant,
					size
				}), className)),
				href: disabled ? void 0 : href,
				"aria-disabled": disabled,
				role: disabled ? "link" : void 0,
				tabindex: disabled ? -1 : void 0,
				...restProps
			})}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></a>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<button${attributes({
				"data-slot": "button",
				class: clsx$1(cn(buttonVariants({
					variant,
					size
				}), className)),
				type,
				disabled,
				...restProps
			})}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></button>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/components/ui/dialog/dialog.svelte
function Dialog($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { open = false, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Dialog$1) {
				$$renderer.push("<!--[-->");
				Dialog$1($$renderer, spread_props([restProps, {
					get open() {
						return open;
					},
					set open($$value) {
						open = $$value;
						$$settled = false;
					}
				}]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { open });
	});
}
//#endregion
//#region src/components/ui/dialog/dialog-overlay.svelte
function Dialog_overlay($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Dialog_overlay$1) {
				$$renderer.push("<!--[-->");
				Dialog_overlay$1($$renderer, spread_props([
					{
						"data-slot": "dialog-overlay",
						class: cn("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60 backdrop-blur-sm", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						}
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/components/ui/dialog/dialog-content.svelte
function Dialog_content($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, showCloseButton = true, children, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Portal) {
				$$renderer.push("<!--[-->");
				Portal($$renderer, {
					children: ($$renderer) => {
						Dialog_overlay($$renderer, {});
						$$renderer.push(`<!----> `);
						if (Dialog_content$1) {
							$$renderer.push("<!--[-->");
							Dialog_content$1($$renderer, spread_props([
								{
									"data-slot": "dialog-content",
									class: cn("bg-neutral-900/95 border border-[var(--hairline)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-2xl p-6 shadow-2xl duration-200 sm:max-w-lg", className)
								},
								restProps,
								{
									get ref() {
										return ref;
									},
									set ref($$value) {
										ref = $$value;
										$$settled = false;
									},
									children: ($$renderer) => {
										children?.($$renderer);
										$$renderer.push(`<!----> `);
										if (showCloseButton) {
											$$renderer.push("<!--[0-->");
											if (Dialog_close) {
												$$renderer.push("<!--[-->");
												Dialog_close($$renderer, {
													"data-slot": "dialog-close",
													class: "ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-md opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
													children: ($$renderer) => {
														X($$renderer, { class: "size-4" });
														$$renderer.push(`<!----> <span class="sr-only">Close</span>`);
													},
													$$slots: { default: true }
												});
												$$renderer.push("<!--]-->");
											} else {
												$$renderer.push("<!--[!-->");
												$$renderer.push("<!--]-->");
											}
										} else $$renderer.push("<!--[-1-->");
										$$renderer.push(`<!--]-->`);
									},
									$$slots: { default: true }
								}
							]));
							$$renderer.push("<!--]-->");
						} else {
							$$renderer.push("<!--[!-->");
							$$renderer.push("<!--]-->");
						}
					},
					$$slots: { default: true }
				});
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/components/ui/dialog/dialog-header.svelte
function Dialog_header($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, children, $$slots, $$events, ...restProps } = $$props;
		$$renderer.push(`<div${attributes({
			"data-slot": "dialog-header",
			class: clsx$1(cn("flex flex-col gap-1.5 text-left", className)),
			...restProps
		})}>`);
		children?.($$renderer);
		$$renderer.push(`<!----></div>`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/components/ui/dialog/dialog-title.svelte
function Dialog_title($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Dialog_title$1) {
				$$renderer.push("<!--[-->");
				Dialog_title$1($$renderer, spread_props([
					{
						"data-slot": "dialog-title",
						class: cn("text-base leading-none font-semibold text-foreground", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						}
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/components/ui/dialog/dialog-description.svelte
function Dialog_description($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Dialog_description$1) {
				$$renderer.push("<!--[-->");
				Dialog_description$1($$renderer, spread_props([
					{
						"data-slot": "dialog-description",
						class: cn("text-muted-foreground text-sm", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						}
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/components/ui/tabs/tabs.svelte
function Tabs($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, value = "", class: className, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Tabs$1) {
				$$renderer.push("<!--[-->");
				Tabs$1($$renderer, spread_props([
					{
						"data-slot": "tabs",
						class: cn("gap-2 group/tabs flex data-[orientation=horizontal]:flex-col", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						},
						get value() {
							return value;
						},
						set value($$value) {
							value = $$value;
							$$settled = false;
						}
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, {
			ref,
			value
		});
	});
}
//#endregion
//#region src/components/ui/tabs/tabs-list.svelte
var tabsListVariants = tv({
	base: "rounded-lg p-[3px] group-data-horizontal/tabs:h-8 data-[variant=line]:rounded-none group/tabs-list text-muted-foreground inline-flex w-fit items-center justify-center group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
	variants: { variant: {
		default: "cn-tabs-list-variant-default bg-muted",
		line: "cn-tabs-list-variant-line gap-1 bg-transparent"
	} },
	defaultVariants: { variant: "default" }
});
function Tabs_list($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, variant = "default", class: className, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Tabs_list$1) {
				$$renderer.push("<!--[-->");
				Tabs_list$1($$renderer, spread_props([
					{
						"data-slot": "tabs-list",
						"data-variant": variant,
						class: cn(tabsListVariants({ variant }), className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						}
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/components/ui/tabs/tabs-trigger.svelte
function Tabs_trigger($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref = null, class: className, $$slots, $$events, ...restProps } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Tabs_trigger$1) {
				$$renderer.push("<!--[-->");
				Tabs_trigger$1($$renderer, spread_props([
					{
						"data-slot": "tabs-trigger",
						class: cn("gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg:not([class*='size-'])]:size-4 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center whitespace-nowrap transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0", "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent", "data-active:bg-background dark:data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 data-active:text-foreground", "after:bg-foreground after:absolute after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100", className)
					},
					restProps,
					{
						get ref() {
							return ref;
						},
						set ref($$value) {
							ref = $$value;
							$$settled = false;
						}
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/download.svelte
function Download($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "download" },
		props,
		{ iconNode: [
			["path", { "d": "M12 15V3" }],
			["path", { "d": "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
			["path", { "d": "m7 10 5 5 5-5" }]
		] }
	]));
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/copy.svelte
function Copy($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "copy" },
		props,
		{ iconNode: [["rect", {
			"width": "14",
			"height": "14",
			"x": "8",
			"y": "8",
			"rx": "2",
			"ry": "2"
		}], ["path", { "d": "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]] }
	]));
}
//#endregion
//#region src/components/shader-composer/code-block.svelte
function Code_block($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { code, language, alwaysShowCopy = false } = $$props;
		let copied = false;
		let html$1 = "";
		async function handleCopy() {
			await navigator.clipboard.writeText(code || "");
			copied = true;
			setTimeout(() => copied = false, 2e3);
		}
		if (!code) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="p-4 text-muted-foreground text-sm">No code generated yet</div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="relative group">`);
			Button($$renderer, {
				variant: "ghost",
				size: "sm",
				class: ["absolute right-2 top-2 h-8 px-2 z-10 text-xs gap-1.5 bg-white/5 hover:bg-white/10 transition-opacity", alwaysShowCopy ? "opacity-100" : "opacity-0 group-hover:opacity-100"].join(" "),
				onclick: handleCopy,
				children: ($$renderer) => {
					if (copied) {
						$$renderer.push("<!--[0-->");
						Check($$renderer, { class: "h-3.5 w-3.5 text-green-500" });
						$$renderer.push(`<!----> <span class="text-green-500">Copied</span>`);
					} else {
						$$renderer.push("<!--[-1-->");
						Copy($$renderer, { class: "h-3.5 w-3.5" });
						$$renderer.push(`<!----> <span>Copy</span>`);
					}
					$$renderer.push(`<!--]-->`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> <div class="shiki-wrap text-xs svelte-13i9lgm">${html(html$1)}</div></div>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/components/shader-composer/export-dialog.svelte
function Export_dialog($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { open = void 0 } = $$props;
		let activeTab = "glsl";
		let enabledCount = derived(() => composer.chain.enabled.length);
		let generated = {
			fragmentShader: "",
			reactComponent: "",
			vanillaJs: ""
		};
		function downloadFile(content, filename) {
			const blob = new Blob([content], { type: "text/plain" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
		}
		function downloadAll() {
			downloadFile(generated.fragmentShader, "shader.frag");
			downloadFile(generated.reactComponent, "Shader.tsx");
			downloadFile(generated.vanillaJs, "shader.js");
		}
		let activeCode = derived(() => activeTab === "glsl" ? generated.fragmentShader : activeTab === "react" ? generated.reactComponent : generated.vanillaJs);
		let activeLanguage = derived(() => activeTab === "glsl" ? "glsl" : "typescript");
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (Dialog) {
				$$renderer.push("<!--[-->");
				Dialog($$renderer, {
					get open() {
						return open;
					},
					set open($$value) {
						open = $$value;
						$$settled = false;
					},
					children: ($$renderer) => {
						if (Dialog_content) {
							$$renderer.push("<!--[-->");
							Dialog_content($$renderer, {
								class: "max-w-[min(95vw,1100px)] sm:max-w-[min(95vw,1100px)] h-[min(85vh,800px)] p-0 gap-0 flex flex-col overflow-hidden",
								children: ($$renderer) => {
									if (Dialog_header) {
										$$renderer.push("<!--[-->");
										Dialog_header($$renderer, {
											class: "px-5 py-4 border-b border-[var(--hairline)]",
											children: ($$renderer) => {
												if (Dialog_title) {
													$$renderer.push("<!--[-->");
													Dialog_title($$renderer, {
														children: ($$renderer) => {
															$$renderer.push(`<!---->Export shader`);
														},
														$$slots: { default: true }
													});
													$$renderer.push("<!--]-->");
												} else {
													$$renderer.push("<!--[!-->");
													$$renderer.push("<!--]-->");
												}
												$$renderer.push(` `);
												if (Dialog_description) {
													$$renderer.push("<!--[-->");
													Dialog_description($$renderer, {
														children: ($$renderer) => {
															$$renderer.push(`<!---->Copy or download the generated source for your scene.`);
														},
														$$slots: { default: true }
													});
													$$renderer.push("<!--]-->");
												} else {
													$$renderer.push("<!--[!-->");
													$$renderer.push("<!--]-->");
												}
											},
											$$slots: { default: true }
										});
										$$renderer.push("<!--]-->");
									} else {
										$$renderer.push("<!--[!-->");
										$$renderer.push("<!--]-->");
									}
									$$renderer.push(` `);
									if (enabledCount() === 0) {
										$$renderer.push("<!--[0-->");
										$$renderer.push(`<div class="flex-1 flex items-center justify-center text-muted-foreground text-sm">Add layers to generate code</div>`);
									} else {
										$$renderer.push("<!--[-1-->");
										if (Tabs) {
											$$renderer.push("<!--[-->");
											Tabs($$renderer, {
												class: "flex-1 flex flex-col min-h-0",
												get value() {
													return activeTab;
												},
												set value($$value) {
													activeTab = $$value;
													$$settled = false;
												},
												children: ($$renderer) => {
													$$renderer.push(`<div class="flex items-center justify-between px-5 py-3 border-b border-[var(--hairline)]">`);
													if (Tabs_list) {
														$$renderer.push("<!--[-->");
														Tabs_list($$renderer, {
															class: "h-8",
															children: ($$renderer) => {
																if (Tabs_trigger) {
																	$$renderer.push("<!--[-->");
																	Tabs_trigger($$renderer, {
																		value: "glsl",
																		class: "text-xs h-7 px-3",
																		children: ($$renderer) => {
																			$$renderer.push(`<!---->GLSL`);
																		},
																		$$slots: { default: true }
																	});
																	$$renderer.push("<!--]-->");
																} else {
																	$$renderer.push("<!--[!-->");
																	$$renderer.push("<!--]-->");
																}
																$$renderer.push(` `);
																if (Tabs_trigger) {
																	$$renderer.push("<!--[-->");
																	Tabs_trigger($$renderer, {
																		value: "react",
																		class: "text-xs h-7 px-3",
																		children: ($$renderer) => {
																			$$renderer.push(`<!---->React`);
																		},
																		$$slots: { default: true }
																	});
																	$$renderer.push("<!--]-->");
																} else {
																	$$renderer.push("<!--[!-->");
																	$$renderer.push("<!--]-->");
																}
																$$renderer.push(` `);
																if (Tabs_trigger) {
																	$$renderer.push("<!--[-->");
																	Tabs_trigger($$renderer, {
																		value: "vanilla",
																		class: "text-xs h-7 px-3",
																		children: ($$renderer) => {
																			$$renderer.push(`<!---->Vanilla JS`);
																		},
																		$$slots: { default: true }
																	});
																	$$renderer.push("<!--]-->");
																} else {
																	$$renderer.push("<!--[!-->");
																	$$renderer.push("<!--]-->");
																}
															},
															$$slots: { default: true }
														});
														$$renderer.push("<!--]-->");
													} else {
														$$renderer.push("<!--[!-->");
														$$renderer.push("<!--]-->");
													}
													$$renderer.push(` `);
													Button($$renderer, {
														variant: "outline",
														size: "sm",
														class: "h-7 text-xs",
														onclick: downloadAll,
														children: ($$renderer) => {
															Download($$renderer, { class: "h-3 w-3 mr-1" });
															$$renderer.push(`<!----> Download All`);
														},
														$$slots: { default: true }
													});
													$$renderer.push(`<!----></div> `);
													Scroll_area($$renderer, {
														class: "flex-1 min-h-0 bg-[#011627]",
														children: ($$renderer) => {
															Code_block($$renderer, {
																code: activeCode(),
																language: activeLanguage(),
																alwaysShowCopy: true
															});
														},
														$$slots: { default: true }
													});
													$$renderer.push(`<!---->`);
												},
												$$slots: { default: true }
											});
											$$renderer.push("<!--]-->");
										} else {
											$$renderer.push("<!--[!-->");
											$$renderer.push("<!--]-->");
										}
									}
									$$renderer.push(`<!--]-->`);
								},
								$$slots: { default: true }
							});
							$$renderer.push("<!--]-->");
						} else {
							$$renderer.push("<!--[!-->");
							$$renderer.push("<!--]-->");
						}
					},
					$$slots: { default: true }
				});
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { open });
	});
}
//#endregion
//#region src/components/shader-composer/shader-editor.svelte
function Shader_editor($$renderer) {
	let paletteCategory = null;
	let exportOpen = false;
	let $$settled = true;
	let $$inner_renderer;
	function $$render_inner($$renderer) {
		$$renderer.push(`<div class="h-screen w-screen bg-neutral-900 overflow-hidden"><div class="flex flex-col h-full w-full px-4 pb-4 overflow-hidden"><header class="flex h-[69px] items-center justify-between pl-4 pr-3 py-3 shrink-0"><h1 class="text-[16px] font-medium tracking-[-0.32px] bg-clip-text text-transparent" style="background-image: linear-gradient(to bottom, #ffffff, rgba(255,255,255,0.8));">Shader Studio</h1> <button type="button" class="relative h-9 inline-flex items-center gap-2 px-3 py-3 rounded-lg text-[14px] font-medium text-white border-[0.5px] border-[rgba(255,255,255,0.1)] overflow-hidden cursor-pointer hover:brightness-110 transition" style="background-image: linear-gradient(to top, var(--indigo-700), var(--indigo-600));"><span class="relative">Export</span> <span class="pointer-events-none absolute inset-0 rounded-[inherit]" style="box-shadow: inset 0 0.5px 1px 0 rgba(255,255,255,0.2);"></span></button></header> <div class="flex-1 grid grid-cols-[300px_minmax(0,1fr)_300px] gap-4 min-h-0"><aside class="glass-panel rounded-3xl overflow-hidden min-h-0">`);
		Layer_stack($$renderer, {});
		$$renderer.push(`<!----></aside> <main class="relative p-2 min-h-0"><div class="absolute inset-2 rounded-3xl overflow-hidden">`);
		Shader_preview($$renderer, {});
		$$renderer.push(`<!----></div> `);
		if (paletteCategory) {
			$$renderer.push("<!--[0-->");
			Effects_palette($$renderer, {
				category: paletteCategory,
				onClose: () => paletteCategory = null
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		Canvas_toolbar($$renderer, {
			selected: paletteCategory,
			onSelect: (c) => paletteCategory = paletteCategory === c ? null : c
		});
		$$renderer.push(`<!----></main> <aside class="glass-panel rounded-3xl overflow-hidden min-h-0">`);
		Property_panel($$renderer, {});
		$$renderer.push(`<!----></aside></div></div> `);
		Export_dialog($$renderer, {
			get open() {
				return exportOpen;
			},
			set open($$value) {
				exportOpen = $$value;
				$$settled = false;
			}
		});
		$$renderer.push(`<!----></div>`);
	}
	do {
		$$settled = true;
		$$inner_renderer = $$renderer.copy();
		$$render_inner($$inner_renderer);
	} while (!$$settled);
	$$renderer.subsume($$inner_renderer);
}
//#endregion
//#region src/routes/+page.svelte
function _page($$renderer) {
	Shader_editor($$renderer, {});
}
//#endregion
export { _page as default };
