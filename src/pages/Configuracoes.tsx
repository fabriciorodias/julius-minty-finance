
import { Categories } from '@/components/categories/Categories';
import { ReconciliationSettingsSection } from '@/components/settings/ReconciliationSettingsSection';
import { ResetSettingsSection } from '@/components/settings/ResetSettingsSection';

const Configuracoes = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Configure suas categorias e outras preferências do sistema
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">Categorias</h2>
          <Categories />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Conciliação de Contas</h2>
          <ReconciliationSettingsSection />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Reset do Sistema</h2>
          <p className="text-muted-foreground mb-4">
            <strong>Atenção:</strong> As opções abaixo removem dados permanentemente do sistema.
          </p>
          <ResetSettingsSection />
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
