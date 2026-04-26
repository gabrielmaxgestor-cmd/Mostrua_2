import React, { useState } from "react";
import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import { 
  LogOut, LayoutDashboard, Package, Users, Layers, Search, Bell, List, ChevronDown, FolderOpen
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout } = useAuth();

  const cadastrosRoutes = ["/admin/niches", "/admin/catalogs", "/admin/categories", "/admin/products"];
  const isCadastrosActive = cadastrosRoutes.some(r => location.pathname.startsWith(r));
  const [cadastrosOpen, setCadastrosOpen] = useState(isCadastrosActive);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (path: string) =>
    location.pathname === path || (path !== "/admin" && location.pathname.startsWith(path));

  const getLinkClass = (path: string) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${
      isActive(path)
        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
        : "text-gray-400 hover:bg-gray-800 hover:text-white"
    }`;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Dark Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col fixed h-full z-20">
        <div className="flex items-center gap-3 mb-8 px-2">
          <img src="/logo.svg" alt="Mostrua Logo" className="h-8" />
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          {/* Dashboard */}
          <Link to="/admin" className={getLinkClass("/admin")}>
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>

          {/* Cadastros — item com submenu */}
          <div>
            <button
              onClick={() => setCadastrosOpen(!cadastrosOpen)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-medium transition-colors ${
                isCadastrosActive
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="w-5 h-5" />
                Cadastros
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  cadastrosOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Submenu */}
            {cadastrosOpen && (
              <div className="mt-1 ml-4 space-y-1 border-l border-gray-700 pl-3">
                <Link
                  to="/admin/niches"
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive("/admin/niches")
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Layers className="w-4 h-4" /> Nichos
                </Link>
                <Link
                  to="/admin/catalogs"
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive("/admin/catalogs")
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Package className="w-4 h-4" /> Catálogos
                </Link>
                <Link
                  to="/admin/categories"
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive("/admin/categories")
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <List className="w-4 h-4" /> Categorias
                </Link>
                <Link
                  to="/admin/products"
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive("/admin/products")
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Package className="w-4 h-4" /> Produtos
                </Link>
              </div>
            )}
          </div>

          {/* Revendedores */}
          <Link to="/admin/resellers" className={getLinkClass("/admin/resellers")}>
            <Users className="w-5 h-5" /> Revendedores
          </Link>
        </nav>

        <div className="pt-6 border-t border-gray-800 mt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-gray-800 hover:text-red-400 rounded-xl font-medium transition-colors"
          >
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
                placeholder="Buscar..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
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
          <Outlet />
        </main>
      </div>
    </div>
  );
};
