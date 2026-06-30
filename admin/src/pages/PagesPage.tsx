import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  is_home: boolean;
  created_at: string;
  updated_at: string;
}

const pageSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  slug: z.string().min(1, "Slug é obrigatório"),
  content: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  status: z.boolean(),
});

type PageForm = z.infer<typeof pageSchema>;

export default function PagesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Page | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["pages"],
    queryFn: async () => {
      const response = await api.get("/pages");
      return response.data;
    },
  });

  const pages: Page[] = apiData?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PageForm>({
    resolver: zodResolver(pageSchema),
    defaultValues: { title: "", slug: "", content: "", meta_title: "", meta_description: "", status: true },
  });

  useEffect(() => {
    if (editing) {
      reset({
        title: editing.title,
        slug: editing.slug,
        content: "",
        meta_title: "",
        meta_description: "",
        status: editing.status,
      });
    } else {
      reset({ title: "", slug: "", content: "", meta_title: "", meta_description: "", status: true });
    }
  }, [editing, reset]);

  const createMutation = useMutation({
    mutationFn: async (data: PageForm) => (await api.post("/pages", data)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pages"] }); setModalOpen(false); setEditing(null); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PageForm }) => (await api.put(`/pages/${id}`, data)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pages"] }); setModalOpen(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/pages/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pages"] }); setDeleteId(null); },
  });

  const onSubmit = (data: PageForm) => {
    editing ? updateMutation.mutate({ id: editing.id, data }) : createMutation.mutate(data);
  };

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
          <button onClick={(e) => { e.stopPropagation(); setEditing(item); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-primary-50 text-text-muted hover:text-primary-600 transition-colors"><Pencil size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }} className="p-1.5 rounded-lg hover:bg-danger-500/10 text-text-muted hover:text-danger-500 transition-colors"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-text">Páginas</h1><p className="text-text-muted text-sm mt-1">Gerencie as páginas de conteúdo</p></div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"><Plus size={16} />Nova Página</button>
      </div>

      <DataTable columns={columns} data={pages} isLoading={isLoading} />

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? "Editar Página" : "Nova Página"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Título</label>
            <input {...register("title")} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
            {errors.title && <p className="text-danger-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Slug</label>
            <input {...register("slug")} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
            {errors.slug && <p className="text-danger-500 text-xs mt-1">{errors.slug.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Meta Title</label>
              <input {...register("meta_title")} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Meta Description</label>
              <input {...register("meta_description")} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Status</label>
            <select {...register("status", { setValueAs: (v) => v === "true" })} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-surface">
              <option value="true">Ativo</option>
              <option value="false">Rascunho</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Conteúdo</label>
            <textarea {...register("content")} rows={6} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none font-mono text-xs" placeholder="HTML ou JSON do editor visual..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setModalOpen(false); setEditing(null); }} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors">Cancelar</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">{editing ? "Salvar" : "Criar"}</button>
          </div>
        </form>
      </Modal>

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
