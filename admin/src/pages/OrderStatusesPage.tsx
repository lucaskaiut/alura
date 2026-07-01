import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, GitBranch, X, Check } from "lucide-react";
import api from "../lib/api";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

interface OrderStatusData {
  id: number;
  name: string;
  slug: string;
  color: string | null;
  variant: string | null;
  payment_status: string | null;
  button_label: string | null;
  is_default: boolean;
  outgoing_transitions: TransitionData[];
}

interface TransitionData {
  id: number;
  from_status_id: number;
  to_status_id: number;
  to_status?: OrderStatusData;
}

interface StatusForm {
  name: string;
  slug: string;
  color: string;
  variant: string;
  payment_status: string;
  button_label: string;
  is_default: boolean;
}

const emptyForm: StatusForm = {
  name: "", slug: "", color: "", variant: "", payment_status: "", button_label: "", is_default: false,
};

const variantOptions = [
  { value: "", label: "Nenhum" },
  { value: "warning", label: "Aviso (amarelo)" },
  { value: "info", label: "Informação (azul)" },
  { value: "success", label: "Sucesso (verde)" },
  { value: "danger", label: "Perigo (vermelho)" },
  { value: "neutral", label: "Neutro (cinza)" },
];

const colorPresets = [
  "#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#6b7280",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
];

