import "@/shaders";

import Circle from "@/shaders/shapes/circle";
import Blur from "@/shaders/blurs/blur";
import { Layer, Scene, scene, chainToScene, flattenSceneToChain } from "@/shaders/core/scene";
import { ShaderChain } from "@/shaders/core/chain";

console.log("=== Scene direct construction ===");
const c = new Circle();
const b = new Blur();
const s = scene(new Layer({ source: c, effects: [b] }));
console.log("Scene layers:", s.layers.length);
console.log(
  "Layer 0 nodes:",
  s.layers[0].nodes.map((n) => n.typeId),
);

console.log("\n=== Round-trip ===");
const json = s.toJSON();
console.log("Serialized layers:", json.layers.length, "effects:", json.layers[0].effects.length);
const restored = Scene.fromJSON(json);
console.log(
  "Restored:",
  restored.layers[0].source.typeId,
  restored.layers[0].effects.map((e) => e.typeId),
);

console.log("\n=== Chain → Scene migration ===");
const flat = new ShaderChain([new Circle(), new Blur(), new Circle(), new Blur()]);
const migrated = chainToScene(flat);
console.log("Migrated layers:", migrated.layers.length);
migrated.layers.forEach((l, i) => {
  console.log(`  Layer ${i}: ${l.source.typeId} + [${l.effects.map((e) => e.typeId).join(", ")}]`);
});

console.log("\n=== flattenSceneToChain ===");
const flatBack = flattenSceneToChain(migrated);
console.log("Flattened:", flatBack.map((n) => n.typeId).join(" → "));

console.log("\n=== findNode ===");
const target = migrated.layers[1].effects[0].id;
const found = migrated.findNode(target);
console.log("found typeId:", found?.node.typeId, "in layer", found?.layer?.id);

console.log("\nOK");
