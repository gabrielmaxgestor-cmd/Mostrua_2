import React from "react";
import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import { 
  LogOut, Store, LayoutDashboard, Settings, Package, Users, Layers, 
  ShoppingCart, Megaphone, CreditCard, ExternalLink, TrendingUp, Receipt, 
  DollarSign, BarChart3, Search, Bell, Plus, Tags, FileText
} from "lucide-react";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";

export const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const getLinkClass = (path: string) => 
    `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${
      isActive(path) 
        ? "bg-gray-800 text-white" 
        : "text-gray-400 hover:bg-gray-800 hover:text-white"
    }`;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Dark Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col fixed h-full z-20">
        <div className="flex items-center gap-3 mb-8 px-2">
          <img src="/logo.svg" alt="Mostrua Logo" className="h-8" />
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="pt-2 pb-2 px-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Visão Geral</p>
          </div>
          <Link to="/admin" className={getLinkClass("/admin")}>
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link to="/admin/reports" className={getLinkClass("/admin/reports")}>
            <BarChart3 className="w-5 h-5" /> Relatórios
          </Link>

          <div className="pt-6 pb-2 px-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Catálogo</p>
          </div>
          <Link to="/admin/niches" className={getLinkClass("/admin/niches")}>
            <Layers className="w-5 h-5" /> Nichos
          </Link>
          <Link to="/admin/catalogs" className={getLinkClass("/admin/catalogs")}>
            <Package className="w-5 h-5" /> Catálogos
          </Link>
          <Link to="/admin/categories" className={getLinkClass("/admin/categories")}>
            <Tags className="w-5 h-5" /> Categorias
          </Link>
          <Link to="/admin/products" className={getLinkClass("/admin/products")}>
            <Package className="w-5 h-5" /> Produtos
          </Link>

          <div className="pt-6 pb-2 px-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Negócio</p>
          </div>
          <Link to="/admin/users" className={getLinkClass("/admin/users")}>
            <Users className="w-5 h-5" /> Revendedores
          </Link>
          <Link to="/admin/orders" className={getLinkClass("/admin/orders")}>
            <ShoppingCart className="w-5 h-5" /> Pedidos
          </Link>
          <Link to="/admin/subscriptions" className={getLinkClass("/admin/subscriptions")}>
            <CreditCard className="w-5 h-5" /> Assinaturas
          </Link>

          <div className="pt-6 pb-2 px-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sistema</p>
          </div>
          <Link to="/admin/settings" className={getLinkClass("/admin/settings")}>
            <Settings className="w-5 h-5" /> Configurações
          </Link>
        </nav>
        
        <div className="pt-6 border-t border-gray-800 mt-4">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-gray-800 hover:text-red-400 rounded-xl font-medium transition-colors">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Buscar revendedores, pedidos, produtos..." 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="hidden md:flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
              <Plus className="w-4 h-4" /> Criar
            </button>
            
            <div className="w-px h-8 bg-gray-200 hidden md:block"></div>
            
            <button className="relative text-gray-500 hover:text-gray-700 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-2 cursor-pointer">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-900 leading-none mb-1">Admin</p>
                <p className="text-xs text-gray-500 leading-none">{profile?.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold shadow-sm">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export const ResellerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { profile, reseller, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const storeLink = reseller?.slug ? `${window.location.origin}/${reseller.slug}` : '';

  const copyStoreLink = () => {
    if (storeLink) {
      navigator.clipboard.writeText(storeLink);
      alert("Link copiado para a área de transferência!");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
            <Store className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900 truncate">Painel Loja</span>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-6">
          <nav className="space-y-1">
            <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-xl font-medium transition-colors">
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </Link>
            <Link to="/dashboard/analytics" className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-xl font-medium transition-colors">
              <BarChart3 className="w-5 h-5" /> Analytics
            </Link>
            <Link to="/dashboard/store" className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-xl font-medium transition-colors">
              <Store className="w-5 h-5" /> Minha Loja
            </Link>
            <Link to="/dashboard/catalogs" className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-xl font-medium transition-colors">
              <Layers className="w-5 h-5" /> Catálogos
            </Link>
            <Link to="/dashboard/products" className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-xl font-medium transition-colors">
              <Package className="w-5 h-5" /> Produtos
            </Link>
            <Link to="/dashboard/orders" className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-xl font-medium transition-colors">
              <ShoppingCart className="w-5 h-5" /> Pedidos
            </Link>
            <Link to="/dashboard/customers" className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-xl font-medium transition-colors">
              <Users className="w-5 h-5" /> Clientes <span className="ml-auto text-[10px] uppercase font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Futuro</span>
            </Link>
            <Link to="/dashboard/reports" className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-xl font-medium transition-colors">
              <TrendingUp className="w-5 h-5" /> Relatórios <span className="ml-auto text-[10px] uppercase font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Premium</span>
            </Link>
            <Link to="/dashboard/subscription" className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-xl font-medium transition-colors">
              <CreditCard className="w-5 h-5" /> Assinatura
            </Link>
            <Link to="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-xl font-medium transition-colors">
              <Settings className="w-5 h-5" /> Configurações
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            {storeLink && (
              <div className="hidden md:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 max-w-md w-full">
                <span className="text-sm text-gray-500 truncate flex-1">{storeLink}</span>
                <button 
                  onClick={copyStoreLink}
                  className="text-gray-400 hover:text-green-600 transition-colors"
                  title="Copiar link"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {reseller?.slug && (
              <Link 
                to={`/${reseller.slug}`} 
                target="_blank" 
                className="hidden md:flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl font-bold hover:bg-green-100 transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Ver minha loja
              </Link>
            )}
            
            <div className="w-px h-8 bg-gray-200 hidden md:block mx-2"></div>
            
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-900 leading-none mb-1">{reseller?.storeName || "Loja"}</p>
                <p className="text-xs text-gray-500 leading-none">{profile?.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-600 to-green-400 flex items-center justify-center text-white font-bold shadow-sm overflow-hidden">
                {reseller?.settings?.logo ? (
                  <img src={reseller.settings.logo} alt="Logo" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                ) : (
                  reseller?.storeName?.charAt(0).toUpperCase() || "L"
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
