import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import React, { useEffect, useState, Suspense } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { TenantProvider } from "./hooks/useTenant";

// Lazy load all page components
const LandingPage = React.lazy(() => import("./pages/LandingPage"));
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const RegisterPage = React.lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = React.lazy(() => import("./pages/ForgotPasswordPage"));
const PublicStore = React.lazy(() => import("./pages/PublicStore"));
const ProductPage = React.lazy(() => import("./pages/store/ProductPage"));

const AdminLayout = React.lazy(() => import("./pages/admin/AdminLayout").then(module => ({ default: module.AdminLayout })));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard").then(module => ({ default: module.AdminDashboard })));
const Niches = React.lazy(() => import("./pages/admin/Niches").then(module => ({ default: module.Niches })));
const AdminCatalogs = React.lazy(() => import("./pages/admin/Catalogs").then(module => ({ default: module.Catalogs })));
const AdminCategories = React.lazy(() => import("./pages/admin/Categories").then(module => ({ default: module.Categories })));
const AdminProducts = React.lazy(() => import("./pages/admin/Products").then(module => ({ default: module.Products })));
const Resellers = React.lazy(() => import("./pages/admin/Resellers").then(module => ({ default: module.Resellers })));

const ResellerLayout = React.lazy(() => import("./pages/reseller/ResellerLayout").then(module => ({ default: module.ResellerLayout })));
const ResellerDashboard = React.lazy(() => import("./pages/reseller/Dashboard").then(module => ({ default: module.Dashboard })));
const ResellerCatalogs = React.lazy(() => import("./pages/reseller/Catalogs").then(module => ({ default: module.Catalogs })));
const ResellerProducts = React.lazy(() => import("./pages/reseller/Products").then(module => ({ default: module.Products })));
const ResellerOrders = React.lazy(() => import("./pages/reseller/Orders").then(module => ({ default: module.Orders })));
const ResellerSettings = React.lazy(() => import("./pages/reseller/StoreSettings").then(module => ({ default: module.StoreSettings })));
const CustomDomain = React.lazy(() => import("./pages/reseller/CustomDomain").then(module => ({ default: module.CustomDomain })));
const ResellerWelcome = React.lazy(() => import("./pages/reseller/ResellerWelcome"));
const Analytics = React.lazy(() => import("./pages/reseller/Analytics"));
const ResellerCustomers = React.lazy(() => import("./pages/ResellerCustomers"));
const OrderConfirmedPage = React.lazy(() => import("./pages/store/OrderConfirmedPage"));
const CategoryPage = React.lazy(() => import("./pages/store/CategoryPage"));

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
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>}>
            <Routes>
              <Route path="/product/:productId" element={<ProductPage />} />
              <Route path="/categoria/:categoryId" element={<CategoryPage />} />
              <Route path="/order-confirmed/:orderId" element={<OrderConfirmedPage />} />
              <Route path="/*" element={<PublicStore />} />
            </Routes>
          </Suspense>
        </Router>
      </TenantProvider>
    );
  }

  return (
    <Router>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>}>
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
      </Suspense>
    </Router>
  );
}

// Helper to extract slug from URL and pass to TenantProvider
import { useParams } from "react-router-dom";
function TenantProviderWrapper({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  return <TenantProvider slug={slug}>{children}</TenantProvider>;
}
