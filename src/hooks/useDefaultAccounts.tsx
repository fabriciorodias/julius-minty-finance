import { useMemo } from 'react';
import { useProfile } from './useProfile';
import { useAccounts } from './useAccounts';

export function useDefaultAccounts() {
  const { profile } = useProfile();
  const { accounts } = useAccounts();

  const getDefaultAccount = (transactionType: 'receita' | 'despesa') => {
    const favoriteAccountId = transactionType === 'receita' 
      ? profile?.favorite_income_account_id 
      : profile?.favorite_expense_account_id;

    // First try to find the favorite account
    if (favoriteAccountId) {
      const favoriteAccount = accounts?.find(
        account => account.id === favoriteAccountId && account.is_active
      );
      if (favoriteAccount) {
        return favoriteAccount;
      }
    }

    // Fallback to first active account
    return accounts?.find(account => account.is_active) || null;
  };

  const defaultExpenseAccount = useMemo(() => getDefaultAccount('despesa'), [
    profile?.favorite_expense_account_id,
    accounts
  ]);

  const defaultIncomeAccount = useMemo(() => getDefaultAccount('receita'), [
    profile?.favorite_income_account_id,
    accounts
  ]);

  const isDefaultAccount = (accountId: string, type: 'receita' | 'despesa') => {
    const favoriteId = type === 'receita' 
      ? profile?.favorite_income_account_id 
      : profile?.favorite_expense_account_id;
    return favoriteId === accountId;
  };

  return {
    defaultExpenseAccount,
    defaultIncomeAccount,
    getDefaultAccount,
    isDefaultAccount,
  };
}