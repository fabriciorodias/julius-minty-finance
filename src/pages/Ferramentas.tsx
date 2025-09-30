import { OriginCard, OriginCardHeader, OriginCardTitle, OriginCardContent } from "@/components/ui/origin-card";
import { CompoundInterestSimulator } from "@/components/tools/CompoundInterestSimulator";
import { TrendingUp } from "lucide-react";

export default function Ferramentas() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ferramentas e Simuladores</h1>
        <p className="text-muted-foreground mt-2">
          Utilize nossas ferramentas para fazer simulações e tomar decisões financeiras mais informadas.
        </p>
      </div>

      <div className="grid gap-6">
        <OriginCard glass textured="mint" className="liquid-glass-primary animate-fade-in">
          <OriginCardHeader>
            <OriginCardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Simulador de Juros Compostos
            </OriginCardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Descubra o poder dos juros compostos e projete o crescimento dos seus investimentos ao longo do tempo.
            </p>
          </OriginCardHeader>
          <OriginCardContent>
            <CompoundInterestSimulator />
          </OriginCardContent>
        </OriginCard>
      </div>
    </div>
  );
}
