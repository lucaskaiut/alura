import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save } from "lucide-react";
import api from "../lib/api";
import CraftEditor, { getCraftEditorJson } from "../components/craft/CraftEditor";
import type { CraftData } from "../components/craft/types";

const pageSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  slug: z.string().min(1, "Slug é obrigatório"),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  status: z.boolean(),
});

type PageForm = z.infer<typeof pageSchema>;

export default function PageFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [saveError, setSaveError] = useState("");
  const [initialJson, setInitialJson] = useState<CraftData | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PageForm>({
    resolver: zodResolver(pageSchema),
    defaultValues: { title: "", slug: "", meta_title: "", meta_description: "", status: true },
  });

  const { isLoading: loadingPage } = useQuery({
    queryKey: ["page", id],
    queryFn: async () => {
      const res = await api.get(`/pages/${id}`);
      return res.data;
    },
    enabled: isEditing,
  });

  // When editing, load the page data into form + editor
  useEffect(() => {
    if (!isEditing) return;
    const fetchPage = async () => {
      try {
        const res = await api.get(`/pages/${id}`);
        const page = res.data;
        reset({
          title: page.title,
          slug: page.slug,
          meta_title: page.meta_title || "",
          meta_description: page.meta_description || "",
          status: page.status,
        });
        try {
          setInitialJson(page.content ? JSON.parse(page.content) : null);
        } catch {
          setInitialJson(null);
        }
      } catch {
        navigate("/pages");
      }
    };
    fetchPage();
  }, [id, isEditing, reset, navigate]);

  const createMutation = useMutation({
    mutationFn: async (data: PageForm & { content: string | null }) =>
      (await api.post("/pages", data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      navigate("/pages");
    },
    onError: (err: unknown) => {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ pageId, data }: { pageId: number; data: PageForm & { content: string | null } }) =>
      (await api.put(`/pages/${pageId}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      navigate("/pages");
    },
    onError: (err: unknown) => {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar.");
    },
  });

  const onSubmit = (data: PageForm) => {
    setSaveError("");
    const json = getCraftEditorJson();
    const payload = {
      ...data,
      content: json, // serialize() já retorna string JSON
    };
    if (isEditing) {
      updateMutation.mutate({ pageId: Number(id), data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isEditing && loadingPage) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="skeleton h-96 rounded-xl" />
      </div>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="animate-fade-in">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/pages")}
              className="p-2 rounded-lg hover:bg-bg text-text-muted hover:text-text transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-text">
                {isEditing ? "Editar Página" : "Nova Página"}
              </h1>
              <p className="text-text-muted text-sm mt-1">
                {isEditing ? "Edite o conteúdo da página com o editor visual" : "Crie uma nova página com o editor visual"}
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>

        {saveError && (
          <div className="mb-4 text-sm text-danger-500 bg-danger-500/10 rounded-lg px-3 py-2">{saveError}</div>
        )}

        {/* Metadata fields */}
        <div className="bg-surface border border-border rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Título</label>
              <input
                {...register("title")}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
              {errors.title && <p className="text-danger-500 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Slug</label>
              <input
                {...register("slug")}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
              {errors.slug && <p className="text-danger-500 text-xs mt-1">{errors.slug.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Meta Title</label>
              <input
                {...register("meta_title")}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Meta Description</label>
              <input
                {...register("meta_description")}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register("status")} className="rounded text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-text">Ativo</span>
            </label>
          </div>
        </div>

        {/* CraftJS Editor */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Conteúdo da Página</label>
          <CraftEditor json={initialJson} />
        </div>

        {/* Bottom save */}
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
