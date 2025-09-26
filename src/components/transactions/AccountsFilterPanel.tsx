
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Account } from '@/hooks/useAccounts';
import { Institution } from '@/hooks/useInstitutions';
import { Search, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getBalanceColors, formatBalanceWithSign, calculateBalanceIntensities } from '@/lib/balance-colors';

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
  }) => (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-auto p-2 font-medium text-sm hover:bg-muted/50"
        >
          <span className="text-muted-foreground">{title}</span>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs h-5">
              {accounts.length}
            </Badge>
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
                    className={`relative flex items-center justify-between w-full rounded-lg px-3 py-2.5 transition-all text-left group hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 border-l-4 ${
                      isSelected
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/20 border-l-primary'
                        : `hover:bg-muted/60 ${balanceColors.borderColor}`
                    } ${balanceColors.bgColor} hover:shadow-sm`}
                    onClick={(e) => handleAccountClick(e, account.id)}
                    onKeyDown={(e) => handleKeyDown(e, () => handleAccountClick(e as any, account.id))}
                    role="button"
                    aria-pressed={isSelected}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate transition-colors ${
                        isSelected ? 'text-primary' : 'group-hover:text-foreground'
                      }`}>
                        {account.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {institutionMap[account.institution_id] || 'Instituição'}
                      </div>
                    </div>
                    <div className={`text-sm ml-2 font-bold transition-colors ${
                      isSelected ? 'text-primary' : balanceColors.textColor
                    }`}>
                      {formatBalanceWithSign(balance, account.kind, balanceColors.showNegativeSign)}
                    </div>
                    
                    {/* Indicador visual de intensidade */}
                    <div className={`absolute top-1 right-1 w-2 h-2 rounded-full opacity-60 ${balanceColors.bgColor.replace('bg-', 'bg-').replace('-bg-', '-')}`} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="z-50">
                  <div className="text-xs space-y-1">
                    <p className="font-medium">
                      {account.kind === 'asset' ? 'Ativo' : 'Passivo'}: {account.name}
                    </p>
                    <p className={balanceColors.textColor}>
                      {formatBalanceWithSign(balance, account.kind, balanceColors.showNegativeSign)}
                    </p>
                    <p className="text-muted-foreground">
                      {account.kind === 'asset' 
                        ? balance >= 0 
                          ? 'Saldo positivo (bom)' 
                          : 'Saldo negativo (atenção)'
                        : 'Dívida/Obrigação'
                      }
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <TooltipProvider>
      <Card className="sticky top-6 h-fit shadow-sm ring-1 ring-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              Contas
              {selectedAccountIds.length > 0 && (
                <Badge variant="secondary" className="text-xs">
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
              className="pl-9 h-9 text-sm"
            />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* All Accounts Toggle */}
          <div className="border-b pb-3">
            <button
              type="button"
              className={`flex items-center justify-between w-full rounded-lg px-3 py-2.5 transition-all text-left hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                isAllSelected
                  ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                  : ''
              }`}
              onClick={handleAllClick}
              onKeyDown={(e) => handleKeyDown(e, handleAllClick)}
              role="button"
              aria-pressed={isAllSelected}
            >
              <span className={`text-sm font-medium ${isAllSelected ? 'text-primary' : ''}`}>
                Todas as Contas
              </span>
              {isAllSelected && (
                <div className={`text-sm ml-2 font-medium ${isAllSelected ? 'text-primary' : ''}`}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(
                    activeAccounts.reduce((sum, account) => {
                      const balance = balanceMap[account.id] ?? 0;
                      return account.kind === 'asset' ? sum + balance : sum + Math.abs(balance);
                    }, 0)
                  )}
                </div>
              )}
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
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 border border-border/50">
              <strong>Dica:</strong> Use Cmd/Ctrl + clique para selecionar múltiplas contas
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
