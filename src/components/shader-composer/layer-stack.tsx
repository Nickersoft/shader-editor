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
import type { Node, NodeClass } from "@/shaders/core/node";
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
} from "lucide-react";

const TEMPLATE_STORAGE_KEY = "shader-composer:templates:v2";

interface CategoryMeta {
  name: string;
}

const CATEGORY_META: Record<Category, CategoryMeta> = {
  shapes: { name: "Shapes" },
  textures: { name: "Textures" },
  effects: { name: "Effects" },
  distortion: { name: "Distortion" },
  overlays: { name: "Overlays" },
};

const CATEGORY_ORDER: Category[] = [
  "shapes",
  "textures",
  "effects",
  "distortion",
  "overlays",
];

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

function SortableLayerItem({ node }: { node: Node }) {
  const { selectNode, toggleNode, removeNode, selectedNodeId } = useComposer();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected = selectedNodeId === node.id;
  const meta = node.meta;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border bg-card transition-colors",
        isSelected && "border-primary ring-1 ring-primary/20",
        !isSelected && "border-border hover:border-muted-foreground/30",
        isDragging && "opacity-50 shadow-lg",
        !node.enabled && "opacity-60"
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
        className="flex-1 min-w-0 text-left"
        onClick={() => selectNode(node.id)}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: meta?.color ?? "#888" }}
          />
          <span className="text-sm font-medium truncate">
            {meta?.name ?? node.typeId}
          </span>
        </div>
      </button>

      <button
        className="p-1 text-muted-foreground hover:text-foreground"
        onClick={() => toggleNode(node.id)}
      >
        {node.enabled ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </button>

      <button
        className="p-1 text-muted-foreground hover:text-destructive"
        onClick={() => removeNode(node.id)}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function LayerStack() {
  const { chain, reorderNodes, addNode, loadChain, loadJson } = useComposer();

  const [templates, setTemplates] = useState<Record<string, SerializedChain>>(
    () => loadTemplatesFromStorage()
  );

  const handleSaveTemplate = () => {
    if (chain.nodes.length === 0) return;
    const name = window.prompt("Template name:")?.trim();
    if (!name) return;
    const next = { ...templates, [name]: chain.toJSON() };
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

  const [presetsOpen, setPresetsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const displayNodes = useMemo(
    () => [...chain.nodes].reverse(),
    [chain]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = displayNodes.findIndex((n) => n.id === active.id);
      const newIndex = displayNodes.findIndex((n) => n.id === over.id);

      const newDisplayOrder = arrayMove(displayNodes, oldIndex, newIndex);
      reorderNodes([...newDisplayOrder].reverse().map((n) => n.id));
    }
  };

  const [search, setSearch] = useState("");

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byCat = new Map<Category, NodeClass[]>();
    for (const cls of listNodeClasses()) {
      if (q) {
        const hay = `${cls.meta.name} ${cls.meta.description}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      const list = byCat.get(cls.meta.category) ?? [];
      list.push(cls);
      byCat.set(cls.meta.category, list);
    }
    return CATEGORY_ORDER
      .map((cat) => ({
        cat,
        meta: CATEGORY_META[cat],
        items: (byCat.get(cat) ?? []).sort((a, b) =>
          a.meta.name.localeCompare(b.meta.name)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [search]);

  const totalPresets = useMemo(
    () => PRESET_GROUPS.reduce((acc, g) => acc + g.presets.length, 0),
    []
  );

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
              disabled={chain.nodes.length === 0}
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
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search primitives…"
              className="h-7 text-xs pl-7"
            />
          </div>
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
                      onClick={() => addNode(cls.typeId)}
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
        <div className="p-3 space-y-2">
          {displayNodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Add a layer to get started
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayNodes.map((n) => n.id)}
                strategy={verticalListSortingStrategy}
              >
                {displayNodes.map((node) => (
                  <SortableLayerItem key={node.id} node={node} />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
