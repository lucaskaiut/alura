import type { ElementType } from "react";

interface CraftNode {
  type: string | { resolvedName: string };
  displayName?: string;
  props: Record<string, unknown>;
  nodes?: string[];
  linkedNodes?: Record<string, string>;
  parent?: string | null;
  hidden?: boolean;
  isCanvas?: boolean;
}

type CraftData = Record<string, CraftNode>;

function resolveType(node: CraftNode): string {
  if (typeof node.type === "string") return node.type;
  return node.type.resolvedName || "div";
}

function getNodeById(nodes: CraftData, id: string): CraftNode | undefined {
  return nodes[id];
}

function marginStyle(p: Record<string, unknown>): Record<string, string | number> {
  return {
    marginTop: p.marginTop === "auto" ? "auto" : (Number(p.marginTop) || 0),
    marginRight: p.marginRight === "auto" ? "auto" : (Number(p.marginRight) || 0),
    marginBottom: p.marginBottom === "auto" ? "auto" : (Number(p.marginBottom) || 0),
    marginLeft: p.marginLeft === "auto" ? "auto" : (Number(p.marginLeft) || 0),
  };
}
function paddingStyle(p: Record<string, unknown>): Record<string, number> {
  return {
    paddingTop: Number(p.paddingTop) || 0,
    paddingRight: Number(p.paddingRight) || 0,
    paddingBottom: Number(p.paddingBottom) || 0,
    paddingLeft: Number(p.paddingLeft) || 0,
  };
}

import ProductGridDisplay from "./ProductGridDisplay";

// ── Display components (no CraftJS, just render) ──

function TextBlockDisplay(props: Record<string, unknown>) {
  const { content, fontSize, color, textAlign } = props;
  return (
    <div
      style={{ fontSize: (fontSize as number) || 16, color: (color as string) || "#111827", textAlign: ((textAlign as string) || "left") as "left" | "center" | "right", ...marginStyle(props), ...paddingStyle(props) }}
      dangerouslySetInnerHTML={{ __html: String(content || "") }}
    />
  );
}

function TitleDisplay(props: Record<string, unknown>) {
  const { text, level, align, color } = props;
  const Tag = ((level as string) || "h2") as ElementType;
  return <Tag style={{ textAlign: ((align as string) || "left") as "left" | "center" | "right", color: (color as string) || "#111827", fontWeight: 700, ...marginStyle(props), ...paddingStyle(props) }}>{String(text || "")}</Tag>;
}

function ImageBlockDisplay(props: Record<string, unknown>) {
  const { src, alt, href, borderRadius } = props;
  const img = <img src={String(src || "https://placehold.co/600x400/e5e7eb/6b7280?text=Imagem")} alt={String(alt || "")} style={{ maxWidth: "100%", borderRadius: (borderRadius as number) || 8 }} />;
  return (
  <div style={{ ...marginStyle(props), ...paddingStyle(props) }}>
    {href ? <a href={String(href)}>{img}</a> : img}
  </div>
);
}

function ButtonBlockDisplay(props: Record<string, unknown>) {
  const { label, href, variant, size } = props;
  const base = "inline-block rounded-lg font-medium no-underline transition-colors text-center";
  const sizeClass = size === "sm" ? "px-3 py-1.5 text-sm"
    : size === "lg" ? "px-6 py-3 text-lg"
    : "px-4 py-2.5 text-sm";
  const variantClass = variant === "outline" ? "border border-primary-600 text-primary-600 hover:bg-primary-50"
    : variant === "secondary" ? "bg-gray-600 text-white hover:bg-gray-700"
    : "bg-primary-600 text-white hover:bg-primary-700";

  return (
    <div style={{ ...marginStyle(props) }}>
    <a href={String(href || "#")} className={`${base} ${sizeClass} ${variantClass}`}>
      {String(label || "")}
    </a>
    </div>
  );
}

