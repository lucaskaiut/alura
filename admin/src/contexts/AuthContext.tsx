import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import api from "../lib/api";

interface User {
  id: number;
  name: string;
  email: string;
  status: boolean;
}

interface TenantInfo {
  id: number;
  name: string;
  subdomain: string;
  logo_path?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  tenant: TenantInfo | null;
  tenants: TenantInfo[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<TenantInfo[]>;
  selectTenant: (tenant: TenantInfo) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("admin_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("admin_token")
  );
  const [tenant, setTenant] = useState<TenantInfo | null>(() => {
    const stored = localStorage.getItem("admin_tenant");
    return stored ? JSON.parse(stored) : null;
  });
  const [tenants, setTenants] = useState<TenantInfo[]>(() => {
    const stored = localStorage.getItem("admin_tenants");
    return stored ? JSON.parse(stored) : [];
  });

  const login = useCallback(async (email: string, password: string): Promise<TenantInfo[]> => {
    const response = await api.post("/auth/login", { email, password });
    const { token: newToken, user: newUser, tenants: userTenants } = response.data;

    localStorage.setItem("admin_token", newToken);
    localStorage.setItem("admin_user", JSON.stringify(newUser));
    localStorage.setItem("admin_tenants", JSON.stringify(userTenants));

    setToken(newToken);
    setUser(newUser);
    setTenants(userTenants);

    // Auto-select if only one tenant
    if (userTenants.length === 1) {
      localStorage.setItem("admin_tenant", JSON.stringify(userTenants[0]));
      setTenant(userTenants[0]);
    }

    return userTenants;
  }, []);

  const selectTenant = useCallback((t: TenantInfo) => {
    localStorage.setItem("admin_tenant", JSON.stringify(t));
    setTenant(t);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("admin_tenant");
    localStorage.removeItem("admin_tenants");
    setToken(null);
    setUser(null);
    setTenant(null);
    setTenants([]);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tenant,
        tenants,
        isAuthenticated: !!token && !!user && !!tenant,
        login,
        selectTenant,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
