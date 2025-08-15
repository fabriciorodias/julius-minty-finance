
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Tutoriais = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-julius-primary">Tutoriais</h1>
          <p className="text-julius-muted-foreground mt-1">
            Aprenda a usar o Julius
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
            A seção de Tutoriais está sendo desenvolvida. Aqui você encontrará guias completos 
            para aproveitar ao máximo todas as funcionalidades do Julius.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tutoriais;
