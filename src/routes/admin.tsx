import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { useRateioData, refresh, totalCC, formatBRL, formatDataHora } from "@/lib/rateio-data";

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
  const { status, centros, meta, error } = useRateioData();
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
            Os dados deste portal são lidos diretamente da planilha oficial hospedada no SharePoint
            corporativo. Não há mais importação manual de arquivos.
          </p>
        </div>
        <button
          onClick={onSair}
          className="text-xs px-3 py-2 border border-[#c9d0d8] bg-white text-[#1f2937] hover:bg-[#f4f5f7] rounded-sm whitespace-nowrap"
        >
          Encerrar sessão
        </button>
      </section>

      <section className="bg-white border border-[#dfe3e8] rounded-sm mb-6">
        <div className="px-5 py-4 border-b border-[#dfe3e8] flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#5b6573]">Fonte de dados</div>
            <h2 className="text-base font-semibold text-[#1d3557]">Microsoft 365 — SharePoint</h2>
          </div>
          <button
            onClick={() => refresh()}
            disabled={status === "loading"}
            className="text-xs px-3 py-2 bg-[#1d3557] text-white hover:bg-[#15294a] disabled:opacity-60 rounded-sm"
          >
            {status === "loading" ? "Sincronizando…" : "Sincronizar agora"}
          </button>
        </div>

        <div className="px-5 py-4 text-sm">
          {status === "loading" && (
            <p className="text-[#5b6573]">Lendo a planilha no SharePoint…</p>
          )}

          {status === "error" && error && (
            <div className="text-sm px-4 py-3 rounded-sm border bg-[#fdf3f3] border-[#f1c9c9] text-[#8a2a2a]">
              <strong>Falha na sincronização:</strong> {error}
            </div>
          )}

          {status === "success" && meta && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-[13px]">
              <Linha rotulo="Arquivo" valor={meta.arquivo} />
              <Linha rotulo="Aba lida" valor={meta.sheetName} />
              <Linha rotulo="Última sincronização" valor={formatDataHora(meta.lastSync)} />
              <Linha rotulo="Linhas processadas" valor={String(meta.totalLinhas)} />
              <Linha rotulo="Centros de custo" valor={String(meta.totalCentros)} />
              <Linha rotulo="Notebooks" valor={String(meta.totalNotebooks)} />
              <div className="sm:col-span-2 pt-3 mt-2 border-t border-[#eef0f3]">
                <div className="text-[11px] uppercase tracking-wider text-[#5b6573] mb-1.5">Colunas identificadas</div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {meta.colunasIdentificadas.map((c) => (
                    <span key={c} className="text-[11px] font-mono bg-[#f4f5f7] border border-[#dfe3e8] px-2 py-0.5 rounded-sm text-[#1f2937]">{c}</span>
                  ))}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-[#5b6573] mb-1.5">Mapeamento aplicado</div>
                <table className="text-[12px] w-full sm:w-auto">
                  <tbody>
                    {[
                      ["Centro de Custo (agrupador)", "CENTRO_CUSTO"],
                      ["Colaborador", "NOME"],
                      ["Número de série", "N.Série"],
                      ["Cidade", "CIDADE"],
                      ["Valor mensal", "VALOR_UNIT"],
                      ["Percentual individual", "PERCENTUAL"],
                    ].map(([rotulo, coluna]) => (
                      <tr key={rotulo}>
                        <td className="text-[#5b6573] pr-4 py-0.5">{rotulo}</td>
                        <td className="font-mono text-[#1f2937] py-0.5">{coluna}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <CartaoInfo rotulo="Centros de Custo" valor={String(centros.length)} />
        <CartaoInfo rotulo="Notebooks carregados" valor={String(totalNotebooks)} />
        <CartaoInfo rotulo="Valor mensal total" valor={formatBRL(totalValor)} />
      </div>

      <section className="bg-white border border-[#dfe3e8] rounded-sm">
        <div className="px-5 py-4 border-b border-[#dfe3e8]">
          <div className="text-[11px] uppercase tracking-wider text-[#5b6573]">Base atual</div>
          <h2 className="text-base font-semibold text-[#1d3557]">Centros de custo carregados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f4f5f7] text-[11px] uppercase tracking-wider text-[#5b6573]">
              <tr>
                <th className="text-left px-5 py-2 font-medium">Centro de custo</th>
                <th className="text-right px-5 py-2 font-medium">Notebooks</th>
                <th className="text-right px-5 py-2 font-medium">Valor mensal</th>
              </tr>
            </thead>
            <tbody>
              {centros.map((cc) => (
                <tr key={cc.codigo} className="border-t border-[#eef0f3]">
                  <td className="px-5 py-2 text-[#1f2937]">{cc.nome}</td>
                  <td className="px-5 py-2 text-right tabular-nums">{cc.notebooks.length}</td>
                  <td className="px-5 py-2 text-right tabular-nums">{formatBRL(totalCC(cc))}</td>
                </tr>
              ))}
              {centros.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-[#5b6573]">
                  {status === "loading" ? "Carregando dados da planilha…" : "Nenhum dado disponível."}
                </td></tr>
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

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[#f1f3f5] py-1">
      <span className="text-[11px] uppercase tracking-wider text-[#5b6573]">{rotulo}</span>
      <span className="text-[#1f2937] font-medium text-right">{valor}</span>
    </div>
  );
}
