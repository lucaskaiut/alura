import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, GripVertical, ChevronRight, ChevronDown } from "lucide-react";
import api from "../lib/api";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";

interface MenuItem {
  id: number;
  title: string;
  slug: string;
  position: number;
  active: boolean;
  open_new_tab: boolean;
  parent_id: number | null;
  children: MenuItem[];
}

interface MenuForm {
  title: string;
  slug: string;
  position: number;
  active: boolean;
  open_new_tab: boolean;
  parent_id: number | null;
}

const emptyForm: MenuForm = {
  title: "", slug: "", position: 0, active: true, open_new_tab: false, parent_id: null,
};

export default function MenuPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuForm>(emptyForm);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [saveError, setSaveError] = useState("");
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);

  const { data: menu, isLoading } = useQuery({
    queryKey: ["menu-items"],
    queryFn: async () => {
      const res = await api.get("/menu-items");
      return (res.data ?? []) as MenuItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MenuForm) => (await api.post("/menu-items", data)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["menu-items"] }); closeForm(); },
    onError: (e: unknown) => setSaveError(e instanceof Error ? e.message : "Erro"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<MenuForm> }) => (await api.put(`/menu-items/${id}`, data)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["menu-items"] }); closeForm(); },
    onError: (e: unknown) => setSaveError(e instanceof Error ? e.message : "Erro"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/menu-items/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu-items"] }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: number; parent_id: number | null; position: number }[]) => {
      await api.post("/menu-items/reorder", { items });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu-items"] }),
  });

  const openCreate = (parentId: number | null = null) => {
    setEditing(null);
    setForm({ ...emptyForm, parent_id: parentId });
    setSaveError("");
    setShowForm(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setForm({ title: item.title, slug: item.slug, position: item.position, active: item.active, open_new_tab: item.open_new_tab, parent_id: item.parent_id });
    setSaveError("");
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm); setSaveError(""); };

  const handleSave = () => {
    if (!form.title.trim() || !form.slug.trim()) return;
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const toggleExpand = (id: number) => {
    setExpanded(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  // Drag & drop
  const handleDragStart = (id: number) => { setDraggedId(id); };
  const handleDragEnd = () => { setDraggedId(null); setDragOverId(null); };
  const handleDragOver = (e: React.DragEvent, id: number) => { e.preventDefault(); setDragOverId(id); };
  const handleDragLeave = () => { setDragOverId(null); };

  const handleDrop = useCallback((targetId: number, asChild: boolean) => {
    if (!draggedId || draggedId === targetId) return;
    const allItems = flatten(menu ?? []);
    const dragged = allItems.find(i => i.id === draggedId);
    if (!dragged) return;

    const updates: { id: number; parent_id: number | null; position: number }[] = [];
    if (asChild) {
      updates.push({ id: draggedId, parent_id: targetId, position: 0 });
    } else {
      const target = allItems.find(i => i.id === targetId);
      updates.push({ id: draggedId, parent_id: target?.parent_id ?? null, position: (target?.position ?? 0) + 1 });
    }
    reorderMutation.mutate(updates);
    setDraggedId(null);
    setDragOverId(null);
  }, [draggedId, menu, reorderMutation]);

  const inputClass = "w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500";

  // Render tree
  const renderItem = (item: MenuItem, depth: number) => {
    const isExpanded = expanded.has(item.id);
    const hasChildren = item.children.length > 0;
    const isDragOver = dragOverId === item.id;

    return (
      <div key={item.id}>
        <div
          draggable
          onDragStart={() => handleDragStart(item.id)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, item.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => { e.preventDefault(); handleDrop(item.id, e.shiftKey); }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors group ${
            isDragOver ? "border-primary-500 bg-primary-50" : "border-transparent hover:bg-bg"
          }`}
          style={{ marginLeft: depth * 24 }}
        >
          <GripVertical size={14} className="text-text-muted cursor-grab shrink-0" />
          {hasChildren ? (
            <button type="button" onClick={() => toggleExpand(item.id)} className="p-0.5 rounded hover:bg-border/50 shrink-0">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text truncate">{item.title}</span>
              <span className="text-xs text-text-muted font-mono truncate">{item.slug}</span>
              {item.active ? (
                <Badge variant="success">Ativo</Badge>
              ) : (
                <Badge variant="neutral">Inativo</Badge>
              )}
              {item.open_new_tab && (
                <span className="text-[10px] text-text-muted">🔗</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button type="button" onClick={() => openCreate(item.id)} className="p-1.5 rounded hover:bg-primary-50 text-text-muted hover:text-primary-600" title="Adicionar filho">
              <Plus size={14} />
            </button>
            <button type="button" onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-primary-50 text-text-muted hover:text-primary-600" title="Editar">
              <Pencil size={14} />
            </button>
            <button type="button" onClick={() => { if (confirm(`Excluir "${item.title}"?`)) deleteMutation.mutate(item.id); }} className="p-1.5 rounded hover:bg-danger-50 text-text-muted hover:text-danger-500" title="Excluir">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && item.children.map(child => renderItem(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Menu de Navegação</h1>
          <p className="text-text-muted text-sm mt-1">Configure os itens exibidos no menu principal da loja. Arraste para reordenar. Segure Shift ao soltar para tornar filho.</p>
        </div>
        <button onClick={() => openCreate(null)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />Adicionar Item
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-10 rounded-lg" />)}</div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-2 space-y-0.5">
          {(menu ?? []).length === 0 && (
            <p className="text-sm text-text-muted text-center py-8">Nenhum item de menu cadastrado.</p>
          )}
          {(menu ?? []).map(item => renderItem(item, 0))}
        </div>
      )}

      <Modal open={showForm} onClose={closeForm} title={editing ? "Editar item" : "Novo item"} size="md">
        <div className="space-y-4">
          {saveError && <div className="text-sm text-danger-500 bg-danger-500/10 rounded-lg px-3 py-2">{saveError}</div>}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Título</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Home" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Slug / URL</label>
            <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="/ ou /produtos" className={`${inputClass} font-mono`} />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Item pai</label>
            <select value={form.parent_id ?? ""} onChange={e => setForm({ ...form, parent_id: e.target.value ? Number(e.target.value) : null })} className={`${inputClass} bg-surface`}>
              <option value="">Nenhum (raiz)</option>
              {flatten(menu ?? []).filter(i => i.id !== editing?.id).map(i => (
                <option key={i.id} value={i.id}>{i.title}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Posição</label>
              <input type="number" min={0} value={form.position} onChange={e => setForm({ ...form, position: Number(e.target.value) || 0 })} className={inputClass} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="rounded text-primary-600" />
              <span className="text-sm text-text">Ativo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.open_new_tab} onChange={e => setForm({ ...form, open_new_tab: e.target.checked })} className="rounded text-primary-600" />
              <span className="text-sm text-text">Abrir em nova aba</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeForm} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium text-text-muted hover:bg-bg">Cancelar</button>
            <button type="button" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">{editing ? "Salvar" : "Criar"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function flatten(items: MenuItem[]): MenuItem[] {
  return items.flatMap(i => [i, ...flatten(i.children)]);
}
