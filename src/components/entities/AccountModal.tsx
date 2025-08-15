
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
    is_active: true,
  });

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        institution_id: account.institution_id,
        is_active: account.is_active,
      });
    } else {
      setFormData({
        name: '',
        institution_id: '',
        is_active: true,
      });
    }
  }, [account, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (account) {
      onSubmit({ id: account.id, ...formData });
    } else {
      onSubmit(formData);
    }
    onClose();
  };

  const activeInstitutions = institutions.filter(inst => inst.is_active);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
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
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Conta Corrente, Poupança, Caixinha Viagem..."
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
            <Button type="submit" disabled={isLoading || !formData.institution_id}>
              {account ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
