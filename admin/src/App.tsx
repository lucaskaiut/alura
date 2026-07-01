import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./contexts/AuthContext";
import DashboardLayout from "./components/layout/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CategoriesPage from "./pages/CategoriesPage";
import BrandsPage from "./pages/BrandsPage";
import ProductsPage from "./pages/ProductsPage";
import ProductFormPage from "./pages/ProductFormPage";
import AttributesPage from "./pages/AttributesPage";
import CustomersPage from "./pages/CustomersPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import OrderStatusesPage from "./pages/OrderStatusesPage";
import CouponsPage from "./pages/CouponsPage";
import PagesPage from "./pages/PagesPage";
import PageFormPage from "./pages/PageFormPage";
import MediaPage from "./pages/MediaPage";
import MenuPage from "./pages/MenuPage";
import SettingsPage from "./pages/SettingsPage";
import ShippingRulesPage from "./pages/ShippingRulesPage";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/brands" element={<BrandsPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/new" element={<ProductFormPage />} />
              <Route path="/products/:id/edit" element={<ProductFormPage />} />
              <Route path="/attributes" element={<AttributesPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage />} />
              <Route path="/order-statuses" element={<OrderStatusesPage />} />
              <Route path="/coupons" element={<CouponsPage />} />
              <Route path="/pages" element={<PagesPage />} />
              <Route path="/pages/new" element={<PageFormPage />} />
              <Route path="/pages/:id/edit" element={<PageFormPage />} />
              <Route path="/media" element={<MediaPage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/shipping-rules" element={<ShippingRulesPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
