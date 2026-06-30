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

interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  status: boolean;
  children?: Category[];
  created_at: string;
}

const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  slug: z.string().min(1, "Slug é obrigatório"),
  parent_id: z.number().nullable().optional(),
  status: z.boolean(),
});

type CategoryForm = z.infer<typeof categorySchema>;

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [treeView, setTreeView] = useState(false);

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/categories");
      return response.data;
    },
  });

  const categories: Category[] = apiData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { status: true, parent_id: null },
  });

  useEffect(() => {
    if (editing) {
      reset({
        name: editing.name,
        slug: editing.slug,
        parent_id: editing.parent_id,
        status: editing.status,
      });
    } else {
      reset({ name: "", slug: "", parent_id: null, status: true });
    }
  }, [editing, reset]);

  const createMutation = useMutation({
    mutationFn: async (data: CategoryForm) => {
      const response = await api.post("/categories", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setModalOpen(false);
      setEditing(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CategoryForm }) => {
      const response = await api.put(`/categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setModalOpen(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeleteId(null);
    },
  });

  const onSubmit = (data: CategoryForm) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setModalOpen(true);
  };

  const buildTreeRows = (items: Category[], level = 0): Category[] => {
    const result: Category[] = [];
    for (const item of items) {
      result.push({ ...item, name: `${"│  ".repeat(level)}${level > 0 ? "├─ " : ""}${item.name}` } as Category);
      if (item.children && item.children.length > 0) {
        result.push(...buildTreeRows(item.children, level + 1));
      }
    }
    return result;
  };

  const displayData = treeView ? buildTreeRows(categories) : categories;

  const columns: Column<Category>[] = [
    { key: "name", label: "Nome", priority: 1 },
    { key: "slug", label: "Slug", priority: 2 },
    {
      key: "status",
      label: "Status",
      priority: 1,
      render: (item) => (
        <Badge variant={item.status ? "success" : "danger"}>
          {item.status ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Ações",
      priority: 1,
      render: (item) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(item);
            }}
            className="p-1.5 rounded-lg hover:bg-primary-50 text-text-muted hover:text-primary-600 transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(item.id);
            }}
            className="p-1.5 rounded-lg hover:bg-danger-500/10 text-text-muted hover:text-danger-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Categorias</h1>
          <p className="text-text-muted text-sm mt-1">Gerencie as categorias de produtos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTreeView(!treeView)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              treeView
                ? "bg-primary-50 border-primary-200 text-primary-700"
                : "bg-surface border-border text-text-muted hover:text-text"
            }`}
          >
            {treeView ? "Lista" : "Árvore"}
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Nova Categoria
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={displayData} isLoading={isLoading} />

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? "Editar Categoria" : "Nova Categoria"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Nome</label>
            <input
              type="text"
              {...register("name")}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
            />
            {errors.name && <p className="text-danger-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Slug</label>
            <input
              type="text"
              {...register("slug")}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
            />
            {errors.slug && <p className="text-danger-500 text-xs mt-1">{errors.slug.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Categoria Pai</label>
            <select
              {...register("parent_id", { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors bg-surface"
            >
              <option value="">Nenhuma (raiz)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Status</label>
            <select
              {...register("status", { setValueAs: (v) => v === "true" })}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors bg-surface"
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                setEditing(null);
              }}
              className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {editing ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar exclusão" size="sm">
        <p className="text-sm text-text-muted mb-4">
          Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setDeleteId(null)}
            className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 bg-danger-500 hover:bg-danger-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Excluir
          </button>
        </div>
      </Modal>
    </div>
  );
}
