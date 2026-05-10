"use client";

import "@/shaders";

import { useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useComposer } from "@/state/composer";
import { listNodeClasses } from "@/shaders/core/registry";
import {
  GeneratorNode,
  EffectNode,
  getEffectScope,
  type EffectScope,
} from "@/shaders/core/node";
import type { Layer } from "@/shaders/core/scene";
import type { NodeClass } from "@/shaders/core/node";
import type { Category, SerializedChain } from "@/shaders/core/types";
import { PRESET_GROUPS, type PresetEntry } from "@/shaders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  GripVertical,
  Trash2,
  Eye,
  EyeOff,
  Search,
  X,
  Plus,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

const TEMPLATE_STORAGE_KEY = "shader-composer:templates:v2";

interface CategoryMeta {
  name: string;
}

const CATEGORY_META: Record<Category, CategoryMeta> = {
  textures: { name: "Textures" },
  shapes: { name: "Shapes" },
  "shape-effects": { name: "Shape Effects" },
  stylize: { name: "Stylize" },
  interactive: { name: "Interactive" },
  distortion: { name: "Distortions" },
  blurs: { name: "Blurs" },
  adjustments: { name: "Adjustments" },
};

const CATEGORY_ORDER: Category[] = [
  "textures",
  "shapes",
  "shape-effects",
  "stylize",
  "interactive",
  "distortion",
  "blurs",
  "adjustments",
];

type AddTarget =
  | { kind: "newLayer" } // Adding a Generator → new layer
  | { kind: "layerEffect"; layerId: string } // Adding an Effect to a specific Layer
  | { kind: "sceneEffect" }; // Adding an Effect to scene post-effects

function isGeneratorClass(cls: NodeClass): boolean {
  return (cls as unknown as typeof GeneratorNode).prototype instanceof
    GeneratorNode;
}

function isEffectClass(cls: NodeClass): boolean {
  return (cls as unknown as typeof EffectNode).prototype instanceof EffectNode;
}

function loadTemplatesFromStorage(): Record<string, SerializedChain> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TEMPLATE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveTemplatesToStorage(t: Record<string, SerializedChain>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(t));
  } catch {
    /* quota or disabled storage — ignore */
  }
}

