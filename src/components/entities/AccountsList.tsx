
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit2, Trash2, CreditCard, Wallet, Eye, EyeOff, Calendar, TrendingUp } from 'lucide-react';
import { AccountModal } from './AccountModal';
import { Account } from '@/hooks/useAccounts';
import { Institution } from '@/hooks/useInstitutions';
import { AccountBalance } from '@/hooks/useAccountBalances';
import { useAccountInitialBalance } from '@/hooks/useAccountInitialBalance';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AccountsListProps {
  accounts: Account[];
  institutions: Institution[];
  accountBalances: AccountBalance[];
  onCreateAccount: (accountData: any) => void;
  onUpdateAccount: (accountData: any) => void;
  onDeleteAccount: (accountId: string) => void;
  onCreateInstitution?: () => void;
  isLoading?: boolean;
  isCreating?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

function AccountInitialBalanceInfo({ accountId }: { accountId: string }) {
  const { data: initialBalance, isLoading } = useAccountInitialBalance(accountId);

  if (isLoading || !initialBalance) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <TrendingUp className="h-3 w-3" />
      <span>Inicial: {formatCurrency(initialBalance.amount)}</span>
      <div className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        <span>{formatDate(initialBalance.balance_date)}</span>
      </div>
    </div>
  );
}

export function AccountsList({
  accounts,
  institutions,
  accountBalances,
  onCreateAccount,
  onUpdateAccount,
  onDeleteAccount,
  onCreateInstitution,
  isLoading,
  isCreating,
  isUpdating,
  isDeleting
}: AccountsListProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>();

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAccount(undefined);
  };

  const handleSubmit = (accountData: any) => {
    if (selectedAccount) {
      onUpdateAccount(accountData);
    } else {
      onCreateAccount(accountData);
    }
  };

  const getInstitutionName = (institutionId: string) => {
    const institution = institutions.find(inst => inst.id === institutionId);
    return institution?.name || 'Instituição não encontrada';
  };

  const getAccountBalance = (accountId: string) => {
    const balance = accountBalances.find(bal => bal.account_id === accountId);
    return balance?.current_balance || 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getCreditUtilization = (account: Account) => {
    if (account.type !== 'credit' || !account.credit_limit) return 0;
    const balance = Math.abs(getAccountBalance(account.id));
    return (balance / account.credit_limit) * 100;
  };

  const budgetAccounts = accounts.filter(account => account.type === 'on_budget');
  const creditAccounts = accounts.filter(account => account.type === 'credit');

  if (isLoading) {
    return <div>Carregando contas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Contas</h2>
          <p className="text-muted-foreground">
            Gerencie suas contas bancárias e cartões de crédito
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {/* Contas de Orçamento */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Contas de Orçamento</h3>
          <Badge variant="secondary">{budgetAccounts.length}</Badge>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgetAccounts.map((account) => {
            const balance = getAccountBalance(account.id);
            return (
              <Card key={account.id} className={`group hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 ${!account.is_active ? 'opacity-50' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {!account.is_active && <EyeOff className="h-4 w-4 text-muted-foreground" />}
                        {account.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground font-medium">
                        {getInstitutionName(account.institution_id)}
                      </p>
                      <AccountInitialBalanceInfo accountId={account.id} />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(account)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteAccount(account.id)}
                        disabled={isDeleting}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">Saldo Atual</span>
                      <span className={`text-lg font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(balance)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cartões de Crédito */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Cartões de Crédito</h3>
          <Badge variant="secondary">{creditAccounts.length}</Badge>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {creditAccounts.map((account) => {
            const balance = Math.abs(getAccountBalance(account.id));
            const utilization = getCreditUtilization(account);
            const availableCredit = (account.credit_limit || 0) - balance;
            
            return (
              <Card key={account.id} className={`group hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500 ${!account.is_active ? 'opacity-50' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {!account.is_active && <EyeOff className="h-4 w-4 text-muted-foreground" />}
                        {account.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground font-medium">
                        {getInstitutionName(account.institution_id)}
                      </p>
                      <AccountInitialBalanceInfo accountId={account.id} />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(account)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteAccount(account.id)}
                        disabled={isDeleting}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">Utilizado</span>
                      <span className="font-semibold">{formatCurrency(balance)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">Disponível</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(availableCredit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">Limite</span>
                      <span className="font-semibold">{formatCurrency(account.credit_limit || 0)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-medium">Utilização</span>
                      <span className={`font-semibold ${utilization > 80 ? 'text-red-600' : utilization > 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {utilization.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={utilization} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <AccountModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        account={selectedAccount}
        institutions={institutions}
        isLoading={isCreating || isUpdating}
        onCreateInstitution={onCreateInstitution}
      />
    </div>
  );
}
