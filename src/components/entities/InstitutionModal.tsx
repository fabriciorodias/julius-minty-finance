
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Institution } from '@/hooks/useInstitutions';

interface InstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (institutionData: any) => void;
  institution?: Institution;
  isLoading?: boolean;
}

export function InstitutionModal({ isOpen, onClose, onSubmit, institution, isLoading }: InstitutionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
  });

  useEffect(() => {
    if (institution) {
      setFormData({
        name: institution.name,
        is_active: institution.is_active,
      });
    } else {
      setFormData({
        name: '',
        is_active: true,
      });
    }
  }, [institution, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (institution) {
      onSubmit({ id: institution.id, ...formData });
    } else {
      onSubmit(formData);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {institution ? 'Editar Instituição' : 'Nova Instituição'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Instituição</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Banco do Brasil, XP Investimentos..."
              required
            />
          </div>

          {institution && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_active: checked as boolean })
                }
              />
              <Label htmlFor="is_active">Instituição ativa</Label>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {institution ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
