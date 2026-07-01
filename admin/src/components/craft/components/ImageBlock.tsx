import { useNode } from "@craftjs/core";
import type { ImageProps } from "../types";
import { marginStyle, paddingStyle, defaultMarginPadding } from "./marginPadding";

export default function ImageBlock(props: ImageProps & Record<string, unknown>) {
  const { src, alt = "", href, width, height, borderRadius = 8 } = props;
  const { connectors: { connect, drag }, selected } = useNode((node) => ({ selected: node.events.selected }));
  const img = <img src={src || "https://placehold.co/600x400/e5e7eb/6b7280?text=Imagem"} alt={alt} style={{ width: width || "100%", height: height || "auto", maxWidth: "100%", borderRadius }} className="object-cover" />;
  const ct = href ? <a href={href} target="_blank" rel="noopener">{img}</a> : img;
  return (
    <div ref={(ref) => { if (ref) connect(drag(ref)); }} style={{ outline: selected ? "2px solid #3b82f6" : "none", outlineOffset: "2px", ...marginStyle(props), ...paddingStyle(props) }} className="rounded hover:ring-1 hover:ring-primary-300/50 group">
      <div className="h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary-500/10 rounded-t shrink-0"><span className="text-[10px] text-primary-600 font-medium select-none">Imagem</span></div>
      <div className="p-1">{ct}</div>
    </div>
  );
}

ImageBlock.craft = {
  displayName: "Imagem",
  props: { src: "", alt: "", href: "", borderRadius: 8, ...defaultMarginPadding },
};
