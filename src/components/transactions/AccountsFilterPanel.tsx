
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Account } from '@/hooks/useAccounts';
import { Institution } from '@/hooks/useInstitutions';
import { Search, ChevronDown, ChevronRight, Info, CreditCard, Wallet, PiggyBank, Building, CheckCircle2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getBalanceColors, formatBalanceWithSign, calculateBalanceIntensities } from '@/lib/balance-colors';
import { AccountListSkeleton } from '@/components/ui/enhanced-skeleton';

interface AccountsFilterPanelProps {
  accounts: Account[];
  institutions: Institution[];
  selectedAccountIds: string[];
  onAccountSelectionChange: (accountIds: string[]) => void;
  balanceMap?: Record<string, number>;
}

export function AccountsFilterPanel({
  accounts,
  institutions,
  selectedAccountIds,
  onAccountSelectionChange,
  balanceMap = {},
}: AccountsFilterPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [assetGroupOpen, setAssetGroupOpen] = useState(true);
  const [liabilityGroupOpen, setLiabilityGroupOpen] = useState(true);

  const institutionMap = institutions.reduce((acc, institution) => {
    acc[institution.id] = institution.name;
    return acc;
  }, {} as Record<string, string>);

  const activeAccounts = accounts.filter(account => account.is_active);
  
  // Filter accounts by search term
  const filteredAccounts = activeAccounts.filter(account => 
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    institutionMap[account.institution_id]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const assetAccounts = filteredAccounts.filter(account => account.kind === 'asset');
  const liabilityAccounts = filteredAccounts.filter(account => account.kind === 'liability');

  const isAllSelected = selectedAccountIds.length === activeAccounts.length;
  const hasMultipleSelected = selectedAccountIds.length > 1;

  // Calcula as intensidades de cor para todos os saldos
  const intensityMap = calculateBalanceIntensities(activeAccounts, balanceMap);

  const handleAllClick = () => {
    onAccountSelectionChange(activeAccounts.map(account => account.id));
  };

  const handleAccountClick = (e: React.MouseEvent, accountId: string) => {
    if (e.metaKey || e.ctrlKey) {
      // Multi-selection: toggle the account
      if (selectedAccountIds.includes(accountId)) {
        onAccountSelectionChange(selectedAccountIds.filter(id => id !== accountId));
      } else {
        onAccountSelectionChange([...selectedAccountIds, accountId]);
      }
    } else {
      // Single selection: select only this account
      onAccountSelectionChange([accountId]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  // Get account type icon
  const getAccountIcon = (account: Account) => {
    switch (account.subtype) {
      case 'credit_card':
        return <CreditCard className="h-3 w-3" />;
      case 'cash':
        return <Wallet className="h-3 w-3" />;
      case 'bank':
        return <Building className="h-3 w-3" />;
      case 'investment':
        return <PiggyBank className="h-3 w-3" />;
      default:
        return <Building className="h-3 w-3" />;
    }
  };

  // Calculate group totals
  const getGroupTotal = (accounts: Account[]) => {
    return accounts.reduce((sum, account) => {
      const balance = balanceMap[account.id] ?? 0;
      return sum + (account.kind === 'asset' ? balance : Math.abs(balance));
    }, 0);
  };

  const AccountGroup = ({ 
    title, 
    accounts, 
    isOpen, 
    onToggle 
  }: { 
    title: string; 
    accounts: Account[];
    isOpen: boolean;
    onToggle: () => void;
  }) => {
    const groupTotal = getGroupTotal(accounts);
    
    return (
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between h-auto p-2 font-medium text-sm hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">{title}</span>
              <Badge variant="secondary" className="text-xs h-5 px-2">
                {accounts.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(groupTotal)}
              </span>
              {isOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 mt-2">
          {accounts.map((account) => {
            const isSelected = selectedAccountIds.includes(account.id);
            const balance = balanceMap[account.id] ?? 0;
            const intensity = intensityMap[account.id] || 1;
            const balanceColors = getBalanceColors({
              balance,
              accountKind: account.kind,
              intensity: intensity as any
            });
            
            return (
              <TooltipProvider key={account.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={`relative flex items-center gap-3 w-full rounded-lg px-3 py-2 transition-all text-left group hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        isSelected
                          ? 'bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm'
                          : 'hover:bg-muted/60 hover:shadow-sm'
                      }`}
                      onClick={(e) => handleAccountClick(e, account.id)}
                      onKeyDown={(e) => handleKeyDown(e, () => handleAccountClick(e as any, account.id))}
                      role="button"
                      aria-pressed={isSelected}
                    >
                      {/* Selection indicator */}
                      <div className={`flex-shrink-0 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      
                      {/* Account icon */}
                      <div className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${
                        isSelected 
                          ? 'bg-primary/20 text-primary' 
                          : `${balanceColors.bgColor} ${balanceColors.textColor}`
                      }`}>
                        {getAccountIcon(account)}
                      </div>
                      
                      {/* Account info */}
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate transition-colors ${
                          isSelected ? 'text-primary' : 'group-hover:text-foreground'
                        }`}>
                          {account.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {institutionMap[account.institution_id] || 'Sem instituição'}
                        </div>
                      </div>
                      
                      {/* Balance */}
                      <div className="flex-shrink-0 text-right">
                        <div className={`text-sm font-bold transition-colors ${
                          isSelected ? 'text-primary' : balanceColors.textColor
                        }`}>
                          {formatBalanceWithSign(balance, account.kind, balanceColors.showNegativeSign)}
                        </div>
                        {/* Balance indicator dot */}
                        <div className={`w-1 h-1 rounded-full mx-auto mt-1 transition-colors ${
                          isSelected ? 'bg-primary' : balanceColors.bgColor.replace('bg-', 'bg-').replace('/50', '')
                        }`} />
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="z-50">
                    <div className="text-xs space-y-2">
                      <div className="flex items-center gap-2">
                        {getAccountIcon(account)}
                        <span className="font-medium">
                          {account.kind === 'asset' ? 'Ativo' : 'Passivo'}: {account.name}
                        </span>
                      </div>
                      <div className={`font-bold ${balanceColors.textColor}`}>
                        {formatBalanceWithSign(balance, account.kind, balanceColors.showNegativeSign)}
                      </div>
                      <div className="text-muted-foreground">
                        {account.kind === 'asset' 
                          ? balance >= 0 
                            ? 'Saldo positivo' 
                            : 'Saldo negativo (atenção)'
                          : 'Dívida/Obrigação'
                        }
                      </div>
                      <div className="text-muted-foreground border-t pt-1">
                        {institutionMap[account.institution_id] || 'Sem instituição'}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const totalAllAccounts = getGroupTotal(activeAccounts);

  // Loading state
  if (!accounts.length && balanceMap && Object.keys(balanceMap).length === 0) {
    return (
      <Card className="sticky top-6 h-fit shadow-sm ring-1 ring-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Contas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <AccountListSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="sticky top-6 h-fit shadow-sm ring-1 ring-border/50 overflow-hidden">
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Contas
              {selectedAccountIds.length > 0 && (
                <Badge variant="secondary" className="text-xs h-5 px-2">
                  {selectedAccountIds.length}
                </Badge>
              )}
            </CardTitle>
            {hasMultipleSelected && (
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground/60" />
                </TooltipTrigger>
                <TooltipContent className="z-50">
                  <p className="text-xs">Use Cmd/Ctrl + clique para multisseleção</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder="Buscar contas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 text-sm border-0 bg-muted/50 focus:bg-background transition-colors"
            />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 pt-0">
          {/* All Accounts Toggle */}
          <div className="border-b pb-3">
            <button
              type="button"
              className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 transition-all text-left hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                isAllSelected
                  ? 'bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm'
                  : 'hover:shadow-sm'
              }`}
              onClick={handleAllClick}
              onKeyDown={(e) => handleKeyDown(e, handleAllClick)}
              role="button"
              aria-pressed={isAllSelected}
            >
              {/* Selection indicator */}
              <div className={`flex-shrink-0 transition-opacity ${isAllSelected ? 'opacity-100' : 'opacity-0'}`}>
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              
              {/* Content */}
              <div className="flex-1 flex items-center justify-between">
                <span className={`text-sm font-medium ${isAllSelected ? 'text-primary' : ''}`}>
                  Todas as Contas
                </span>
                <div className="text-right">
                  <div className={`text-sm font-medium ${isAllSelected ? 'text-primary' : 'text-foreground'}`}>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(totalAllAccounts)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total geral
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Asset Accounts */}
          {assetAccounts.length > 0 && (
            <AccountGroup 
              title="Ativos" 
              accounts={assetAccounts}
              isOpen={assetGroupOpen}
              onToggle={() => setAssetGroupOpen(!assetGroupOpen)}
            />
          )}

          {/* Liability Accounts */}
          {liabilityAccounts.length > 0 && (
            <AccountGroup 
              title="Passivos" 
              accounts={liabilityAccounts}
              isOpen={liabilityGroupOpen}
              onToggle={() => setLiabilityGroupOpen(!liabilityGroupOpen)}
            />
          )}

          {/* No results */}
          {searchTerm && filteredAccounts.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              Nenhuma conta encontrada
            </div>
          )}

          {/* Multi-selection hint */}
          {hasMultipleSelected && (
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 border border-border/50 animate-fade-in">
              <div className="flex items-center gap-2">
                <Info className="h-3 w-3" />
                <span><strong>Dica:</strong> Use Cmd/Ctrl + clique para multisseleção</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
