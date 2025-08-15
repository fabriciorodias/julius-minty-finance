
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompoundInterestSimulator } from "@/components/tools/CompoundInterestSimulator";

export default function Ferramentas() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-mint-text-primary">Ferramentas e Simuladores</h1>
        <p className="text-mint-text-secondary mt-2">
          Utilize nossas ferramentas para fazer simulações e tomar decisões financeiras mais informadas.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="border-mint-secondary/20">
          <CardHeader>
            <CardTitle className="text-mint-text-primary flex items-center gap-2">
              <span className="material-icons">trending_up</span>
              Simulador de Juros Compostos
            </CardTitle>
            <CardDescription>
              Descubra o poder dos juros compostos e projete o crescimento dos seus investimentos ao longo do tempo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompoundInterestSimulator />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
