"use client";

import { useMemo, useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { useComposer } from "@/state/composer";
import { generate } from "@/lib/codegen";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Copy, Download } from "lucide-react";

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!code) {
    return (
      <div className="p-4 text-muted-foreground text-sm">
        No code generated yet
      </div>
    );
  }

  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-2 top-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
      <Highlight
        theme={themes.nightOwl}
        code={code}
        language={language as "typescript" | "glsl"}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} text-xs p-4 rounded-lg overflow-auto`}
            style={{ ...style, background: "transparent" }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                <span className="inline-block w-8 text-right mr-4 text-muted-foreground/50 select-none">
                  {i + 1}
                </span>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

export function CodeOutput() {
  const { chain } = useComposer();
  const [activeTab, setActiveTab] = useState("glsl");

  const enabledCount = chain.enabled.length;

  const generated = useMemo(() => {
    if (enabledCount === 0) {
      return { fragmentShader: "", reactComponent: "", vanillaJs: "" };
    }
    return generate(chain);
  }, [chain, enabledCount]);

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    handleDownload(generated.fragmentShader, "shader.frag");
    handleDownload(generated.reactComponent, "Shader.tsx");
    handleDownload(generated.vanillaJs, "shader.js");
  };

  if (enabledCount === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Add layers to generate code
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <TabsList className="h-8">
            <TabsTrigger value="glsl" className="text-xs h-7 px-2">
              GLSL
            </TabsTrigger>
            <TabsTrigger value="react" className="text-xs h-7 px-2">
              React
            </TabsTrigger>
            <TabsTrigger value="vanilla" className="text-xs h-7 px-2">
              Vanilla JS
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={downloadAll}>
            <Download className="h-3 w-3 mr-1" />
            Download All
          </Button>
        </div>

        <ScrollArea className="flex-1 min-h-0 bg-[#011627]">
          <TabsContent value="glsl" className="m-0">
            <CodeBlock code={generated.fragmentShader} language="glsl" />
          </TabsContent>
          <TabsContent value="react" className="m-0">
            <CodeBlock code={generated.reactComponent} language="typescript" />
          </TabsContent>
          <TabsContent value="vanilla" className="m-0">
            <CodeBlock code={generated.vanillaJs} language="typescript" />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
