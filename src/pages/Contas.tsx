import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
          <h1 className="text-3xl font-bold text-foreground">Contas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas contas financeiras e instituições
          </p>
        </div>
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList 
          className="p-1 rounded-xl border-0"
          style={{ backgroundColor: '#1F2937' }}
        >
          <TabsTrigger 
            value="accounts"
            className="rounded-lg px-6 py-2.5 text-white/70 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md transition-all"
          >
            Contas
          </TabsTrigger>
          <TabsTrigger 
            value="institutions"
            className="rounded-lg px-6 py-2.5 text-white/70 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md transition-all"
          >
            Instituições
          </TabsTrigger>
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
              <h2 className="text-2xl font-bold text-foreground">Instituições</h2>
              <p className="text-muted-foreground mt-1">
                Gerencie as instituições financeiras onde você possui contas
              </p>
            </div>
            <Button 
              onClick={() => setShowInstitutionModal(true)}
              className="rounded-xl px-6"
              style={{ backgroundColor: '#1F2937' }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Instituição
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeInstitutions.map((institution) => {
              const bgColor = institution.primary_color || '#374151';
              const accountCount = accounts.filter(acc => acc.institution_id === institution.id).length;
              
              return (
                <div 
                  key={institution.id} 
                  className="rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    backgroundColor: bgColor,
                    border: `3px solid ${bgColor}`,
                  }}
                >
                  <div className="p-5">
                    {/* Header: Logo + Nome */}
                    <div className="flex items-center gap-3 mb-4">
                      {institution.logo_url ? (
                        <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center p-1.5">
                          <img 
                            src={institution.logo_url} 
                            alt={institution.name} 
                            className="h-full w-auto object-contain"
                          />
                        </div>
                      ) : (
                        <div 
                          className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center text-white text-lg font-bold"
                        >
                          {institution.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-lg font-semibold text-white">
                        {institution.name}
                      </span>
                    </div>
                    
                    {/* Contagem de Contas */}
                    <p className="text-white/80 text-sm mb-5">
                      {accountCount} conta{accountCount !== 1 ? 's' : ''} vinculada{accountCount !== 1 ? 's' : ''}
                    </p>
                    
                    {/* Ações */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditInstitution(institution)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => deleteInstitution(institution.id)}
                        disabled={isDeletingInstitution}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/30 text-red-200 text-sm font-medium hover:bg-red-500/40 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
