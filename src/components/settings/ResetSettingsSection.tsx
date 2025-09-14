import { useState } from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSystemReset } from '@/hooks/useSystemReset';

export function ResetSettingsSection() {
  const [showTransactionsDialog, setShowTransactionsDialog] = useState(false);
  const [showBalancesDialog, setShowBalancesDialog] = useState(false);
  const [transactionsConfirmText, setTransactionsConfirmText] = useState('');
  const [balancesConfirmText, setBalancesConfirmText] = useState('');
  
  const {
    resetTransactions,
    resetAccountBalances,
    isResettingTransactions,
    isResettingBalances,
  } = useSystemReset();

  const handleResetTransactions = () => {
    resetTransactions();
    setShowTransactionsDialog(false);
    setTransactionsConfirmText('');
  };

  const handleResetBalances = () => {
    resetAccountBalances();
    setShowBalancesDialog(false);
    setBalancesConfirmText('');
  };

  const isTransactionsConfirmValid = transactionsConfirmText === 'CONFIRMAR';
  const isBalancesConfirmValid = balancesConfirmText === 'CONFIRMAR';

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Resetar Transações
            </CardTitle>
            <CardDescription>
              Remove todas as transações do sistema permanentemente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setShowTransactionsDialog(true)}
              disabled={isResettingTransactions}
              className="w-full"
            >
              {isResettingTransactions ? 'Resetando...' : 'Resetar Todas as Transações'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <RotateCcw className="h-5 w-5" />
              Resetar Saldos das Contas
            </CardTitle>
            <CardDescription>
              Zera todos os saldos iniciais das contas permanentemente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setShowBalancesDialog(true)}
              disabled={isResettingBalances}
              className="w-full"
            >
              {isResettingBalances ? 'Resetando...' : 'Resetar Saldos das Contas'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para resetar transações */}
      <AlertDialog open={showTransactionsDialog} onOpenChange={setShowTransactionsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Confirmar Reset das Transações
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p><strong>Esta ação é irreversível!</strong></p>
              <p>Todas as suas transações serão permanentemente excluídas do sistema:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Lançamentos de receitas e despesas</li>
                <li>Histórico de transações</li>
                <li>Dados de parcelamentos</li>
                <li>Tags associadas às transações</li>
              </ul>
              <p>Para confirmar, digite <strong>CONFIRMAR</strong> no campo abaixo:</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="transactions-confirm">Confirmação</Label>
            <Input
              id="transactions-confirm"
              value={transactionsConfirmText}
              onChange={(e) => setTransactionsConfirmText(e.target.value)}
              placeholder="Digite CONFIRMAR"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setTransactionsConfirmText('');
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetTransactions}
              disabled={!isTransactionsConfirmValid || isResettingTransactions}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isResettingTransactions ? 'Resetando...' : 'Confirmar Reset'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para resetar saldos das contas */}
      <AlertDialog open={showBalancesDialog} onOpenChange={setShowBalancesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Confirmar Reset dos Saldos das Contas
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p><strong>Esta ação é irreversível!</strong></p>
              <p>Todos os saldos iniciais das suas contas serão permanentemente removidos:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Saldos iniciais configurados</li>
                <li>Histórico de reconciliações</li>
                <li>Datas de referência dos saldos</li>
              </ul>
              <p>Suas contas continuarão existindo, mas com saldo zerado.</p>
              <p>Para confirmar, digite <strong>CONFIRMAR</strong> no campo abaixo:</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="balances-confirm">Confirmação</Label>
            <Input
              id="balances-confirm"
              value={balancesConfirmText}
              onChange={(e) => setBalancesConfirmText(e.target.value)}
              placeholder="Digite CONFIRMAR"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setBalancesConfirmText('');
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetBalances}
              disabled={!isBalancesConfirmValid || isResettingBalances}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isResettingBalances ? 'Resetando...' : 'Confirmar Reset'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}