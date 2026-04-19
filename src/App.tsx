import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

// Auth
import SignIn from "./pages/auth/SignIn";

// Dashboard
import Dashboard from "./pages/dashboard/Dashboard";

// Catalog
import Products from "./pages/products/Products";
import ProductDetail from "./pages/products/ProductDetail";
import Categories from "./pages/categories/Categories";
import Brands from "./pages/brands/Brands";

// Orders
import Orders from "./pages/orders/Orders";
import OrderDetail from "./pages/orders/OrderDetail";

// Users & Riders
import Users from "./pages/users/Users";
import Riders from "./pages/riders/Riders";
import Customers from "./pages/customers/Customers";

// Inventory
import Inventory from "./pages/inventory/Inventory";

// Analytics & Reports
import Analytics from "./pages/analytics/Analytics";
import Reports from "./pages/reports/Reports";

// Content
import Reviews from "./pages/reviews/Reviews";
import Banners from "./pages/banners/Banners";
import Promotions from "./pages/promotions/Promotions";
import Discounts from "./pages/discounts/Discounts";
import MediaLibrary from "./pages/media/MediaLibrary";

// Settings
import Cities from "./pages/cities/Cities";
import AppConfig from "./pages/config/AppConfig";
import Profile from "./pages/profile/Profile";

import NotFound from "./pages/OtherPage/NotFound";

function ProtectedRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div></div>
  if (!user) return <Navigate to="/signin" replace />
  return (
    <AppLayout />
  )
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/new" element={<ProductDetail />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/users" element={<Users />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/riders" element={<Riders />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/discounts" element={<Discounts />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/banners" element={<Banners />} />
          <Route path="/media" element={<MediaLibrary />} />
          <Route path="/cities" element={<Cities />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/config" element={<AppConfig />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <AppRoutes />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
