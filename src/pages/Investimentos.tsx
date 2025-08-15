
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Investimentos = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-mint-text-primary">Investimentos</h1>
          <p className="text-mint-text-secondary mt-1 font-normal">
            Acompanhe sua carteira de investimentos
          </p>
        </div>
      </div>

      <Card className="mint-card mint-gradient-light">
        <CardHeader>
          <CardTitle className="text-mint-text-primary flex items-center font-bold">
            <span className="material-icons text-primary mr-2">construction</span>
            Módulo em Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-mint-text-secondary font-normal">
            O módulo de Investimentos está sendo desenvolvido. Aqui você poderá acompanhar 
            o desempenho da sua carteira e analisar seus investimentos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Investimentos;
