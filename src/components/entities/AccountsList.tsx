import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Edit2, Trash2, CreditCard, Wallet, Eye, EyeOff, Calendar, TrendingUp, Banknote, PiggyBank, TrendingDown, Building2, Home, DollarSign, CheckCircle, Clock, User, Zap, Building, AlertTriangle, Star, MoreHorizontal } from 'lucide-react';
import { AccountModal } from './AccountModal';
import { ReconcileAccountModal } from './ReconcileAccountModal';
import { Account, isCreditCard, SUBTYPE_LABELS, RECONCILIATION_METHOD_LABELS } from '@/hooks/useAccounts';
import { Institution } from '@/hooks/useInstitutions';
import { AccountBalance } from '@/hooks/useAccountBalances';
import { useAccountInitialBalance } from '@/hooks/useAccountInitialBalance';
import { useProfile } from '@/hooks/useProfile';
import { useDefaultAccounts } from '@/hooks/useDefaultAccounts';
import { useReconciliationSettings } from '@/hooks/useReconciliationSettings';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getBalanceColors, formatBalanceWithSign, calculateBalanceIntensities } from '@/lib/balance-colors';

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
  activeFilter?: string;
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
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
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

// Helper function to get institution branding - Julius/Nubank solid style
function getInstitutionBranding(institution: Institution | undefined) {
  if (!institution?.primary_color) {
    return {
      bgColor: '#374151', // gray-700 como fallback
      borderColor: '#4B5563', // gray-600
      logoUrl: institution?.logo_url || undefined,
      hasCustomBranding: false,
    };
  }

  return {
    bgColor: institution.primary_color, // Cor sólida
    borderColor: institution.primary_color,
    logoUrl: institution.logo_url || undefined,
    hasCustomBranding: true,
  };
}

