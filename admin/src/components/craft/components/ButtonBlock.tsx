import { useNode } from "@craftjs/core";
import type { ButtonProps } from "../types";
import { marginStyle, defaultMarginPadding } from "./marginPadding";

const vS: Record<string, Record<string, string>> = { primary: { bg: "#2563eb", color: "#fff", border: "transparent" }, secondary: { bg: "#4b5563", color: "#fff", border: "transparent" }, outline: { bg: "transparent", color: "#2563eb", border: "#2563eb" } };
const sS: Record<string, Record<string, string>> = { sm: { padding: "6px 12px", fontSize: "14px" }, md: { padding: "10px 20px", fontSize: "16px" }, lg: { padding: "14px 28px", fontSize: "18px" } };

export default function ButtonBlock(props: ButtonProps & Record<string, unknown>) {
  const { label, href, variant = "primary", size = "md", borderRadius = 8 } = props;
  const { connectors: { connect, drag }, selected } = useNode((node) => ({ selected: node.events.selected }));
  const v = vS[variant] || vS.primary; const s = sS[size] || sS.md;
  return (
    <div ref={(ref) => { if (ref) connect(drag(ref)); }} style={{ outline: selected ? "2px solid #3b82f6" : "none", outlineOffset: "2px", ...marginStyle(props) }} className="inline-block hover:ring-1 hover:ring-primary-300/50">
      <a href={href || "#"} style={{ ...v, ...s, display: "inline-block", borderRadius, fontWeight: 500, textDecoration: "none", borderWidth: v.border !== "transparent" ? "1px" : 0, borderStyle: "solid" }}>{label}</a>
    </div>
  );
}

ButtonBlock.craft = {
  displayName: "Botão",
  props: { label: "Clique aqui", href: "#", variant: "primary", size: "md", borderRadius: 8, ...defaultMarginPadding },
};