function BannerDisplay(props: Record<string, unknown>) {
  const { imageSrc, title, subtitle, buttonLabel, buttonHref, overlayOpacity, height, textColor, borderRadius } = props;
  const opacity = overlayOpacity != null ? Number(overlayOpacity) : 40;
  return (
    <div style={{ height: (height as number) || 300, backgroundImage: `url(${imageSrc || "https://placehold.co/1200x400/1e3a5f/ffffff?text=Banner"})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative", borderRadius: (borderRadius as number) || 8, overflow: "hidden", ...marginStyle(props) }}>
      {opacity > 0 && <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${opacity / 100})` }} />}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 24, textAlign: "center", color: (textColor as string) || "#fff" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{String(title || "")}</h2>
        {subtitle && <p style={{ fontSize: 16, marginTop: 8, opacity: 0.9 }}>{String(subtitle)}</p>}
        {buttonLabel && <a href={String(buttonHref || "#")} style={{ marginTop: 16, padding: "10px 24px", background: (textColor as string) || "#fff", color: (textColor as string) === "#ffffff" ? "#111827" : "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 500 }}>{String(buttonLabel)}</a>}
      </div>
    </div>
  );
}

function SpacerDisplay(props: Record<string, unknown>) {
  const { height } = props;
  return <div style={{ height: (height as number) || 32, ...marginStyle(props) }} />;
}

function ColumnsDisplay(props: Record<string, unknown>) {
  const { columns, gap, borderRadius, data, nodeId, renderNode } = props;
  const cols = Number(columns) || 2;
  const g = (gap as number) || 16;
  const nodes = data as CraftData;
  const parent = nodeId as string;
  const render = renderNode as (id: string) => React.ReactNode;
  const parentNode = nodes[parent];
  if (!parentNode?.linkedNodes) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: g, borderRadius: (borderRadius as number) || 8, overflow: "hidden", ...marginStyle(props), ...paddingStyle(props) }}>
      {Object.keys(parentNode.linkedNodes).sort().map((key) => {
        const childId = parentNode.linkedNodes![key];
        const cellNode = nodes[childId];
        if (!cellNode || cellNode.hidden) return null;
        return (
          <div key={childId} style={{ minHeight: 40 }}>
            {cellNode.nodes?.map((nid) => render(nid))}
          </div>
        );
      })}
    </div>
  );
}

function ContainerDisplay(props: Record<string, unknown>) {
  const { width, height, hAlign, vAlign, backgroundColor, padding, borderRadius, data, nodeId, renderNode } = props;
  const resolveSize = (v: unknown) => { if (!v || v === "auto") return undefined; const s = String(v); if (s.endsWith("%") || s.endsWith("px")) return s; const n = Number(v); return isNaN(n) ? undefined : n; };
  const h = resolveSize(height); const w = resolveSize(width);
  const alignMap: Record<string, string> = { left: "flex-start", center: "center", right: "flex-end" };
  const valignMap: Record<string, string> = { top: "flex-start", center: "center", bottom: "flex-end", stretch: "stretch" };
  const nodes = data as CraftData;
  const parent = nodeId as string;
  const render = renderNode as (id: string) => React.ReactNode;
  const parentNode = nodes[parent];

  // Render children from linkedNodes (created by Element id={...}) and direct nodes
  const childIds: string[] = [];
  if (parentNode?.linkedNodes) {
    for (const linkedId of Object.values(parentNode.linkedNodes)) {
      childIds.push(linkedId);
    }
  }

  return (
    <div style={{
      width: w, minHeight: h, height: h, display: "flex", flexDirection: "column",
      alignItems: alignMap[(hAlign as string) || "left"],
      justifyContent: valignMap[(vAlign as string) || "top"],
      backgroundColor: (backgroundColor as string) === "transparent" ? undefined : (backgroundColor as string),
      padding: (padding as number) || undefined,
      borderRadius: (borderRadius as number) || 0,
      ...marginStyle(props),
      ...paddingStyle(props),
    }}>
      {childIds.map((cid) => render(cid))}
    </div>
  );
}

