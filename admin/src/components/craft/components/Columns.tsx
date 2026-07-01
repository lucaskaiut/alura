import { useNode, Element } from "@craftjs/core";
import type { ColumnsProps } from "../types";
import ColumnCell from "./ColumnCell";
import { marginStyle, paddingStyle, defaultMarginPadding } from "./marginPadding";

export default function Columns(props: ColumnsProps & Record<string, unknown>) {
  const { columns = 2, gap = 16, borderRadius = 8 } = props;
  const cols = Number(columns) || 2;
  const { id, connectors: { connect, drag }, selected } = useNode((node) => ({ id: node.id, selected: node.events.selected }));
  return (
    <div ref={(ref) => { if (ref) connect(drag(ref)); }} style={{ borderRadius, outline: selected ? "2px solid #3b82f6" : "none", outlineOffset: "2px", ...marginStyle(props), ...paddingStyle(props) }} className="border border-dashed border-border hover:border-primary-300/50 overflow-hidden group">
      <div className="h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary-500/10 shrink-0"><span className="text-[10px] text-primary-600 font-medium select-none">Colunas ({cols})</span></div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap }} className="p-2 min-h-[60px]">
        {Array.from({ length: cols }).map((_, i) => (<Element key={i} id={`${id}-col-${i}`} canvas is={ColumnCell} />))}
      </div>
    </div>
  );
}

Columns.craft = {
  displayName: "Colunas",
  props: { columns: 2, gap: 16, borderRadius: 8, ...defaultMarginPadding },
  rules: { canMoveIn: () => true },
};
