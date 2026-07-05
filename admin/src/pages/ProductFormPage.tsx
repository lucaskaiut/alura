import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Upload, X, Save, Pencil } from "lucide-react";
import api from "../lib/api";
import Modal from "../components/ui/Modal";

// ─── Types ───
interface ProductImage { id?: number; path: string; is_primary: boolean; rank: number; file?: File; preview?: string }
interface Attribute { id: number; name: string; values: { id: number; value: string }[] }

interface VariantMediaItem {
  id: number;
  path: string;
}

interface VariantForm {
  id?: number;
  sku: string;
  barcode?: string;
  price: string;
  stock: number;
  weight?: string;
  attribute_value_ids: number[];
  _label?: string;
  media?: VariantMediaItem[];
}

const variantSchema = z.object({
  id: z.number().optional(),
  sku: z.string(),
  barcode: z.string().optional(),
  price: z.string(),
  stock: z.number().min(0),
  weight: z.string().optional(),
  attribute_value_ids: z.array(z.number()),
  _label: z.string().optional(),
  media: z.array(z.object({ id: z.number(), path: z.string() })).optional(),
});
const productSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  slug: z.string().min(1, "Slug obrigatório"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  short_desc: z.string().optional(),
  full_desc: z.string().optional(),
  brand_id: z.string().optional(),
  category_id: z.string().optional(),
  price: z.string().optional(),
  cost_price: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  width: z.string().optional(),
  length: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  is_variable: z.string(),
  status: z.string(),
  selected_attributes: z.array(z.string()).optional(),
  variants: z.array(variantSchema).optional(),
});
type ProductForm = z.infer<typeof productSchema>;

