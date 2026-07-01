import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import api from "../lib/api";
import DataTable, { type Column } from "../components/ui/DataTable";
import Badge from "../components/ui/Badge";

interface OrderStatus {
  id: number;
  name: string;
  slug: string;
  color: string | null;
  variant: string | null;
  button_label?: string;
}

interface OrderCustomer {
  id: number;
  name: string;
  email: string;
}

interface OrderItem {
  name_snapshot: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  number: string;
  customer: OrderCustomer | null;
  total: string;
  status_id: number | null;
  status: OrderStatus | null;
  items: OrderItem[];
  created_at: string;
}

interface Transition {
  id: number;
  from_status_id: number;
  to_status_id: number;
  to_status?: OrderStatus;
}

function formatCurrency(value: string): string {
  const num = parseFloat(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [statusOrderId, setStatusOrderId] = useState<number | null>(null);

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await api.get("/orders");
      return response.data;
    },
  });

  const orders: Order[] = apiData?.data ?? [];

  const { data: transitions } = useQuery({
    queryKey: ["order-status-transitions"],
    queryFn: async () => {
      const response = await api.get("/order-statuses/transitions/all");
      return (response.data ?? []) as Transition[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, statusId }: { id: number; statusId: number }) => {
      const response = await api.put(`/orders/${id}/status`, { status_id: statusId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setStatusOrderId(null);
    },
  });

  const getAllowedNextStatuses = (currentStatusId: number | null): OrderStatus[] => {
    if (!currentStatusId || !transitions) return [];
    return transitions
      .filter(t => t.from_status_id === currentStatusId)
      .map(t => t.to_status!)
      .filter(Boolean);
  };

  const getCancelledStatus = (): OrderStatus | undefined => {
    return orders.flatMap(o => (o.status ? [o.status] : [])).find(s => s.slug === "cancelled")
      || undefined;
  };

  const columns: Column<Order>[] = [
    {
      key: "number",
      label: "Pedido",
      priority: 1,
      render: (item) => (
        <span className="font-mono font-medium text-primary-600">#{item.number}</span>
      ),
    },
    {
      key: "customer",
      label: "Cliente",
      priority: 2,
      render: (item) => (
        <span>{item.customer?.name || "—"}</span>
      ),
    },
    {
      key: "total",
      label: "Total",
      priority: 1,
      render: (item) => formatCurrency(item.total),
    },
    {
      key: "status",
      label: "Status",
      priority: 1,
      render: (item) => {
        const st = item.status;
        const variant = (st?.variant as BadgePropsVariant) || "neutral";
        const allowed = getAllowedNextStatuses(item.status_id);
        const cancelledStatus = getCancelledStatus();
        const showDropdown = (allowed.length > 0 || cancelledStatus) && st;

        return (
          <div className="relative inline-block">
            <Badge
              variant={variant}
              onClick={showDropdown ? () => setStatusOrderId(item.id) : undefined}
            >
              {st?.name ?? "—"}
            </Badge>
            {statusOrderId === item.id && (
              <div className="absolute left-0 top-full mt-1 z-30 bg-surface border border-border rounded-lg shadow-lg p-1 animate-fade-in min-w-[160px]">
                {allowed.map(next => (
                  <button
                    key={next.id}
                    onClick={() => updateStatusMutation.mutate({ id: item.id, statusId: next.id })}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-bg rounded-md transition-colors"
                    style={{ color: next.color || undefined }}
                  >
                    Avançar para {next.button_label || next.name}
                  </button>
                ))}
                {cancelledStatus && item.status_id !== cancelledStatus.id && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: item.id, statusId: cancelledStatus.id })}
                    className="block w-full text-left px-3 py-2 text-sm text-danger-500 hover:bg-danger-500/5 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  onClick={() => setStatusOrderId(null)}
                  className="block w-full text-left px-3 py-2 text-sm text-text-muted hover:bg-bg rounded-md transition-colors"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "created_at",
      label: "Data",
      priority: 2,
      render: (item) => formatDate(item.created_at),
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
              navigate(`/orders/${item.id}`);
            }}
            className="p-1.5 rounded-lg hover:bg-primary-50 text-text-muted hover:text-primary-600 transition-colors"
            title="Visualizar"
          >
            <Eye size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Pedidos</h1>
        <p className="text-text-muted text-sm mt-1">Gerencie os pedidos da loja</p>
      </div>

      <DataTable columns={columns} data={orders} isLoading={isLoading} />
    </div>
  );
}

type BadgePropsVariant = "success" | "warning" | "danger" | "info" | "neutral";
