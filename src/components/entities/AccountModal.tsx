
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CurrencyInputBRL } from '@/components/ui/currency-input-brl';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Account, SUBTYPE_LABELS, ASSET_SUBTYPES, LIABILITY_SUBTYPES } from '@/hooks/useAccounts';
import { Institution } from '@/hooks/useInstitutions';
import { useAccountInitialBalance } from '@/hooks/useAccountInitialBalance';

console.log('AccountModal: Component imported successfully');

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  account?: Account;
  institutions: Institution[];
  isLoading?: boolean;
  onCreateInstitution?: () => void;
}

export function AccountModal({
  isOpen,
  onClose,
  onSubmit,
  account,
  institutions,
  isLoading = false,
  onCreateInstitution
}: AccountModalProps) {
  console.log('AccountModal: Component rendering...');
  const [formData, setFormData] = useState({
    name: '',
    institution_id: '',
    kind: 'asset' as Account['kind'],
    subtype: 'bank' as Account['subtype'],
    credit_limit: '',
    is_active: true,
    initial_balance: '',
    initial_balance_numeric: 0,
    balance_date: new Date(),
  });

  const { data: initialBalance } = useAccountInitialBalance(account?.id);

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        institution_id: account.institution_id,
        kind: account.kind,
        subtype: account.subtype,
        credit_limit: account.credit_limit?.toString() || '',
        is_active: account.is_active,
        initial_balance: initialBalance?.amount ? Math.abs(initialBalance.amount).toString() : '',
        initial_balance_numeric: initialBalance?.amount ? Math.abs(initialBalance.amount) : 0,
        balance_date: initialBalance?.balance_date ? new Date(initialBalance.balance_date) : new Date(),
      });
    } else {
      setFormData({
        name: '',
        institution_id: '',
        kind: 'asset',
        subtype: 'bank',
        credit_limit: '',
        is_active: true,
        initial_balance: '',
        initial_balance_numeric: 0,
        balance_date: new Date(),
      });
    }
  }, [account, initialBalance]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Preparar dados da conta
    const accountData: any = {
      name: formData.name,
      institution_id: formData.institution_id,
      kind: formData.kind,
      subtype: formData.subtype,
      is_active: formData.is_active,
    };

    // Adicionar credit_limit apenas para cartões de crédito
    if (formData.subtype === 'credit_card' && formData.credit_limit) {
      accountData.credit_limit = parseFloat(formData.credit_limit);
    }

    // Tratar saldo inicial
    if (formData.initial_balance_numeric) {
      const initialBalanceValue = formData.initial_balance_numeric;
      
      // Para passivos, garantir que o valor seja negativo
      // O trigger do banco vai garantir isso, mas vamos normalizar aqui também
      if (formData.kind === 'liability') {
        accountData.initial_balance = -Math.abs(initialBalanceValue);
      } else {
        accountData.initial_balance = initialBalanceValue;
      }
      
      accountData.balance_date = formData.balance_date;
    }

    if (account) {
      accountData.id = account.id;
    }

    onSubmit(accountData);
    onClose();
  };

  const handleKindChange = (value: Account['kind']) => {
    setFormData(prev => ({
      ...prev,
      kind: value,
      subtype: value === 'asset' ? 'bank' : 'credit_card',
      credit_limit: value === 'asset' ? '' : prev.credit_limit
    }));
  };

  const availableSubtypes = formData.kind === 'asset' ? ASSET_SUBTYPES : LIABILITY_SUBTYPES;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {account ? 'Editar Conta' : 'Nova Conta'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Conta</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution">Instituição</Label>
            <div className="flex gap-2">
              <Select
                value={formData.institution_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, institution_id: value }))}
                required
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione uma instituição" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.filter(inst => inst.is_active).map((institution) => (
                    <SelectItem key={institution.id} value={institution.id}>
                      {institution.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {onCreateInstitution && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onCreateInstitution}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kind">Tipo</Label>
              <Select
                value={formData.kind}
                onValueChange={handleKindChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">Ativo</SelectItem>
                  <SelectItem value="liability">Passivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtype">Subtipo</Label>
              <Select
                value={formData.subtype}
                onValueChange={(value) => setFormData(prev => ({ ...prev, subtype: value as Account['subtype'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableSubtypes.map((subtype) => (
                    <SelectItem key={subtype} value={subtype}>
                      {SUBTYPE_LABELS[subtype]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.subtype === 'credit_card' && (
            <div className="space-y-2">
              <Label htmlFor="credit_limit">Limite do Cartão</Label>
              <CurrencyInputBRL
                value={formData.credit_limit}
                onChange={(value, numericValue) => setFormData(prev => ({ ...prev, credit_limit: numericValue.toString() }))}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initial_balance">
                {formData.kind === 'asset' ? 'Saldo Inicial' : 'Valor Inicial'}
              </Label>
              <CurrencyInputBRL
                value={formData.initial_balance_numeric}
                onChange={(value, numericValue) => setFormData(prev => ({ ...prev, initial_balance: value, initial_balance_numeric: numericValue }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance_date">Data do Saldo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.balance_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.balance_date ? (
                      format(formData.balance_date, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.balance_date}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, balance_date: date }))}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Conta ativa</Label>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Salvando...' : account ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
