
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Account, SUBTYPE_LABELS, ASSET_SUBTYPES, LIABILITY_SUBTYPES } from '@/hooks/useAccounts';
import { Institution } from '@/hooks/useInstitutions';
import { useAccountInitialBalance } from '@/hooks/useAccountInitialBalance';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (accountData: any) => void;
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
  isLoading,
  onCreateInstitution
}: AccountModalProps) {
  const { data: initialBalance } = useAccountInitialBalance(account?.id);
  
  const [formData, setFormData] = useState({
    name: '',
    institution_id: '',
    kind: 'asset' as 'asset' | 'liability',
    subtype: 'bank' as Account['subtype'],
    credit_limit: '',
    initial_balance: '',
    balance_date: undefined as Date | undefined,
    is_active: true,
  });

  useEffect(() => {
    if (account) {
      console.log('Setting form data for existing account:', account);
      setFormData({
        name: account.name,
        institution_id: account.institution_id,
        // Garantir que kind e subtype sejam válidos
        kind: account.kind || 'asset',
        subtype: account.subtype || (account.kind === 'liability' ? 'credit_card' : 'bank'),
        credit_limit: account.credit_limit?.toString() || '',
        initial_balance: initialBalance?.amount ? Math.abs(initialBalance.amount).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) : '',
        balance_date: initialBalance?.balance_date ? new Date(initialBalance.balance_date) : undefined,
        is_active: account.is_active,
      });
    } else {
      setFormData({
        name: '',
        institution_id: '',
        kind: 'asset',
        subtype: 'bank',
        credit_limit: '',
        initial_balance: '',
        balance_date: undefined,
        is_active: true,
      });
    }
  }, [account, initialBalance, isOpen]);

  const handleKindChange = (kind: 'asset' | 'liability') => {
    const newSubtype = kind === 'asset' ? 'bank' : 'credit_card';
    console.log('Changing kind to:', kind, 'and subtype to:', newSubtype);
    setFormData({ 
      ...formData, 
      kind, 
      subtype: newSubtype,
      credit_limit: '' 
    });
  };

  const getAvailableSubtypes = () => {
    return formData.kind === 'asset' ? ASSET_SUBTYPES : LIABILITY_SUBTYPES;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting form data:', formData);
    
    // Validar que os valores obrigatórios estão preenchidos
    if (!formData.kind || !formData.subtype) {
      console.error('Kind or subtype is missing:', { kind: formData.kind, subtype: formData.subtype });
      return;
    }
    
    const submitData: any = {
      name: formData.name,
      institution_id: formData.institution_id,
      kind: formData.kind,
      subtype: formData.subtype,
      is_active: formData.is_active,
    };

    // Adiciona credit_limit se for cartão de crédito
    if (formData.subtype === 'credit_card' && formData.credit_limit) {
      const creditLimit = parseFloat(formData.credit_limit.replace(/\./g, '').replace(',', '.'));
      submitData.credit_limit = creditLimit;
    }

    // Adiciona dados do saldo inicial se informado
    if (formData.initial_balance) {
      const initialBalanceAmount = parseFloat(formData.initial_balance.replace(/\./g, '').replace(',', '.'));
      submitData.initial_balance = formData.subtype === 'credit_card' ? -Math.abs(initialBalanceAmount) : initialBalanceAmount;
      submitData.balance_date = formData.balance_date;
    }

    console.log('Final submit data:', submitData);

    if (account) {
      onSubmit({ id: account.id, ...submitData });
    } else {
      onSubmit(submitData);
    }
    onClose();
  };

  const activeInstitutions = institutions.filter(inst => inst.is_active);

  const isFormValid = formData.name && 
    formData.institution_id && 
    formData.kind &&
    formData.subtype &&
    (formData.subtype !== 'credit_card' || formData.credit_limit) &&
    (!formData.initial_balance || formData.balance_date);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-semibold">
            {account ? 'Editar Conta' : 'Nova Conta'}
          </DialogTitle>
          <DialogDescription>
            {account 
              ? 'Edite as informações da sua conta'
              : 'Crie uma nova conta para gerenciar seus recursos financeiros'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Nome da Conta */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-base font-medium">
              Nome da Conta *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Conta Corrente, NuBank, PicPay..."
              className="h-12"
              required
            />
          </div>

          {/* Instituição */}
          <div className="space-y-3">
            <Label htmlFor="institution" className="text-base font-medium">
              Instituição *
            </Label>
            <div className="flex gap-2">
              <Select
                value={formData.institution_id}
                onValueChange={(value) => setFormData({ ...formData, institution_id: value })}
                required
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione uma instituição" />
                </SelectTrigger>
                <SelectContent>
                  {activeInstitutions.map((institution) => (
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
                  onClick={onCreateInstitution}
                  className="h-12 px-4"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Tipo de Conta */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Tipo de Conta *</Label>
            <RadioGroup
              value={formData.kind}
              onValueChange={handleKindChange}
              disabled={!!account}
              className="space-y-4"
            >
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="asset" id="asset" className="mt-1" />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="asset" className="font-medium cursor-pointer">
                    Ativo
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Representa recursos que você possui e podem gerar valor futuro.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="liability" id="liability" className="mt-1" />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="liability" className="font-medium cursor-pointer">
                    Passivo
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Representa obrigações e dívidas que você deve pagar.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Subtipo da Conta */}
          <div className="space-y-3">
            <Label htmlFor="subtype" className="text-base font-medium">
              Subtipo *
            </Label>
            <Select
              value={formData.subtype}
              onValueChange={(value: Account['subtype']) => {
                console.log('Changing subtype to:', value);
                setFormData({ ...formData, subtype: value });
              }}
              required
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione o subtipo" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableSubtypes().map((subtype) => (
                  <SelectItem key={subtype} value={subtype}>
                    {SUBTYPE_LABELS[subtype]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Limite do Cartão */}
          {formData.subtype === 'credit_card' && (
            <div className="space-y-3">
              <Label htmlFor="credit_limit" className="text-base font-medium">
                Limite Total do Cartão *
              </Label>
              <CurrencyInput
                id="credit_limit"
                value={formData.credit_limit}
                onChange={(value) => setFormData({ ...formData, credit_limit: value })}
                required
                className="h-12"
              />
            </div>
          )}

          {/* Saldo Inicial */}
          <div className="space-y-6 p-6 border rounded-lg bg-muted/20">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                {account ? 'Saldo Inicial' : 'Saldo Inicial (Opcional)'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formData.kind === 'asset' 
                  ? account 
                    ? 'Ajuste o saldo inicial desta conta. Isso afetará o cálculo do saldo atual.'
                    : 'Registre o saldo atual desta conta para começar com o valor correto.'
                  : account
                    ? 'Ajuste o valor da dívida inicial. Isso afetará o cálculo do saldo atual.'
                    : 'Registre o valor da sua dívida atual (será registrado como passivo).'
                }
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="initial_balance" className="text-base font-medium">
                  {formData.kind === 'asset' ? 'Saldo Inicial' : 'Valor da Dívida Inicial'}
                </Label>
                <CurrencyInput
                  id="initial_balance"
                  value={formData.initial_balance}
                  onChange={(value) => setFormData({ ...formData, initial_balance: value })}
                  className="h-12"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Data do Saldo {formData.initial_balance && '*'}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-12 justify-start text-left font-normal",
                        !formData.balance_date && "text-muted-foreground"
                      )}
                      disabled={!formData.initial_balance}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.balance_date ? (
                        format(formData.balance_date, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.balance_date}
                      onSelect={(date) => setFormData({ ...formData, balance_date: date })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {formData.initial_balance && !formData.balance_date && (
                  <p className="text-sm text-destructive">
                    Data é obrigatória quando há saldo inicial
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Conta Ativa - apenas para edição */}
          {account && (
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_active: checked as boolean })
                }
              />
              <Label htmlFor="is_active" className="font-medium cursor-pointer">
                Conta ativa
              </Label>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="px-6">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !isFormValid} className="px-6">
              {account ? 'Atualizar' : 'Criar Conta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
