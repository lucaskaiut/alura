import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import api from "../lib/api";
import DataTable, { type Column } from "../components/ui/DataTable";
import Modal from "../components/ui/Modal";

interface Customer {
  id: number;
  name: string;
  email: string;
  document: string | null;
  phone: string | null;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateStr));
}

export default function CustomersPage() {
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await api.get("/customers");
      return response.data;
    },
  });

  const customers: Customer[] = apiData?.data ?? [];

  const columns: Column<Customer>[] = [
    { key: "name", label: "Nome", priority: 1 },
    { key: "email", label: "Email", priority: 2 },
    {
      key: "phone",
      label: "Telefone",
      priority: 3,
      render: (item) => item.phone || "—",
    },
    { key: "total_orders", label: "Pedidos", priority: 2 },
    {
      key: "total_spent",
      label: "Total Gasto",
      priority: 2,
      render: (item) => formatCurrency(item.total_spent),
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
              setViewCustomer(item);
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
        <h1 className="text-2xl font-bold text-text">Clientes</h1>
        <p className="text-text-muted text-sm mt-1">Gerencie os clientes da loja</p>
      </div>

      <DataTable columns={columns} data={customers} isLoading={isLoading} />

      <Modal open={!!viewCustomer} onClose={() => setViewCustomer(null)} title="Detalhes do Cliente" size="md">
        {viewCustomer && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-text-muted mb-1">Nome</p>
              <p className="text-sm font-medium text-text">{viewCustomer.name}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Email</p>
              <p className="text-sm text-text">{viewCustomer.email}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Telefone</p>
              <p className="text-sm text-text">{viewCustomer.phone || "Não informado"}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Documento</p>
              <p className="text-sm text-text">{viewCustomer.document || "Não informado"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-muted mb-1">Total de Pedidos</p>
                <p className="text-sm font-medium text-text">{viewCustomer.total_orders}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Total Gasto</p>
                <p className="text-sm font-medium text-text">{formatCurrency(viewCustomer.total_spent)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Cliente desde</p>
              <p className="text-sm text-text">{formatDate(viewCustomer.created_at)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
