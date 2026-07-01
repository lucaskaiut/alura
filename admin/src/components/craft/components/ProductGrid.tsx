import { useNode, useEditor } from "@craftjs/core";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Check } from "lucide-react";
import api from "../../../lib/api";
import Modal from "../../ui/Modal";
import { marginStyle, paddingStyle, defaultMarginPadding } from "./marginPadding";

interface AdminProduct {
  id: number;
  name: string;
  price: number;
  sku?: string;
  media?: { id: number; path: string }[];
}

export default function ProductGrid(props: Record<string, unknown>) {
  const { title, limit = 4, columns = 3, borderRadius = 8, productIds } = props;
  const cols = Number(columns) || 3; const lim = Number(limit) || 4;
  const ids = (productIds as number[]) || [];
  const { connectors: { connect, drag }, selected, id } = useNode((node) => ({ selected: node.events.selected, id: node.id }));
  const { actions } = useEditor();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>(ids);

  const { data: productsData } = useQuery({
    queryKey: ["products-picker", search],
    queryFn: async () => {
      const res = await api.get(`/products?per_page=50${search ? `&search=${search}` : ""}`);
      return (res.data?.data ?? res.data ?? []) as AdminProduct[];
    },
    enabled: pickerOpen,
  });

  const toggleProduct = (pid: number) => {
    setSelectedIds(prev =>
      prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]
    );
  };

  const saveSelection = () => {
    actions.setProp(id, (p: Record<string, unknown>) => {
      p.productIds = selectedIds;
    });
    setPickerOpen(false);
  };

  const selectedProducts = (productsData || []).filter(p => selectedIds.includes(p.id));

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{ borderRadius: (borderRadius as number) || 8, outline: selected ? "2px solid #3b82f6" : "none", outlineOffset: "2px", ...marginStyle(props), ...paddingStyle(props) }}
      className="rounded border border-dashed border-border hover:ring-1 hover:ring-primary-300/50 group"
    >
      <div className="h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary-500/10 rounded-t shrink-0">
        <span className="text-[10px] text-primary-600 font-medium select-none">Grade de Produtos</span>
      </div>
      <div className="p-3">
        {title && <h3 className="text-sm font-semibold text-text mb-3">{title as string}</h3>}

        {selectedProducts.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
            {selectedProducts.slice(0, lim).map((p) => (
              <div key={p.id} className="bg-bg rounded overflow-hidden border border-border/50">
                <div className="aspect-square bg-border/20 flex items-center justify-center text-text-muted text-xs">
                  {p.media?.[0]?.path ? (
                    <img src={`/api/media/${p.media[0].id}/serve`} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>Sem imagem</span>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-text truncate">{p.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {p.price != null ? `R$ ${Number(p.price).toFixed(2).replace(".", ",")}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-xs text-text-muted mb-2">Nenhum produto selecionado</p>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setPickerOpen(true); setSelectedIds(ids); }}
          className="mt-3 w-full px-3 py-2 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg border border-dashed border-primary-300 transition-colors"
        >
          + {ids.length > 0 ? "Alterar" : "Selecionar"} produtos
        </button>
      </div>

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Selecionar produtos" size="lg">
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar produtos..." className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <p className="text-xs text-text-muted">{selectedIds.length} selecionados</p>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {(productsData || []).map(p => {
              const isSel = selectedIds.includes(p.id);
              return (
                <button type="button" key={p.id} onClick={() => toggleProduct(p.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${isSel ? "bg-primary-50 border border-primary-200" : "hover:bg-bg border border-transparent"}`}>
                  <div className="w-10 h-10 rounded bg-border/20 flex items-center justify-center shrink-0 overflow-hidden">
                    {p.media?.[0]?.path ? <img src={`/api/media/${p.media[0].id}/serve`} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] text-text-muted">--</span>}
                  </div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-text truncate">{p.name}</p>{p.sku && <p className="text-xs text-text-muted">{p.sku}</p>}</div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isSel ? "bg-primary-600 border-primary-600" : "border-border"}`}>{isSel && <Check size={12} className="text-white" />}</div>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setPickerOpen(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm text-text-muted hover:bg-bg">Cancelar</button>
            <button type="button" onClick={saveSelection} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">Confirmar ({selectedIds.length})</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

ProductGrid.craft = {
  displayName: "Grade de Produtos",
  props: { title: "Produtos em destaque", productIds: [], limit: 4, columns: 3, borderRadius: 8, ...defaultMarginPadding },
};
