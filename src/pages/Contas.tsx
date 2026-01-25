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
    <>
      <Tabs defaultValue="accounts" className="w-full space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList 
            className="p-0.5 rounded-lg border border-white/10 h-8"
            style={{ backgroundColor: '#1F2937' }}
          >
            <TabsTrigger 
              value="accounts"
              className="rounded-md px-3 py-1 text-xs text-white/70 data-[state=active]:bg-white data-[state=active]:text-gray-900 transition-all h-7"
            >
              Contas
            </TabsTrigger>
            <TabsTrigger 
              value="institutions"
              className="rounded-md px-3 py-1 text-xs text-white/70 data-[state=active]:bg-white data-[state=active]:text-gray-900 transition-all h-7"
            >
              Instituições
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="accounts" className="space-y-3 mt-3">
          {/* Summary + Filters numa linha em desktop */}
          <div className="flex flex-col lg:flex-row gap-3">
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
          </div>
          
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

        <TabsContent value="institutions" className="space-y-4 mt-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Instituições</h2>
            <Button 
              onClick={() => setShowInstitutionModal(true)}
              size="sm"
              className="rounded-lg px-4 border border-white/10 hover:bg-white/10 text-sm"
              style={{ backgroundColor: '#1F2937' }}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Nova
            </Button>
          </div>

          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {activeInstitutions.map((institution) => {
              const bgColor = institution.primary_color || '#374151';
              const accountCount = accounts.filter(acc => acc.institution_id === institution.id).length;
              
              return (
                <div 
                  key={institution.id} 
                  className="rounded-lg overflow-hidden transition-all duration-150 hover:scale-[1.01]"
                  style={{ backgroundColor: bgColor }}
                >
                  <div className="p-3">
                    {/* Header: Logo + Nome */}
                    <div className="flex items-center gap-2 mb-2">
                      {institution.logo_url ? (
                        <div className="h-6 w-6 rounded bg-white/20 flex items-center justify-center p-0.5">
                          <img 
                            src={institution.logo_url} 
                            alt={institution.name} 
                            className="h-full w-auto object-contain"
                          />
                        </div>
                      ) : (
                        <div 
                          className="h-6 w-6 rounded bg-white/20 flex items-center justify-center text-white text-xs font-bold"
                        >
                          {institution.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-white truncate">
                        {institution.name}
                      </span>
                    </div>
                    
                    {/* Contagem */}
                    <p className="text-white/70 text-xs mb-3">
                      {accountCount} conta{accountCount !== 1 ? 's' : ''}
                    </p>
                    
                    {/* Ações */}
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleEditInstitution(institution)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-white/20 text-white text-xs font-medium hover:bg-white/30 transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                        Editar
                      </button>
                      <button
                        onClick={() => deleteInstitution(institution.id)}
                        disabled={isDeletingInstitution}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-red-500/30 text-red-200 text-xs font-medium hover:bg-red-500/40 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" />
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
    </>
  );
}
