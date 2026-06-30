import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  Layers,
  ShoppingCart,
  Percent,
  Users,
  FileText,
  Image as ImageIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
  BoxesIcon,
  Building2,
  LogOut,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface NavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Principal",
    items: [{ label: "Dashboard", path: "/", icon: LayoutDashboard }],
  },
  {
    title: "Catálogo",
    items: [
      { label: "Produtos", path: "/products", icon: Package },
      { label: "Categorias", path: "/categories", icon: Tags },
      { label: "Marcas", path: "/brands", icon: BoxesIcon },
      { label: "Atributos", path: "/attributes", icon: Layers },
    ],
  },
  {
    title: "Vendas",
    items: [
      { label: "Pedidos", path: "/orders", icon: ShoppingCart },
      { label: "Cupons", path: "/coupons", icon: Percent },
      { label: "Clientes", path: "/customers", icon: Users },
    ],
  },
  {
    title: "Conteúdo",
    items: [
      { label: "Páginas", path: "/pages", icon: FileText },
      { label: "Mídias", path: "/media", icon: ImageIcon },
    ],
  },
  {
    title: "Configurações",
    items: [{ label: "Ajustes", path: "/settings", icon: Settings }],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const { tenant, tenants, selectTenant, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    if (isMobile && mobileOpen) {
      onMobileClose();
    }
  }, [location.pathname]);

  const sidebarContent = (
    <div className={`flex flex-col h-full bg-primary-950 text-white ${collapsed ? "w-16" : "w-64"} transition-all duration-300`}>
      {/* Logo + collapse toggle */}
      <div className="flex items-center h-16 px-4 border-b border-primary-800/50 shrink-0">
        {!collapsed && (
          <span className="text-xl font-bold tracking-tight animate-fade-in">Njord</span>
        )}
        {collapsed && (
          <span className="text-xl font-bold tracking-tight mx-auto">N</span>
        )}
        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            className="ml-auto p-1.5 rounded-lg hover:bg-primary-800 transition-colors text-primary-300"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Collapse toggle when not at top */}
      <div className="flex justify-end px-2 py-1">
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded hover:bg-primary-800 transition-colors text-primary-300"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-6">
        {navGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-primary-400 uppercase tracking-wider">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => isMobile && onMobileClose()}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                        isActive
                          ? "bg-primary-600 text-white shadow-sm"
                          : "text-primary-200 hover:bg-primary-800 hover:text-white"
                      } ${collapsed ? "justify-center px-2" : ""}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={20} />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom section: Tenant info + Logout */}
      <div className="border-t border-primary-800/50 p-3 shrink-0">
        {/* Tenant indicator */}
        {tenant && !collapsed && (
          <div className="flex items-center gap-2 px-1 mb-2 text-xs text-primary-300">
            <Building2 size={14} />
            <span className="truncate">{tenant.name}</span>
            {tenants.length > 1 && (
              <button
                onClick={() => {
                  // Switch to next tenant for demo
                  const idx = tenants.findIndex((t) => t.id === tenant.id);
                  const next = tenants[(idx + 1) % tenants.length];
                  selectTenant(next);
                  window.location.reload();
                }}
                className="ml-auto text-primary-400 hover:text-white transition-colors"
                title="Trocar loja"
              >
                <ChevronRight size={12} />
              </button>
            )}
          </div>
        )}
        {tenant && collapsed && (
          <div className="flex justify-center mb-2">
            <div className="w-6 h-6 rounded bg-primary-600 flex items-center justify-center text-xs font-semibold" title={tenant.name}>
              {tenant.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Logout button */}
        <button
          onClick={logout}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-primary-300 hover:bg-danger-500/10 hover:text-danger-400 transition-colors text-sm w-full ${collapsed ? "justify-center px-2" : ""}`}
          title="Sair"
        >
          <LogOut size={16} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/50 animate-fade-in"
              onClick={onMobileClose}
            />
            <div className="relative z-50 animate-slide-in-left h-full">
              {sidebarContent}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <aside className="hidden md:block shrink-0 h-screen sticky top-0">
      {sidebarContent}
    </aside>
  );
}
