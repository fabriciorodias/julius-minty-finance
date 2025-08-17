
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { AccountsList } from '@/components/entities/AccountsList';
import { InstitutionModal } from '@/components/entities/InstitutionModal';
import { useAccounts } from '@/hooks/useAccounts';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useAccountBalances } from '@/hooks/useAccountBalances';

export default function Contas() {
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  
  const { 
    accounts, 
    createAccount, 
    updateAccount, 
    deleteAccount,
    reconcileAccount,
    isLoading: accountsLoading, 
    isCreating, 
    isUpdating, 
    isDeleting,
    isReconciling
  } = useAccounts();
  
  const { 
    institutions, 
    createInstitution, 
    updateInstitution, 
    deleteInstitution,
    isLoading: institutionsLoading, 
    isCreating: isCreatingInstitution, 
    isUpdating: isUpdatingInstitution, 
    isDeleting: isDeletingInstitution 
  } = useInstitutions();
  
  const { balances } = useAccountBalances();

  const handleReconcileAccount = (accountId: string, reconciledAt: Date) => {
    reconcileAccount({ accountId, reconciledAt });
  };

  const activeInstitutions = institutions.filter(inst => inst.is_active);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contas</h1>
          <p className="text-muted-foreground">
            Gerencie suas contas financeiras e instituições
          </p>
        </div>
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="accounts">Contas</TabsTrigger>
          <TabsTrigger value="institutions">Instituições</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-6">
          <AccountsList
            accounts={accounts}
            institutions={institutions}
            accountBalances={balances}
            onCreateAccount={createAccount}
            onUpdateAccount={updateAccount}
            onDeleteAccount={deleteAccount}
            onReconcileAccount={handleReconcileAccount}
            onCreateInstitution={() => setShowInstitutionModal(true)}
            isLoading={accountsLoading}
            isCreating={isCreating}
            isUpdating={isUpdating}
            isDeleting={isDeleting}
            isReconciling={isReconciling}
          />
        </TabsContent>

        <TabsContent value="institutions" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Instituições</h2>
              <p className="text-muted-foreground">
                Gerencie as instituições financeiras onde você possui contas
              </p>
            </div>
            <Button onClick={() => setShowInstitutionModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Instituição
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeInstitutions.map((institution) => (
              <Card key={institution.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{institution.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {accounts.filter(acc => acc.institution_id === institution.id).length} contas
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <InstitutionModal
        isOpen={showInstitutionModal}
        onClose={() => setShowInstitutionModal(false)}
        onSubmit={(data) => createInstitution(data)}
        isLoading={isCreatingInstitution}
      />
    </div>
  );
}
