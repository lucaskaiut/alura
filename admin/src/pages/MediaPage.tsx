import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, Eye, Upload, ImageIcon, FileText, Film } from "lucide-react";
import api from "../lib/api";
import Modal from "../components/ui/Modal";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/api$/, "") || "http://localhost:8080";

function mediaUrl(m: { path: string }): string {
  return `${API_URL}/storage/${m.path}`;
}

interface Media {
  id: number; original_name: string; stored_name: string;
  mime_type: string; extension: string; size: number;
  path: string; status: string;
  created_at: string; updated_at: string;
}

interface MediaUsage { type: string; count: number; items: { id: number; name: string; collection: string }[] }

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function isImage(mime: string): boolean { return mime.startsWith("image/"); }

function getTypeIcon(mime: string) {
  if (mime.startsWith("image/")) return <ImageIcon size={16} />;
  if (mime.startsWith("video/")) return <Film size={16} />;
  return <FileText size={16} />;
}

export default function MediaPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null);
  const [previewUsage, setPreviewUsage] = useState<MediaUsage[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["media", search, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      const response = await api.get(`/media?${params}`);
      return response.data;
    },
  });
  const mediaList: Media[] = apiData?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/media/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["media"] }); setDeleteId(null); setDeleteError(null); },
    onError: (err: { response?: { data?: { message?: string; usage_count?: number; references?: { type: string; id: number; collection: string }[] } } }) => {
      const d = err.response?.data;
      if (d?.references) {
        setDeleteError(`Em uso por ${d.usage_count} registro(s): ${d.references.map((r: { type: string }) => r.type).join(", ")}`);
      } else {
        setDeleteError(d?.message || "Erro ao excluir");
      }
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => { await api.post("/media/bulk-delete", { ids }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["media"] }); setSelected(new Set()); },
  });

  const openPreview = async (media: Media) => {
    setPreviewMedia(media);
    try {
      const res = await api.get(`/media/${media.id}`);
      setPreviewUsage(res.data.usage || []);
    } catch {
      setPreviewUsage([]);
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Biblioteca de Mídias</h1>
          <p className="text-text-muted text-sm mt-1">Gerencie imagens, documentos e outros arquivos</p>
        </div>
        {selected.size > 0 && (
          <button onClick={() => bulkDeleteMutation.mutate(Array.from(selected))} className="flex items-center gap-2 px-4 py-2 bg-danger-500 hover:bg-danger-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Trash2 size={16} />Excluir ({selected.size})
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome..." className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-surface">
          <option value="">Todos os tipos</option>
          <option value="image">Imagens</option>
          <option value="video">Vídeos</option>
          <option value="application">Documentos</option>
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-bg animate-pulse" />
          ))}
        </div>
      ) : mediaList.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <Upload size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma mídia encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-6 gap-3">
          {mediaList.map((m) => (
            <div key={m.id} className={`relative group border-2 rounded-lg overflow-hidden aspect-square cursor-pointer transition-colors ${selected.has(m.id) ? "border-primary-500 bg-primary-50" : "border-border hover:border-primary-300"}`} onClick={() => toggleSelect(m.id)} onDoubleClick={() => openPreview(m)}>
              {isImage(m.mime_type) ? (
                <img src={mediaUrl(m)} alt={m.original_name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-text-muted p-2">
                  {getTypeIcon(m.mime_type)}
                  <span className="text-xs text-center truncate w-full">{m.extension.toUpperCase()}</span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs truncate">{m.original_name}</p>
                <p className="text-white/70 text-xs">{formatSize(m.size)}</p>
              </div>
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); openPreview(m); }} className="p-1 bg-white rounded shadow"><Eye size={12} /></button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteId(m.id); }} className="p-1 bg-danger-500 text-white rounded shadow"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Modal open={!!previewMedia} onClose={() => { setPreviewMedia(null); setPreviewUsage([]); }} title={previewMedia?.original_name || "Mídia"} size="lg">
        {previewMedia && (
          <div className="space-y-4">
            {isImage(previewMedia.mime_type) ? (
              <img src={mediaUrl(previewMedia)} alt={previewMedia.original_name} className="w-full max-h-80 object-contain rounded-lg bg-bg" />
            ) : (
              <a href={mediaUrl(previewMedia)} target="_blank" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium">
                <FileText size={16} />Abrir arquivo
              </a>
            )}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-text-muted">Nome:</span> <span className="text-text">{previewMedia.original_name}</span></div>
              <div><span className="text-text-muted">Tipo:</span> <span className="text-text">{previewMedia.mime_type}</span></div>
              <div><span className="text-text-muted">Tamanho:</span> <span className="text-text">{formatSize(previewMedia.size)}</span></div>
              <div><span className="text-text-muted">Enviado:</span> <span className="text-text">{new Date(previewMedia.created_at).toLocaleDateString("pt-BR")}</span></div>
            </div>
            {previewUsage.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-text mb-2">Onde está sendo usado:</h4>
                <div className="space-y-1">
                  {previewUsage.map((u, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-text-muted bg-bg px-3 py-2 rounded-lg">
                      <span className="font-medium">{u.type}</span>
                      <span>{u.count} registro(s)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => { setDeleteId(null); setDeleteError(null); }} title="Excluir mídia" size="sm">
        {deleteError ? (
          <div className="space-y-4">
            <div className="bg-warning-500/10 border border-warning-500/20 text-warning-700 text-sm rounded-lg px-4 py-3">{deleteError}</div>
            <button onClick={() => { deleteId && deleteMutation.mutate(deleteId); }} className="px-4 py-2 bg-danger-500 hover:bg-danger-700 text-white rounded-lg text-sm">Forçar exclusão mesmo assim</button>
          </div>
        ) : (
          <>
            <p className="text-sm text-text-muted mb-4">Tem certeza que deseja excluir esta mídia?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors">Cancelar</button>
              <button onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="px-4 py-2 bg-danger-500 hover:bg-danger-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">Excluir</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
