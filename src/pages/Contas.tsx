
import { useState } from 'react';
import { NotionButton } from '@/components/ui/notion-button';
import { NotionCard, NotionCardHeader, NotionCardTitle, NotionCardContent } from '@/components/ui/notion-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { AccountsList } from '@/components/entities/AccountsList';
import { AccountsSummary } from '@/components/entities/AccountsSummary';
import { InstitutionModal } from '@/components/entities/InstitutionModal';
import { AccountsQuickFilters, AccountFilter } from '@/components/entities/AccountsQuickFilters';
import { useAccounts } from '@/hooks/useAccounts';
import { useInstitutions, Institution } from '@/hooks/useInstitutions';
import { useAccountBalances } from '@/hooks/useAccountBalances';

export default function Contas() {
  console.log('Contas: Component rendering...');
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [activeFilter, setActiveFilter] = useState<AccountFilter>('all');
  
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

  const handleInstitutionModalClose = () => {
    setShowInstitutionModal(false);
    setSelectedInstitution(null);
  };

  const handleInstitutionSubmit = (data: any) => {
    if (selectedInstitution) {
      updateInstitution({ id: selectedInstitution.id, ...data });
    } else {
      createInstitution(data);
    }
  };

  const handleEditInstitution = (institution: Institution) => {
    setSelectedInstitution(institution);
    setShowInstitutionModal(true);
  };

  const activeInstitutions = institutions.filter(inst => inst.is_active);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-notion-h1 text-notion-gray-900">Contas</h1>
          <p className="text-notion-body text-notion-gray-600">
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
          <AccountsSummary
            accounts={accounts}
            accountBalances={balances}
            isLoading={accountsLoading}
          />
          
          <AccountsQuickFilters
            accounts={accounts}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
          
          <AccountsList
            activeFilter={activeFilter}
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
              <h2 className="text-notion-h2 text-notion-gray-900">Instituições</h2>
              <p className="text-notion-body text-notion-gray-600">
                Gerencie as instituições financeiras onde você possui contas
              </p>
            </div>
            <NotionButton onClick={() => setShowInstitutionModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Instituição
            </NotionButton>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeInstitutions.map((institution) => (
              <NotionCard 
                key={institution.id} 
                variant="hoverable"
                className="transition-notion"
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: institution.primary_color || undefined,
                }}
              >
                <NotionCardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    {institution.logo_url ? (
                      <img 
                        src={institution.logo_url} 
                        alt={institution.name} 
                        className="h-6 w-auto max-w-[60px] object-contain"
                      />
                    ) : institution.primary_color ? (
                      <div 
                        className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: institution.primary_color }}
                      >
                        {institution.name.charAt(0).toUpperCase()}
                      </div>
                    ) : null}
                    <NotionCardTitle>{institution.name}</NotionCardTitle>
                  </div>
                </NotionCardHeader>
                <NotionCardContent>
                  <div className="text-notion-body-sm text-notion-gray-600 mb-4">
                    {accounts.filter(acc => acc.institution_id === institution.id).length} contas
                  </div>
                  <div className="flex justify-end gap-2">
                    <NotionButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditInstitution(institution)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </NotionButton>
                    <NotionButton
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteInstitution(institution.id)}
                      disabled={isDeletingInstitution}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </NotionButton>
                  </div>
                </NotionCardContent>
              </NotionCard>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <InstitutionModal
        isOpen={showInstitutionModal}
        onClose={handleInstitutionModalClose}
        onSubmit={handleInstitutionSubmit}
        institution={selectedInstitution ?? undefined}
        isLoading={isCreatingInstitution || isUpdatingInstitution}
      />
    </div>
  );
}
