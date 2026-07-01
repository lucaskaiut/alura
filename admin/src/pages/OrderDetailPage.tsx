import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Package, Clock, CreditCard, MapPin, Truck,
  FileText, User, Mail, Phone, Copy, ShoppingCart,
} from "lucide-react";
import api from "../lib/api";
import Badge from "../components/ui/Badge";

// ─── Types ───

interface OrderDetailItem {
  id: number;
  product_id: number;
  variant_id: number | null;
  name_snapshot: string;
  sku_snapshot: string | null;
  price: number;
  quantity: number;
}

interface OrderDetailPayment {
  id: number;
  gateway: string;
  method: string;
  transaction_id: string | null;
  amount: string;
  status: string;
  metadata: Record<string, unknown>;
  paid_at: string | null;
  created_at: string;
}

interface OrderDetailTransaction {
  id: number;
  type: string;
  data: Record<string, unknown>;
  created_at: string;
  user?: { id: number; name: string } | null;
}

interface OrderDetailCustomer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  document?: string;
}

interface OrderDetailStatus {
  id: number;
  name: string;
  slug: string;
  color?: string;
}

interface OrderDetailAddress {
  zip_code: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface OrderDetailData {
  id: number;
  number: string;
  customer: OrderDetailCustomer | null;
  subtotal: string;
  discount: string;
  shipping_cost: string;
  total: string;
  status: OrderDetailStatus | null;
  shipping_address: OrderDetailAddress | null;
  shipping_method: string | null;
  notes: string | null;
  items: OrderDetailItem[];
  payments: OrderDetailPayment[];
  transactions: OrderDetailTransaction[];
  created_at: string;
  updated_at: string;
}

interface TransitionItem {
  id: number;
  from_status_id: number;
  to_status_id: number;
  to_status?: OrderStatusOption;
}

interface OrderStatusOption {
  id: number;
  name: string;
  slug: string;
  color?: string;
  variant?: string;
  button_label?: string;
  outgoing_transitions?: TransitionItem[];
}

// ─── Helpers ───

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value / 100;
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

function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(dateStr));
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

function getPaymentStatusVariant(status: string): "warning" | "info" | "success" | "danger" | "neutral" {
  const map: Record<string, "warning" | "info" | "success" | "danger" | "neutral"> = {
    pending: "warning",
    processing: "info",
    completed: "success",
    cancelled: "danger",
    refunded: "neutral",
    shipped: "info",
    delivered: "success",
    paid: "success",
    failed: "danger",
  };
  return map[status] ?? "neutral";
}

function getPaymentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Pendente",
    paid: "Pago",
    failed: "Falhou",
    refunded: "Reembolsado",
    authorized: "Autorizado",
  };
  return map[status] ?? status;
}

const transactionLabels: Record<string, string> = {
  status_change: "Status alterado",
  payment: "Pagamento processado",
  shipping: "Envio atualizado",
  note: "Observação",
  refund: "Reembolso",
};

function transactionIcon(type: string) {
  switch (type) {
    case "status_change": return <Clock size={14} />;
    case "payment": return <CreditCard size={14} />;
    case "shipping": return <Truck size={14} />;
    case "note": return <FileText size={14} />;
    default: return <Package size={14} />;
  }
}

// ─── Card wrapper ───

