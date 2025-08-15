
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Lancamentos = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-julius-primary">Lançamentos</h1>
          <p className="text-julius-muted-foreground mt-1">
            Registre suas receitas e despesas
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
            O módulo de Lançamentos está sendo desenvolvido. Aqui você poderá registrar todas 
            suas transações financeiras de forma rápida e organizada.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Lancamentos;
