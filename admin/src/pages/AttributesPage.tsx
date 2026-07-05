import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import api from "../lib/api";
import DataTable, { type Column } from "../components/ui/DataTable";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";

interface Attribute {
  id: number;
  name: string;
  slug: string;
  type: string;
  is_filterable: boolean;
  is_variation: boolean;
  status: boolean;
  created_at: string;
}

const attributeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  slug: z.string().min(1, "Slug é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
  is_filterable: z.boolean(),
  is_variation: z.boolean(),
  position: z.number().optional(),
  status: z.boolean(),
});

type AttributeForm = z.infer<typeof attributeSchema>;

export default function AttributesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Attribute | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [values, setValues] = useState<{ id: number; value: string }[]>([]);
  const [newValue, setNewValue] = useState("");
  const [valuesLoading, setValuesLoading] = useState(false);

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["attributes"],
    queryFn: async () => {
      const response = await api.get("/attributes");
      return response.data;
    },
  });

  const attributes: Attribute[] = apiData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AttributeForm>({
    resolver: zodResolver(attributeSchema),
    defaultValues: { status: true, is_filterable: false, is_variation: false, position: 0 },
  });

  useEffect(() => {
    if (editing) {
      reset({
        name: editing.name,
        slug: editing.slug,
        type: editing.type,
        is_filterable: editing.is_filterable,
        is_variation: editing.is_variation,
        position: editing.position ?? 0,
        status: editing.status,
      });
    } else {
      reset({ name: "", slug: "", type: "text", is_filterable: false, is_variation: false, position: 0, status: true });
    }
  }, [editing, reset]);

  const createMutation = useMutation({
    mutationFn: async (data: AttributeForm) => {
      const response = await api.post("/attributes", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
      setModalOpen(false);
      setEditing(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AttributeForm }) => {
      const response = await api.put(`/attributes/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
      setModalOpen(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/attributes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
      setDeleteId(null);
    },
  });

  const fetchValues = async (attributeId: number) => {
    setValuesLoading(true);
    setValues([]);
    try {
      const res = await api.get(`/attributes/${attributeId}/values`);
      setValues(res.data?.data ?? res.data ?? []);
    } catch {
      setValues([]);
    } finally {
      setValuesLoading(false);
    }
  };

  const addValueMutation = useMutation({
    mutationFn: async ({ attributeId, value }: { attributeId: number; value: string }) => {
      const res = await api.post(`/attributes/${attributeId}/values`, { value });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      fetchValues(variables.attributeId);
    },
  });

  const deleteValueMutation = useMutation({
    mutationFn: async ({ attributeId, valueId }: { attributeId: number; valueId: number }) => {
      await api.delete(`/attributes/${attributeId}/values/${valueId}`);
    },
    onSuccess: (_data, variables) => {
      fetchValues(variables.attributeId);
    },
  });

  const handleAddValue = () => {
    const trimmed = newValue.trim();
    if (!trimmed || !editing) return;
    addValueMutation.mutate({ attributeId: editing.id, value: trimmed });
    setNewValue("");
  };

  const onSubmit = (data: AttributeForm) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (attr: Attribute) => {
    setEditing(attr);
    setValues([]);
    setNewValue("");
    setModalOpen(true);
    fetchValues(attr.id);
  };

  const columns: Column<Attribute>[] = [
    { key: "name", label: "Nome", priority: 1 },
    { key: "slug", label: "Slug", priority: 2 },
    { key: "type", label: "Tipo", priority: 2 },
    {
      key: "is_filterable",
      label: "Filtrável",
      priority: 3,
      render: (item) => (
        <Badge variant={item.is_filterable ? "success" : "neutral"}>
          {item.is_filterable ? "Sim" : "Não"}
        </Badge>
      ),
    },
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
          <h1 className="text-2xl font-bold text-text">Atributos</h1>
          <p className="text-text-muted text-sm mt-1">Gerencie os atributos de produtos</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Novo Atributo
        </button>
      </div>

      <DataTable columns={columns} data={attributes} isLoading={isLoading} />

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? "Editar Atributo" : "Novo Atributo"}
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
            <label className="block text-sm font-medium text-text mb-1">Tipo</label>
            <select
              {...register("type")}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors bg-surface"
            >
              <option value="text">Texto</option>
              <option value="select">Seleção</option>
              <option value="color">Cor</option>
              <option value="number">Número</option>
              <option value="boolean">Sim/Não</option>
            </select>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                {...register("is_filterable")}
                className="rounded border-border text-primary-600 focus:ring-primary-500"
              />
              Filtrável
            </label>
            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                {...register("is_variation")}
                className="rounded border-border text-primary-600 focus:ring-primary-500"
              />
              Variação
            </label>
          </div>

          {editing && (
            <div>
              <label className="block text-sm font-medium text-text mb-2">Valores</label>
              {valuesLoading ? (
                <p className="text-xs text-text-muted">Carregando...</p>
              ) : values.length > 0 ? (
                <div className="space-y-1 mb-2">
                  {values.map((v) => (
                    <div key={v.id} className="flex items-center justify-between bg-bg px-3 py-1.5 rounded-lg text-sm">
                      <span className="text-text">{v.value}</span>
                      <button
                        type="button"
                        onClick={() => deleteValueMutation.mutate({ attributeId: editing.id, valueId: v.id })}
                        className="p-0.5 text-text-muted hover:text-danger-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted mb-2">Nenhum valor cadastrado.</p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddValue())}
                  placeholder="Novo valor (ex: Preto)"
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddValue}
                  disabled={addValueMutation.isPending}
                  className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text mb-1">Posição</label>
            <input
              type="number"
              {...register("position", { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              placeholder="0"
            />
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
          Tem certeza que deseja excluir este atributo? Esta ação não pode ser desfeita.
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
