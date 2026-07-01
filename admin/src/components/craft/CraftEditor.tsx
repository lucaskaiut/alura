import { Editor, Frame, Element, useEditor } from "@craftjs/core";
import { useEffect, useRef, useState } from "react";
import React from "react";
import { Trash2, Layers } from "lucide-react";
import type { CraftData } from "./types";
import TextBlock from "./components/TextBlock";
import Title from "./components/Title";
import ImageBlock from "./components/ImageBlock";
import ButtonBlock from "./components/ButtonBlock";
import Banner from "./components/Banner";
import Spacer from "./components/Spacer";
import Columns from "./components/Columns";
import VideoBlock from "./components/VideoBlock";
import ProductGrid from "./components/ProductGrid";
import CustomHtml from "./components/CustomHtml";
import RootContainer from "./components/RootContainer";
import ColumnCell from "./components/ColumnCell";
import Container from "./components/Container";
import SettingsPanel from "./SettingsPanel";

const toolboxItems = [
  { Component: TextBlock, label: "Texto", icon: "T" },
  { Component: Title, label: "Título", icon: "H" },
  { Component: ImageBlock, label: "Imagem", icon: "🖼" },
  { Component: ButtonBlock, label: "Botão", icon: "▣" },
  { Component: Banner, label: "Banner", icon: "▬" },
  { Component: Spacer, label: "Espaçador", icon: "↕" },
  { Component: Columns, label: "Colunas", icon: "▦" },
  { Component: VideoBlock, label: "Vídeo", icon: "▶" },
  { Component: ProductGrid, label: "Produtos", icon: "▤" },
  { Component: CustomHtml, label: "HTML", icon: "</>" },
  { Component: Container, label: "Container", icon: "⬜" },
] as { Component: React.FC; label: string; icon: string }[];

// ── Module-level query access for parent to call serialize ──
let editorQuery: ReturnType<typeof useEditor>["query"] | null = null;
export function getCraftEditorJson(): CraftData | null {
  if (!editorQuery) return null;
  const state = editorQuery.serialize();
  return Object.keys(state).length > 1 ? state : null;
}

function QueryCapture() {
  const { query } = useEditor();
  useEffect(() => { editorQuery = query; return () => { editorQuery = null; }; }, [query]);
  return null;
}

// ── Sub-components ──

function ComponentPalette() {
  const { connectors, actions } = useEditor();

  const addBlock = (Comp: React.FC) => {
    actions.add(React.createElement(Comp), "ROOT");
  };

  return (
    <div className="p-3 space-y-1">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1 mb-2">Componentes</p>
      {toolboxItems.map((item) => (
        <div
          key={item.label}
          ref={(ref) => { if (ref) connectors.create(ref, React.createElement(item.Component)); }}
          onClick={() => addBlock(item.Component)}
          className="flex items-center gap-2 w-full text-left px-2 py-2 text-sm hover:bg-bg rounded-md transition-colors cursor-grab active:cursor-grabbing select-none"
        >
          <span className="w-6 h-6 rounded bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-mono shrink-0">{item.icon}</span>
          {item.label}
        </div>
      ))}
      <p className="text-[10px] text-text-muted px-1 pt-2 leading-snug">Arraste para a área de conteúdo ou clique para adicionar.</p>
    </div>
  );
}

function LayersPanel() {
  const { actions, selected: state } = useEditor((state) => ({ selected: state }));
  const [open, setOpen] = useState(false);
  const nodeTree = Object.entries(state.nodes)
    .filter(([id]) => id !== "ROOT")
    .map(([id, node]) => ({ id, displayName: node.data?.displayName || node.data?.name || "?" }));

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface hover:bg-bg text-sm font-medium text-text transition-colors">
        <Layers size={14} /> Camadas ({nodeTree.length})
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-surface border border-border rounded-lg shadow-lg p-1 animate-fade-in w-56 max-h-64 overflow-y-auto">
            {nodeTree.length === 0 && <p className="text-xs text-text-muted px-3 py-2">Nenhum bloco.</p>}
            {nodeTree.map(({ id, displayName }) => (
              <button type="button" key={id}
                onClick={() => { actions.selectNode(id); setOpen(false); }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-bg rounded-md transition-colors">
                <span className="text-xs text-text-muted font-mono">{id.slice(0, 8)}</span>
                <span className="text-text">{displayName}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DeleteButton() {
  const { selected, actions } = useEditor((state) => {
    const ids = Array.from(state.events.selected);
    const id = ids.length > 0 ? ids[0] : null;
    return { selected: id && state.nodes[id] ? id : null };
  });
  if (!selected || selected === "ROOT") return null;
  return (
    <button type="button" onClick={() => actions.delete(selected)}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-danger-500/30 text-danger-500 hover:bg-danger-500/5 text-sm font-medium transition-colors">
      <Trash2 size={14} /> Excluir
    </button>
  );
}

function EditorInit({ json }: { json?: CraftData | null }) {
  const { actions } = useEditor();
  const done = useRef<string | null>(null);

  useEffect(() => {
    if (!json || Object.keys(json).length === 0) return;
    const key = JSON.stringify(json);
    if (done.current === key) return;
    try { actions.deserialize(json); done.current = key; } catch { /* ignore */ }
  }, [json, actions]);

  return null;
}

// ── Main ──

const resolverMap = {
  RootContainer,
  ColumnCell,
  Container,
  div: ColumnCell,
  TextBlock, Title, ImageBlock, ButtonBlock, Banner,
  Spacer, Columns, VideoBlock, ProductGrid, CustomHtml,
};

interface CraftEditorProps {
  json?: CraftData | null;
}

export default function CraftEditor({ json }: CraftEditorProps) {
  return (
    <Editor resolver={resolverMap}>
      <QueryCapture />
      <div className="flex min-h-[500px] border border-border rounded-xl overflow-hidden bg-bg">
        <div className="w-44 shrink-0 border-r border-border bg-surface overflow-y-auto">
          <ComponentPalette />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 p-3 border-b border-border bg-surface">
            <DeleteButton />
            <div className="flex-1" />
            <LayersPanel />
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <Frame>
                <Element is={RootContainer} canvas id="ROOT" />
              </Frame>
            </div>
          </div>
        </div>
        <div className="w-64 shrink-0 border-l border-border bg-surface overflow-y-auto">
          <SettingsPanel />
        </div>
      </div>
      <EditorInit json={json} />
    </Editor>
  );
}
