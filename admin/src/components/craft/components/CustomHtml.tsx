import { useNode } from "@craftjs/core";
import type { CustomHtmlProps } from "../types";
import { marginStyle, defaultMarginOnly } from "./marginPadding";

export default function CustomHtml(props: CustomHtmlProps & Record<string, unknown>) {
  const { html = "" } = props;
  const { connectors: { connect, drag }, selected } = useNode((node) => ({ selected: node.events.selected }));
  return (
    <div ref={(ref) => { if (ref) connect(drag(ref)); }} style={{ outline: selected ? "2px solid #3b82f6" : "none", outlineOffset: "2px", ...marginStyle(props) }} className="p-2 rounded border border-dashed border-border hover:ring-1 hover:ring-primary-300/50">
      <div className="text-xs text-text-muted mb-1 font-medium">HTML Personalizado</div>
      <div dangerouslySetInnerHTML={{ __html: html || "<p style='color:#9ca3af'>...</p>" }} />
    </div>
  );
}

CustomHtml.craft = {
  displayName: "HTML Personalizado",
  props: { html: "", ...defaultMarginOnly },
};