// Helper function to get account groups by kind and subtype
function getAccountGroups(accounts: Account[]) {
  const assetAccounts = accounts.filter(account => account.kind === 'asset');
  const liabilityAccounts = accounts.filter(account => account.kind === 'liability');

  // Group assets by subtype
  const assetGroups = assetAccounts.reduce((groups, account) => {
    const subtype = account.subtype;
    if (!groups[subtype]) groups[subtype] = [];
    groups[subtype].push(account);
    return groups;
  }, {} as Record<string, Account[]>);

  // Group liabilities by subtype
  const liabilityGroups = liabilityAccounts.reduce((groups, account) => {
    const subtype = account.subtype;
    if (!groups[subtype]) groups[subtype] = [];
    groups[subtype].push(account);
    return groups;
  }, {} as Record<string, Account[]>);

  return { assetGroups, liabilityGroups, assetAccounts, liabilityAccounts };
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
  isReconciling,
  activeFilter = 'all'
}: AccountsListProps) {
  const [showModal, setShowModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>();
  const { settings } = useReconciliationSettings();
  const { setFavoriteExpenseAccount, setFavoriteIncomeAccount } = useProfile();
  const { isDefaultAccount } = useDefaultAccounts();

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
        icon: <AlertTriangle className="h-3 w-3 text-red-500" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        method: null,
        isAlert: true,
        alertLevel: 'critical' as const
      };
    }

    const reconciledDate = new Date(account.last_reconciled_at);
    const now = new Date();
    const hoursDiff = Math.floor((now.getTime() - reconciledDate.getTime()) / (1000 * 60 * 60));
    const daysDiff = Math.floor(hoursDiff / 24);

    const methodIcon = getReconciliationMethodIcon(account.last_reconciliation_method);
    const methodLabel = account.last_reconciliation_method 
      ? RECONCILIATION_METHOD_LABELS[account.last_reconciliation_method]
      : 'Manual';

    const isStale = hoursDiff > settings.alertThresholdHours;

    if (daysDiff === 0) {
      return {
        text: 'Conciliada hoje',
        icon: <CheckCircle className="h-3 w-3 text-green-500" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        method: { icon: methodIcon, label: methodLabel },
        isAlert: false,
        alertLevel: null
      };
    } else if (!isStale) {
      const timeText = daysDiff <= 7 
        ? `há ${daysDiff} ${daysDiff === 1 ? 'dia' : 'dias'}`
        : `há ${daysDiff} dias`;
      
      return {
        text: `Conciliada ${timeText}`,
        icon: <CheckCircle className="h-3 w-3 text-green-500" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        method: { icon: methodIcon, label: methodLabel },
        isAlert: false,
        alertLevel: null
      };
    } else {
      return {
        text: `Conciliada há ${daysDiff} dias`,
        icon: <Clock className="h-3 w-3 text-amber-500" />,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        method: { icon: methodIcon, label: methodLabel },
        isAlert: true,
        alertLevel: 'warning' as const
      };
    }
  };

  // Apply active filter
  const getHoursSinceReconciliation = (reconciledAt: string) => {
    const reconciledDate = new Date(reconciledAt);
    const now = new Date();
    return Math.floor((now.getTime() - reconciledDate.getTime()) / (1000 * 60 * 60));
  };

  const filterAccount = (account: Account): boolean => {
    switch (activeFilter) {
      case 'all':
        return account.is_active;
      case 'recently_reconciled':
        if (!account.last_reconciled_at) return false;
        const hoursDiff = getHoursSinceReconciliation(account.last_reconciled_at);
        return hoursDiff <= 72 && account.is_active; // 3 days = 72 hours
      case 'stale_reconciliation':
        if (!account.last_reconciled_at) return false;
        const staleHoursDiff = getHoursSinceReconciliation(account.last_reconciled_at);
        return staleHoursDiff > settings.alertThresholdHours && account.is_active;
      case 'never_reconciled':
        return !account.last_reconciled_at && account.is_active;
      case 'credit_cards':
        return account.subtype === 'credit_card' && account.is_active;
      case 'inactive':
        return !account.is_active;
      default:
        return true;
    }
  };

  const filteredAccounts = accounts.filter(filterAccount);

  const { assetGroups, liabilityGroups, assetAccounts, liabilityAccounts } = getAccountGroups(filteredAccounts);

  // Calcula as intensidades de cor para todos os saldos
  const balanceMap = accountBalances.reduce((acc, balance) => {
    acc[balance.account_id] = balance.current_balance;
    return acc;
  }, {} as Record<string, number>);
  
  const intensityMap = calculateBalanceIntensities(accounts, balanceMap);

  if (isLoading) {
    return <div>Carregando contas...</div>;
  }

  const renderAccountCard = (account: Account) => {
    const balance = getAccountBalance(account.id);
    const institution = institutions.find(i => i.id === account.institution_id);
    const branding = getInstitutionBranding(institution);
    const reconciliationStatus = getReconciliationStatus(account);

    const cardStyle: React.CSSProperties = { 
      backgroundColor: branding.bgColor,
    };

    const cardClasses = `group rounded-lg overflow-hidden transition-all duration-150 cursor-pointer ${
      !account.is_active ? 'opacity-50' : ''
    } hover:shadow-lg hover:scale-[1.01]`;

    const getUpdateText = () => {
      if (!account.last_reconciled_at) return 'Nunca';
      const reconciledDate = new Date(account.last_reconciled_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - reconciledDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) return 'Hoje';
      if (daysDiff === 1) return 'Ontem';
      return `${daysDiff}d`;
    };
    
    return (
      <div 
        key={account.id} 
        className={cardClasses} 
        style={cardStyle}
        onClick={() => handleReconcile(account)}
      >
        <div className="p-3 space-y-2">
          {/* Header: Logo + Nome + Menu */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {branding.logoUrl ? (
                <img 
                  src={branding.logoUrl} 
                  alt={institution?.name || ''} 
                  className="h-6 w-6 rounded object-contain bg-white/20 p-0.5 flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-6 h-6 rounded flex items-center justify-center bg-white/20 flex-shrink-0">
                  {getSubtypeIcon(account.subtype, 'sm')}
                </div>
              )}
              <span className="text-white font-medium text-xs truncate">
                {account.name}
              </span>
              {!account.is_active && <EyeOff className="h-3 w-3 text-white/60 flex-shrink-0" />}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/20 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(account); }}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); setFavoriteExpenseAccount(account.id); }}
                  className={isDefaultAccount(account.id, 'despesa') ? 'bg-accent' : ''}
                >
                  <Star className="mr-2 h-4 w-4" />
                  {isDefaultAccount(account.id, 'despesa') ? 'Padrão Despesas' : 'Padrão Despesas'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); setFavoriteIncomeAccount(account.id); }}
                  className={isDefaultAccount(account.id, 'receita') ? 'bg-accent' : ''}
                >
                  <Star className="mr-2 h-4 w-4" />
                  {isDefaultAccount(account.id, 'receita') ? 'Padrão Receitas' : 'Padrão Receitas'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDeleteAccount(account.id); }}
                  disabled={isDeleting}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Saldo + Status inline */}
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-white tabular-nums">
              {formatCurrency(balance)}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-white/70">
              {reconciliationStatus.isAlert ? (
                <Clock className="h-3 w-3 text-yellow-300" />
              ) : (
                <CheckCircle className="h-3 w-3 text-green-300" />
              )}
              <span>{getUpdateText()}</span>
            </div>
          </div>
          
          {/* Cartão de crédito: disponível */}
          {isCreditCard(account) && account.credit_limit && (
            <div className="text-[10px] text-white/60">
              Disp: {formatCurrency((account.credit_limit || 0) - Math.abs(balance))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAccountGroup = (title: string, icon: React.ReactNode, groups: Record<string, Account[]>, totalCount: number) => (
    <div className="space-y-3">
      {/* Header inline com subtypes como badges */}
      <div className="flex flex-wrap items-center gap-2">
        {icon}
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <span className="text-xs text-white/50">({totalCount})</span>
        
        <div className="flex flex-wrap gap-1 ml-2">
          {Object.entries(groups).map(([subtype, accts]) => (
            <span 
              key={subtype}
              className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-white/70"
            >
              {SUBTYPE_LABELS[subtype as Account['subtype']]} {accts.length}
            </span>
          ))}
        </div>
      </div>
      
      {/* Grid denso de cards */}
      <div className="grid gap-2.5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Object.values(groups).flat().map(renderAccountCard)}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          onClick={() => setShowModal(true)}
          size="sm"
          className="rounded-lg px-4 border border-white/10 hover:bg-white/10 text-sm"
          style={{ backgroundColor: '#1F2937' }}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nova
        </Button>
      </div>

      {/* Assets */}
      {assetAccounts.length > 0 && renderAccountGroup(
        "Ativos", 
        <Wallet className="h-5 w-5 text-blue-600" />, 
        assetGroups, 
        assetAccounts.length
      )}

      {/* Liabilities */}
      {liabilityAccounts.length > 0 && renderAccountGroup(
        "Passivos", 
        <CreditCard className="h-5 w-5 text-purple-600" />, 
        liabilityGroups, 
        liabilityAccounts.length
      )}

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
