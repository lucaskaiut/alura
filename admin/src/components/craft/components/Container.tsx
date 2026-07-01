import { useNode, Element } from "@craftjs/core";
import ColumnCell from "./ColumnCell";
import { marginStyle, paddingStyle, defaultMarginPadding } from "./marginPadding";

export default function Container(props: Record<string, unknown>) {
  const { width = "auto", height = "auto", hAlign = "left", vAlign = "top", backgroundColor = "transparent", padding = 0, borderRadius = 0 } = props;
  const { connectors: { connect, drag }, selected, id } = useNode((node) => ({ selected: node.events.selected, id: node.id }));
  const flexAlignMap: Record<string, string> = { left: "flex-start", center: "center", right: "flex-end" };
  const flexVAlignMap: Record<string, string> = { top: "flex-start", center: "center", bottom: "flex-end", stretch: "stretch" };

  const resolveSize = (v: unknown): string | number | undefined => {
    if (v === undefined || v === null || v === "" || v === "auto") return undefined;
    const str = String(v);
    if (str.endsWith("%") || str.endsWith("px")) return str;
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  };

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        borderRadius,
        width: resolveSize(width),
        minHeight: height === "auto" ? undefined : resolveSize(height),
        height: height === "auto" ? undefined : resolveSize(height),
        outline: selected ? "2px solid #3b82f6" : "none",
        outlineOffset: "2px",
        display: "flex",
        flexDirection: "column",
        ...marginStyle(props),
        ...paddingStyle(props),
      }}
      className="border border-dashed border-border/50 hover:border-primary-300/50 relative group"
    >
      <div className="h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary-500/10 rounded-t shrink-0">
        <span className="text-[10px] text-primary-600 font-medium select-none">Container</span>
      </div>
      <div style={{
        backgroundColor: backgroundColor === "transparent" ? undefined : backgroundColor,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: flexAlignMap[hAlign],
        justifyContent: flexVAlignMap[vAlign],
        padding: padding || undefined,
      }}>
        <Element id={`${id}-content`} canvas is={ColumnCell} />
      </div>
    </div>
  );
}

Container.craft = {
  displayName: "Container",
  props: { width: "auto", height: "auto", hAlign: "left", vAlign: "top", backgroundColor: "transparent", padding: 0, borderRadius: 0, ...defaultMarginPadding },
  rules: { canMoveIn: () => true },
};
