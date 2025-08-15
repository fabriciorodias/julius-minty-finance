
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard } from '@/hooks/useCreditCards';
import { Institution } from '@/hooks/useInstitutions';

interface CreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cardData: any) => void;
  creditCard?: CreditCard;
  institutions: Institution[];
  isLoading?: boolean;
}

export function CreditCardModal({ isOpen, onClose, onSubmit, creditCard, institutions, isLoading }: CreditCardModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    institution_id: '',
    card_limit: '',
    is_active: true,
  });

  useEffect(() => {
    if (creditCard) {
      setFormData({
        name: creditCard.name,
        institution_id: creditCard.institution_id,
        card_limit: creditCard.card_limit.toString(),
        is_active: creditCard.is_active,
      });
    } else {
      setFormData({
        name: '',
        institution_id: '',
        card_limit: '',
        is_active: true,
      });
    }
  }, [creditCard, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      card_limit: parseFloat(formData.card_limit),
    };
    
    if (creditCard) {
      onSubmit({ id: creditCard.id, ...submitData });
    } else {
      onSubmit(submitData);
    }
    onClose();
  };

  const activeInstitutions = institutions.filter(inst => inst.is_active);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {creditCard ? 'Editar Cartão' : 'Novo Cartão'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Apelido do Cartão</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Visa Platinum, Mastercard Black..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution">Instituição Emissora</Label>
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
            <Label htmlFor="card_limit">Limite do Cartão</Label>
            <Input
              id="card_limit"
              type="number"
              step="0.01"
              min="0"
              value={formData.card_limit}
              onChange={(e) => setFormData({ ...formData, card_limit: e.target.value })}
              placeholder="0,00"
              required
            />
          </div>

          {creditCard && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_active: checked as boolean })
                }
              />
              <Label htmlFor="is_active">Cartão ativo</Label>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.institution_id || !formData.card_limit}>
              {creditCard ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
