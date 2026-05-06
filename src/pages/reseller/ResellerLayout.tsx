import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Store, 
  Layers, 
  Package, 
  ShoppingCart, 
  LogOut, 
  Menu, 
  X,
  Globe,
  Bell,
  Check,
  BarChart3,
  Users,
  Eye,
  HeadphonesIcon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useReseller } from "../../hooks/useReseller";
import { useOrders } from "../../hooks/useOrders";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { AppNotification } from "../../types";
import { notificationService } from "../../services/notificationService";
import { motion, AnimatePresence } from "motion/react";

export const ResellerLayout: React.FC = () => {
  const { user, logout, subscription } = useAuth();
  const { reseller } = useReseller(user?.uid);
  const { orders } = useOrders(user?.uid);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const isExpired = subscription && subscription.status !== 'active' && subscription.status !== 'trial';

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "notifications"), 
      where("resellerId", "==", user.uid), 
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification)));
    });
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (subscription && subscription.status !== 'active' && subscription.status !== 'trial') {
      if (location.pathname !== '/dashboard/plans') {
        navigate('/dashboard/plans', { state: { message: "Seu periodo de teste encerrou. Escolha um plano para continuar." } });
      }
    }
  }, [subscription, navigate, location.pathname]);

  const pendingOrdersCount = orders.filter(o => o.status === "pending").length;

  const trialDaysLeft = subscription?.status === 'trial' && subscription.currentPeriodEnd
    ? Math.ceil((subscription.currentPeriodEnd.toDate().getTime() - Date.now()) / 86400000)
    : null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const menuItems = [
    { path: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
    { path: "/dashboard/store", icon: <Store className="w-5 h-5" />, label: "Minha Loja" },
    { path: "/dashboard/preview", icon: <Eye className="w-5 h-5" />, label: "Prévia da Loja" },
    { path: "/dashboard/catalogs", icon: <Layers className="w-5 h-5" />, label: "Catálogos" },
    { path: "/dashboard/products", icon: <Package className="w-5 h-5" />, label: "Produtos" },
    { path: "/dashboard/analytics", icon: <BarChart3 className="w-5 h-5" />, label: "Analytics" },
    { 
      path: "/dashboard/orders", 
      icon: <ShoppingCart className="w-5 h-5" />, 
      label: "Pedidos",
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined
    },
    { path: "/dashboard/customers", icon: <Users className="w-5 h-5" />, label: "Clientes" },
    { path: "/dashboard/domain", icon: <Globe className="w-5 h-5" />, label: "Domínio" },
    { path: "/dashboard/support", icon: <HeadphonesIcon className="w-5 h-5" />, label: "Suporte" },
  ];

  const primaryColor = reseller?.settings?.primaryColor || "#2563eb";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {isExpired && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 text-center">
          <span className="text-red-700 text-sm font-medium">
            Sua assinatura esta inativa. Sua loja esta offline para novos pedidos.
          </span>
          <Link to="/dashboard/plans" className="ml-2 text-red-700 font-bold underline">Renovar agora</Link>
        </div>
      )}
      {trialDaysLeft !== null && trialDaysLeft > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800 z-50">
          Voce esta no periodo de teste. <strong>{trialDaysLeft} dias restantes</strong>.
          <Link to="/dashboard/plans" className="ml-2 underline font-bold">Assinar agora</Link>
        </div>
      )}
      <div className="flex flex-1">
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:transform-none flex flex-col ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 truncate">
            {reseller?.settings?.logo ? (
              <img src={reseller.settings.logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain p-0.5" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: primaryColor }}>
                {reseller?.storeName?.charAt(0).toUpperCase() || "L"}
              </div>
            )}
            <span className="font-bold text-gray-900 truncate">{reseller?.storeName || "Minha Loja"}</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive 
                    ? "text-white" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
                style={isActive ? { backgroundColor: primaryColor } : {}}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </div>
                {item.badge !== undefined && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-8 shrink-0">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">Notificações</h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={() => {
                            if (user?.uid) notificationService.markAllAsRead(user.uid);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Ler todas
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 flex flex-col items-center gap-2">
                          <Bell className="w-8 h-8 text-gray-300" />
                          <p className="text-sm">Nenhuma notificação</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {notifications.map(notif => (
                            <div 
                              key={notif.id} 
                              className={`p-4 transition-colors hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-blue-50/30' : ''}`}
                              onClick={() => {
                                if (!notif.read) notificationService.markAsRead(notif.id);
                                if (notif.link) {
                                  navigate(notif.link);
                                  setIsNotificationsOpen(false);
                                }
                              }}
                            >
                              <div className="flex gap-3">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!notif.read ? 'bg-blue-600' : 'bg-transparent'}`} />
                                <div>
                                  <p className={`text-sm ${!notif.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                    {notif.title}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                    {notif.message}
                                  </p>
                                  {notif.createdAt && (
                                    <p className="text-[10px] text-gray-400 mt-2">
                                      {notif.createdAt.toDate().toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
      </div>
    </div>
  );
};
