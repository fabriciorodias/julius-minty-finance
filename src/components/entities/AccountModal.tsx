
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Account } from '@/hooks/useAccounts';
import { Institution } from '@/hooks/useInstitutions';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (accountData: any) => void;
  account?: Account;
  institutions: Institution[];
  isLoading?: boolean;
}

export function AccountModal({ isOpen, onClose, onSubmit, account, institutions, isLoading }: AccountModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    institution_id: '',
    type: 'on_budget' as 'on_budget' | 'credit',
    credit_limit: '',
    initial_balance: '',
    is_active: true,
  });

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        institution_id: account.institution_id,
        type: account.type,
        credit_limit: account.credit_limit?.toString() || '',
        initial_balance: '',
        is_active: account.is_active,
      });
    } else {
      setFormData({
        name: '',
        institution_id: '',
        type: 'on_budget',
        credit_limit: '',
        initial_balance: '',
        is_active: true,
      });
    }
  }, [account, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: any = {
      name: formData.name,
      institution_id: formData.institution_id,
      type: formData.type,
      is_active: formData.is_active,
    };

    // Apenas adiciona credit_limit se for cartão de crédito
    if (formData.type === 'credit' && formData.credit_limit) {
      submitData.credit_limit = parseFloat(formData.credit_limit);
    }

    if (account) {
      onSubmit({ id: account.id, ...submitData });
    } else {
      onSubmit(submitData);
    }
    onClose();
  };

  const activeInstitutions = institutions.filter(inst => inst.is_active);

  const isFormValid = formData.name && formData.institution_id && 
    (formData.type === 'on_budget' || (formData.type === 'credit' && formData.credit_limit));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {account ? 'Editar Conta' : 'Nova Conta'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Conta</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Conta Corrente, NuBank, PicPay..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution">Instituição</Label>
            <Select
              value={formData.institution_id}
              onValueChange={(value) => setFormData({ ...formData, institution_id: value })}
              required
            >
              <SelectTrigger>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Conta</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'on_budget' | 'credit') => 
                setFormData({ ...formData, type: value, credit_limit: '', initial_balance: '' })
              }
              disabled={!!account} // Não permite alterar o tipo se estiver editando
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on_budget">Conta de Orçamento</SelectItem>
                <SelectItem value="credit">Cartão de Crédito</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {formData.type === 'on_budget' 
                ? 'Conta cujo saldo representa dinheiro que você possui e pode orçar.'
                : 'Cartão de crédito que representa uma linha de crédito disponível.'
              }
            </p>
          </div>

          {/* Campos condicionais baseados no tipo */}
          {formData.type === 'on_budget' && !account && (
            <div className="space-y-2">
              <Label htmlFor="initial_balance">Qual o saldo atual desta conta?</Label>
              <Input
                id="initial_balance"
                type="number"
                step="0.01"
                value={formData.initial_balance}
                onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                placeholder="0,00"
              />
              <p className="text-sm text-muted-foreground">
                Este valor será registrado como saldo inicial da conta.
              </p>
            </div>
          )}

          {formData.type === 'credit' && (
            <>
              {!account && (
                <div className="space-y-2">
                  <Label htmlFor="initial_balance">Qual o valor da sua fatura atual?</Label>
                  <Input
                    id="initial_balance"
                    type="number"
                    step="0.01"
                    value={formData.initial_balance}
                    onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                    placeholder="0,00"
                  />
                  <p className="text-sm text-muted-foreground">
                    Este valor será registrado como dívida inicial do cartão (saldo negativo).
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="credit_limit">Qual o limite total do seu cartão?</Label>
                <Input
                  id="credit_limit"
                  type="number"
                  step="0.01"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                  placeholder="5000,00"
                  required
                />
              </div>
            </>
          )}

          {account && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_active: checked as boolean })
                }
              />
              <Label htmlFor="is_active">Conta ativa</Label>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !isFormValid}>
              {account ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