function VideoBlockDisplay(props: Record<string, unknown>) {
  const { url, platform, aspectRatio, borderRadius } = props;
  const ratio = aspectRatio === "4:3" ? "75%" : aspectRatio === "1:1" ? "100%" : "56.25%";
  let embedUrl = String(url || "");
  if (platform === "youtube") { const m = embedUrl.match(/(?:v=|\/)([\w-]{11})/); if (m) embedUrl = `https://www.youtube.com/embed/${m[1]}`; }
  else if (platform === "vimeo") { const m = embedUrl.match(/vimeo\.com\/(\d+)/); if (m) embedUrl = `https://player.vimeo.com/video/${m[1]}`; }

  if (!url) return <div style={{ padding: "40px 0", textAlign: "center", color: "#9ca3af", border: "1px dashed #e5e7eb", borderRadius: (borderRadius as number) || 8 }}>Vídeo</div>;

  return (
    <div style={{ borderRadius: (borderRadius as number) || 8, overflow: "hidden", ...marginStyle(props), ...paddingStyle(props) }}>
      <div style={{ position: "relative", paddingBottom: ratio, height: 0 }}>
        <iframe src={embedUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }} allowFullScreen />
      </div>
    </div>
  );
}

function CustomHtmlDisplay(props: Record<string, unknown>) {
  const { html } = props;
  return <div style={{ ...marginStyle(props) }} dangerouslySetInnerHTML={{ __html: String(html || "") }} />;
}

export { marginStyle, paddingStyle }; // exported for ProductGridDisplay

// ── Component map ──

const displayComponents: Record<string, React.FC<Record<string, unknown>>> = {
  TextBlock: TextBlockDisplay,
  Title: TitleDisplay,
  ImageBlock: ImageBlockDisplay,
  ButtonBlock: ButtonBlockDisplay,
  Banner: BannerDisplay,
  Spacer: SpacerDisplay,
  Columns: ColumnsDisplay,
  Container: ContainerDisplay,
  VideoBlock: VideoBlockDisplay,
  ProductGrid: ProductGridDisplay,
  CustomHtml: CustomHtmlDisplay,
  RootContainer: ({ data, nodeId, renderNode }: Record<string, unknown>) => {
    const nodes = data as CraftData;
    const parent = nodeId as string;
    const render = renderNode as (id: string) => React.ReactNode;
    const root = nodes[parent];
    if (!root) return null;
    return <>{root.nodes?.map((nid) => render(nid))}</>;
  },
  ColumnCell: ({ data, nodeId, renderNode }: Record<string, unknown>) => {
    const nodes = data as CraftData;
    const parent = nodeId as string;
    const render = renderNode as (id: string) => React.ReactNode;
    const node = nodes[parent];
    if (!node) return null;
    return <div className="w-full">{node.nodes?.map((nid) => render(nid))}</div>;
  },
  div: ({ data, nodeId, renderNode }: Record<string, unknown>) => {
    const nodes = data as CraftData;
    const parent = nodeId as string;
    const render = renderNode as (id: string) => React.ReactNode;
    const node = nodes[parent];
    if (!node) return null;
    return <div className="w-full">{node.nodes?.map((nid) => render(nid))}</div>;
  },
};

// ── Main renderer ──

export default function CraftPageRenderer({ data }: { data: CraftData }) {
  const renderNode = (nodeId: string, depth = 0): React.ReactNode => {
    if (depth > 50) return null; // safety
    const node = getNodeById(data, nodeId);
    if (!node || node.hidden) return null;

    const typeName = resolveType(node);
    const Component = displayComponents[typeName];

    if (!Component) {
      // Unknown component: render children only
      return <>{node.nodes?.map((nid) => renderNode(nid, depth + 1))}</>;
    }

    const props = {
      ...node.props,
      data,
      nodeId,
      renderNode: (id: string) => renderNode(id, depth + 1),
    };

    return <Component key={nodeId} {...props} />;
  };

  const rootNode = data["ROOT"];
  if (!rootNode) return null;

  return <div>{rootNode.nodes?.map((nid) => renderNode(nid))}</div>;
}
