
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Investimentos = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-julius-primary">Investimentos</h1>
          <p className="text-julius-muted-foreground mt-1">
            Acompanhe sua carteira de investimentos
          </p>
        </div>
      </div>

      <Card className="julius-card">
        <CardHeader>
          <CardTitle className="text-julius-primary flex items-center">
            <span className="material-icons text-julius-accent mr-2">construction</span>
            Módulo em Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-julius-muted-foreground">
            O módulo de Investimentos está sendo desenvolvido. Aqui você poderá acompanhar 
            o desempenho da sua carteira e analisar seus investimentos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Investimentos;
