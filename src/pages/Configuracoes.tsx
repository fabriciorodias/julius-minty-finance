import { Categories } from '@/components/categories/Categories';
import { ReconciliationSettingsSection } from '@/components/settings/ReconciliationSettingsSection';
import { ResetSettingsSection } from '@/components/settings/ResetSettingsSection';
import { OriginCard } from '@/components/ui/origin-card';
import { AlertTriangle } from 'lucide-react';

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
        <OriginCard glass className="liquid-glass-subtle p-6 animate-fade-in">
          <h2 className="text-2xl font-bold mb-4">Categorias</h2>
          <Categories />
        </OriginCard>

        <OriginCard glass className="liquid-glass-primary p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h2 className="text-2xl font-bold mb-4">Conciliação de Contas</h2>
          <ReconciliationSettingsSection />
        </OriginCard>

        <OriginCard glass className="liquid-glass-danger p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <h2 className="text-2xl font-bold text-destructive">Reset do Sistema</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            <strong>Atenção:</strong> As opções abaixo removem dados permanentemente do sistema.
          </p>
          <ResetSettingsSection />
        </OriginCard>
      </div>
    </div>
  );
};

export default Configuracoes;
