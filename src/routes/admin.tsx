import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { ImportarPlanilha } from "@/components/ImportarPlanilha";
import { useCentros, totalCC, formatBRL } from "@/lib/rateio-data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Administração · Central de Rateio" }],
  }),
  component: AdminPage,
});

const SENHA = "Medicar2026@";
const AUTH_KEY = "rateio:admin-auth";

function AdminPage() {
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(AUTH_KEY) === "1") {
      setAutenticado(true);
    }
  }, []);

  if (!autenticado) return <TelaLogin onSucesso={() => setAutenticado(true)} />;
  return <PainelAdmin onSair={() => { sessionStorage.removeItem(AUTH_KEY); setAutenticado(false); }} />;
}

function TelaLogin({ onSucesso }: { onSucesso: () => void }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (senha === SENHA) {
      sessionStorage.setItem(AUTH_KEY, "1");
      onSucesso();
    } else {
      setErro("Senha incorreta.");
    }
  }

  const breadcrumb = (
    <span>
      <Link to="/" className="hover:underline">Início</Link>
      <span className="mx-2 text-[#c9d0d8]">/</span>
      <span>Administração</span>
    </span>
  );

  return (
    <PortalLayout breadcrumb={breadcrumb}>
      <div className="max-w-md mx-auto mt-8 bg-white border border-[#dfe3e8] rounded-sm p-7">
        <div className="text-[11px] uppercase tracking-wider text-[#5b6573] mb-1">Acesso restrito</div>
        <h1 className="text-xl font-semibold text-[#1d3557] mb-1">Área de Administração</h1>
        <p className="text-xs text-[#5b6573] mb-5 leading-relaxed">
          Esta área é destinada exclusivamente à equipe responsável pela manutenção dos dados do portal.
        </p>
        <form onSubmit={entrar} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#5b6573] mb-1">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => { setSenha(e.target.value); setErro(""); }}
              autoFocus
              className="w-full border border-[#c9d0d8] bg-white px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1d3557] focus:ring-1 focus:ring-[#1d3557]"
            />
          </div>
          {erro && (
            <div className="text-xs px-3 py-2 rounded-sm border bg-[#fdf3f3] border-[#f1c9c9] text-[#8a2a2a]">
              {erro}
            </div>
          )}
          <div className="flex justify-between items-center pt-1">
            <Link to="/" className="text-xs text-[#5b6573] hover:text-[#1d3557] hover:underline">← Voltar ao portal</Link>
            <button type="submit" className="px-4 py-2 text-sm bg-[#1d3557] text-white hover:bg-[#15294a] rounded-sm">
              Entrar
            </button>
          </div>
        </form>
      </div>
    </PortalLayout>
  );
}

function PainelAdmin({ onSair }: { onSair: () => void }) {
  const centros = useCentros();
  const totalNotebooks = centros.reduce((s, c) => s + c.notebooks.length, 0);
  const totalValor = centros.reduce((s, c) => s + totalCC(c), 0);

  const breadcrumb = (
    <span>
      <Link to="/" className="hover:underline">Início</Link>
      <span className="mx-2 text-[#c9d0d8]">/</span>
      <span>Administração</span>
    </span>
  );

  return (
    <PortalLayout breadcrumb={breadcrumb}>
      <section className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#5b6573] mb-1">Área restrita</div>
          <h1 className="text-2xl font-semibold text-[#1d3557]">Administração do Portal</h1>
          <p className="text-sm text-[#5b6573] mt-1 max-w-3xl">
            Gerencie os dados exibidos no portal de consulta. As alterações feitas aqui ficam
            imediatamente disponíveis para os gestores.
          </p>
        </div>
        <button
          onClick={onSair}
          className="text-xs px-3 py-2 border border-[#c9d0d8] bg-white text-[#1f2937] hover:bg-[#f4f5f7] rounded-sm whitespace-nowrap"
        >
          Encerrar sessão
        </button>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <CartaoInfo rotulo="Centros de Custo" valor={String(centros.length)} />
        <CartaoInfo rotulo="Notebooks cadastrados" valor={String(totalNotebooks)} />
        <CartaoInfo rotulo="Valor mensal total" valor={formatBRL(totalValor)} />
      </div>

      <ImportarPlanilha />

      <section className="bg-white border border-[#dfe3e8] rounded-sm">
        <div className="px-5 py-4 border-b border-[#dfe3e8]">
          <div className="text-[11px] uppercase tracking-wider text-[#5b6573]">Resumo da base atual</div>
          <h2 className="text-base font-semibold text-[#1d3557]">Centros de custo carregados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f4f5f7] text-[11px] uppercase tracking-wider text-[#5b6573]">
              <tr>
                <th className="text-left px-5 py-2 font-medium">Código</th>
                <th className="text-left px-5 py-2 font-medium">Centro de custo</th>
                <th className="text-right px-5 py-2 font-medium">Notebooks</th>
                <th className="text-right px-5 py-2 font-medium">Valor mensal</th>
              </tr>
            </thead>
            <tbody>
              {centros.map((cc) => (
                <tr key={cc.codigo} className="border-t border-[#eef0f3]">
                  <td className="px-5 py-2 font-mono text-xs text-[#5b6573]">{cc.codigo}</td>
                  <td className="px-5 py-2 text-[#1f2937]">{cc.nome}</td>
                  <td className="px-5 py-2 text-right tabular-nums">{cc.notebooks.length}</td>
                  <td className="px-5 py-2 text-right tabular-nums">{formatBRL(totalCC(cc))}</td>
                </tr>
              ))}
              {centros.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-[#5b6573]">Nenhum dado carregado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PortalLayout>
  );
}

function CartaoInfo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="bg-white border border-[#dfe3e8] rounded-sm p-4">
      <div className="text-[11px] uppercase tracking-wider text-[#5b6573] mb-1">{rotulo}</div>
      <div className="text-xl font-semibold text-[#1d3557] tabular-nums">{valor}</div>
    </div>
  );
}
