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
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useReseller } from "../../hooks/useReseller";
import { useOrders } from "../../hooks/useOrders";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { AppNotification } from "../../types";
import { notificationService } from "../../services/notificationService";
import { motion, AnimatePresence } from "motion/react";
import { TrialExpiredGate } from "../../components/reseller/TrialExpiredGate";

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

// ─── Componente de item de navegação ────────────────────────────────────────

const NavLink: React.FC<{
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onClick?: () => void;
}> = ({ item, isActive, collapsed, onClick }) => (
  <Link
    to={item.path}
    onClick={onClick}
    title={collapsed ? item.label : undefined}
    className={`
      relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
      transition-all duration-150 group
      ${isActive
        ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
        : "text-white/50 hover:bg-white/5 hover:text-white"
      }
      ${collapsed ? "justify-center" : ""}
    `}
  >
    <span className="w-5 h-5 shrink-0 flex items-center justify-center">
      {item.icon}
    </span>

    {!collapsed && (
      <span className="flex-1 truncate">{item.label}</span>
    )}

    {item.badge !== undefined && item.badge > 0 && (
      <span
        className={`
          font-bold text-[10px] px-1.5 py-0.5 rounded-full shrink-0
          ${isActive ? "bg-white/20 text-white" : "bg-red-500 text-white"}
          ${collapsed ? "absolute -top-1 -right-1 min-w-[16px] text-center" : ""}
        `}
      >
        {item.badge}
      </span>
    )}

    {/* Tooltip para collapsed */}
    {collapsed && (
      <div className="
        absolute left-full ml-2 px-2 py-1 bg-[#1e1e2e] text-white text-xs
        rounded-lg whitespace-nowrap border border-white/10 shadow-xl
        opacity-0 pointer-events-none group-hover:opacity-100
        transition-opacity duration-150 z-50
      ">
        {item.label}
        {item.badge !== undefined && item.badge > 0 && (
          <span className="ml-1 bg-red-500 text-white px-1 rounded-full">
            {item.badge}
          </span>
        )}
      </div>
    )}
  </Link>
);

// ─── Layout Principal ────────────────────────────────────────────────────────

export const ResellerLayout: React.FC = () => {
  const { user, logout, subscription, loading } = useAuth();
  const { reseller } = useReseller(user?.uid);
  const { orders } = useOrders(user?.uid);
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // ─── Trial / Subscription gate ───────────────────────────────────────────
  const now = new Date();
  const isTrialExpired =
    subscription?.status === "trial" &&
    subscription?.currentPeriodEnd != null &&
    subscription.currentPeriodEnd.toDate() < now;

  const isBlocked =
    !loading &&
    (!subscription ||
      isTrialExpired ||
      subscription.status === "expired" ||
      subscription.status === "canceled" ||
      subscription.status === "past_due");

  const trialDaysLeft =
    subscription?.status === "trial" && subscription.currentPeriodEnd
      ? Math.ceil(
          (subscription.currentPeriodEnd.toDate().getTime() - Date.now()) / 86400000
        )
      : null;
  // ─────────────────────────────────────────────────────────────────────────

  // Notificações em tempo real
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "notifications"),
      where("resellerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification)));
    });
  }, [user?.uid]);

  // Fechar notificações ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fechar menu mobile ao navegar
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingOrdersCount = orders.filter((o) => o.status === "pending").length;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // ─── Itens de menu ───────────────────────────────────────────────────────

  const mainNavItems: NavItem[] = [
    {
      path: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: "Dashboard",
    },
    {
      path: "/dashboard/products",
      icon: <Package className="w-5 h-5" />,
      label: "Produtos",
    },
    {
      path: "/dashboard/orders",
      icon: <ShoppingCart className="w-5 h-5" />,
      label: "Pedidos",
      badge: pendingOrdersCount,
    },
    {
      path: "/dashboard/customers",
      icon: <Users className="w-5 h-5" />,
      label: "Clientes",
    },
    {
      path: "/dashboard/catalogs",
      icon: <Layers className="w-5 h-5" />,
      label: "Catálogos",
    },
    {
      path: "/dashboard/analytics",
      icon: <BarChart3 className="w-5 h-5" />,
      label: "Analytics",
    },
  ];

  const storeNavItems: NavItem[] = [
    {
      path: "/dashboard/store",
      icon: <Store className="w-5 h-5" />,
      label: "Minha Loja",
    },
    {
      path: "/dashboard/preview",
      icon: <Eye className="w-5 h-5" />,
      label: "Prévia da Loja",
    },
    {
      path: "/dashboard/domain",
      icon: <Globe className="w-5 h-5" />,
      label: "Domínio",
    },
  ];

  const accountNavItems: NavItem[] = [
    {
      path: "/dashboard/billing",
      icon: <CreditCard className="w-5 h-5" />,
      label: "Assinatura",
    },
    {
      path: "/dashboard/support",
      icon: <HeadphonesIcon className="w-5 h-5" />,
      label: "Suporte",
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(path);

  const primaryColor = reseller?.settings?.primaryColor || "#f97316";

  // Gate de bloqueio
  if (isBlocked) return <TrialExpiredGate />;

  // ─── Sidebar content (reutilizado em mobile e desktop) ───────────────────
  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <>
      {/* Logo */}
      <div
        className={`
          h-16 flex items-center border-b border-white/5 shrink-0
          ${isCollapsed && !onClose ? "justify-center px-0" : "justify-between px-5"}
        `}
      >
        <div className={`flex items-center gap-3 min-w-0 ${isCollapsed && !onClose ? "" : "flex-1"}`}>
          {reseller?.settings?.logo ? (
            <img
              src={reseller.settings.logo}
              alt="Logo"
              className="w-8 h-8 rounded-lg object-contain shrink-0"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {reseller?.storeName?.charAt(0).toUpperCase() || "M"}
            </div>
          )}
          {(!isCollapsed || onClose) && (
            <span className="font-bold text-white truncate text-sm">
              {reseller?.storeName || "Minha Loja"}
            </span>
          )}
        </div>

        {/* Botão fechar mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 scrollbar-none">
        {/* Seção principal */}
        {(!isCollapsed || onClose) && (
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-3 pt-1 pb-2">
            Principal
          </p>
        )}
        {mainNavItems.map((item) => (
          <NavLink
            key={item.path}
            item={item}
            isActive={isActive(item.path)}
            collapsed={isCollapsed && !onClose}
            onClick={onClose}
          />
        ))}

        {/* Seção loja */}
        {(!isCollapsed || onClose) && (
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-3 pt-4 pb-2">
            Loja
          </p>
        )}
        {isCollapsed && !onClose && <div className="my-3 border-t border-white/5" />}
        {storeNavItems.map((item) => (
          <NavLink
            key={item.path}
            item={item}
            isActive={isActive(item.path)}
            collapsed={isCollapsed && !onClose}
            onClick={onClose}
          />
        ))}

        {/* Seção conta */}
        {(!isCollapsed || onClose) && (
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-3 pt-4 pb-2">
            Conta
          </p>
        )}
        {isCollapsed && !onClose && <div className="my-3 border-t border-white/5" />}
        {accountNavItems.map((item) => (
          <NavLink
            key={item.path}
            item={item}
            isActive={isActive(item.path)}
            collapsed={isCollapsed && !onClose}
            onClick={onClose}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 p-3 shrink-0 space-y-1">
        {/* Plano atual */}
        {(!isCollapsed || onClose) && subscription && (
          <Link
            to="/dashboard/billing"
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white/70 truncate">
                {subscription.status === "trial" ? "Período de Teste" : "Plano Ativo"}
              </p>
              {trialDaysLeft !== null && trialDaysLeft > 0 && (
                <p className="text-[10px] text-orange-400 font-semibold">
                  {trialDaysLeft} dias restantes
                </p>
              )}
            </div>
          </Link>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={isCollapsed && !onClose ? "Sair" : undefined}
          className={`
            flex items-center gap-3 px-3 py-2.5 w-full text-sm font-medium
            text-red-500/70 hover:text-red-400 hover:bg-red-500/10
            rounded-xl transition-colors
            ${isCollapsed && !onClose ? "justify-center" : ""}
          `}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {(!isCollapsed || onClose) && "Sair"}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">

      {/* Banner de trial */}
      {trialDaysLeft !== null && trialDaysLeft > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-sm text-amber-400 z-50 shrink-0">
          Você está no período de teste.{" "}
          <strong>{trialDaysLeft} dias restantes</strong>.{" "}
          <Link to="/dashboard/billing" className="ml-1 underline font-bold hover:text-amber-300">
            Assinar agora →
          </Link>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

        {/* Overlay mobile */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* ── SIDEBAR MOBILE ── */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-[#0A0A0F] border-r border-white/5 flex flex-col lg:hidden"
            >
              <SidebarContent onClose={() => setIsMobileMenuOpen(false)} />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── SIDEBAR DESKTOP ── */}
        <aside
          className={`
            hidden lg:flex flex-col shrink-0
            bg-[#0A0A0F] border-r border-white/5
            relative transition-all duration-300 ease-in-out
            ${isCollapsed ? "w-[68px]" : "w-64"}
          `}
        >
          {/* Botão colapsar */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="
              absolute -right-3 top-[72px] z-10
              w-6 h-6 rounded-full
              bg-[#1a1a2e] border border-white/10
              flex items-center justify-center
              text-white/40 hover:text-white hover:border-orange-500
              transition-all duration-150 shadow-md
            "
          >
            {isCollapsed
              ? <ChevronRight className="w-3 h-3" />
              : <ChevronLeft className="w-3 h-3" />
            }
          </button>

          <SidebarContent />
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Topbar */}
          <header className="h-14 bg-[#0A0A0F] border-b border-white/5 flex items-center px-4 lg:px-6 gap-3 shrink-0">

            {/* Hambúrguer mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-1 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / título da página (simples) */}
            <div className="flex-1" />

            {/* Ações */}
            <div className="flex items-center gap-2">

              {/* Notificações */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0A0A0F]" />
                  )}
                </button>

                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 bg-[#13131C] rounded-2xl shadow-2xl border border-white/10 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <h3 className="font-bold text-white text-sm">Notificações</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => {
                              if (user?.uid) notificationService.markAllAsRead(user.uid);
                            }}
                            className="text-xs text-orange-500 hover:text-orange-400 font-semibold flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Marcar todas como lidas
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center flex flex-col items-center gap-3">
                            <Bell className="w-8 h-8 text-white/15" />
                            <p className="text-sm text-white/40">Nenhuma notificação</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-white/5">
                            {notifications.map((notif) => (
                              <div
                                key={notif.id}
                                className={`p-4 transition-colors hover:bg-white/5 cursor-pointer ${
                                  !notif.read ? "bg-orange-500/8" : ""
                                }`}
                                onClick={() => {
                                  if (!notif.read) notificationService.markAsRead(notif.id);
                                  if (notif.link) {
                                    navigate(notif.link);
                                    setIsNotificationsOpen(false);
                                  }
                                }}
                              >
                                <div className="flex gap-3">
                                  <div
                                    className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                                      !notif.read ? "bg-orange-500" : "bg-transparent"
                                    }`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`text-sm leading-snug ${
                                        !notif.read
                                          ? "font-semibold text-white"
                                          : "font-medium text-white/50"
                                      }`}
                                    >
                                      {notif.title}
                                    </p>
                                    <p className="text-xs text-white/35 mt-0.5 line-clamp-2">
                                      {notif.message}
                                    </p>
                                    {notif.createdAt && (
                                      <p className="text-[10px] text-white/25 mt-1.5">
                                        {notif.createdAt
                                          .toDate()
                                          .toLocaleDateString("pt-BR", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
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

              {/* Avatar */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
