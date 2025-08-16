import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCategories, Category } from "@/hooks/useCategories";
import { useInstitutions } from "@/hooks/useInstitutions";
import { useAccounts } from "@/hooks/useAccounts";
import { useCreditCards } from "@/hooks/useCreditCards";
import { CategoryModal } from "@/components/entities/CategoryModal";
import { InstitutionModal } from "@/components/entities/InstitutionModal";
import { AccountModal } from "@/components/entities/AccountModal";
import { CreditCardModal } from "@/components/entities/CreditCardModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const Entidades = () => {
  const [activeTab, setActiveTab] = useState("categories");
  const [categoryModal, setCategoryModal] = useState({ isOpen: false, category: undefined as Category | undefined });
  const [institutionModal, setInstitutionModal] = useState({ isOpen: false, institution: undefined as any });
  const [accountModal, setAccountModal] = useState({ isOpen: false, account: undefined as any });
  const [creditCardModal, setCreditCardModal] = useState({ isOpen: false, creditCard: undefined as any });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, type: '', id: '', name: '' });

  const { categories, createCategory, updateCategory, deleteCategorySafely, isCreating, isUpdating, isDeleting } = useCategories();
  const { institutions, createInstitution, updateInstitution, deleteInstitutionSafely } = useInstitutions();
  const { accounts, createAccount, updateAccount, deleteAccountSafely } = useAccounts();
  const { creditCards, createCreditCard, updateCreditCard, deleteCreditCardSafely } = useCreditCards();

  const handleDelete = () => {
    switch (deleteDialog.type) {
      case 'category':
        deleteCategorySafely(deleteDialog.id);
        break;
      case 'institution':
        deleteInstitutionSafely(deleteDialog.id);
        break;
      case 'account':
        deleteAccountSafely(deleteDialog.id);
        break;
      case 'creditCard':
        deleteCreditCardSafely(deleteDialog.id);
        break;
    }
    setDeleteDialog({ isOpen: false, type: '', id: '', name: '' });
  };

  const renderCategoryItem = (category: Category, isSubcategory = false) => (
    <div key={category.id} className={`border rounded-lg p-4 ${isSubcategory ? 'ml-6 bg-gray-50' : 'bg-white'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="font-medium">{category.name}</span>
          <Badge variant={category.type === 'receita' ? 'default' : 'secondary'}>
            {category.type}
          </Badge>
          {!category.is_active && (
            <Badge variant="outline">Inativa</Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCategoryModal({ isOpen: true, category })}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteDialog({ 
              isOpen: true, 
              type: 'category', 
              id: category.id, 
              name: category.name 
            })}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {category.subcategories && category.subcategories.length > 0 && (
        <div className="mt-4 space-y-2">
          {category.subcategories.map(subcat => renderCategoryItem(subcat, true))}
        </div>
      )}
    </div>
  );

  const renderInstitutionCard = (institution: any) => {
    const institutionAccounts = accounts.filter(acc => acc.institution_id === institution.id);
    
    return (
      <Card key={institution.id} className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CardTitle className="text-lg">{institution.name}</CardTitle>
              {!institution.is_active && (
                <Badge variant="outline">Inativa</Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAccountModal({ isOpen: true, account: { institution_id: institution.id } })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Conta
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInstitutionModal({ isOpen: true, institution })}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteDialog({ 
                  isOpen: true, 
                  type: 'institution', 
                  id: institution.id, 
                  name: institution.name 
                })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {institutionAccounts.length > 0 && (
          <CardContent>
            <div className="space-y-2">
              {institutionAccounts.map(account => (
                <div key={account.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span>{account.name}</span>
                    {!account.is_active && (
                      <Badge variant="outline" className="text-xs">Inativa</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAccountModal({ isOpen: true, account })}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteDialog({ 
                        isOpen: true, 
                        type: 'account', 
                        id: account.id, 
                        name: account.name 
                      })}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-mint-text-primary">Gerenciar Entidades</h1>
          <p className="text-mint-text-secondary mt-1 font-normal">
            Configure bancos, cartões e categorias
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="institutions">Instituições e Contas</TabsTrigger>
          <TabsTrigger value="creditCards">Cartões de Crédito</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Categorias</h2>
            <Button onClick={() => setCategoryModal({ isOpen: true, category: undefined })}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Categoria
            </Button>
          </div>
          <div className="space-y-4">
            {categories.map(category => renderCategoryItem(category))}
            {categories.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground mb-4">Nenhuma categoria cadastrada</p>
                  <Button onClick={() => setCategoryModal({ isOpen: true, category: undefined })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeira categoria
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="institutions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Instituições e Contas</h2>
            <Button onClick={() => setInstitutionModal({ isOpen: true, institution: undefined })}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Instituição
            </Button>
          </div>
          <div className="space-y-4">
            {institutions.map(institution => renderInstitutionCard(institution))}
            {institutions.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground mb-4">Nenhuma instituição cadastrada</p>
                  <Button onClick={() => setInstitutionModal({ isOpen: true, institution: undefined })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeira instituição
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="creditCards" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Cartões de Crédito</h2>
            <Button 
              onClick={() => setCreditCardModal({ isOpen: true, creditCard: undefined })}
              disabled={institutions.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cartão
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {creditCards.map(card => (
              <Card key={card.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{card.name}</CardTitle>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCreditCardModal({ isOpen: true, creditCard: card })}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog({ 
                          isOpen: true, 
                          type: 'creditCard', 
                          id: card.id, 
                          name: card.name 
                        })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {card.institutions?.name}
                    </p>
                    <p className="text-lg font-semibold">
                      R$ {card.card_limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    {!card.is_active && (
                      <Badge variant="outline">Inativo</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {creditCards.length === 0 && (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground mb-4">
                    {institutions.length === 0 
                      ? "Cadastre uma instituição primeiro para criar cartões"
                      : "Nenhum cartão cadastrado"
                    }
                  </p>
                  {institutions.length > 0 && (
                    <Button onClick={() => setCreditCardModal({ isOpen: true, creditCard: undefined })}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar primeiro cartão
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CategoryModal
        isOpen={categoryModal.isOpen}
        onClose={() => setCategoryModal({ isOpen: false, category: undefined })}
        onSubmit={categoryModal.category ? updateCategory : createCategory}
        category={categoryModal.category}
        categories={categories}
        isLoading={isCreating || isUpdating}
      />

      <InstitutionModal
        isOpen={institutionModal.isOpen}
        onClose={() => setInstitutionModal({ isOpen: false, institution: undefined })}
        onSubmit={institutionModal.institution ? updateInstitution : createInstitution}
        institution={institutionModal.institution}
      />

      <AccountModal
        isOpen={accountModal.isOpen}
        onClose={() => setAccountModal({ isOpen: false, account: undefined })}
        onSubmit={accountModal.account?.id ? updateAccount : createAccount}
        account={accountModal.account?.id ? accountModal.account : undefined}
        institutions={institutions}
      />

      <CreditCardModal
        isOpen={creditCardModal.isOpen}
        onClose={() => setCreditCardModal({ isOpen: false, creditCard: undefined })}
        onSubmit={creditCardModal.creditCard ? updateCreditCard : createCreditCard}
        creditCard={creditCardModal.creditCard}
        institutions={institutions}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={() => setDeleteDialog({ isOpen: false, type: '', id: '', name: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteDialog.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Entidades;
