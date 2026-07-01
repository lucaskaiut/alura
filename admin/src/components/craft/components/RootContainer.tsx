import { useNode } from "@craftjs/core";

export default function RootContainer({ children }: { children?: React.ReactNode }) {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className="min-h-[400px] p-4 rounded-lg border-2 border-dashed border-border/50 bg-surface/40 group"
    >
      <div className="h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary-500/10 rounded-t shrink-0 -mx-4 -mt-4 mb-4 px-4">
        <span className="text-[10px] text-primary-600 font-medium select-none">Área de conteúdo</span>
      </div>
      {children}
    </div>
  );
}

RootContainer.craft = {
  displayName: "Área de conteúdo",
  rules: { canMoveIn: () => true, canDrag: () => false },
};
