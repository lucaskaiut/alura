import { useNode } from "@craftjs/core";
import type { SpacerProps } from "../types";
import { marginStyle, defaultMarginOnly } from "./marginPadding";

export default function Spacer(props: SpacerProps & Record<string, unknown>) {
  const { height = 32 } = props;
  const { connectors: { connect, drag } } = useNode();
  return <div ref={(ref) => { if (ref) connect(drag(ref)); }} style={{ height, ...marginStyle(props) }} className="w-full bg-bg/50 rounded hover:ring-1 hover:ring-primary-300/50 flex items-center justify-center text-xs text-text-muted">{height}px</div>;
}

Spacer.craft = {
  displayName: "Espaçador",
  props: { height: 32, ...defaultMarginOnly },
};
