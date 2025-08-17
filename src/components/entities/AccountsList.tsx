
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit2, Trash2, CreditCard, Wallet, Eye, EyeOff, Calendar, TrendingUp, Banknote, PiggyBank, TrendingDown, Building2, Home, DollarSign, CheckCircle, Clock, User, Zap, Building } from 'lucide-react';
import { AccountModal } from './AccountModal';
import { ReconcileAccountModal } from './ReconcileAccountModal';
import { Account, isCreditCard, isBudgetAccount, SUBTYPE_LABELS, RECONCILIATION_METHOD_LABELS } from '@/hooks/useAccounts';
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
  onReconcileAccount: (accountId: string, reconciledAt: Date) => void;
  onCreateInstitution?: () => void;
  isLoading?: boolean;
  isCreating?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
  isReconciling?: boolean;
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

// Helper function to get subtype icon
function getSubtypeIcon(subtype: Account['subtype'], size: 'sm' | 'md' = 'md') {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  
  switch (subtype) {
    case 'cash':
      return <Banknote className={`${iconSize} text-green-600`} />;
    case 'bank':
      return <Building2 className={`${iconSize} text-blue-600`} />;
    case 'investment':
      return <TrendingUp className={`${iconSize} text-emerald-600`} />;
    case 'property_rights':
      return <Home className={`${iconSize} text-amber-600`} />;
    case 'other_assets':
      return <PiggyBank className={`${iconSize} text-indigo-600`} />;
    case 'credit_card':
      return <CreditCard className={`${iconSize} text-purple-600`} />;
    case 'loan':
      return <TrendingDown className={`${iconSize} text-red-600`} />;
    case 'other_liabilities':
      return <DollarSign className={`${iconSize} text-orange-600`} />;
    default:
      return <Wallet className={`${iconSize} text-gray-600`} />;
  }
}

// Helper function to get reconciliation method icon
function getReconciliationMethodIcon(method?: Account['last_reconciliation_method']) {
  if (!method) return null;
  
  switch (method) {
    case 'manual':
      return <User className="h-3 w-3" />;
    case 'automacao':
      return <Zap className="h-3 w-3" />;
    case 'open_finance':
      return <Building className="h-3 w-3" />;
    default:
      return null;
  }
}

// Helper function to get kind color scheme
function getKindColorScheme(kind: Account['kind']) {
  switch (kind) {
    case 'asset':
      return {
        border: 'border-l-blue-500',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        gradient: 'bg-gradient-to-br from-blue-50/50 to-blue-100/30'
      };
    case 'liability':
      return {
        border: 'border-l-purple-500',
        badge: 'bg-purple-50 text-purple-700 border-purple-200',
        gradient: 'bg-gradient-to-br from-purple-50/50 to-purple-100/30'
      };
    default:
      return {
        border: 'border-l-gray-500',
        badge: 'bg-gray-50 text-gray-700 border-gray-200',
        gradient: 'bg-gradient-to-br from-gray-50/50 to-gray-100/30'
      };
  }
}

