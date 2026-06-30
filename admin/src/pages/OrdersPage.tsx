import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import api from "../lib/api";
import DataTable, { type Column } from "../components/ui/DataTable";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";

interface OrderItem {
  product_name: string;
  quantity: number;
  price: string;
}

interface Order {
  id: number;
  number: string;
  customer_name: string;
  customer_email: string;
  total: string;
  status_id: number | null;
  status: string;
  items: OrderItem[];
  created_at: string;
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

const statusMap: Record<string, { label: string; variant: "warning" | "info" | "success" | "danger" | "neutral" }> = {
  pending: { label: "Pendente", variant: "warning" },
  processing: { label: "Processando", variant: "info" },
  completed: { label: "Concluído", variant: "success" },
  cancelled: { label: "Cancelado", variant: "danger" },
  refunded: { label: "Reembolsado", variant: "neutral" },
};

const nextStatus: Record<string, string> = {
  pending: "processing",
  processing: "completed",
};

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [statusOrderId, setStatusOrderId] = useState<number | null>(null);

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await api.get("/orders");
      return response.data;
    },
  });

  const orders: Order[] = apiData?.data ?? [];

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await api.patch(`/orders/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setStatusOrderId(null);
    },
  });

  const columns: Column<Order>[] = [
    {
      key: "number",
      label: "Pedido",
      priority: 1,
      render: (item) => (
        <span className="font-mono font-medium text-primary-600">#{item.number}</span>
      ),
    },
    { key: "customer_name", label: "Cliente", priority: 2 },
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
        const s = statusMap[item.status] || { label: item.status, variant: "neutral" as const };
        const next = nextStatus[item.status];
        return (
          <div className="relative inline-block">
            <Badge
              variant={s.variant}
              onClick={next ? () => setStatusOrderId(item.id) : undefined}
            >
              {s.label}
            </Badge>
            {statusOrderId === item.id && (
              <div className="absolute left-0 top-full mt-1 z-30 bg-surface border border-border rounded-lg shadow-lg p-1 animate-fade-in min-w-[140px]">
                {next && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: item.id, status: next })}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-bg rounded-md transition-colors"
                  >
                    Avançar para {statusMap[next].label}
                  </button>
                )}
                <button
                  onClick={() => updateStatusMutation.mutate({ id: item.id, status: "cancelled" })}
                  className="block w-full text-left px-3 py-2 text-sm text-danger-500 hover:bg-danger-500/5 rounded-md transition-colors"
                >
                  Cancelar
                </button>
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
              setViewOrder(item);
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

      <Modal open={!!viewOrder} onClose={() => setViewOrder(null)} title={`Pedido #${viewOrder?.number}`} size="lg">
        {viewOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-muted mb-1">Cliente</p>
                <p className="text-sm font-medium text-text">{viewOrder.customer_name}</p>
                <p className="text-xs text-text-muted">{viewOrder.customer_email}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Status</p>
                <Badge variant={statusMap[viewOrder.status]?.variant || "neutral"}>
                  {statusMap[viewOrder.status]?.label || viewOrder.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Total</p>
                <p className="text-sm font-semibold text-text">{formatCurrency(viewOrder.total)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Data</p>
                <p className="text-sm text-text">{formatDate(viewOrder.created_at)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Itens</p>
              <div className="border border-border rounded-lg divide-y divide-border">
                {viewOrder.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-text">{item.product_name}</p>
                      <p className="text-xs text-text-muted">Qtd: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-text">{formatCurrency(item.price)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
