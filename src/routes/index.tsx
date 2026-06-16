import { createFileRoute, Link } from "@tanstack/react-router";
import { PortalLayout } from "@/components/PortalLayout";
import { 
  ArrowRight, 
  Laptop, 
  ShieldCheck, 
  Clock, 
  Users, 
  FileText,
  CheckCircle2,
  Info
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useContratoRateio, formatDataHora } from "@/lib/rateio-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Portal de Rateios Medicar" },
      {
        name: "description",
        content: "Portal interno para consulta dos contratos de rateio de equipamentos.",
      },
    ],
  }),
  component: PortalRateios,
});

const contratosConfig = [
  {
    id: "soffner" as const,
    nome: "SOFFNER",
    descricao: "Gestão e rateio de notebooks e periféricos vinculados aos centros de custo.",
    destino: "/rateio/soffner" as const,
    cor: "bg-blue-500",
  },
  {
    id: "arklok" as const,
    nome: "ARKLOK",
    descricao: "Consulta de ativos e alocação de equipamentos de infraestrutura tecnológica.",
    destino: "/rateio/arklok" as const,
    cor: "bg-indigo-500",
  },
];

function PortalRateios() {
  const soffner = useContratoRateio("soffner");
  const arklok = useContratoRateio("arklok");

  const isLoading = soffner.status === "loading" || arklok.status === "loading";
  
  // Calcular indicadores reais
  const totalEquipamentos = (soffner.meta?.totalNotebooks ?? 0) + (arklok.meta?.totalNotebooks ?? 0);
  const centrosSet = new Set([
    ...soffner.centros.map(c => c.codigo),
    ...arklok.centros.map(c => c.codigo)
  ]);
  const totalCentros = centrosSet.size;
  
  // Data da última atualização (a mais recente entre os contratos)
  const datas = [soffner.meta?.lastSync, arklok.meta?.lastSync].filter(Boolean) as string[];
  const ultimaAtualizacao = datas.length > 0 
    ? formatDataHora(datas.sort().reverse()[0])
    : "Não disponível";

  const stats = [
    { label: "Contratos Ativos", value: "02", icon: FileText, color: "text-[#BD1616]", bg: "bg-red-50" },
    { label: "Centros de Custo", value: totalCentros.toString(), icon: Users, color: "text-[#BD1616]", bg: "bg-red-50" },
    { label: "Total Equipamentos", value: totalEquipamentos.toString(), icon: Laptop, color: "text-[#BD1616]", bg: "bg-red-50" },
    { label: "Última Sincronização", value: ultimaAtualizacao, icon: Clock, color: "text-[#BD1616]", bg: "bg-red-50" },
  ];

  return (
    <PortalLayout>
      {/* Welcome Section */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Portal de Rateios</h1>
            <p className="text-slate-500 mt-2 max-w-2xl text-base">
              Bem-vindo à Central de Rateio de Equipamentos da Medicar. Consulte a alocação de ativos e informações financeiras atualizadas.
            </p>
          </div>
        </div>
      </section>

      {/* Dynamic Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat) => (
          <Card key={stat.label} className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className={`font-bold text-slate-900 mt-0.5 ${stat.label === "Última Sincronização" ? 'text-xs' : 'text-2xl'}`}>
                    {isLoading ? "..." : stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Main Actions Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-[#BD1616]" />
            Contratos Operacionais
          </h2>
          <Badge variant="outline" className="text-slate-400 border-slate-200 font-medium">
            Ativos no Sistema
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {contratosConfig.map((config) => {
            const data = config.id === "soffner" ? soffner : arklok;
            const equipCount = data.meta?.totalNotebooks ?? 0;
            
            return (
              <Card key={config.nome} className="group overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col rounded-2xl">
                <CardHeader className="p-8 pb-4">
                  <div className="flex justify-between items-start mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-[#BD1616]/5 transition-colors duration-500">
                      <Laptop className="h-7 w-7 text-slate-400 group-hover:text-[#BD1616] transition-colors duration-500" />
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100 px-3 py-1 font-semibold tracking-wide">
                      {data.status === "success" ? "ATIVO" : "CARREGANDO"}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-[#BD1616] transition-colors duration-500">
                    {config.nome}
                  </CardTitle>
                  <CardDescription className="text-slate-500 text-sm leading-relaxed min-h-[40px]">
                    {config.descricao}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-2 mt-auto">
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-slate-600">{isLoading ? "..." : `${equipCount} Equipamentos`}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-8 pt-6">
                  <Button asChild className="w-full bg-[#BD1616] hover:bg-[#9a1212] text-white shadow-lg shadow-red-900/10 h-12 rounded-xl text-sm font-bold transition-all duration-300">
                    <Link to={config.destino} className="flex items-center justify-center gap-2">
                      Consultar Rateio
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Info/Support Section */}
      <section>
        <div className="bg-[#0F172A] rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 text-center lg:text-left">
            <div className="max-w-xl">
              <h3 className="text-2xl font-bold mb-4">Suporte ao Portal</h3>
              <p className="text-slate-400 leading-relaxed">
                Para suporte técnico, inconsistência nos dados ou solicitações de acesso a novos centros de custo, utilize o portal oficial de chamados da Medicar.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <Button asChild variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-[#BD1616] hover:border-[#BD1616] transition-all duration-300 h-12 px-8 rounded-xl font-bold">
                <a 
                  href="https://medicar.mysuite.com.br/client/login.php" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  Abrir Chamado
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 h-12 px-8 rounded-xl font-bold gap-2">
                <Info className="h-4 w-4" />
                Documentação
              </Button>
            </div>
          </div>
          {/* Decorative background elements */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#BD1616]/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        </div>
      </section>
    </PortalLayout>
  );
}

