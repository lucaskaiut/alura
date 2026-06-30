import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "../lib/api";
import DataTable, { type Column } from "../components/ui/DataTable";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";

interface Product {
  id: number; name: string; slug: string; sku: string | null;
  price: string;
  brand?: { id: number; name: string }; category?: { id: number; name: string };
  is_variable: boolean; status: boolean;
  created_at: string;
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await api.get("/products")).data,
  });
  const products: Product[] = apiData?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/products/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products"] }); setDeleteId(null); },
  });

  const columns: Column<Product>[] = [
    { key: "name", label: "Nome", priority: 1 },
    { key: "sku", label: "SKU", priority: 2, render: (item) => item.sku || "—" },
    { key: "price", label: "Preço", priority: 1, render: (item) => item.price ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(item.price)) : "—" },
    { key: "category", label: "Categoria", priority: 2, render: (item) => item.category?.name || "—" },
    { key: "is_variable", label: "Tipo", priority: 2, render: (item) => <Badge variant={item.is_variable ? "info" : "neutral"}>{item.is_variable ? "Variável" : "Simples"}</Badge> },
    { key: "status", label: "Status", priority: 1, render: (item) => <Badge variant={item.status ? "success" : "danger"}>{item.status ? "Ativo" : "Inativo"}</Badge> },
    { key: "actions", label: "Ações", priority: 1, render: (item) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); navigate(`/products/${item.id}/edit`); }} className="p-1.5 rounded-lg hover:bg-primary-50 text-text-muted hover:text-primary-600 transition-colors"><Pencil size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }} className="p-1.5 rounded-lg hover:bg-danger-500/10 text-text-muted hover:text-danger-500 transition-colors"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-text">Produtos</h1><p className="text-text-muted text-sm mt-1">Gerencie o catálogo de produtos</p></div>
        <button onClick={() => navigate("/products/new")} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"><Plus size={16} />Novo Produto</button>
      </div>

      <DataTable columns={columns} data={products} isLoading={isLoading} />

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar exclusão" size="sm">
        <p className="text-sm text-text-muted mb-4">Tem certeza que deseja excluir este produto?</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors">Cancelar</button>
          <button onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="px-4 py-2 bg-danger-500 hover:bg-danger-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">Excluir</button>
        </div>
      </Modal>
    </div>
  );
}
