import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { 
  LayoutDashboard, 
  Settings, 
  Menu, 
  Bell, 
  FileText,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function PortalLayout({ children, breadcrumb }: { children: ReactNode; breadcrumb?: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const routerState = useRouterState({
    select: (state) => state.location.pathname,
  });
  const pathname = routerState ?? "/";

  // Handle initial screen size and responsiveness
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
    };

    // Initial check
    const initialMobile = window.innerWidth < 1024;
    setIsMobile(initialMobile);
    if (initialMobile) {
      setIsSidebarOpen(false);
    }

    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  // Handle ESC key to close sidebar
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMobile) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isMobile]);

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Contrato SOFFNER", icon: FileText, href: "/rateio/soffner" },
    { label: "Contrato ARKLOK", icon: FileText, href: "/rateio/arklok" },
  ];

  const adminItems = [
    { label: "Administração", icon: Settings, href: "/admin" },
    { label: "Ajuda", icon: HelpCircle, href: "#" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans flex overflow-hidden relative">
      {/* Overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-[#0F172A] text-white transition-all duration-300 ease-in-out flex flex-col z-50 shadow-xl",
          "fixed inset-y-0 left-0 lg:static lg:translate-x-0",
          isSidebarOpen 
            ? "translate-x-0 w-64" 
            : "-translate-x-full lg:w-20 lg:translate-x-0"
        )}
      >
        <div className="p-4 flex items-center justify-between border-b border-white/5 h-16">
          <Link 
            to="/" 
            className="flex items-center gap-3 overflow-hidden"
            onClick={() => isMobile && setIsSidebarOpen(false)}
          >
            <div className="min-w-[40px] flex items-center justify-center">
              <img src="/logo-medicar.png" alt="Medicar" className="h-8 w-auto object-contain" />
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-lg tracking-tight whitespace-nowrap">Rateios</span>
            )}
          </Link>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => isMobile && setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                  isActive 
                    ? "bg-[#BD1616] text-white font-medium shadow-lg shadow-red-900/20" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                {isSidebarOpen && <span className="text-sm">{item.label}</span>}
                {!isSidebarOpen && !isMobile && (
                  <div className="absolute left-16 bg-slate-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60]">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}

          <div className="pt-6 pb-2 px-3">
            <div className={cn("h-px bg-white/5 w-full", !isSidebarOpen && "hidden")} />
            {isSidebarOpen && <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-4 mb-2 font-bold px-1 text-center lg:text-left">Configurações</p>}
          </div>

          {adminItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => isMobile && setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                  isActive 
                    ? "bg-[#BD1616] text-white font-medium shadow-lg shadow-red-900/20" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                {isSidebarOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/10">
          <div className={cn("flex items-center gap-3", !isSidebarOpen && "justify-center")}>
            <div className="h-9 w-auto shrink-0 flex items-center justify-center">
              <img src="/logo-medicar.png" alt="Medicar" className="h-8 w-auto object-contain opacity-80" />
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-xs font-medium truncate text-slate-200">Suporte Medicar</p>
                <p className="text-[10px] text-slate-500 truncate">Departamento de TI</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link to="/" className="hover:text-[#BD1616] transition-colors">Início</Link>
              {breadcrumb && (
                <>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                  <span className="text-slate-900 font-medium">{breadcrumb}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="h-8 w-px bg-slate-100" />
            <div className="flex items-center">
              <img src="/logo-medicar.png" alt="Medicar" className="h-9 w-auto object-contain" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
          
          <footer className="mt-20 py-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 max-w-7xl mx-auto">
            <p>© {new Date().getFullYear()} Medicar Assistência Médica - Departamento de TI</p>
            <div className="flex gap-6">
              <span className="text-slate-300">|</span>
              <p>Central de Rateio de Equipamentos</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

