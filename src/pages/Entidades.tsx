
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Entidades = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-julius-primary">Gerenciar Entidades</h1>
          <p className="text-julius-muted-foreground mt-1">
            Configure bancos, cartões e categorias
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
            O módulo de Gerenciamento de Entidades está sendo desenvolvido. Aqui você poderá 
            configurar suas contas bancárias, cartões de crédito e categorias de gastos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Entidades;
