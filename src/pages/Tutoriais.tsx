
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Tutoriais = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-mint-text-primary">Tutoriais</h1>
          <p className="text-mint-text-secondary mt-1 font-normal">
            Aprenda a usar o Julius
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
            A seção de Tutoriais está sendo desenvolvida. Aqui você encontrará guias completos 
            para aproveitar ao máximo todas as funcionalidades do Julius.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tutoriais;
