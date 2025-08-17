
import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { AccountsFilterPanel } from './AccountsFilterPanel';
import { TagsFilter } from './TagsFilter';
import { QuickDateFilters } from './QuickDateFilters';
import { Account } from '@/hooks/useAccounts';
import { Institution } from '@/hooks/useInstitutions';

interface FiltersMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  institutions: Institution[];
  selectedAccountIds: string[];
  onAccountSelectionChange: (accountIds: string[]) => void;
  balanceMap: Record<string, number>;
  selectedTags: string[];
  onTagsChange: (tagIds: string[]) => void;
  onDateRangeSelect: (startDate: string, endDate: string) => void;
  currentStartDate?: string;
  currentEndDate?: string;
}

export function FiltersMobileDrawer({
  isOpen,
  onClose,
  accounts,
  institutions,
  selectedAccountIds,
  onAccountSelectionChange,
  balanceMap,
  selectedTags,
  onTagsChange,
  onDateRangeSelect,
  currentStartDate,
  currentEndDate,
}: FiltersMobileDrawerProps) {
  const handleApply = () => {
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Filtros</DrawerTitle>
          <DrawerDescription>
            Selecione contas, tags e período para filtrar suas transações
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="px-4 pb-4 space-y-6 overflow-y-auto">
          <AccountsFilterPanel
            accounts={accounts}
            institutions={institutions}
            selectedAccountIds={selectedAccountIds}
            onAccountSelectionChange={onAccountSelectionChange}
            balanceMap={balanceMap}
          />
          
          <TagsFilter
            selectedTagIds={selectedTags}
            onTagsChange={onTagsChange}
          />
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Período</h4>
            <QuickDateFilters
              onDateRangeSelect={onDateRangeSelect}
              currentStartDate={currentStartDate}
              currentEndDate={currentEndDate}
            />
          </div>
        </div>
        
        <DrawerFooter>
          <Button onClick={handleApply} className="w-full">
            Aplicar Filtros
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
