import { useNode } from "@craftjs/core";
import type { BannerProps } from "../types";
import { marginStyle, defaultMarginPadding } from "./marginPadding";

export default function Banner(props: BannerProps & Record<string, unknown>) {
  const { imageSrc, title, subtitle, buttonLabel, buttonHref, overlayOpacity = 40, height = 300, textColor = "#ffffff", borderRadius = 8 } = props;
  const { connectors: { connect, drag }, selected } = useNode((node) => ({ selected: node.events.selected }));
  return (
    <div ref={(ref) => { if (ref) connect(drag(ref)); }} className="hover:ring-1 hover:ring-primary-300/50 group rounded overflow-hidden" style={{ borderRadius, outline: selected ? "2px solid #3b82f6" : "none", outlineOffset: "2px", ...marginStyle(props) }}>
      <div className="h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary-500/10 shrink-0"><span className="text-[10px] text-primary-600 font-medium select-none">Banner</span></div>
      <div style={{ height, backgroundImage: `url(${imageSrc || "https://placehold.co/1200x400/1e3a5f/ffffff?text=Banner"})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
        {overlayOpacity > 0 && <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${overlayOpacity / 100})` }} />}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "24px", textAlign: "center", color: textColor }}>
          <h2 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: "16px", marginTop: "8px", opacity: 0.9 }}>{subtitle}</p>}
          {buttonLabel && <a href={buttonHref || "#"} style={{ marginTop: "16px", padding: "10px 24px", background: textColor, color: textColor === "#ffffff" ? "#111827" : "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 500 }}>{buttonLabel}</a>}
        </div>
      </div>
    </div>
  );
}

Banner.craft = {
  displayName: "Banner",
  props: { imageSrc: "", title: "Título do Banner", subtitle: "", buttonLabel: "", buttonHref: "", overlayOpacity: 40, height: 300, textColor: "#ffffff", borderRadius: 8, ...defaultMarginPadding },
};