function SortableLayerRow({
  layer,
  isExpanded,
  onToggleExpanded,
}: {
  layer: Layer;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}) {
  const {
    selectNode,
    toggleLayer,
    removeLayer,
    selectedNodeId,
  } = useComposer();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `layer:${layer.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected = selectedNodeId === layer.source.id;
  const meta = layer.source.meta;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 p-2 rounded-lg border bg-card transition-colors",
        isSelected && "border-primary ring-1 ring-primary/20",
        !isSelected && "border-border hover:border-muted-foreground/30",
        isDragging && "opacity-50 shadow-lg",
        !layer.enabled && "opacity-60"
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button
        className="p-1 text-muted-foreground hover:text-foreground"
        onClick={onToggleExpanded}
        title={isExpanded ? "Collapse effects" : "Expand effects"}
      >
        {layer.effects.length > 0 ? (
          isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )
        ) : (
          <span className="block w-3.5 h-3.5" />
        )}
      </button>

      <button
        className="flex-1 min-w-0 text-left"
        onClick={() => selectNode(layer.source.id)}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: meta.color }}
          />
          <span className="text-sm font-medium truncate">{layer.name}</span>
          {layer.effects.length > 0 && (
            <span className="text-[10px] text-muted-foreground/70">
              {layer.effects.length}fx
            </span>
          )}
        </div>
      </button>

      <button
        className="p-1 text-muted-foreground hover:text-foreground"
        onClick={() => toggleLayer(layer.id)}
      >
        {layer.enabled ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </button>

      <button
        className="p-1 text-muted-foreground hover:text-destructive"
        onClick={() => removeLayer(layer.id)}
        title="Remove layer"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function SortableEffectRow({
  effectId,
  layerId,
  scope,
}: {
  effectId: string;
  layerId: string | null; // null = scene post-effect
  scope: "layer" | "scene";
}) {
  const {
    scene,
    selectNode,
    toggleNode,
    removeEffectFromLayer,
    removeSceneEffect,
    selectedNodeId,
  } = useComposer();

  const dragId =
    scope === "layer"
      ? `effect:${layerId}:${effectId}`
      : `scene-effect:${effectId}`;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: dragId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const node = scene.findNode(effectId)?.node;
  if (!node) return null;
  const isSelected = selectedNodeId === effectId;
  const meta = node.meta;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 p-1.5 rounded-md border bg-card/60 transition-colors",
        isSelected && "border-primary/60 ring-1 ring-primary/20",
        !isSelected && "border-border/60 hover:border-muted-foreground/30",
        isDragging && "opacity-50 shadow-lg",
        !node.enabled && "opacity-60"
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button
        className="flex-1 min-w-0 text-left"
        onClick={() => selectNode(effectId)}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: meta.color }}
          />
          <span className="text-xs truncate">{meta.name}</span>
        </div>
      </button>
      <button
        className="p-0.5 text-muted-foreground hover:text-foreground"
        onClick={() => toggleNode(effectId)}
      >
        {node.enabled ? (
          <Eye className="h-3.5 w-3.5" />
        ) : (
          <EyeOff className="h-3.5 w-3.5" />
        )}
      </button>
      <button
        className="p-0.5 text-muted-foreground hover:text-destructive"
        onClick={() => {
          if (scope === "layer" && layerId) {
            removeEffectFromLayer(layerId, effectId);
          } else {
            removeSceneEffect(effectId);
          }
        }}
        title="Remove effect"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SortableLayerWithEffects({
  layer,
  isExpanded,
  onToggleExpanded,
  onAddEffect,
}: {
  layer: Layer;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onAddEffect: () => void;
}) {
  const { reorderEffectsInLayer } = useComposer();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Display effects top-to-bottom = applied last-to-first (Figma convention).
  const displayEffects = useMemo(
    () => [...layer.effects].reverse(),
    [layer.effects]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = displayEffects.findIndex(
      (e) => `effect:${layer.id}:${e.id}` === active.id
    );
    const newIndex = displayEffects.findIndex(
      (e) => `effect:${layer.id}:${e.id}` === over.id
    );
    const next = arrayMove(displayEffects, oldIndex, newIndex);
    reorderEffectsInLayer(
      layer.id,
      next
        .slice()
        .reverse()
        .map((e) => e.id)
    );
  };

  return (
    <div className="space-y-1.5">
      <SortableLayerRow
        layer={layer}
        isExpanded={isExpanded}
        onToggleExpanded={onToggleExpanded}
      />
      {isExpanded && (
        <div className="ml-6 space-y-1 border-l border-border/50 pl-2">
          {displayEffects.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayEffects.map((e) => `effect:${layer.id}:${e.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {displayEffects.map((fx) => (
                  <SortableEffectRow
                    key={fx.id}
                    effectId={fx.id}
                    layerId={layer.id}
                    scope="layer"
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
          <button
            onClick={onAddEffect}
            className="flex items-center gap-1.5 w-full p-1.5 rounded-md border border-dashed border-border/50 text-[11px] text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add effect…
          </button>
        </div>
      )}
    </div>
  );
}

export function LayerStack() {
  const {
    scene,
    selectedNodeId,
    selectNode,
    addNode,
    addLayer,
    addEffectToLayer,
    addSceneEffect,
    reorderLayers,
    reorderSceneEffects,
    loadChain,
    loadJson,
  } = useComposer();

  const [templates, setTemplates] = useState<Record<string, SerializedChain>>(
    () => loadTemplatesFromStorage()
  );
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>(
    {}
  );
  const [addTarget, setAddTarget] = useState<AddTarget | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Display layers top-to-bottom = render top-to-bottom (Figma).
  const displayLayers = useMemo(
    () => [...scene.layers].reverse(),
    [scene.layers]
  );
  const displayPostEffects = useMemo(
    () => [...scene.postEffects].reverse(),
    [scene.postEffects]
  );

  const handleSaveTemplate = () => {
    if (scene.layers.length === 0 && scene.postEffects.length === 0) return;
    const name = window.prompt("Template name:")?.trim();
    if (!name) return;
    const next = { ...templates, [name]: { nodes: [] } };
    setTemplates(next);
    saveTemplatesToStorage(next);
  };

  const handleLoadTemplate = (name: string) => {
    const t = templates[name];
    if (!t) return;
    loadJson(t);
  };

  const handleDeleteTemplate = (name: string) => {
    const next = { ...templates };
    delete next[name];
    setTemplates(next);
    saveTemplatesToStorage(next);
  };

  const handleLoadPreset = (preset: PresetEntry) => {
    loadChain(preset.chain.clone());
  };

  const handleLayerDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = displayLayers.findIndex(
      (l) => `layer:${l.id}` === active.id
    );
    const newIndex = displayLayers.findIndex(
      (l) => `layer:${l.id}` === over.id
    );
    const next = arrayMove(displayLayers, oldIndex, newIndex);
    reorderLayers(
      next
        .slice()
        .reverse()
        .map((l) => l.id)
    );
  };

  const handleSceneEffectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = displayPostEffects.findIndex(
      (e) => `scene-effect:${e.id}` === active.id
    );
    const newIndex = displayPostEffects.findIndex(
      (e) => `scene-effect:${e.id}` === over.id
    );
    const next = arrayMove(displayPostEffects, oldIndex, newIndex);
    reorderSceneEffects(
      next
        .slice()
        .reverse()
        .map((e) => e.id)
    );
  };

  // Build the picker grid. When `addTarget` is set we narrow to the relevant
  // primitive class (Generators for newLayer; Effects of the right scope for
  // layerEffect / sceneEffect). Otherwise show everything (Generators add new
  // layers, Effects route by scope).
  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byCat = new Map<Category, NodeClass[]>();
    for (const cls of listNodeClasses()) {
      // Filter by add target.
      if (addTarget?.kind === "newLayer") {
        if (!isGeneratorClass(cls)) continue;
      } else if (addTarget?.kind === "layerEffect") {
        if (!isEffectClass(cls)) continue;
        const scope = getEffectScope(cls);
        if (scope === "scene") continue;
      } else if (addTarget?.kind === "sceneEffect") {
        if (!isEffectClass(cls)) continue;
        const scope = getEffectScope(cls);
        if (scope === "layer") continue;
      }
      // Free-form picker filters.
      if (q) {
        const hay = `${cls.meta.name} ${cls.meta.description}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      const list = byCat.get(cls.meta.category) ?? [];
      list.push(cls);
      byCat.set(cls.meta.category, list);
    }
    return CATEGORY_ORDER.map((cat) => ({
      cat,
      meta: CATEGORY_META[cat],
      items: (byCat.get(cat) ?? []).sort((a, b) =>
        a.meta.name.localeCompare(b.meta.name)
      ),
    })).filter((g) => g.items.length > 0);
  }, [search, addTarget]);

  const handlePickPrimitive = (cls: NodeClass) => {
    const typeId = cls.typeId;
    if (addTarget?.kind === "newLayer" && isGeneratorClass(cls)) {
      addLayer(typeId);
    } else if (addTarget?.kind === "layerEffect" && isEffectClass(cls)) {
      addEffectToLayer(addTarget.layerId, typeId);
    } else if (addTarget?.kind === "sceneEffect" && isEffectClass(cls)) {
      addSceneEffect(typeId);
    } else {
      // Default routing — keeps backward compatibility for unscoped clicks.
      if (isEffectClass(cls)) {
        const scope = getEffectScope(cls);
        if (scope === "scene") {
          addSceneEffect(typeId);
        } else {
          // Prefer the currently-selected layer; else fall back to legacy addNode.
          const selected = selectedNodeId
            ? scene.findNode(selectedNodeId)?.layer
            : null;
          if (selected) addEffectToLayer(selected.id, typeId);
          else addNode(typeId);
        }
      } else {
        addNode(typeId);
      }
    }
    setAddTarget(null);
  };

  const totalPresets = useMemo(
    () => PRESET_GROUPS.reduce((acc, g) => acc + g.presets.length, 0),
    []
  );

  const selectionLabel = (() => {
    if (!addTarget) return null;
    if (addTarget.kind === "newLayer") return "Add layer";
    if (addTarget.kind === "sceneEffect") return "Add scene effect";
    const layer = scene.findLayer(addTarget.layerId);
    return `Add effect to "${layer?.name ?? "layer"}"`;
  })();

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="border-b border-border shrink-0">
        <div className="flex items-center justify-between px-3 pt-3 mb-2">
          <h2 className="text-sm font-semibold text-foreground">Layers</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] px-2"
              onClick={() => setPresetsOpen((v) => !v)}
              title="Browse presets"
            >
              Presets {presetsOpen ? "▾" : "▸"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] px-2"
              onClick={handleSaveTemplate}
              disabled={
                scene.layers.length === 0 && scene.postEffects.length === 0
              }
              title="Save current composition as a template"
            >
              Save…
            </Button>
          </div>
        </div>
        {presetsOpen && (
          <div className="px-3 pb-2 max-h-48 overflow-y-auto space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Presets ({totalPresets})
            </div>
            {PRESET_GROUPS.map((group) => (
              <div key={group.slug}>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1 mt-1">
                  {group.name}
                </div>
                <div className="flex flex-wrap gap-1">
                  {group.presets.map((preset) => (
                    <Button
                      key={`${group.slug}-${preset.name}`}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleLoadPreset(preset)}
                      title={group.description}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {Object.keys(templates).length > 0 && (
          <div className="px-3 pb-2 flex flex-wrap gap-1">
            {Object.keys(templates).map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px]"
              >
                <button
                  className="hover:text-primary"
                  onClick={() => handleLoadTemplate(name)}
                  title="Load template"
                >
                  {name}
                </button>
                <button
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteTemplate(name)}
                  title="Delete template"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="px-3 pb-2 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                selectionLabel ? selectionLabel + "…" : "Search primitives…"
              }
              className="h-7 text-xs pl-7"
            />
          </div>
          {addTarget && (
            <button
              onClick={() => setAddTarget(null)}
              className="text-[10px] text-muted-foreground hover:text-foreground"
              title="Clear add filter"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="px-3 pb-3 max-h-72 overflow-y-auto space-y-2">
          {grouped.length === 0 ? (
            <div className="text-xs text-muted-foreground py-2">
              No primitives match.
            </div>
          ) : (
            grouped.map(({ cat, meta, items }) => (
              <div key={cat}>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 mt-1">
                  {meta.name}{" "}
                  <span className="text-muted-foreground/60">
                    ({items.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {items.map((cls) => (
                    <Button
                      key={cls.typeId}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handlePickPrimitive(cls)}
                      title={cls.meta.description}
                    >
                      <span
                        className="w-2 h-2 rounded-full mr-1.5"
                        style={{ backgroundColor: cls.meta.color }}
                      />
                      {cls.meta.name}
                    </Button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-3">
          {/* Layers section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Scene
              </div>
              <button
                onClick={() => setAddTarget({ kind: "newLayer" })}
                className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                title="Add layer"
              >
                <Plus className="h-3 w-3" /> Layer
              </button>
            </div>
            {displayLayers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-xs">
                Add a layer to get started
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleLayerDragEnd}
              >
                <SortableContext
                  items={displayLayers.map((l) => `layer:${l.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1.5">
                    {displayLayers.map((layer) => (
                      <SortableLayerWithEffects
                        key={layer.id}
                        layer={layer}
                        isExpanded={expandedLayers[layer.id] ?? true}
                        onToggleExpanded={() =>
                          setExpandedLayers((s) => ({
                            ...s,
                            [layer.id]: !(s[layer.id] ?? true),
                          }))
                        }
                        onAddEffect={() =>
                          setAddTarget({
                            kind: "layerEffect",
                            layerId: layer.id,
                          })
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Scene post-effects section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Post-effects
              </div>
              <button
                onClick={() => setAddTarget({ kind: "sceneEffect" })}
                className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                title="Add scene effect"
              >
                <Plus className="h-3 w-3" /> Effect
              </button>
            </div>
            {displayPostEffects.length === 0 ? (
              <div className="text-[11px] text-muted-foreground/70 py-2">
                Apply full-canvas effects (vignette, grain, …) here.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleSceneEffectDragEnd}
              >
                <SortableContext
                  items={displayPostEffects.map((e) => `scene-effect:${e.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {displayPostEffects.map((fx) => (
                      <SortableEffectRow
                        key={fx.id}
                        effectId={fx.id}
                        layerId={null}
                        scope="scene"
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// EffectScope is re-imported but currently unused in this file's surface.
export type { EffectScope };
