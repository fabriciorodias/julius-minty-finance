import { Categories } from '@/components/categories/Categories';
import { ReconciliationSettingsSection } from '@/components/settings/ReconciliationSettingsSection';
import { ResetSettingsSection } from '@/components/settings/ResetSettingsSection';
import { NotionCard } from '@/components/ui/notion-card';
import { AlertTriangle } from 'lucide-react';

const Configuracoes = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-notion-h1 text-notion-gray-900">Configurações</h1>
        <p className="text-notion-body text-notion-gray-600 mt-2">
          Configure suas categorias e outras preferências do sistema
        </p>
      </div>

      <div className="space-y-6">
        <NotionCard variant="default" className="p-6 transition-notion">
          <h2 className="text-notion-h2 text-notion-gray-900 mb-4">Categorias</h2>
          <Categories />
        </NotionCard>

        <NotionCard variant="default" className="p-6 transition-notion">
          <h2 className="text-notion-h2 text-notion-gray-900 mb-4">Conciliação de Contas</h2>
          <ReconciliationSettingsSection />
        </NotionCard>

        <NotionCard variant="default" className="p-6 border-notion-danger/20 transition-notion">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-notion-danger" />
            <h2 className="text-notion-h2 text-notion-danger">Reset do Sistema</h2>
          </div>
          <p className="text-notion-body text-notion-gray-600 mb-4">
            <strong>Atenção:</strong> As opções abaixo removem dados permanentemente do sistema.
          </p>
          <ResetSettingsSection />
        </NotionCard>
      </div>
    </div>
  );
};

export default Configuracoes;
