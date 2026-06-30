import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Save } from "lucide-react";
import api from "../lib/api";

const settingsSchema = z.object({
  store_name: z.string().min(1, "Nome da loja é obrigatório"),
  store_email: z.string().email("Email inválido"),
  store_phone: z.string().optional().nullable(),
  store_address: z.string().optional().nullable(),
  currency: z.string().min(1),
  language: z.string().min(1),
  timezone: z.string().min(1),
  tenant_domain: z.string().min(1, "Domínio é obrigatório"),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      store_name: "",
      store_email: "",
      store_phone: "",
      store_address: "",
      currency: "BRL",
      language: "pt-BR",
      timezone: "America/Sao_Paulo",
      tenant_domain: localStorage.getItem("tenant_domain") || "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      const response = await api.put("/settings", data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      localStorage.setItem("tenant_domain", variables.tenant_domain);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const onSubmit = (data: SettingsForm) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Ajustes</h1>
        <p className="text-text-muted text-sm mt-1">Configure as preferências da loja</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-text uppercase tracking-wider">Informações da Loja</h2>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Nome da Loja</label>
            <input
              type="text"
              {...register("store_name")}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
            />
            {errors.store_name && <p className="text-danger-500 text-xs mt-1">{errors.store_name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Email</label>
              <input
                type="email"
                {...register("store_email")}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              />
              {errors.store_email && <p className="text-danger-500 text-xs mt-1">{errors.store_email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Telefone</label>
              <input
                type="text"
                {...register("store_phone")}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Endereço</label>
            <input
              type="text"
              {...register("store_address")}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
            />
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-text uppercase tracking-wider">Regional</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Moeda</label>
              <select
                {...register("currency")}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors bg-surface"
              >
                <option value="BRL">BRL - Real Brasileiro</option>
                <option value="USD">USD - Dólar Americano</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Idioma</label>
              <select
                {...register("language")}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors bg-surface"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Fuso Horário</label>
            <select
              {...register("timezone")}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors bg-surface"
            >
              <option value="America/Sao_Paulo">America/Sao_Paulo (Brasília)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-text uppercase tracking-wider">Tenant</h2>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Domínio do Tenant</label>
            <input
              type="text"
              {...register("tenant_domain")}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              placeholder="minhaloja"
            />
            {errors.tenant_domain && <p className="text-danger-500 text-xs mt-1">{errors.tenant_domain.message}</p>}
            <p className="text-text-muted text-xs mt-1">Usado no cabeçalho X-Tenant-Domain das requisições</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-sm text-success-500 animate-fade-in">Configurações salvas!</span>
          )}
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
