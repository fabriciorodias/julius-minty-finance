
import { useState } from 'react';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useAccounts } from '@/hooks/useAccounts';
import { useAccountBalances } from '@/hooks/useAccountBalances';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountsList } from '@/components/entities/AccountsList';
import { AccountsSummary } from '@/components/entities/AccountsSummary';
import { InstitutionModal } from '@/components/entities/InstitutionModal';

const Contas = () => {
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
    isCreating: creatingAccount,
    isUpdating: updatingAccount,
    isDeleting: deletingAccount,
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

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Contas</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas contas e instituições financeiras
        </p>
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accounts">Contas</TabsTrigger>
          <TabsTrigger value="institutions">Instituições</TabsTrigger>
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
            onCreateInstitution={handleCreateInstitutionFromAccount}
            isLoading={accountsLoading}
            isCreating={creatingAccount}
            isUpdating={updatingAccount}
            isDeleting={deletingAccount}
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
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
              onClick={() => setShowInstitutionModal(true)}
            >
              Nova Instituição
            </button>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {institutions.map((institution) => (
              <div key={institution.id} className="bg-white rounded shadow p-4">
                <h3 className="font-semibold text-lg">{institution.name}</h3>
                <p className="text-sm text-gray-500">
                  Criado em:{' '}
                  {new Date(institution.created_at).toLocaleDateString()}
                </p>
                <div className="mt-2 flex justify-end space-x-2">
                  <button
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={() => {
                      setSelectedInstitution(institution);
                      setShowInstitutionModal(true);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-700"
                    onClick={() => deleteInstitution(institution.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
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

export default Contas;
