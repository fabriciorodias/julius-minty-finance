
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Entidades = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-mint-text-primary">Gerenciar Entidades</h1>
          <p className="text-mint-text-secondary mt-1 font-normal">
            Configure bancos, cartões e categorias
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
            O módulo de Gerenciamento de Entidades está sendo desenvolvido. Aqui você poderá 
            configurar suas contas bancárias, cartões de crédito e categorias de gastos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Entidades;