export default function OrderStatusesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<OrderStatusData | null>(null);
  const [form, setForm] = useState<StatusForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [managingTransitions, setManagingTransitions] = useState<OrderStatusData | null>(null);
  const [toggleLoading, setToggleLoading] = useState<number | null>(null);

  const { data: statuses, isLoading } = useQuery({
    queryKey: ["order-statuses"],
    queryFn: async () => {
      const res = await api.get("/order-statuses");
      return (res.data ?? []) as OrderStatusData[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: StatusForm) => {
      const res = await api.post("/order-statuses", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-statuses"] });
      closeForm();
    },
    onError: (err: unknown) => {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<StatusForm> }) => {
      const res = await api.put(`/order-statuses/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-statuses"] });
      closeForm();
    },
    onError: (err: unknown) => {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/order-statuses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-statuses"] });
    },
  });

  const createTransitionMutation = useMutation({
    mutationFn: async ({ from, to }: { from: number; to: number }) => {
      await api.post("/order-statuses/transitions", { from_status_id: from, to_status_id: to });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-statuses"] });
    },
  });

  const deleteTransitionMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/order-statuses/transitions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-statuses"] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSaveError("");
    setShowForm(true);
  };

  const openEdit = (st: OrderStatusData) => {
    setEditing(st);
    setForm({
      name: st.name, slug: st.slug, color: st.color || "",
      variant: st.variant || "", payment_status: st.payment_status || "",
      button_label: st.button_label || "", is_default: st.is_default,
    });
    setSaveError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setSaveError("");
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.slug.trim()) return;
    const payload = {
      ...form,
      color: form.color || null,
      variant: form.variant || null,
      payment_status: form.payment_status || null,
      button_label: form.button_label || null,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isTransitionAllowed = (from: OrderStatusData, toId: number): boolean => {
    return from.outgoing_transitions?.some(t => t.to_status_id === toId) ?? false;
  };

  const handleToggleTransition = async (from: OrderStatusData, toId: number) => {
    setToggleLoading(toId);
    try {
      if (isTransitionAllowed(from, toId)) {
        const tr = from.outgoing_transitions.find(t => t.to_status_id === toId);
        if (tr) await deleteTransitionMutation.mutateAsync(tr.id);
      } else {
        await createTransitionMutation.mutateAsync({ from: from.id, to: toId });
      }
    } finally {
      setToggleLoading(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Status de Pedidos</h1>
          <p className="text-text-muted text-sm mt-1">Gerencie os status e suas transições</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Novo status
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(statuses ?? []).map(st => (
            <div
              key={st.id}
              className="bg-surface border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: st.color || "#6b7280" }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-text">{st.name}</span>
                    <span className="text-xs text-text-muted font-mono">{st.slug}</span>
                    {st.is_default && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">Padrão</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {st.variant ? (
                      <Badge variant={st.variant as "success" | "warning" | "danger" | "info" | "neutral"}>
                        {variantOptions.find(v => v.value === st.variant)?.label || st.variant}
                      </Badge>
                    ) : (
                      <span className="text-xs text-text-muted">Sem variante</span>
                    )}
                    {st.payment_status && (
                      <span className="text-xs bg-bg border border-border px-1.5 py-0.5 rounded">
                        Pagamento: {st.payment_status}
                      </span>
                    )}
                    <span className="text-xs text-text-muted">
                      {st.outgoing_transitions?.length ?? 0} transições de saída
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setManagingTransitions(st)}
                  className="p-2 rounded-lg hover:bg-primary-50 text-text-muted hover:text-primary-600 transition-colors"
                  title="Gerenciar transições"
                >
                  <GitBranch size={16} />
                </button>
                <button
                  onClick={() => openEdit(st)}
                  className="p-2 rounded-lg hover:bg-primary-50 text-text-muted hover:text-primary-600 transition-colors"
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => { if (confirm(`Excluir status "${st.name}"?`)) deleteMutation.mutate(st.id); }}
                  className="p-2 rounded-lg hover:bg-danger-50 text-text-muted hover:text-danger-500 transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showForm}
        onClose={closeForm}
        title={editing ? "Editar status" : "Novo status"}
        size="md"
      >
        <div className="space-y-4">
          {saveError && (
            <div className="text-sm text-danger-500 bg-danger-500/10 rounded-lg px-3 py-2">{saveError}</div>
          )}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="ex: Pendente"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={e => setForm({ ...form, slug: e.target.value })}
              placeholder="ex: pending"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Cor</label>
            <div className="flex items-center gap-2 mb-2">
              {colorPresets.map(color => (
                <button
                  key={color}
                  onClick={() => setForm({ ...form, color })}
                  className={`w-7 h-7 rounded-full border-2 transition-colors ${form.color === color ? "border-text shadow-sm scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input
              type="text"
              value={form.color}
              onChange={e => setForm({ ...form, color: e.target.value })}
              placeholder="#HEX ou cor CSS"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Variante do Badge</label>
            <select
              value={form.variant}
              onChange={e => setForm({ ...form, variant: e.target.value })}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              {variantOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Status de Pagamento vinculado</label>
            <select
              value={form.payment_status}
              onChange={e => setForm({ ...form, payment_status: e.target.value })}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option value="">Nenhum</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="failed">Falhou</option>
              <option value="refunded">Reembolsado</option>
            </select>
            <p className="text-xs text-text-muted mt-1">Quando o pagamento atingir este estado, o pedido será movido para este status automaticamente.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Label do botão de transição</label>
            <input
              type="text"
              value={form.button_label}
              onChange={e => setForm({ ...form, button_label: e.target.value })}
              placeholder="ex: Aprovar, Faturar, Enviar..."
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
            <p className="text-xs text-text-muted mt-1">Exibido no botão da tela do pedido. Se vazio, usa o nome do status.</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={e => setForm({ ...form, is_default: e.target.checked })}
              className="rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-text">Definir como padrão</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={closeForm} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium text-text-muted hover:bg-bg transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {editing ? "Salvar" : "Criar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Transitions Management Modal */}
      <Modal
        open={!!managingTransitions}
        onClose={() => setManagingTransitions(null)}
        title={`Transições: ${managingTransitions?.name}`}
        size="md"
      >
        {managingTransitions && (() => {
          const fromStatus = (statuses ?? []).find(s => s.id === managingTransitions.id) ?? managingTransitions;
          return (
          <div>
            <p className="text-sm text-text-muted mb-4">
              Selecione para quais status <strong className="text-text">{fromStatus.name}</strong> pode transitar:
            </p>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(statuses ?? [])
                .filter(s => s.id !== fromStatus.id)
                .map(s => {
                  const allowed = isTransitionAllowed(fromStatus, s.id);
                  const loading = toggleLoading === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleToggleTransition(fromStatus, s.id)}
                      disabled={loading}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                        allowed
                          ? "border-primary-500 bg-primary-50 hover:bg-primary-100"
                          : "border-border hover:border-primary-300 hover:bg-bg"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: s.color || "#6b7280" }}
                        />
                        <div>
                          <span className="text-sm font-medium text-text">{s.name}</span>
                          <span className="text-xs text-text-muted ml-2 font-mono">{s.slug}</span>
                        </div>
                      </div>
                      {allowed ? (
                        <span className="text-xs text-primary-600 flex items-center gap-1">
                          <Check size={14} /> Permitido
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <X size={14} /> Bloqueado
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
          );
        })()}
      </Modal>
    </div>
  );
}
