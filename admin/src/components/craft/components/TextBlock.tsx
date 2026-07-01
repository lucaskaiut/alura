import { useNode } from "@craftjs/core";
import type { TextBlockProps } from "../types";
import { marginStyle, paddingStyle, defaultMarginPadding } from "./marginPadding";

export default function TextBlock(props: TextBlockProps & Record<string, unknown>) {
  const { content, fontSize = 16, color = "#111827", textAlign = "left" } = props;
  const { connectors: { connect, drag }, selected } = useNode((node) => ({ selected: node.events.selected }));
  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{ fontSize, color, textAlign, outline: selected ? "2px solid #3b82f6" : "none", outlineOffset: "2px", ...marginStyle(props), ...paddingStyle(props) }}
      className="min-h-[1em] cursor-text p-1 rounded hover:ring-1 hover:ring-primary-300/50"
      contentEditable
      suppressContentEditableWarning
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

TextBlock.craft = {
  displayName: "Texto",
  props: { content: "Digite seu texto aqui...", fontSize: 16, color: "#111827", textAlign: "left", ...defaultMarginPadding },
};
