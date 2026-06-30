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

interface Coupon {
  id: number;
  code: string;
  type: "fixed" | "percentage" | "free_shipping";
  value: string;
  min_order_amount: string | null;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  status: boolean;
  created_at: string;
}

const couponSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  type: z.enum(["fixed", "percentage", "free_shipping"]),
  value: z.string(),
  min_order_amount: z.string().nullable().optional(),
  max_uses: z.number().int().nullable().optional(),
  starts_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  status: z.boolean(),
});

type CouponForm = z.infer<typeof couponSchema>;

function formatCurrency(value: string): string {
  const num = parseFloat(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const response = await api.get("/coupons");
      return response.data;
    },
  });

  const coupons: Coupon[] = apiData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CouponForm>({
    resolver: zodResolver(couponSchema),
    defaultValues: { status: true, type: "fixed", value: "0" },
  });

  useEffect(() => {
    if (editing) {
      reset({
        code: editing.code,
        type: editing.type,
        value: editing.value,
        min_order_amount: editing.min_order_amount,
        max_uses: editing.max_uses,
        starts_at: editing.starts_at,
        expires_at: editing.expires_at,
        status: editing.status,
      });
    } else {
      reset({
        code: "",
        type: "fixed",
        value: "0",
        min_order_amount: null,
        max_uses: null,
        starts_at: null,
        expires_at: null,
        status: true,
      });
    }
  }, [editing, reset]);

  const createMutation = useMutation({
    mutationFn: async (data: CouponForm) => {
      const response = await api.post("/coupons", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      setModalOpen(false);
      setEditing(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CouponForm }) => {
      const response = await api.put(`/coupons/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      setModalOpen(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      setDeleteId(null);
    },
  });

  const onSubmit = (data: CouponForm) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setModalOpen(true);
  };

  const columns: Column<Coupon>[] = [
    {
      key: "code",
      label: "Código",
      priority: 1,
      render: (item) => (
        <span className="font-mono font-medium text-primary-600">{item.code}</span>
      ),
    },
    {
      key: "type",
      label: "Tipo",
      priority: 2,
      render: (item) => {
        const typeLabels: Record<Coupon["type"], string> = {
          fixed: "Fixo",
          percentage: "Porcentagem",
          free_shipping: "Frete Grátis",
        };
        const typeVariants: Record<Coupon["type"], "success" | "warning" | "danger" | "info" | "neutral"> = {
          fixed: "neutral",
          percentage: "info",
          free_shipping: "success",
        };
        return <Badge variant={typeVariants[item.type]}>{typeLabels[item.type]}</Badge>;
      },
    },
    {
      key: "value",
      label: "Valor",
      priority: 1,
      render: (item) =>
        item.type === "percentage" ? `${item.value}%` : formatCurrency(item.value),
    },
    {
      key: "used_count",
      label: "Usado",
      priority: 3,
      render: (item) => (
        <span>
          {item.used_count}
          {item.max_uses ? ` / ${item.max_uses}` : ""}
        </span>
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
          <h1 className="text-2xl font-bold text-text">Cupons</h1>
          <p className="text-text-muted text-sm mt-1">Gerencie os cupons de desconto</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Novo Cupom
        </button>
      </div>

      <DataTable columns={columns} data={coupons} isLoading={isLoading} />

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? "Editar Cupom" : "Novo Cupom"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Código</label>
            <input
              type="text"
              {...register("code")}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              placeholder="ex: VERAO2024"
            />
            {errors.code && <p className="text-danger-500 text-xs mt-1">{errors.code.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Tipo</label>
              <select
                {...register("type")}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors bg-surface"
              >
                <option value="fixed">Valor Fixo</option>
                <option value="percentage">Porcentagem</option>
                <option value="free_shipping">Frete Grátis</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Valor</label>
                <input
                  type="text"
                  {...register("value")}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                />
              {errors.value && <p className="text-danger-500 text-xs mt-1">{errors.value.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Pedido mínimo</label>
                <input
                  type="text"
                  {...register("min_order_amount")}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                  placeholder="Opcional"
                />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Máx. utilizações</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  {...register("max_uses", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                  placeholder="Opcional"
                />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Início</label>
              <input
                type="datetime-local"
                {...register("starts_at")}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Expira em</label>
              <input
                type="datetime-local"
                {...register("expires_at")}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              />
            </div>
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
          Tem certeza que deseja excluir este cupom? Esta ação não pode ser desfeita.
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
