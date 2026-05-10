"use client";

import { useMemo, useRef, useState } from "react";
import { useComposer } from "@/state/composer";
import {
  inspectObjectSchema,
  inspectUiFields,
  type InspectedField,
  type InspectedUiField,
} from "@/lib/codegen/schema-introspection";
import { getMetaDeep, type ImageInputValue } from "@/shaders/core/schemas";
import type { Node } from "@/shaders/core/node";
import type { BlendMode } from "@/shaders/core/types";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Upload, X } from "lucide-react";

const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "add", label: "Add" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "softLight", label: "Soft Light" },
  { value: "hardLight", label: "Hard Light" },
];

interface PaletteValue {
  values: number[][];
  length: number;
}

function ColorInput({ value, onChange }: { value: number[]; onChange: (value: number[]) => void }) {
  const hasAlpha = value.length === 4;
  const hexValue = `#${value
    .slice(0, 3)
    .map((v) =>
      Math.round(v * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

  const handleHexChange = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    onChange(hasAlpha ? [r, g, b, value[3]] : [r, g, b]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hexValue}
          onChange={(e) => handleHexChange(e.target.value)}
          className="w-8 h-8 rounded border border-border cursor-pointer"
        />
        <span className="text-xs text-muted-foreground font-mono">
          {hexValue}
          {hasAlpha && (
            <>
              {" "}
              <span className="opacity-60">{Math.round(value[3] * 100)}%</span>
            </>
          )}
        </span>
      </div>
      {hasAlpha && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-4">A</span>
          <Slider
            value={[value[3]]}
            onValueChange={([a]) => onChange([value[0], value[1], value[2], a])}
            min={0}
            max={1}
            step={0.01}
            className="flex-1"
          />
        </div>
      )}
    </div>
  );
}

function rgbToHex(c: number[]): string {
  return `#${c
    .slice(0, 3)
    .map((v) =>
      Math.round(Math.max(0, Math.min(1, v)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

function ColorArrayInput({
  value,
  maxLength,
  minLength,
  onChange,
}: {
  value: PaletteValue;
  maxLength: number;
  minLength: number;
  onChange: (value: PaletteValue) => void;
}) {
  const colors = value.values.slice(0, value.length);
  const updateColor = (i: number, next: number[]) => {
    const arr = colors.map((c, idx) => (idx === i ? next : c));
    onChange({ values: arr, length: arr.length });
  };
  const addColor = () => {
    if (colors.length >= maxLength) return;
    const arr = [...colors, [1, 1, 1, 1]];
    onChange({ values: arr, length: arr.length });
  };
  const removeColor = (i: number) => {
    if (colors.length <= minLength) return;
    const arr = colors.filter((_, idx) => idx !== i);
    onChange({ values: arr, length: arr.length });
  };
  return (
    <div className="space-y-1">
      {colors.map((c, i) => {
        const hex = rgbToHex(c);
        return (
          <div key={i} className="flex items-center gap-2">
            <input
              type="color"
              value={hex}
              onChange={(e) => {
                const [r, g, b] = hexToRgb(e.target.value);
                updateColor(i, [r, g, b, c[3] ?? 1]);
              }}
              className="w-7 h-7 rounded border border-border cursor-pointer"
            />
            <span className="text-[11px] font-mono text-muted-foreground flex-1">{hex}</span>
            <Slider
              value={[c[3] ?? 1]}
              onValueChange={([a]) => updateColor(i, [c[0], c[1], c[2], a])}
              min={0}
              max={1}
              step={0.01}
              className="w-16"
            />
            {colors.length > minLength && (
              <button
                onClick={() => removeColor(i)}
                className="text-muted-foreground hover:text-destructive p-0.5"
                aria-label="Remove color"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
      {colors.length < maxLength && (
        <button
          onClick={addColor}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground py-1"
        >
          <Plus className="h-3 w-3" /> Add color
        </button>
      )}
    </div>
  );
}

function ImageInput({
  value,
  onChange,
}: {
  value: ImageInputValue;
  onChange: (value: ImageInputValue) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange({ ...value, url: reader.result, sourceKind: "dataUrl" });
      }
    };
    reader.onerror = () => setError("Failed to read file");
    reader.readAsDataURL(file);
  };

  const handlePaste = (url: string) => {
    if (!url) return;
    setError(null);
    onChange({ ...value, url, sourceKind: "url" });
  };

  return (
    <div className="space-y-2">
      <div
        className="flex items-center gap-2 p-2 rounded border border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
      >
        {value.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.url} alt="Preview" className="w-12 h-12 object-cover rounded" />
        ) : (
          <div className="w-12 h-12 rounded bg-muted/60 flex items-center justify-center text-muted-foreground">
            <Upload className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-muted-foreground truncate">
            {value.url
              ? value.sourceKind === "dataUrl"
                ? "Uploaded file"
                : value.url
              : "Drop or paste an image"}
          </div>
          {error && <div className="text-[10px] text-destructive truncate">{error}</div>}
        </div>
        {value.url && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange({ ...value, url: null, sourceKind: "url" });
            }}
            className="text-muted-foreground hover:text-destructive p-1"
            aria-label="Clear image"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <input
        type="text"
        placeholder="…or paste a URL"
        className="w-full h-7 text-[11px] px-2 rounded border border-border bg-background"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handlePaste((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).value = "";
          }
        }}
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[10px] text-muted-foreground">
          Fit
          <select
            className="w-full h-6 mt-0.5 text-[11px] bg-background border border-border rounded px-1"
            value={value.fit ?? "cover"}
            onChange={(e) =>
              onChange({
                ...value,
                fit: e.target.value as ImageInputValue["fit"],
              })
            }
          >
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="fill">Fill</option>
          </select>
        </label>
        <label className="text-[10px] text-muted-foreground">
          Scale
          <Slider
            value={[value.scale ?? 1]}
            onValueChange={([s]) => onChange({ ...value, scale: s })}
            min={0.1}
            max={4}
            step={0.01}
            className="mt-2"
          />
        </label>
      </div>
    </div>
  );
}

function FieldControl({
  field,
  label,
  value,
  onChange,
}: {
  field: InspectedField | InspectedUiField;
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const meta = getMetaDeep(field.schema);
  const ui = meta?.ui;

  switch (field.glslType) {
    case "enumString": {
      const opts = (field as InspectedUiField).enumValues ?? [];
      const current = (value as string | undefined) ?? opts[0] ?? "";
      return (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          <Select value={current} onValueChange={(v) => onChange(v)}>
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {opts.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    case "float": {
      const numValue = (value as number) ?? 0;
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <span className="text-xs text-muted-foreground font-mono w-12 text-right">
              {numValue.toFixed(2)}
            </span>
          </div>
          <Slider
            value={[numValue]}
            onValueChange={([v]) => onChange(v)}
            min={ui?.min ?? 0}
            max={ui?.max ?? 1}
            step={ui?.step ?? 0.01}
            className="w-full"
          />
        </div>
      );
    }

    case "int": {
      const intValue = (value as number) ?? 0;
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <span className="text-xs text-muted-foreground font-mono w-12 text-right">
              {intValue}
            </span>
          </div>
          <Slider
            value={[intValue]}
            onValueChange={([v]) => onChange(Math.round(v))}
            min={ui?.min ?? 0}
            max={ui?.max ?? 10}
            step={1}
            className="w-full"
          />
        </div>
      );
    }

    case "bool": {
      const boolValue = Boolean(value);
      return (
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          <input type="checkbox" checked={boolValue} onChange={(e) => onChange(e.target.checked)} />
        </div>
      );
    }

    case "vec2": {
      const vec2Value = (value as number[]) ?? [0, 0];
      return (
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-4">X</span>
              <Slider
                value={[vec2Value[0]]}
                onValueChange={([v]) => onChange([v, vec2Value[1]])}
                min={ui?.min ?? 0}
                max={ui?.max ?? 1}
                step={ui?.step ?? 0.01}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground font-mono w-10 text-right">
                {vec2Value[0].toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-4">Y</span>
              <Slider
                value={[vec2Value[1]]}
                onValueChange={([v]) => onChange([vec2Value[0], v])}
                min={ui?.min ?? 0}
                max={ui?.max ?? 1}
                step={ui?.step ?? 0.01}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground font-mono w-10 text-right">
                {vec2Value[1].toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      );
    }

    case "vec3":
    case "vec4": {
      const vecValue = (value as number[]) ?? [];
      const isColor = ui?.color || vecValue.every((v) => v >= 0 && v <= 1);

      if (isColor) {
        return (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <ColorInput value={vecValue} onChange={(next) => onChange(next as unknown)} />
          </div>
        );
      }

      return (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          {vecValue.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-4">{["X", "Y", "Z", "W"][i]}</span>
              <Slider
                value={[v]}
                onValueChange={([newV]) => {
                  const newVec = [...vecValue];
                  newVec[i] = newV;
                  onChange(newVec);
                }}
                min={ui?.min ?? 0}
                max={ui?.max ?? 1}
                step={ui?.step ?? 0.01}
                className="flex-1"
              />
            </div>
          ))}
        </div>
      );
    }

    case "sampler2D": {
      const imgValue = value as ImageInputValue | undefined;
      return (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          <ImageInput
            value={
              imgValue ?? {
                url: null,
                sourceKind: "url",
                fit: "cover",
                offsetX: 0,
                offsetY: 0,
                scale: 1,
                rotation: 0,
              }
            }
            onChange={(next) => onChange(next as unknown)}
          />
        </div>
      );
    }

    case "vec4Array": {
      const arr = value as PaletteValue | undefined;
      const max = ui?.array?.maxLength ?? field.arrayLength ?? 10;
      const min = ui?.array?.minLength ?? 1;
      return (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          <ColorArrayInput
            value={arr ?? { values: [[1, 1, 1, 1]], length: 1 }}
            maxLength={max}
            minLength={min}
            onChange={(next) => onChange(next as unknown)}
          />
        </div>
      );
    }

    default:
      return null;
  }
}

function fieldLabel(field: InspectedField | InspectedUiField): string {
  const description = field.schema.description;
  if (description) return description;
  return field.key;
}

export function PropertyPanel() {
  const { chain, selectedNodeId, updateConfig, updateInput, updateBlendMode, updateOpacity } =
    useComposer();

  const selectedNode: Node | null = useMemo(
    () => chain.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [chain, selectedNodeId],
  );

  const fields = useMemo(() => {
    if (!selectedNode) return null;
    const cls = selectedNode.cls;
    const cfgFields = inspectUiFields(cls.config);
    const inFields = inspectObjectSchema(cls.inputs);
    return { cfgFields, inFields };
  }, [selectedNode]);

  const visibleCfgFields = useMemo(() => {
    if (!selectedNode || !fields) return [] as InspectedUiField[];
    const config = selectedNode.config as Record<string, unknown>;
    return fields.cfgFields.filter((field) => {
      const cond = getMetaDeep(field.schema)?.ui?.visibleWhen;
      if (!cond) return true;
      for (const [siblingKey, allowed] of Object.entries(cond)) {
        const v = config[siblingKey];
        if (!allowed.includes(v as string | number | boolean)) return false;
      }
      return true;
    });
  }, [selectedNode, fields]);

  if (!selectedNode || !fields) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Select a layer to edit
      </div>
    );
  }

  const meta = selectedNode.meta;
  const allFields = [...visibleCfgFields, ...fields.inFields];

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: meta.color }} />
            <h2 className="text-sm font-semibold">{meta.name}</h2>
          </div>

          <div className="space-y-4">
            {/* Blend Mode */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Blend Mode</Label>
              <Select
                value={selectedNode.blendMode || "normal"}
                onValueChange={(v) => updateBlendMode(selectedNode.id, v as BlendMode)}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLEND_MODES.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Opacity</Label>
                <span className="text-xs text-muted-foreground font-mono">
                  {Math.round(selectedNode.opacity * 100)}%
                </span>
              </div>
              <Slider
                value={[selectedNode.opacity]}
                onValueChange={([v]) => updateOpacity(selectedNode.id, v)}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Node-specific config + inputs */}
        {allFields.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Properties
            </h3>
            {visibleCfgFields.map((field) => {
              const value = (selectedNode.config as Record<string, unknown>)[field.key];
              return (
                <FieldControl
                  key={`cfg-${field.key}`}
                  field={field}
                  label={fieldLabel(field)}
                  value={value}
                  onChange={(v) => updateConfig(selectedNode.id, field.key, v)}
                />
              );
            })}
            {fields.inFields.map((field) => {
              const value = (selectedNode.inputs as Record<string, unknown>)[field.key];
              return (
                <FieldControl
                  key={`in-${field.key}`}
                  field={field}
                  label={fieldLabel(field)}
                  value={value}
                  onChange={(v) => updateInput(selectedNode.id, field.key, v)}
                />
              );
            })}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
