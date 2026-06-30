import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, DollarSign, TrendingUp, Package } from "lucide-react";
import api from "../lib/api";

interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  average_ticket: number;
  products_sold: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function StatSkeleton() {
  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <div className="skeleton h-10 w-10 rounded-lg mb-4" />
      <div className="skeleton h-4 w-24 mb-2" />
      <div className="skeleton h-8 w-32" />
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const response = await api.get("/dashboard/stats");
      return response.data;
    },
  });

  const cards = [
    {
      label: "Total de Pedidos",
      value: stats ? String(stats.total_orders) : "0",
      icon: ShoppingCart,
      color: "text-primary-500",
      bg: "bg-primary-50",
    },
    {
      label: "Receita Total",
      value: stats ? formatCurrency(stats.total_revenue) : "R$ 0,00",
      icon: DollarSign,
      color: "text-success-500",
      bg: "bg-success-500/10",
    },
    {
      label: "Ticket Médio",
      value: stats ? formatCurrency(stats.average_ticket) : "R$ 0,00",
      icon: TrendingUp,
      color: "text-warning-500",
      bg: "bg-warning-500/10",
    },
    {
      label: "Produtos Vendidos",
      value: stats ? String(stats.products_sold) : "0",
      icon: Package,
      color: "text-primary-700",
      bg: "bg-primary-100",
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">Visão geral da sua loja</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-surface rounded-xl border border-border p-6 hover:shadow-md transition-shadow"
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.bg} mb-4`}>
                  <Icon size={20} className={card.color} />
                </div>
                <p className="text-sm text-text-muted mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-text">{card.value}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