function Card({ title, icon, children, className = "" }: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-surface border border-border rounded-xl p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-text uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Main ───

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const response = await api.get(`/orders/${id}`);
      return response.data as OrderDetailData;
    },
    enabled: !!id,
  });

  const { data: statusesData } = useQuery({
    queryKey: ["order-statuses"],
    queryFn: async () => {
      const response = await api.get("/order-statuses");
      return (response.data?.data ?? response.data ?? []) as OrderStatusOption[];
    },
  });
  const statuses: OrderStatusOption[] = statusesData ?? [];

  const updateStatusMutation = useMutation({
    mutationFn: async ({ statusId }: { statusId: number }) => {
      const response = await api.put(`/orders/${id}/status`, { status_id: statusId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  if (isLoading || !order) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  const address = order.shipping_address;
  const customer = order.customer;
  const payment = order.payments?.[0];
  const currentStatus = order.status;
  const currentStatusWithTransitions = statuses.find(s => s.id === currentStatus?.id);
  const allowedNextStatuses = (currentStatusWithTransitions?.outgoing_transitions ?? [])
    .map(t => t.to_status)
    .filter(Boolean) as OrderStatusOption[];

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/orders")}
            className="p-2 rounded-lg hover:bg-bg text-text-muted hover:text-text transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-text">Pedido #{order.number}</h1>
              {currentStatus && (
                <Badge variant={(currentStatus.variant as "success" | "warning" | "danger" | "info" | "neutral") || "neutral"}> 
                  {currentStatus.name}
                </Badge>
              )}
            </div>
            <p className="text-text-muted text-sm mt-1">
              Realizado em {formatDate(order.created_at)}
              {customer && <span> · Cliente: {customer.name}</span>}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {allowedNextStatuses.map(s => {
            const isCancel = s.slug === "cancelled";
            const label = isCancel ? "Cancelar" : (s.button_label || s.name);
            const color = s.color || "#6b7280";
            return (
              <button
                key={s.id}
                onClick={() => updateStatusMutation.mutate({ statusId: s.id })}
                disabled={updateStatusMutation.isPending}
                className="px-3 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  borderColor: isCancel ? undefined : color + "40",
                  color: color,
                }}
                onMouseEnter={e => { if (!isCancel) e.currentTarget.style.backgroundColor = color + "0D"; }}
                onMouseLeave={e => { if (!isCancel) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                {label}
              </button>
            );
          })}
          {allowedNextStatuses.length === 0 && currentStatus && (
            <span className="text-sm text-text-muted">Sem transições disponíveis</span>
          )}
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column (70%) */}
        <div className="lg:w-[70%] space-y-6">
          {/* Products */}
          <Card title="Produtos do Pedido" icon={<ShoppingCart size={16} className="text-text-muted" />}>
            <div className="divide-y divide-border -mx-5">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-start gap-4 px-5 py-4">
                  <div className="w-12 h-12 rounded-lg bg-bg border border-border flex items-center justify-center shrink-0">
                    <Package size={20} className="text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text">{item.name_snapshot}</p>
                    {item.sku_snapshot && (
                      <p className="text-xs text-text-muted mt-0.5">SKU: {item.sku_snapshot}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-text-muted">Qtd: {item.quantity}</p>
                    <p className="text-xs text-text-muted">Unitário: {formatCurrency(item.price)}</p>
                    <p className="text-sm font-semibold text-text mt-0.5">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-border mt-2 pt-4 px-5 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Subtotal</span>
                <span className="text-text">{formatCurrency(order.subtotal)}</span>
              </div>
              {parseFloat(order.discount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Desconto</span>
                  <span className="text-danger-500">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-muted">Frete</span>
                <span className="text-text">{formatCurrency(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border font-semibold">
                <span className="text-text">Total</span>
                <span className="text-text text-base">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card title="Histórico do Pedido" icon={<Clock size={16} className="text-text-muted" />}>
            {order.transactions.length === 0 ? (
              <p className="text-sm text-text-muted">Nenhum evento registrado.</p>
            ) : (
              <div className="space-y-0">
                {order.transactions.map((tx, i) => {
                  const isLast = i === order.transactions.length - 1;
                  return (
                    <div key={tx.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                          {transactionIcon(tx.type)}
                        </div>
                        {!isLast && <div className="w-px flex-1 bg-border my-1" />}
                      </div>
                      <div className={`pb-4 ${isLast ? "" : ""}`}>
                        <p className="text-sm font-medium text-text">
                          {transactionLabels[tx.type] ?? tx.type}
                        </p>
                        {tx.data && Object.keys(tx.data).length > 0 && (
                          <p className="text-xs text-text-muted mt-0.5">
                            {typeof tx.data === "object" ? JSON.stringify(tx.data) : String(tx.data)}
                          </p>
                        )}
                        <p className="text-xs text-text-muted mt-1">
                          {formatDateTime(tx.created_at)}
                          {tx.user?.name && <span> · {tx.user.name}</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Payment */}
          <Card title="Pagamento" icon={<CreditCard size={16} className="text-text-muted" />}>
            {payment ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-text-muted mb-0.5">Método</p>
                    <p className="text-sm font-medium text-text capitalize">{payment.method}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-0.5">Gateway</p>
                    <p className="text-sm text-text">{payment.gateway}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-0.5">Status</p>
                    <Badge variant={getPaymentStatusVariant(payment.status)}>
                      {getPaymentStatusLabel(payment.status)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-0.5">ID Transação</p>
                    <p className="text-sm font-mono text-text text-xs">{payment.transaction_id || "—"}</p>
                  </div>
                  {payment.paid_at && (
                    <div>
                      <p className="text-xs text-text-muted mb-0.5">Pago em</p>
                      <p className="text-sm text-text">{formatDate(payment.paid_at)}</p>
                    </div>
                  )}
                </div>

                {/* PIX details */}
                {payment.metadata?.pix_code && (
                  <div className="mt-3 p-3 bg-bg rounded-lg">
                    <p className="text-xs text-text-muted mb-1">Código PIX (copia e cola)</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-text font-mono break-all flex-1">
                        {String(payment.metadata.pix_code).slice(0, 60)}...
                      </p>
                      <button
                        onClick={() => copyToClipboard(String(payment.metadata.pix_code))}
                        className="p-1 rounded hover:bg-border/50 text-text-muted hover:text-text shrink-0"
                        title="Copiar código"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Boleto details */}
                {payment.metadata?.boleto_digitable_line && (
                  <div className="mt-3 p-3 bg-bg rounded-lg">
                    <p className="text-xs text-text-muted mb-1">Linha digitável</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-text font-mono break-all flex-1">
                        {String(payment.metadata.boleto_digitable_line)}
                      </p>
                      <button
                        onClick={() => copyToClipboard(String(payment.metadata.boleto_digitable_line))}
                        className="p-1 rounded hover:bg-border/50 text-text-muted hover:text-text shrink-0"
                        title="Copiar linha digitável"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    {payment.metadata?.boleto_url && (
                      <a
                        href={String(payment.metadata.boleto_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Visualizar boleto
                      </a>
                    )}
                  </div>
                )}

                {/* Credit card details */}
                {payment.metadata?.payment_data && typeof payment.metadata.payment_data === "object" && Object.keys(payment.metadata.payment_data as object).length > 0 && (
                  <div className="mt-3 p-3 bg-bg rounded-lg">
                    <p className="text-xs text-text-muted mb-1">Dados do cartão</p>
                    <div className="space-y-1">
                      {payment.metadata.payment_data.card_name && (
                        <p className="text-sm text-text">Titular: {String(payment.metadata.payment_data.card_name)}</p>
                      )}
                      {payment.metadata.payment_data.installments && (
                        <p className="text-sm text-text">
                          Parcelas: {String(payment.metadata.payment_data.installments)}x
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-muted">Nenhum pagamento registrado.</p>
            )}
          </Card>

          {/* Notes */}
          <Card title="Observações" icon={<FileText size={16} className="text-text-muted" />}>
            {order.notes ? (
              <p className="text-sm text-text whitespace-pre-wrap">{order.notes}</p>
            ) : (
              <p className="text-sm text-text-muted italic">Nenhuma observação registrada.</p>
            )}
          </Card>
        </div>

        {/* Right column (30%) */}
        <div className="lg:w-[30%] space-y-6">
          {/* Customer */}
          <Card title="Cliente" icon={<User size={16} className="text-text-muted" />}>
            {customer ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-text">{customer.name}</p>
                  {customer.document && (
                    <p className="text-xs text-text-muted mt-0.5 font-mono">{customer.document}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Mail size={14} />
                  <span className="truncate">{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Phone size={14} />
                    <span>{customer.phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-muted italic">Cliente não identificado (guest).</p>
            )}
          </Card>

          {/* Shipping address */}
          <Card title="Endereço de Entrega" icon={<MapPin size={16} className="text-text-muted" />}>
            {address ? (
              <div className="text-sm text-text space-y-0.5">
                {customer && <p className="font-medium mb-1">{customer.name}</p>}
                <p>{address.street}, {address.number}</p>
                {address.complement && <p>{address.complement}</p>}
                <p>{address.neighborhood}</p>
                <p>{address.city} - {address.state}</p>
                <p className="font-mono text-text-muted">{address.zip_code}</p>
              </div>
            ) : (
              <p className="text-sm text-text-muted italic">Endereço não informado.</p>
            )}
          </Card>

          {/* Shipping info */}
          <Card title="Informações de Frete" icon={<Truck size={16} className="text-text-muted" />}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Método</span>
                <span className="text-text">{order.shipping_method || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Valor</span>
                <span className="text-text">{formatCurrency(order.shipping_cost)}</span>
              </div>
            </div>
          </Card>

          {/* Financial summary — sticky */}
          <div className="bg-surface border border-border rounded-xl p-5 lg:sticky lg:top-6">
            <h3 className="text-sm font-semibold text-text uppercase tracking-wider mb-4">Resumo Financeiro</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Produtos</span>
                <span className="text-text">{formatCurrency(order.subtotal)}</span>
              </div>
              {parseFloat(order.discount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Desconto</span>
                  <span className="text-danger-500">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-muted">Frete</span>
                <span className="text-text">{formatCurrency(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border">
                <span className="font-semibold text-text">Total</span>
                <span className="font-bold text-text text-base">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
