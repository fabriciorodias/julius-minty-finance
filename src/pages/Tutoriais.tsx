
import { NotionCard, NotionCardContent, NotionCardHeader, NotionCardTitle } from "@/components/ui/notion-card";
import { Construction } from "lucide-react";

const Tutoriais = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-notion-h1 text-notion-gray-900">Tutoriais</h1>
        <p className="text-notion-body text-notion-gray-600 mt-2">
          Aprenda a usar o Julius
        </p>
      </div>

      <NotionCard variant="muted">
        <NotionCardHeader>
          <NotionCardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-notion-blue" />
            Módulo em Desenvolvimento
          </NotionCardTitle>
        </NotionCardHeader>
        <NotionCardContent>
          <p className="text-notion-body text-notion-gray-600">
            A seção de Tutoriais está sendo desenvolvida. Aqui você encontrará guias completos 
            para aproveitar ao máximo todas as funcionalidades do Julius.
          </p>
        </NotionCardContent>
      </NotionCard>
    </div>
  );
};

export default Tutoriais;
