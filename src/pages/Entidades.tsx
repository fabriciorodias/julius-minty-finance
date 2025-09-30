import { useState } from 'react';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useAccounts } from '@/hooks/useAccounts';
import { useAccountBalances } from '@/hooks/useAccountBalances';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotionCard } from '@/components/ui/notion-card';
import { NotionButton } from '@/components/ui/notion-button';
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
        <h1 className="text-notion-h1 text-notion-gray-900">Entidades</h1>
        <p className="text-notion-body text-notion-gray-600 mt-2">
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
              <h2 className="text-notion-h2 text-notion-gray-900">Instituições</h2>
              <p className="text-notion-body text-notion-gray-600">
                Adicione e gerencie as instituições financeiras
              </p>
            </div>
            <NotionButton onClick={() => setShowInstitutionModal(true)}>
              Nova Instituição
            </NotionButton>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {institutions.map((institution) => (
              <NotionCard 
                key={institution.id} 
                variant="hoverable"
                className="transition-notion"
              >
                <div className="p-6">
                  <h3 className="text-notion-h3 text-notion-gray-900 mb-2">{institution.name}</h3>
                  <p className="text-notion-body-sm text-notion-gray-600 mb-4">
                    Criado em: {new Date(institution.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex justify-end gap-2">
                    <NotionButton
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedInstitution(institution);
                        setShowInstitutionModal(true);
                      }}
                    >
                      Editar
                    </NotionButton>
                    <NotionButton
                      variant="danger"
                      size="sm"
                      onClick={() => deleteInstitution(institution.id)}
                    >
                      Excluir
                    </NotionButton>
                  </div>
                </div>
              </NotionCard>
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
