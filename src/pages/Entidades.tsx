import { useState } from 'react';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useAccounts } from '@/hooks/useAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useAccountBalances } from '@/hooks/useAccountBalances';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountsList } from '@/components/entities/AccountsList';
import { InstitutionModal } from '@/components/entities/InstitutionModal';
import { CreditCardModal } from '@/components/entities/CreditCardModal';
import { Categories } from '@/components/categories/Categories';

const Entidades = () => {
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  const [showCreditCardModal, setShowCreditCardModal] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [selectedCreditCard, setSelectedCreditCard] = useState(null);

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

  const { data: accountBalances = [] } = useAccountBalances();

  const {
    creditCards,
    isLoading: creditCardsLoading,
    createCreditCard,
    updateCreditCard,
    deleteCreditCard,
    isCreating: creatingCreditCard,
    isUpdating: updatingCreditCard,
    isDeleting: deletingCreditCard,
  } = useCreditCards();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Entidades</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas instituições, contas, cartões de crédito e categorias
        </p>
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="accounts">Contas</TabsTrigger>
          <TabsTrigger value="institutions">Instituições</TabsTrigger>
          <TabsTrigger value="credit-cards">Cartões (Legacy)</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-6">
          <AccountsList
            accounts={accounts}
            institutions={institutions}
            accountBalances={accountBalances}
            onCreateAccount={createAccount}
            onUpdateAccount={updateAccount}
            onDeleteAccount={deleteAccount}
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

          <InstitutionModal
            isOpen={showInstitutionModal}
            onClose={() => {
              setShowInstitutionModal(false);
              setSelectedInstitution(null);
            }}
            onSubmit={
              selectedInstitution ? updateInstitution : createInstitution
            }
            institution={selectedInstitution}
            isLoading={creatingInstitution || updatingInstitution}
          />
        </TabsContent>

        <TabsContent value="credit-cards" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Cartões de Crédito</h2>
              <p className="text-muted-foreground">
                Adicione e gerencie seus cartões de crédito
              </p>
            </div>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
              onClick={() => setShowCreditCardModal(true)}
            >
              Novo Cartão
            </button>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {creditCards.map((card) => (
              <div key={card.id} className="bg-white rounded shadow p-4">
                <h3 className="font-semibold text-lg">{card.name}</h3>
                <p className="text-sm text-gray-500">
                  Limite: {card.card_limit}
                </p>
                <div className="mt-2 flex justify-end space-x-2">
                  <button
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={() => {
                      setSelectedCreditCard(card);
                      setShowCreditCardModal(true);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-700"
                    onClick={() => deleteCreditCard(card.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>

          <CreditCardModal
            isOpen={showCreditCardModal}
            onClose={() => {
              setShowCreditCardModal(false);
              setSelectedCreditCard(null);
            }}
            onSubmit={selectedCreditCard ? updateCreditCard : createCreditCard}
            creditCard={selectedCreditCard}
            institutions={institutions}
            isLoading={creatingCreditCard || updatingCreditCard}
          />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Categories />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Entidades;