export function AccountsList({
  accounts,
  institutions,
  accountBalances,
  onCreateAccount,
  onUpdateAccount,
  onDeleteAccount,
  onReconcileAccount,
  onCreateInstitution,
  isLoading,
  isCreating,
  isUpdating,
  isDeleting,
  isReconciling
}: AccountsListProps) {
  const [showModal, setShowModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>();

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setShowModal(true);
  };

  const handleReconcile = (account: Account) => {
    setSelectedAccount(account);
    setShowReconcileModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAccount(undefined);
  };

  const handleCloseReconcileModal = () => {
    setShowReconcileModal(false);
    setSelectedAccount(undefined);
  };

  const handleSubmit = (accountData: any) => {
    if (selectedAccount) {
      onUpdateAccount(accountData);
    } else {
      onCreateAccount(accountData);
    }
  };

  const handleReconcileConfirm = (reconciledAt: Date) => {
    if (selectedAccount) {
      onReconcileAccount(selectedAccount.id, reconciledAt);
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
    if (!isCreditCard(account) || !account.credit_limit) return 0;
    const balance = Math.abs(getAccountBalance(account.id));
    return (balance / account.credit_limit) * 100;
  };

  const getReconciliationStatus = (account: Account) => {
    if (!account.last_reconciled_at) {
      return {
        text: 'Nunca conciliada',
        icon: <Clock className="h-3 w-3 text-orange-500" />,
        color: 'text-orange-600',
        method: null
      };
    }

    const reconciledDate = new Date(account.last_reconciled_at);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - reconciledDate.getTime()) / (1000 * 60 * 60 * 24));

    const methodIcon = getReconciliationMethodIcon(account.last_reconciliation_method);
    const methodLabel = account.last_reconciliation_method 
      ? RECONCILIATION_METHOD_LABELS[account.last_reconciliation_method]
      : 'Manual';

    if (daysDiff === 0) {
      return {
        text: 'Conciliada hoje',
        icon: <CheckCircle className="h-3 w-3 text-green-500" />,
        color: 'text-green-600',
        method: { icon: methodIcon, label: methodLabel }
      };
    } else if (daysDiff <= 7) {
      return {
        text: `Conciliada há ${daysDiff} ${daysDiff === 1 ? 'dia' : 'dias'}`,
        icon: <CheckCircle className="h-3 w-3 text-green-500" />,
        color: 'text-green-600',
        method: { icon: methodIcon, label: methodLabel }
      };
    } else {
      return {
        text: `Conciliada há ${daysDiff} dias`,
        icon: <Clock className="h-3 w-3 text-orange-500" />,
        color: 'text-orange-600',
        method: { icon: methodIcon, label: methodLabel }
      };
    }
  };

  // Usar as helper functions para manter compatibilidade
  const budgetAccounts = accounts.filter(isBudgetAccount);
  const creditAccounts = accounts.filter(isCreditCard);

  if (isLoading) {
    return <div>Carregando contas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Contas</h2>
          <p className="text-muted-foreground">
            Gerencie suas contas de ativos e passivos
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {/* Contas de Ativo */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Ativos</h3>
          <Badge variant="secondary">{budgetAccounts.length}</Badge>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgetAccounts.map((account) => {
            const balance = getAccountBalance(account.id);
            const colorScheme = getKindColorScheme(account.kind);
            const reconciliationStatus = getReconciliationStatus(account);
            
            return (
              <Card key={account.id} className={`group hover:shadow-lg transition-all duration-200 border-l-4 ${colorScheme.border} ${colorScheme.gradient} ${!account.is_active ? 'opacity-50' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getSubtypeIcon(account.subtype, 'sm')}
                        {!account.is_active && <EyeOff className="h-4 w-4 text-muted-foreground" />}
                        {account.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground font-medium">
                        {getInstitutionName(account.institution_id)}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={colorScheme.badge}>
                          {SUBTYPE_LABELS[account.subtype]}
                        </Badge>
                      </div>
                      <AccountInitialBalanceInfo accountId={account.id} />
                      
                      {/* Reconciliation Status */}
                      <div className={`flex items-center gap-2 text-xs ${reconciliationStatus.color}`}>
                        {reconciliationStatus.icon}
                        <span>{reconciliationStatus.text}</span>
                        {reconciliationStatus.method && (
                          <div className="flex items-center gap-1 ml-2">
                            {reconciliationStatus.method.icon}
                            <span>({reconciliationStatus.method.label})</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReconcile(account)}
                        disabled={isReconciling}
                        className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                        title="Conciliar conta"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
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

      {/* Contas de Passivo */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Passivos</h3>
          <Badge variant="secondary">{creditAccounts.length}</Badge>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {creditAccounts.map((account) => {
            const balance = Math.abs(getAccountBalance(account.id));
            const utilization = getCreditUtilization(account);
            const availableCredit = (account.credit_limit || 0) - balance;
            const colorScheme = getKindColorScheme(account.kind);
            const reconciliationStatus = getReconciliationStatus(account);
            
            return (
              <Card key={account.id} className={`group hover:shadow-lg transition-all duration-200 border-l-4 ${colorScheme.border} ${colorScheme.gradient} ${!account.is_active ? 'opacity-50' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getSubtypeIcon(account.subtype, 'sm')}
                        {!account.is_active && <EyeOff className="h-4 w-4 text-muted-foreground" />}
                        {account.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground font-medium">
                        {getInstitutionName(account.institution_id)}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={colorScheme.badge}>
                          {SUBTYPE_LABELS[account.subtype]}
                        </Badge>
                      </div>
                      <AccountInitialBalanceInfo accountId={account.id} />
                      
                      {/* Reconciliation Status */}
                      <div className={`flex items-center gap-2 text-xs ${reconciliationStatus.color}`}>
                        {reconciliationStatus.icon}
                        <span>{reconciliationStatus.text}</span>
                        {reconciliationStatus.method && (
                          <div className="flex items-center gap-1 ml-2">
                            {reconciliationStatus.method.icon}
                            <span>({reconciliationStatus.method.label})</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReconcile(account)}
                        disabled={isReconciling}
                        className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                        title="Conciliar conta"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
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
                  {isCreditCard(account) ? (
                    <>
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
                    </>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Saldo Atual</span>
                        <span className={`text-lg font-bold ${balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(balance)}
                        </span>
                      </div>
                    </div>
                  )}
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

      <ReconcileAccountModal
        isOpen={showReconcileModal}
        onClose={handleCloseReconcileModal}
        onConfirm={handleReconcileConfirm}
        account={selectedAccount}
        isLoading={isReconciling}
      />
    </div>
  );
}