const inputClass = "w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500";
const API_URL = import.meta.env.VITE_API_URL?.replace(/\/api$/, "") || "http://localhost:8080";

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"basic" | "images" | "variants" | "seo">("basic");
  const [images, setImages] = useState<ProductImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  const [editingVariant, setEditingVariant] = useState<number | null>(null);
  const [variantMedia, setVariantMedia] = useState<{ file: File; preview: string }[]>([]);
  const [variantRemovedMediaIds, setVariantRemovedMediaIds] = useState<number[]>([]);

  const { data: categoriesApi } = useQuery({ queryKey: ["categories"], queryFn: async () => (await api.get("/categories")).data });
  const categories = categoriesApi?.data ?? [];

  const { data: brandsApi } = useQuery({ queryKey: ["brands"], queryFn: async () => (await api.get("/brands")).data });
  const brands = brandsApi?.data ?? [];

  const { data: attributesApi } = useQuery({ queryKey: ["attributes"], queryFn: async () => (await api.get("/attributes")).data });
  const attributes: Attribute[] = attributesApi?.data ?? [];

  const { data: productData, isLoading: loadingProduct } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => (await api.get(`/products/${id}`)).data,
    enabled: isEditing,
  });

  // Compute default values from product data (for edit mode)
  const defaultValues = useMemo(() => {
    const base: ProductForm & { variants: VariantForm[] } = {
      name: "", slug: "", is_variable: "false", status: "true",
      selected_attributes: [], variants: [],
    };
    if (!isEditing || !productData) return base;
    const p = productData;
    const variants: VariantForm[] = (p.variants || []).map((v: {
      id: number; sku: string; barcode?: string; price: string; stock: number;
      weight?: string; height?: string; width?: string; length?: string; rank: number;
      attribute_values?: { id: number; value: string }[];
      media?: { id: number; path: string }[];
    }) => ({
      id: v.id,
      sku: v.sku ?? "",
      barcode: v.barcode ?? "",
      price: v.price ?? "",
      stock: v.stock ?? 0,
      weight: v.weight ?? "",
      attribute_value_ids: (v.attribute_values || []).map((av) => av.id),
      _label: (v.attribute_values || []).map((av) => av.value).join(" / ") || `Var ${v.rank + 1}`,
      media: (v.media || []).map((m) => ({ id: m.id, path: m.path })),
    }));
    return {
      name: p.name ?? "",
      slug: p.slug ?? "",
      sku: p.sku ?? "",
      barcode: p.barcode ?? "",
      short_desc: p.short_desc ?? "",
      full_desc: p.full_desc ?? "",
      brand_id: p.brand_id ? String(p.brand_id) : "",
      category_id: p.category_id ? String(p.category_id) : "",
      price: p.price ?? "",
      cost_price: p.cost_price ?? "",
      weight: p.weight ?? "",
      height: p.height ?? "",
      width: p.width ?? "",
      length: p.length ?? "",
      meta_title: p.meta_title ?? "",
      meta_description: p.meta_description ?? "",
      is_variable: p.is_variable ? "true" : "false",
      status: p.status ? "true" : "false",
      selected_attributes: [] as string[],
      variants,
    };
  }, [isEditing, productData]);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  // Sync images when product loads (from media relationship)
  useEffect(() => {
    if (isEditing && productData?.media) {
      const imgs: ProductImage[] = productData.media.map((m: { id: number; path: string; pivot?: { is_primary?: number; rank?: number } }) => ({
        id: m.id,
        path: m.path,
        is_primary: !!(m.pivot?.is_primary),
        rank: m.pivot?.rank ?? 0,
        preview: `${API_URL}/storage/${m.path}`,
      }));
      setImages(imgs);
    }
  }, [isEditing, productData]);

  // Sync form when product data loads (variants, etc.)
  useEffect(() => {
    if (!isEditing || !productData) return;
    const p = productData;

    const variants: VariantForm[] = (p.variants || []).map((v: {
      id: number; sku: string; barcode?: string; price: string; stock: number;
      weight?: string; height?: string; width?: string; length?: string; rank: number;
      attribute_values?: { id: number; value: string; attribute?: { id: number; name: string } }[];
      media?: { id: number; path: string }[];
    }) => ({
      id: v.id,
      sku: v.sku ?? "",
      barcode: v.barcode ?? "",
      price: v.price ?? "",
      stock: v.stock ?? 0,
      weight: v.weight ?? "",
      attribute_value_ids: (v.attribute_values || []).map((av) => av.id),
      _label: (v.attribute_values || []).map((av) => av.value).join(" / ") || `Var ${v.rank + 1}`,
      media: (v.media || []).map((m) => ({ id: m.id, path: m.path })),
    }));

    reset({
      name: p.name ?? "",
      slug: p.slug ?? "",
      sku: p.sku ?? "",
      barcode: p.barcode ?? "",
      short_desc: p.short_desc ?? "",
      full_desc: p.full_desc ?? "",
      brand_id: p.brand_id ? String(p.brand_id) : "",
      category_id: p.category_id ? String(p.category_id) : "",
      price: p.price ?? "",
      cost_price: p.cost_price ?? "",
      weight: p.weight ?? "",
      height: p.height ?? "",
      width: p.width ?? "",
      length: p.length ?? "",
      meta_title: p.meta_title ?? "",
      meta_description: p.meta_description ?? "",
      is_variable: p.is_variable ? "true" : "false",
      status: p.status ? "true" : "false",
      selected_attributes: [],
      variants,
    });
  }, [isEditing, productData, reset]);

  const isVariable = watch("is_variable") === "true";
  const selectedAttrs = watch("selected_attributes") ?? [];

  const pageTitle = isEditing && productData ? `Editar: ${productData.name}` : "Novo Produto";

  const generateVariants = () => {
    const currentSelected = watch("selected_attributes") ?? [];
    const selected = attributes.filter((a) => currentSelected.includes(String(a.id)));
    if (selected.length === 0) return;
    const combos = cartesian(selected.map((a) => a.values));
    setValue("variants", combos.map((combo) => ({
      sku: "", barcode: "", price: watch("price") ?? "", stock: 0, weight: watch("weight") ?? "",
      attribute_value_ids: combo.map((v) => v.id),
      _label: combo.map((v) => v.value).join(" / "),
    })));
  };

  const toggleAttribute = (attrId: number) => {
    const current = watch("selected_attributes") ?? [];
    const strId = String(attrId);
    if (current.includes(strId)) {
      setValue("selected_attributes", current.filter((id) => id !== strId), { shouldDirty: true });
    } else {
      setValue("selected_attributes", [...current, strId], { shouldDirty: true });
    }
  };

  const [imageError, setImageError] = useState<string | null>(null);
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const files = e.target.files;
    if (!files) return;
    const newImgs: ProductImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_IMAGE_SIZE) {
        setImageError(`"${file.name}" excede o limite de 5 MB.`);
        continue;
      }
      newImgs.push({ path: URL.createObjectURL(file), is_primary: images.length === 0 && i === 0, rank: images.length + i, file, preview: URL.createObjectURL(file) });
    }
    setImages([...images, ...newImgs]);
  };

  const onSubmit = async (data: ProductForm) => {
    setSaving(true);
    setSaveError(null);
    try {
      // 1. Upload new images to Media Engine first
      const uploadResults: { mediaId: number; isPrimary: boolean }[] = [];
      for (const img of images) {
        if (img.file) {
          const fd = new FormData();
          fd.append("file", img.file);
          const res = await api.post("/media", fd, { headers: { "Content-Type": "multipart/form-data" } });
          uploadResults.push({ mediaId: res.data.id as number, isPrimary: img.is_primary });
        }
      }

      // 2. Collect existing + newly uploaded media IDs
      const existingMediaIds = images
        .filter((img) => !img.file && img.id)
        .map((img) => img.id as number);

      const newMediaIds = uploadResults.map((r) => r.mediaId);
      const allMediaIds = [...existingMediaIds, ...newMediaIds];

      // 3. Find primary media
      let primaryMediaId: number | null = null;
      const existingPrimary = images.find((img) => !img.file && img.is_primary);
      if (existingPrimary?.id) {
        primaryMediaId = existingPrimary.id;
      } else {
        const newPrimary = uploadResults.find((r) => r.isPrimary);
        if (newPrimary) primaryMediaId = newPrimary.mediaId;
      }

      // 4. Build JSON payload (no files!)
      const payload: Record<string, unknown> = {
        name: data.name,
        slug: data.slug,
        is_variable: data.is_variable === "true",
        status: data.status === "true",
        media_ids: allMediaIds,
      };

      if (data.sku) payload.sku = data.sku;
      if (data.barcode) payload.barcode = data.barcode;
      if (data.short_desc) payload.short_desc = data.short_desc;
      if (data.full_desc) payload.full_desc = data.full_desc;
      if (data.brand_id) payload.brand_id = Number(data.brand_id);
      if (data.category_id) payload.category_id = Number(data.category_id);
      if (data.price) payload.price = data.price;
      if (data.cost_price) payload.cost_price = data.cost_price;
      if (data.weight) payload.weight = data.weight;
      if (data.height) payload.height = data.height;
      if (data.width) payload.width = data.width;
      if (data.length) payload.length = data.length;
      if (data.meta_title) payload.meta_title = data.meta_title;
      if (data.meta_description) payload.meta_description = data.meta_description;
      if (primaryMediaId) payload.primary_media_id = primaryMediaId;

      if (deletedImageIds.length > 0) {
        payload.removed_media_ids = deletedImageIds;
      }

      // 5. Include variants data if product is variable
      if (data.is_variable === "true" && data.variants && data.variants.length > 0) {
        payload.variants = data.variants.map((v) => ({
          id: v.id,
          sku: v.sku || "",
          barcode: v.barcode || null,
          price: v.price || null,
          weight: v.weight || null,
          stock: v.stock || 0,
          attribute_value_ids: v.attribute_value_ids || [],
          media_ids: (v.media || []).map((m) => m.id),
          removed_media_ids: v.removed_media_ids || [],
        }));
      }

      // 6. Save product as JSON (small request)
      if (isEditing) {
        await api.put(`/products/${id}`, payload);
      } else {
        await api.post("/products", payload);
      }

      queryClient.invalidateQueries({ queryKey: ["products"] });
      navigate("/products");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (typeof err === 'object' && err && 'message' in err ? String((err as { message: string }).message) : 'Erro ao salvar produto.');
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loadingProduct && isEditing) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/products")} className="p-2 rounded-lg hover:bg-bg text-text-muted hover:text-text transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text">{pageTitle}</h1>
          <p className="text-text-muted text-sm mt-1">{isEditing ? "Edite os dados do produto" : "Preencha os dados para cadastrar um novo produto"}</p>
        </div>
        <button onClick={handleSubmit(onSubmit)} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          <Save size={16} />
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      {saveError && (
        <div className="mb-4 p-4 bg-danger-500/10 border border-danger-500/20 text-danger-700 rounded-lg text-sm flex items-start gap-2">
          <span className="shrink-0 mt-0.5">⚠</span>
          <div className="flex-1">{saveError}</div>
          <button onClick={() => setSaveError(null)} className="shrink-0 text-danger-400 hover:text-danger-600 ml-2">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {(["basic", "images", "variants", "seo"] as const).map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab ? "border-primary-500 text-primary-600" : "border-transparent text-text-muted hover:text-text"}`}>
            {tab === "basic" ? "Básico" : tab === "images" ? "Imagens" : tab === "variants" ? "Variações" : "SEO"}
          </button>
        ))}
      </div>

      {/* Tab: Básico */}
      {activeTab === "basic" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Nome *</label>
              <input {...register("name")} className={inputClass} />
              {errors.name && <p className="text-danger-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Slug *</label>
              <input {...register("slug")} className={inputClass} />
              {errors.slug && <p className="text-danger-500 text-xs mt-1">{errors.slug.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-text mb-1">SKU</label><input {...register("sku")} className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-text mb-1">Código de Barras</label><input {...register("barcode")} className={inputClass} /></div>
          </div>
          <div><label className="block text-sm font-medium text-text mb-1">Descrição Curta</label><textarea {...register("short_desc")} rows={2} className={inputClass + " resize-none"} /></div>
          <div><label className="block text-sm font-medium text-text mb-1">Descrição Completa</label><textarea {...register("full_desc")} rows={4} className={inputClass + " resize-none"} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Marca</label>
              <select {...register("brand_id")} className={inputClass + " bg-surface"}>
                <option value="">Nenhuma</option>
                {brands.map((b: { id: number; name: string }) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Categoria Principal</label>
              <select {...register("category_id")} className={inputClass + " bg-surface"}>
                <option value="">Nenhuma</option>
                {categories.map((c: { id: number; name: string }) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-text mb-1">Preço</label><input {...register("price")} placeholder="99.90" className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-text mb-1">Preço de Custo</label><input {...register("cost_price")} placeholder="50.00" className={inputClass} /></div>
          </div>
          <fieldset className="border border-border rounded-lg p-4">
            <legend className="text-sm font-medium text-text px-1">Dimensões e Peso</legend>
            <div className="grid grid-cols-4 gap-4">
              {(["weight", "height", "width", "length"] as const).map((f) => (
                <div key={f}>
                  <label className="block text-xs text-text-muted mb-1">{f === "weight" ? "Peso (kg)" : f === "height" ? "Altura (cm)" : f === "width" ? "Largura (cm)" : "Comprimento (cm)"}</label>
                  <input {...register(f)} placeholder="0" className={inputClass} />
                </div>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Tipo</label>
              <select {...register("is_variable")} className={inputClass + " bg-surface"}>
                <option value="false">Simples</option>
                <option value="true">Variável (com variações)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Status</label>
              <select {...register("status")} className={inputClass + " bg-surface"}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Imagens */}
      {activeTab === "images" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-text">Imagens do Produto</label>
            <span className="text-xs text-text-muted">Máx. 5 MB por imagem • JPEG, PNG, WebP</span>
          </div>
          {imageError && (
            <div className="bg-danger-500/10 border border-danger-500/20 text-danger-700 text-sm rounded-lg px-4 py-2.5">{imageError}</div>
          )}
          <div className="grid grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className={`relative group border-2 rounded-lg overflow-hidden aspect-square ${img.is_primary ? "border-primary-500" : "border-border"}`}>
                <img src={img.file ? img.preview : `${API_URL}/storage/${img.path}`} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button type="button" onClick={() => { const ni = [...images]; if (idx > 0) { [ni[idx], ni[idx - 1]] = [ni[idx - 1], ni[idx]]; setImages(ni.map((img, i) => ({ ...img, rank: i }))); } }} disabled={idx === 0} className="p-1 bg-white rounded shadow disabled:opacity-30"><X size={12} className="rotate-90" /></button>
                  <button type="button" onClick={() => setImages(images.map((img, i) => ({ ...img, is_primary: i === idx })))} className={`p-1 rounded shadow text-xs ${img.is_primary ? "bg-primary-500 text-white" : "bg-white"}`}>★</button>
                  <button type="button" onClick={() => {
                    const img = images[idx];
                    if (img.id) setDeletedImageIds((prev) => [...prev, img.id as number]);
                    setImages(images.filter((_, i) => i !== idx));
                  }} className="p-1 bg-danger-500 text-white rounded shadow"><X size={12} /></button>
                </div>
                {img.is_primary && <span className="absolute top-1 left-1 bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded">Principal</span>}
              </div>
            ))}
            <label className="border-2 border-dashed border-border rounded-lg aspect-square flex flex-col items-center justify-center gap-1 text-text-muted hover:border-primary-400 hover:text-primary-500 cursor-pointer transition-colors">
              <Upload size={20} /><span className="text-xs">Adicionar</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
            </label>
          </div>
        </div>
      )}

      {/* Tab: Variações */}
      {activeTab === "variants" && (
        <div className="space-y-4">
          {!isVariable ? (
            <p className="text-text-muted text-sm">Altere o tipo para "Variável" na aba Básico para configurar variações.</p>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Selecione os atributos</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {attributes.map((attr) => (
                    <button
                      key={attr.id}
                      type="button"
                      onClick={() => toggleAttribute(attr.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm cursor-pointer transition-colors ${selectedAttrs.includes(String(attr.id)) ? "border-primary-500 bg-primary-50 text-primary-700" : "border-border hover:border-primary-300"}`}
                    >{attr.name}</button>
                  ))}
                </div>
                <button type="button" onClick={generateVariants} className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors">Gerar Combinações</button>
              </div>
              {watch("variants") && watch("variants")!.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-bg"><tr><th className="px-3 py-2 text-left font-medium text-text-muted">Variação</th><th className="px-3 py-2 text-left font-medium text-text-muted">SKU</th><th className="px-3 py-2 text-left font-medium text-text-muted">Preço</th><th className="px-3 py-2 text-left font-medium text-text-muted">Estoque</th><th className="px-3 py-2 text-left font-medium text-text-muted">Imagens</th><th className="px-3 py-2 text-left font-medium text-text-muted w-16"></th></tr></thead>
                    <tbody>
                      {watch("variants")!.map((v, idx) => {
                        const variant = v as VariantForm;
                        return (
                          <tr key={idx} className="border-t border-border">
                            <td className="px-3 py-2">{variant._label || `Var ${idx + 1}`}</td>
                            <td className="px-3 py-2 text-xs text-text-muted">{variant.sku || "—"}</td>
                            <td className="px-3 py-2 text-xs text-text-muted">{variant.price ? `R$ ${Number(variant.price).toFixed(2).replace(".", ",")}` : "—"}</td>
                            <td className="px-3 py-2 text-xs text-text-muted">{variant.stock}</td>
                            <td className="px-3 py-2 text-xs text-text-muted">{variant.media?.length || 0}</td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingVariant(idx);
                                  setVariantMedia([]);
                                  setVariantRemovedMediaIds([]);
                                }}
                                className="p-1.5 rounded-lg hover:bg-primary-50 text-text-muted hover:text-primary-600 transition-colors"
                              ><Pencil size={14} /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Variant Edit Modal */}
      <Modal
        open={editingVariant !== null}
        onClose={() => setEditingVariant(null)}
        title={editingVariant !== null ? `Editar: ${(watch("variants")?.[editingVariant] as VariantForm)?._label || `Variação ${editingVariant + 1}`}` : ""}
        size="lg"
      >
        {editingVariant !== null && (() => {
          const idx = editingVariant;
          const variant = watch(`variants.${idx}`) as VariantForm;
          const existingMedia = variant.media || [];

          const handleVariantImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files) return;
            const newImgs: { file: File; preview: string }[] = [];
            for (let i = 0; i < files.length; i++) {
              const f = files[i];
              if (f.size > MAX_IMAGE_SIZE) continue;
              newImgs.push({ file: f, preview: URL.createObjectURL(f) });
            }
            setVariantMedia((prev) => [...prev, ...newImgs]);
          };

          const handleSaveVariant = async () => {
            // Upload new variant images
            const uploadedIds: number[] = [];
            for (const img of variantMedia) {
              try {
                const fd = new FormData();
                fd.append("file", img.file);
                const res = await api.post("/media", fd, { headers: { "Content-Type": "multipart/form-data" } });
                uploadedIds.push(res.data.id as number);
              } catch { /* skip */ }
            }

            const existingMediaIds = existingMedia
              .filter((m) => !variantRemovedMediaIds.includes(m.id))
              .map((m) => m.id);

            const allMediaIds = [...existingMediaIds, ...uploadedIds];

            setValue(`variants.${idx}.media`, allMediaIds.map((id, i) => ({ id, path: "" })));
            setEditingVariant(null);
            setVariantMedia([]);
            setVariantRemovedMediaIds([]);
          };

          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">SKU</label>
                <input {...register(`variants.${idx}.sku`)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Preço</label>
                <input {...register(`variants.${idx}.price`)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Estoque</label>
                <input type="number" {...register(`variants.${idx}.stock`, { valueAsNumber: true })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Imagens da Variação</label>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {existingMedia.filter((m) => !variantRemovedMediaIds.includes(m.id)).map((m) => (
                    <div key={m.id} className="relative group border-2 border-border rounded-lg overflow-hidden aspect-square">
                      <img src={`${API_URL}/storage/${m.path}`} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setVariantRemovedMediaIds((prev) => [...prev, m.id])}
                        className="absolute top-1 right-1 p-1 bg-danger-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      ><X size={12} /></button>
                    </div>
                  ))}
                  {variantMedia.map((img, i) => (
                    <div key={i} className="relative group border-2 border-primary-500 rounded-lg overflow-hidden aspect-square">
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setVariantMedia((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 p-1 bg-danger-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      ><X size={12} /></button>
                    </div>
                  ))}
                  <label className="border-2 border-dashed border-border rounded-lg aspect-square flex flex-col items-center justify-center gap-1 text-text-muted hover:border-primary-400 hover:text-primary-500 cursor-pointer transition-colors">
                    <Upload size={20} /><span className="text-xs">Adicionar</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleVariantImageAdd} />
                  </label>
                </div>
                <p className="text-xs text-text-muted">Máx. 5 MB por imagem • JPEG, PNG, WebP</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => {
                  setEditingVariant(null);
                  setVariantMedia([]);
                  setVariantRemovedMediaIds([]);
                }} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors">Cancelar</button>
                <button type="button" onClick={handleSaveVariant} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">Salvar</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Tab: SEO */}
      {activeTab === "seo" && (
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-text mb-1">Meta Title</label><input {...register("meta_title")} className={inputClass} placeholder="Título para buscas" /></div>
          <div><label className="block text-sm font-medium text-text mb-1">Meta Description</label><textarea {...register("meta_description")} rows={3} className={inputClass + " resize-none"} placeholder="Descrição para buscas" /></div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-8 mt-8 border-t border-border">
        <button type="button" onClick={() => navigate("/products")} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors">Cancelar</button>
        <button onClick={handleSubmit(onSubmit)} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          <Save size={16} />{saving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Produto"}
        </button>
      </div>
    </div>
  );
}

function cartesian(arrays: { id: number; value: string }[][]): { id: number; value: string }[][] {
  return arrays.reduce((acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])), [[]] as { id: number; value: string }[][]);
}
