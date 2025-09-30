import { NotionCard, NotionCardHeader, NotionCardTitle, NotionCardContent } from "@/components/ui/notion-card";
import { CompoundInterestSimulator } from "@/components/tools/CompoundInterestSimulator";
import { TrendingUp } from "lucide-react";

export default function Ferramentas() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-notion-h1 text-notion-gray-900">Ferramentas e Simuladores</h1>
        <p className="text-notion-body text-notion-gray-600 mt-2">
          Utilize nossas ferramentas para fazer simulações e tomar decisões financeiras mais informadas.
        </p>
      </div>

      <div className="grid gap-6">
        <NotionCard variant="hoverable" className="transition-notion">
          <NotionCardHeader>
            <NotionCardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-notion-blue" />
              Simulador de Juros Compostos
            </NotionCardTitle>
            <p className="text-notion-body-sm text-notion-gray-600 mt-2">
              Descubra o poder dos juros compostos e projete o crescimento dos seus investimentos ao longo do tempo.
            </p>
          </NotionCardHeader>
          <NotionCardContent>
            <CompoundInterestSimulator />
          </NotionCardContent>
        </NotionCard>
      </div>
    </div>
  );
}
