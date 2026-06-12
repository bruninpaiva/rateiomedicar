import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  setCentros,
  resetCentros,
  montarCentrosDePlanilha,
  type LinhaPlanilha,
} from "@/lib/rateio-data";

type Status =
  | { tipo: "idle" }
  | { tipo: "ok"; msg: string }
  | { tipo: "erro"; msg: string };

export function ImportarPlanilha() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ tipo: "idle" });
  const [carregando, setCarregando] = useState(false);

  async function processarArquivo(file: File) {
    setCarregando(true);
    setStatus({ tipo: "idle" });
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) throw new Error("Planilha vazia.");
      const linhas = XLSX.utils.sheet_to_json<LinhaPlanilha>(sheet, { defval: "" });
      if (linhas.length === 0) throw new Error("Nenhuma linha encontrada.");

      const primeira = linhas[0] as Record<string, unknown>;
      const obrigatorias = ["Cod_Centro_Custo", "Centro_Custo", "N_Serie", "Nome"];
      const faltando = obrigatorias.filter((c) => !(c in primeira));
      if (faltando.length > 0) {
        throw new Error(`Colunas ausentes: ${faltando.join(", ")}`);
      }

      const resultado = montarCentrosDePlanilha(linhas);
      setCentros(resultado.centros);
      setStatus({
        tipo: "ok",
        msg: `${resultado.totalNotebooks} notebooks importados em ${resultado.totalCentros} centros de custo.`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao ler o arquivo.";
      setStatus({ tipo: "erro", msg });
    } finally {
      setCarregando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRestaurar() {
    resetCentros();
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
            Selecione o arquivo Excel (.xlsx) extraído do TOTVS. As colunas esperadas são{" "}
            <span className="font-mono text-[#1f2937]">
              N_Serie, Valor_Unit, Percentual, Cod_Centro_Custo, Centro_Custo, Cidade, Nome
            </span>
            . Os dados exibidos no portal serão substituídos pelos da planilha.
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
    </div>
  );
}
