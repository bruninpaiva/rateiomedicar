import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function PortalLayout({ children, breadcrumb }: { children: ReactNode; breadcrumb?: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f5f7] text-[#1f2937] font-sans">
      <header className="bg-[#1d3557] text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo-medicar.png" alt="Medicar" className="h-9 w-auto" />
            <div className="leading-tight">
              <div className="text-[11px] uppercase tracking-widest text-white/70">Portal Interno</div>
              <div className="text-base font-semibold">Central de Rateio de Equipamentos</div>
            </div>
          </Link>
          <div className="hidden sm:block text-right text-xs text-white/80">
            <div>Departamento de TI</div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-[#dfe3e8]">
        <div className="max-w-6xl mx-auto px-6 py-2 text-xs text-[#5b6573]">
          {breadcrumb ?? <Link to="/" className="hover:underline">Início</Link>}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>

      <footer className="border-t border-[#dfe3e8] bg-white mt-12">
        <div className="max-w-6xl mx-auto px-6 py-4 text-xs text-[#5b6573] flex flex-col sm:flex-row sm:justify-between gap-1">
          <span>© {new Date().getFullYear()} Departamento de Tecnologia da Informação - Medicar</span>
          <span className="flex items-center gap-3">
            <span>Portal somente leitura · Aprovações realizadas no TOTVS</span>
            <Link to="/admin" className="text-[#9aa3ad] hover:text-[#1d3557] hover:underline">Administração</Link>
          </span>
        </div>
      </footer>

    </div>
  );
}
