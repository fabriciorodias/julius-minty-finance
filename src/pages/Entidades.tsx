import { useState } from 'react';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useAccounts } from '@/hooks/useAccounts';
import { useAccountBalances } from '@/hooks/useAccountBalances';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OriginCard } from '@/components/ui/origin-card';
import { Button } from '@/components/ui/button';
import { AccountsList } from '@/components/entities/AccountsList';
import { AccountsSummary } from '@/components/entities/AccountsSummary';
import { InstitutionModal } from '@/components/entities/InstitutionModal';
import { Categories } from '@/components/categories/Categories';

const Entidades = () => {
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [institutionModalFromAccount, setInstitutionModalFromAccount] = useState(false);

  const {
    institutions,
    isLoading: institutionsLoading,
    createInstitution,
    updateInstitution,
    deleteInstitution,
    isCreating: creatingInstitution,
    isUpdating: updatingInstitution,
    isDeleting: deletingInstitution,
  } = useInstitutions();

  const {
    accounts,
    isLoading: accountsLoading,
    createAccount,
    updateAccount,
    deleteAccount,
    reconcileAccount,
    isCreating: creatingAccount,
    isUpdating: updatingAccount,
    isDeleting: deletingAccount,
    isReconciling,
  } = useAccounts();

  const { balances: accountBalances = [] } = useAccountBalances();

  const handleCreateInstitutionFromAccount = () => {
    setInstitutionModalFromAccount(true);
    setShowInstitutionModal(true);
  };

  const handleInstitutionModalClose = () => {
    setShowInstitutionModal(false);
    setSelectedInstitution(null);
    setInstitutionModalFromAccount(false);
  };

  const handleInstitutionSubmit = (institutionData: any) => {
    if (selectedInstitution) {
      updateInstitution(institutionData);
    } else {
      createInstitution(institutionData);
    }
  };

  const handleReconcileAccount = (accountId: string, reconciledAt: Date) => {
    reconcileAccount({ accountId, reconciledAt });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Entidades</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas instituições, contas e categorias
        </p>
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="accounts">Contas</TabsTrigger>
          <TabsTrigger value="institutions">Instituições</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-6">
          <AccountsSummary
            accounts={accounts}
            accountBalances={accountBalances}
            isLoading={accountsLoading}
          />
          
          <AccountsList
            accounts={accounts}
            institutions={institutions}
            accountBalances={accountBalances}
            onCreateAccount={createAccount}
            onUpdateAccount={updateAccount}
            onDeleteAccount={deleteAccount}
            onReconcileAccount={handleReconcileAccount}
            onCreateInstitution={handleCreateInstitutionFromAccount}
            isLoading={accountsLoading}
            isCreating={creatingAccount}
            isUpdating={updatingAccount}
            isDeleting={deletingAccount}
            isReconciling={isReconciling}
          />
        </TabsContent>

        <TabsContent value="institutions" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Instituições</h2>
              <p className="text-muted-foreground">
                Adicione e gerencie as instituições financeiras
              </p>
            </div>
            <Button onClick={() => setShowInstitutionModal(true)}>
              Nova Instituição
            </Button>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {institutions.map((institution, index) => (
              <OriginCard 
                key={institution.id} 
                glass 
                hover
                className="liquid-glass-primary animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{institution.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Criado em: {new Date(institution.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedInstitution(institution);
                        setShowInstitutionModal(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteInstitution(institution.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </OriginCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Categories />
        </TabsContent>
      </Tabs>

      <InstitutionModal
        isOpen={showInstitutionModal}
        onClose={handleInstitutionModalClose}
        onSubmit={handleInstitutionSubmit}
        institution={selectedInstitution}
        isLoading={creatingInstitution || updatingInstitution}
      />
    </div>
  );
};

export default Entidades;
