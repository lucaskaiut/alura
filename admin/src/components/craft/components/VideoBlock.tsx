import { useNode } from "@craftjs/core";
import type { VideoProps } from "../types";
import { marginStyle, paddingStyle, defaultMarginPadding } from "./marginPadding";

function gU(u: string, p: "youtube" | "vimeo"): string { if (p === "youtube") { const m = u.match(/(?:v=|\/)([\w-]{11})/); return m ? `https://www.youtube.com/embed/${m[1]}` : u; } const m = u.match(/vimeo\.com\/(\d+)/); return m ? `https://player.vimeo.com/video/${m[1]}` : u; }
const r: Record<string, string> = { "16:9": "56.25%", "4:3": "75%", "1:1": "100%" };

export default function VideoBlock(props: VideoProps & Record<string, unknown>) {
  const { url, platform, aspectRatio = "16:9", borderRadius = 8 } = props;
  const { connectors: { connect, drag }, selected } = useNode((node) => ({ selected: node.events.selected }));
  return (
    <div ref={(ref) => { if (ref) connect(drag(ref)); }} style={{ outline: selected ? "2px solid #3b82f6" : "none", outlineOffset: "2px", borderRadius, ...marginStyle(props), ...paddingStyle(props) }} className="overflow-hidden hover:ring-1 hover:ring-primary-300/50 group">
      <div className="h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary-500/10 shrink-0"><span className="text-[10px] text-primary-600 font-medium select-none">Vídeo</span></div>
      <div style={{ position: "relative", paddingBottom: r[aspectRatio], height: 0 }}><iframe src={url ? gU(url, platform) : "about:blank"} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0, pointerEvents: "none" }} allowFullScreen /></div>
    </div>
  );
}

VideoBlock.craft = {
  displayName: "Vídeo",
  props: { url: "", platform: "youtube", aspectRatio: "16:9", borderRadius: 8, ...defaultMarginPadding },
};
