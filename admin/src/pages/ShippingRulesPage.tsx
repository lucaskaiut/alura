import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import api from "../lib/api";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

interface ShippingRuleData {
  id: number;
  name: string;
  gateway: string;
  service_code: string | null;
  free_from: string | null;
  min_value: string | null;
  max_weight: string | null;
  min_weight: string | null;
  zip_ranges: { start: string; end: string }[] | null;
  status: boolean;
}

interface ZipRange {
  start: string;
  end: string;
}

interface RuleForm {
  name: string;
  gateway: string;
  service_code: string;
  free_from: string;
  min_value: string;
  min_weight: string;
  max_weight: string;
  zip_ranges: ZipRange[];
  status: boolean;
}

const emptyForm: RuleForm = {
  name: "", gateway: "", service_code: "", free_from: "", min_value: "",
  min_weight: "", max_weight: "", zip_ranges: [], status: true,
};

function formatMoney(value: string | null): string {
  if (!value) return "—";
  const n = parseFloat(value);
  return n === 0 ? "Grátis" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function addZipRange(ranges: ZipRange[]): ZipRange[] {
  return [...ranges, { start: "", end: "" }];
}

function updateZipRange(ranges: ZipRange[], idx: number, field: "start" | "end", value: string): ZipRange[] {
  return ranges.map((r, i) => i === idx ? { ...r, [field]: value } : r);
}

function removeZipRange(ranges: ZipRange[], idx: number): ZipRange[] {
  return ranges.filter((_, i) => i !== idx);
}

export default function ShippingRulesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ShippingRuleData | null>(null);
  const [form, setForm] = useState<RuleForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saveError, setSaveError] = useState("");

  const { data: rules, isLoading } = useQuery({
    queryKey: ["shipping-rules"],
    queryFn: async () => {
      const res = await api.get("/shipping-rules");
      return (res.data?.data ?? res.data ?? []) as ShippingRuleData[];
    },
  });

  const { data: gateways } = useQuery({
    queryKey: ["shipping-gateways"],
    queryFn: async () => {
      const res = await api.get("/shipping-rules/gateways");
      return (res.data ?? []) as string[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post("/shipping-rules", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-rules"] });
      closeForm();
    },
    onError: (err: unknown) => {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await api.put(`/shipping-rules/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-rules"] });
      closeForm();
    },
    onError: (err: unknown) => {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/shipping-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-rules"] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSaveError("");
    setShowForm(true);
  };

  const openEdit = (rule: ShippingRuleData) => {
    setEditing(rule);
    setForm({
      name: rule.name,
      gateway: rule.gateway,
      service_code: rule.service_code || "",
      free_from: rule.free_from || "",
      min_value: rule.min_value || "",
      min_weight: rule.min_weight || "",
      max_weight: rule.max_weight || "",
      zip_ranges: rule.zip_ranges ?? [],
      status: rule.status,
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
    if (!form.name.trim() || !form.gateway) return;
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      gateway: form.gateway,
      service_code: form.service_code.trim() || null,
      free_from: form.free_from || null,
      min_value: form.min_value || null,
      min_weight: form.min_weight || null,
      max_weight: form.max_weight || null,
      zip_ranges: form.zip_ranges.length > 0 ? form.zip_ranges : null,
      status: form.status,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Regras de Frete</h1>
          <p className="text-text-muted text-sm mt-1">Configure as opções de frete por gateway</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Nova regra
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(rules ?? []).map(rule => (
            <div
              key={rule.id}
              className="bg-surface border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-semibold text-text">{rule.name}</span>
                  <span className="text-xs text-text-muted font-mono">{rule.gateway}</span>
                  {rule.service_code && (
                    <span className="text-xs bg-bg border border-border px-1.5 py-0.5 rounded">{rule.service_code}</span>
                  )}
                  {rule.status ? (
                    <Badge variant="success">Ativo</Badge>
                  ) : (
                    <Badge variant="neutral">Inativo</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
                  <span>Preço: {formatMoney(rule.min_value)}</span>
                  {rule.free_from && <span>· Grátis a partir de {formatMoney(rule.free_from)}</span>}
                  {rule.min_weight && rule.max_weight && (
                    <span>· {rule.min_weight}kg – {rule.max_weight}kg</span>
                  )}
                  {rule.min_weight && !rule.max_weight && (
                    <span>· A partir de {rule.min_weight}kg</span>
                  )}
                  {!rule.min_weight && rule.max_weight && (
                    <span>· Até {rule.max_weight}kg</span>
                  )}
                  {rule.zip_ranges && rule.zip_ranges.length > 0 && (
                    <span>· {rule.zip_ranges.length} faixa(s) de CEP</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(rule)}
                  className="p-2 rounded-lg hover:bg-primary-50 text-text-muted hover:text-primary-600 transition-colors"
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => { if (confirm(`Excluir regra "${rule.name}"?`)) deleteMutation.mutate(rule.id); }}
                  className="p-2 rounded-lg hover:bg-danger-50 text-text-muted hover:text-danger-500 transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {(!rules || rules.length === 0) && (
            <p className="text-sm text-text-muted text-center py-8">Nenhuma regra de frete cadastrada.</p>
          )}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={closeForm}
        title={editing ? "Editar regra de frete" : "Nova regra de frete"}
        size="md"
      >
        <div className="space-y-4">
          {saveError && (
            <div className="text-sm text-danger-500 bg-danger-500/10 rounded-lg px-3 py-2">{saveError}</div>
          )}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Nome de exibição</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="ex: PAC, SEDEX, Frete Expresso"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Gateway</label>
            <select
              value={form.gateway}
              onChange={e => setForm({ ...form, gateway: e.target.value })}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option value="">Selecione um gateway</option>
              {(gateways ?? []).map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Código do serviço</label>
            <input
              type="text"
              value={form.service_code}
              onChange={e => setForm({ ...form, service_code: e.target.value })}
              placeholder="ex: pac, sedex, express"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.min_value}
                onChange={e => setForm({ ...form, min_value: e.target.value })}
                placeholder="0,00"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Frete grátis a partir de (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.free_from}
                onChange={e => setForm({ ...form, free_from: e.target.value })}
                placeholder="Ex: 200,00"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Faixa de peso (kg)</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.min_weight}
                onChange={e => setForm({ ...form, min_weight: e.target.value })}
                placeholder="Mínimo (ex: 0)"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.max_weight}
                onChange={e => setForm({ ...form, max_weight: e.target.value })}
                placeholder="Máximo (ex: 5.0)"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-text-muted">Faixas de CEP</label>
              <button
                onClick={() => setForm({ ...form, zip_ranges: addZipRange(form.zip_ranges) })}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                + Adicionar faixa
              </button>
            </div>
            {form.zip_ranges.length === 0 && (
              <p className="text-xs text-text-muted">Deixe vazio para atender todos os CEPs.</p>
            )}
            <div className="space-y-2">
              {form.zip_ranges.map((range, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={range.start}
                    onChange={e => setForm({ ...form, zip_ranges: updateZipRange(form.zip_ranges, idx, "start", e.target.value) })}
                    placeholder="CEP inicial"
                    maxLength={8}
                    className="flex-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <span className="text-xs text-text-muted">até</span>
                  <input
                    type="text"
                    value={range.end}
                    onChange={e => setForm({ ...form, zip_ranges: updateZipRange(form.zip_ranges, idx, "end", e.target.value) })}
                    placeholder="CEP final"
                    maxLength={8}
                    className="flex-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <button
                    onClick={() => setForm({ ...form, zip_ranges: removeZipRange(form.zip_ranges, idx) })}
                    className="p-1 rounded hover:bg-danger-50 text-text-muted hover:text-danger-500 shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.status}
              onChange={e => setForm({ ...form, status: e.target.checked })}
              className="rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-text">Ativo</span>
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
    </div>
  );
}
