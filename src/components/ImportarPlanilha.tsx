import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  setCentros,
  resetCentros,
  montarCentrosComMapeamento,
  autoDetectarMapeamento,
  CAMPOS_MAPEAVEIS,
  type MapeamentoColunas,
  type CampoMapeavel,
} from "@/lib/rateio-data";

type Status =
  | { tipo: "idle" }
  | { tipo: "ok"; msg: string }
  | { tipo: "erro"; msg: string };

interface PreImport {
  nomeArquivo: string;
  colunas: string[];
  linhas: Record<string, unknown>[];
  mapeamento: MapeamentoColunas;
}

const OBRIGATORIOS: CampoMapeavel[] = CAMPOS_MAPEAVEIS
  .filter((c) => c.obrigatorio)
  .map((c) => c.campo);

export function ImportarPlanilha() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ tipo: "idle" });
  const [carregando, setCarregando] = useState(false);
  const [pre, setPre] = useState<PreImport | null>(null);

  async function processarArquivo(file: File) {
    setCarregando(true);
    setStatus({ tipo: "idle" });
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) throw new Error("Planilha vazia.");
      const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      if (linhas.length === 0) throw new Error("Nenhuma linha encontrada na planilha.");
      const colunas = Object.keys(linhas[0]);
      if (colunas.length === 0) throw new Error("Não foi possível ler os cabeçalhos.");
      const mapeamento = autoDetectarMapeamento(colunas);
      setPre({ nomeArquivo: file.name, colunas, linhas, mapeamento });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao ler o arquivo.";
      setStatus({ tipo: "erro", msg });
    } finally {
      setCarregando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function atualizarMapeamento(campo: CampoMapeavel, valor: string) {
    if (!pre) return;
    setPre({ ...pre, mapeamento: { ...pre.mapeamento, [campo]: valor || null } });
  }

  function confirmarImportacao() {
    if (!pre) return;
    const faltando = OBRIGATORIOS.filter((c) => !pre.mapeamento[c]);
    if (faltando.length > 0) {
      const rotulos = faltando
        .map((f) => CAMPOS_MAPEAVEIS.find((c) => c.campo === f)?.rotulo)
        .join(", ");
      setStatus({ tipo: "erro", msg: `Mapeie os campos obrigatórios: ${rotulos}.` });
      return;
    }
    const resultado = montarCentrosComMapeamento(pre.linhas, pre.mapeamento);
    setCentros(resultado.centros);
    setStatus({
      tipo: "ok",
      msg: `${resultado.totalNotebooks} notebooks importados em ${resultado.totalCentros} centros de custo.`,
    });
    setPre(null);
  }

  function cancelarImportacao() {
    setPre(null);
    setStatus({ tipo: "idle" });
  }

  function handleRestaurar() {
    resetCentros();
    setPre(null);
    setStatus({ tipo: "ok", msg: "Dados de demonstração restaurados." });
  }

  return (
    <div className="bg-white border border-[#dfe3e8] rounded-sm p-5 mb-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="max-w-2xl">
          <div className="text-[11px] uppercase tracking-wider text-[#5b6573] mb-1">
            Atualização de dados
          </div>
          <h2 className="text-base font-semibold text-[#1d3557]">Importar planilha de rateio</h2>
          <p className="text-xs text-[#5b6573] mt-1 leading-relaxed">
            Selecione o arquivo Excel (.xlsx). Se os cabeçalhos forem diferentes do esperado,
            você poderá mapear as colunas manualmente antes de concluir a importação.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={carregando}
            className="px-4 py-2 text-sm bg-[#1d3557] text-white hover:bg-[#15294a] disabled:opacity-60 rounded-sm whitespace-nowrap"
          >
            {carregando ? "Lendo arquivo..." : "Selecionar arquivo .xlsx"}
          </button>
          <button
            onClick={handleRestaurar}
            disabled={carregando}
            className="px-4 py-2 text-sm border border-[#c9d0d8] bg-white text-[#1f2937] hover:bg-[#f4f5f7] rounded-sm whitespace-nowrap"
          >
            Restaurar demonstração
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) processarArquivo(f);
            }}
          />
        </div>
      </div>

      {status.tipo !== "idle" && (
        <div
          className={`mt-4 text-xs px-3 py-2 rounded-sm border ${
            status.tipo === "ok"
              ? "bg-[#f1f7f1] border-[#cfe3cf] text-[#2f5d2f]"
              : "bg-[#fdf3f3] border-[#f1c9c9] text-[#8a2a2a]"
          }`}
        >
          {status.msg}
        </div>
      )}

      {pre && (
        <MapeamentoPanel
          pre={pre}
          onChange={atualizarMapeamento}
          onConfirmar={confirmarImportacao}
          onCancelar={cancelarImportacao}
        />
      )}
    </div>
  );
}

function MapeamentoPanel({
  pre,
  onChange,
  onConfirmar,
  onCancelar,
}: {
  pre: PreImport;
  onChange: (c: CampoMapeavel, v: string) => void;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const amostra = pre.linhas.slice(0, 3);

  return (
    <div className="mt-5 border border-[#dfe3e8] rounded-sm bg-[#fafbfc]">
      <div className="px-5 py-4 border-b border-[#dfe3e8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#5b6573]">Mapeamento de colunas</div>
          <h3 className="text-sm font-semibold text-[#1d3557]">
            {pre.nomeArquivo} <span className="text-[#5b6573] font-normal">· {pre.linhas.length} linhas</span>
          </h3>
        </div>
        <div className="text-[11px] text-[#5b6573]">
          Associe cada campo do portal a uma coluna da planilha.
        </div>
      </div>

      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {CAMPOS_MAPEAVEIS.map(({ campo, rotulo, obrigatorio }) => {
          const valor = pre.mapeamento[campo] ?? "";
          return (
            <div key={campo}>
              <label className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#5b6573] mb-1">
                <span>
                  {rotulo}
                  {obrigatorio && <span className="text-[#b3261e] ml-1">*</span>}
                </span>
                {valor && (
                  <span className="font-mono normal-case tracking-normal text-[10px] text-[#5b6573] truncate ml-2">
                    {amostra.map((l) => String(l[valor] ?? "")).filter(Boolean)[0] ?? ""}
                  </span>
                )}
              </label>
              <select
                value={valor}
                onChange={(e) => onChange(campo, e.target.value)}
                className={`w-full border bg-white px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-[#1d3557] ${
                  obrigatorio && !valor ? "border-[#e8b4ae]" : "border-[#c9d0d8]"
                }`}
              >
                <option value="">— Não usar —</option>
                {pre.colunas.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-3 border-t border-[#dfe3e8] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-[11px] text-[#5b6573]">
          Campos com <span className="text-[#b3261e]">*</span> são obrigatórios.
          Se o Percentual não for mapeado, ele será calculado automaticamente a partir do valor.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancelar}
            className="px-3 py-2 text-sm border border-[#c9d0d8] bg-white text-[#1f2937] hover:bg-[#f4f5f7] rounded-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className="px-4 py-2 text-sm bg-[#1d3557] text-white hover:bg-[#15294a] rounded-sm"
          >
            Confirmar importação
          </button>
        </div>
      </div>
    </div>
  );
}
