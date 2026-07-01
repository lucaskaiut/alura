import { useNode } from "@craftjs/core";

export default function ColumnCell({ children }: { children?: React.ReactNode }) {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div ref={(ref) => { if (ref) connect(drag(ref)); }} className="min-h-[80px] w-full group">
      <div className="h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary-500/5 shrink-0">
        <span className="text-[9px] text-primary-500/50 font-medium select-none">Área de drop</span>
      </div>
      {children}
    </div>
  );
}

ColumnCell.craft = {
  displayName: "Célula",
  isCanvas: true,
  rules: { canMoveIn: () => true },
};
