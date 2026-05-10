"use client";

import { ShaderPreview } from "./shader-preview";
import { LayerStack } from "./layer-stack";
import { PropertyPanel } from "./property-panel";
import { CodeOutput } from "./code-output";

export function ShaderEditor() {
  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
        {/* Header */}
        <header className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-500 to-fuchsia-500" />
            <h1 className="font-semibold text-sm">Shader Composer</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Compose shaders visually, export clean code
          </p>
        </header>

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Layer Stack */}
          <aside className="w-64 border-r border-border flex flex-col shrink-0">
            <LayerStack />
          </aside>

          {/* Center - Preview */}
          <main className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 relative">
              <ShaderPreview />
            </div>
          </main>

          {/* Right Panel - Properties & Code */}
          <aside className="w-80 border-l border-border flex flex-col shrink-0">
            <div className="h-1/2 border-b border-border">
              <PropertyPanel />
            </div>
            <div className="h-1/2">
              <CodeOutput />
            </div>
          </aside>
        </div>
    </div>
  );
}
