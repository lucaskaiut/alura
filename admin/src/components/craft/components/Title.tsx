import { useNode } from "@craftjs/core";
import type { TitleProps } from "../types";
import { marginStyle, paddingStyle, defaultMarginPadding } from "./marginPadding";

export default function Title(props: TitleProps & Record<string, unknown>) {
  const { text, level: Tag = "h2", align = "left", color = "#111827" } = props;
  const { connectors: { connect, drag }, selected } = useNode((node) => ({ selected: node.events.selected }));
  return (
    <Tag
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{ textAlign: align, color, outline: selected ? "2px solid #3b82f6" : "none", outlineOffset: "2px", ...marginStyle(props), ...paddingStyle(props) }}
      className="outline-none font-bold p-1 rounded hover:ring-1 hover:ring-primary-300/50"
    >{text}</Tag>
  );
}

Title.craft = {
  displayName: "Título",
  props: { text: "Título da seção", level: "h2", align: "left", color: "#111827", ...defaultMarginPadding },
};
