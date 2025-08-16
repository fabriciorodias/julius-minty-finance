
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Account } from '@/hooks/useAccounts';
import { Institution } from '@/hooks/useInstitutions';
import { AccountModal } from './AccountModal';
import { DeleteConfirmationDialog } from '@/components/transactions/DeleteConfirmationDialog';
import { CreditCard, Wallet, MoreVertical, Edit, Trash2, Plus } from 'lucide-react';

interface AccountsListProps {
  accounts: Account[];
  institutions: Institution[];
  accountBalances: { account_id: string; current_balance: number }[];
  onCreateAccount: (data: any) => void;
  onUpdateAccount: (data: any) => void;
  onDeleteAccount: (id: string) => void;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function AccountsList({
  accounts,
  institutions,
  accountBalances,
  onCreateAccount,
  onUpdateAccount,
  onDeleteAccount,
  isLoading,
  isCreating,
  isUpdating,
  isDeleting
}: AccountsListProps) {
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const budgetAccounts = accounts.filter(account => account.type === 'on_budget' && account.is_active);
  const creditAccounts = accounts.filter(account => account.type === 'credit' && account.is_active);

  const getAccountBalance = (accountId: string) => {
    const balance = accountBalances.find(b => b.account_id === accountId);
    return balance?.current_balance || 0;
  };

  const getInstitutionName = (institutionId: string) => {
    const institution = institutions.find(i => i.id === institutionId);
    return institution?.name || 'N/A';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    setShowAccountModal(true);
  };

  const handleDeleteAccount = (account: Account) => {
    setSelectedAccount(account);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (selectedAccount) {
      onDeleteAccount(selectedAccount.id);
      setShowDeleteDialog(false);
      setSelectedAccount(null);
    }
  };

  const getCreditCardStatus = (balance: number, limit?: number) => {
    if (!limit) return { available: 0, used: Math.abs(balance) };
    const used = Math.abs(balance);
    const available = Math.max(0, limit - used);
    return { available, used };
  };

  return (
    <div className="space-y-6">
      {/* Header com botão de adicionar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Contas</h2>
          <p className="text-muted-foreground">Gerencie suas contas de orçamento e cartões de crédito</p>
        </div>
        <Button onClick={() => setShowAccountModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {/* Contas de Orçamento */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Contas de Orçamento</h3>
          <Badge variant="secondary">{budgetAccounts.length}</Badge>
        </div>
        
        {budgetAccounts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma conta de orçamento cadastrada
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {budgetAccounts.map((account) => {
              const balance = getAccountBalance(account.id);
              return (
                <Card key={account.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{account.name}</CardTitle>
                        <CardDescription>{getInstitutionName(account.institution_id)}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteAccount(account)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(balance)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Cartões de Crédito */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Cartões de Crédito</h3>
          <Badge variant="secondary">{creditAccounts.length}</Badge>
        </div>
        
        {creditAccounts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum cartão de crédito cadastrado
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {creditAccounts.map((account) => {
              const balance = getAccountBalance(account.id);
              const { available, used } = getCreditCardStatus(balance, account.credit_limit);
              const utilizationPercent = account.credit_limit ? (used / account.credit_limit) * 100 : 0;
              
              return (
                <Card key={account.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{account.name}</CardTitle>
                        <CardDescription>{getInstitutionName(account.institution_id)}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteAccount(account)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm text-muted-foreground mb-1">
                        <span>Fatura Atual</span>
                        <span>Limite</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-lg font-bold ${used > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(used)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(account.credit_limit || 0)}
                        </span>
                      </div>
                    </div>
                    
                    {account.credit_limit && (
                      <div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                          <span>Disponível</span>
                          <span>{utilizationPercent.toFixed(0)}% usado</span>
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(available)}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className={`h-2 rounded-full ${utilizationPercent > 80 ? 'bg-red-500' : utilizationPercent > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Conta */}
      <AccountModal
        isOpen={showAccountModal}
        onClose={() => {
          setShowAccountModal(false);
          setSelectedAccount(null);
        }}
        onSubmit={selectedAccount ? onUpdateAccount : onCreateAccount}
        account={selectedAccount}
        institutions={institutions}
        isLoading={isCreating || isUpdating}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedAccount(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Excluir Conta"
        description={`Tem certeza que deseja excluir a conta "${selectedAccount?.name}"? Esta ação não pode ser desfeita.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
