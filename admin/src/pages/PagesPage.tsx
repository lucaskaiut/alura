import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "../lib/api";
import DataTable, { type Column } from "../components/ui/DataTable";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";

interface Page {
  id: number;
  title: string;
  slug: string;
  status: boolean;
  updated_at: string;
}

export default function PagesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["pages"],
    queryFn: async () => {
      const response = await api.get("/pages");
      return response.data;
    },
  });

  const pages: Page[] = apiData?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/pages/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pages"] }); setDeleteId(null); },
  });

  const columns: Column<Page>[] = [
    { key: "title", label: "Título", priority: 1 },
    { key: "slug", label: "Slug", priority: 2 },
    {
      key: "status",
      label: "Status",
      priority: 1,
      render: (item) => (
        <Badge variant={item.status ? "success" : "warning"}>
          {item.status ? "Ativo" : "Rascunho"}
        </Badge>
      ),
    },
    { key: "updated_at", label: "Atualizado", priority: 2, render: (item) => new Date(item.updated_at).toLocaleDateString("pt-BR") },
    {
      key: "actions",
      label: "Ações",
      priority: 1,
      render: (item) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/pages/${item.id}/edit`); }} className="p-1.5 rounded-lg hover:bg-primary-50 text-text-muted hover:text-primary-600 transition-colors"><Pencil size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }} className="p-1.5 rounded-lg hover:bg-danger-500/10 text-text-muted hover:text-danger-500 transition-colors"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-text">Páginas</h1><p className="text-text-muted text-sm mt-1">Gerencie as páginas de conteúdo com editor visual</p></div>
        <button onClick={() => navigate("/pages/new")} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"><Plus size={16} />Nova Página</button>
      </div>

      <DataTable columns={columns} data={pages} isLoading={isLoading} />

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar exclusão" size="sm">
        <p className="text-sm text-text-muted mb-4">Tem certeza que deseja excluir esta página?</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors">Cancelar</button>
          <button onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="px-4 py-2 bg-danger-500 hover:bg-danger-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">Excluir</button>
        </div>
      </Modal>
    </div>
  );
}
