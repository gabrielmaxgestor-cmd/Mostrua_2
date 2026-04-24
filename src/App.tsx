import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { TenantProvider } from "./hooks/useTenant";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import PublicStore from "./pages/PublicStore";
import ProductPage from "./pages/store/ProductPage";

import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { Niches } from "./pages/admin/Niches";
import { Catalogs as AdminCatalogs } from "./pages/admin/Catalogs";
import { Categories as AdminCategories } from "./pages/admin/Categories";
import { Products as AdminProducts } from "./pages/admin/Products";
import { Resellers } from "./pages/admin/Resellers";

import { ResellerLayout } from "./pages/reseller/ResellerLayout";
import { Dashboard as ResellerDashboard } from "./pages/reseller/Dashboard";
import { Catalogs as ResellerCatalogs } from "./pages/reseller/Catalogs";
import { Products as ResellerProducts } from "./pages/reseller/Products";
import { Orders as ResellerOrders } from "./pages/reseller/Orders";
import { StoreSettings as ResellerSettings } from "./pages/reseller/StoreSettings";
import { CustomDomain } from "./pages/reseller/CustomDomain";
import ResellerWelcome from "./pages/reseller/ResellerWelcome";
import Analytics from "./pages/reseller/Analytics";
import { ResellerCustomers } from "./pages/ResellerCustomers";
import OrderConfirmedPage from "./pages/store/OrderConfirmedPage";
import CategoryPage from "./pages/store/CategoryPage";

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const tokenResult = await u.getIdTokenResult(true);
          const snap = await getDoc(doc(db, "users", u.uid));
          const userRole = tokenResult.claims.admin ? "admin" : (snap.data()?.role || null);
          setRole(userRole);
        } catch (error) {
          console.error("Error getting user claims:", error);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const host = window.location.hostname;
  const isMainDomain = host.includes('localhost') || host.includes('vercel.app') || host.includes('run.app');

  if (!isMainDomain) {
    return (
      <TenantProvider>
        <Router>
          <Routes>
            <Route path="/product/:productId" element={<ProductPage />} />
            <Route path="/categoria/:categoryId" element={<CategoryPage />} />
            <Route path="/order-confirmed/:orderId" element={<OrderConfirmedPage />} />
            <Route path="/*" element={<PublicStore />} />
          </Routes>
        </Router>
      </TenantProvider>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="niches" element={<Niches />} />
          <Route path="catalogs" element={<AdminCatalogs />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="resellers" element={<Resellers />} />
        </Route>

        <Route path="/reseller/welcome" element={<ProtectedRoute requiredRole="reseller"><ResellerWelcome /></ProtectedRoute>} />

        <Route path="/dashboard" element={<ProtectedRoute requiredRole="reseller"><ResellerLayout /></ProtectedRoute>}>
          <Route index element={<ResellerDashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="customers" element={<ResellerCustomers />} />
          <Route path="store" element={<ResellerSettings />} />
          <Route path="domain" element={<CustomDomain />} />
          <Route path="catalogs" element={<ResellerCatalogs />} />
          <Route path="products" element={<ResellerProducts />} />
          <Route path="orders" element={<ResellerOrders />} />
        </Route>

        <Route path="/store/:slug/product/:productId" element={<TenantProviderWrapper><ProductPage /></TenantProviderWrapper>} />
        <Route path="/store/:slug/categoria/:categoryId" element={<TenantProviderWrapper><CategoryPage /></TenantProviderWrapper>} />
        <Route path="/store/:slug/order-confirmed/:orderId" element={<TenantProviderWrapper><OrderConfirmedPage /></TenantProviderWrapper>} />
        <Route path="/store/:slug/*" element={<TenantProviderWrapper><PublicStore /></TenantProviderWrapper>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// Helper to extract slug from URL and pass to TenantProvider
import { useParams } from "react-router-dom";
function TenantProviderWrapper({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  return <TenantProvider slug={slug}>{children}</TenantProvider>;
}
