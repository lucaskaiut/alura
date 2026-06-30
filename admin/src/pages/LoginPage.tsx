import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn, Eye, EyeOff, Building2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, selectTenant, tenants, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Already authenticated with tenant selected → redirect
  if (isAuthenticated) {
    navigate("/", { replace: true });
    return null;
  }

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setLoading(true);
    try {
      await login(data.email, data.password);
      // If single tenant, login() auto-selects and isAuthenticated becomes true
      // If multiple tenants, user stays here to pick
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Credenciais inválidas.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTenant = (t: { id: number; name: string; subdomain: string; logo_path?: string | null }) => {
    selectTenant(t);
    navigate("/", { replace: true });
  };

  // Tenant selector screen (user logged in but no tenant selected)
  if (tenants.length > 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-950 p-4">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="text-center mb-6">
            <Building2 size={32} className="mx-auto text-primary-400 mb-2" />
            <h2 className="text-xl font-semibold text-white">Selecione a loja</h2>
            <p className="text-primary-300 text-sm mt-1">Escolha qual loja deseja gerenciar</p>
          </div>

          <div className="space-y-2">
            {tenants.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectTenant(t)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white text-left transition-colors border border-white/10 hover:border-primary-500/50"
              >
                <div className="w-8 h-8 rounded bg-primary-600 flex items-center justify-center text-sm font-semibold shrink-0">
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-primary-300">{t.subdomain}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Login form (not yet authenticated)
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-950 p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Njord</h1>
          <p className="text-primary-300 mt-1 text-sm">Painel administrativo</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-surface rounded-xl shadow-xl p-6 space-y-4"
        >
          {error && (
            <div className="bg-danger-500/10 border border-danger-500/20 text-danger-700 text-sm rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              placeholder="seu@email.com"
            />
            {errors.email && (
              <p className="text-danger-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                {...register("password")}
                className="w-full px-3 py-2 pr-10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-danger-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <LogIn size={16} />
            )}
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
