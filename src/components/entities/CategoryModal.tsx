
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Category } from '@/hooks/useCategories';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (categoryData: any) => void;
  category?: Category;
  categories: Category[];
  isLoading?: boolean;
}

export function CategoryModal({ isOpen, onClose, onSubmit, category, categories, isLoading }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'despesa' as 'receita' | 'despesa',
    parent_id: null as string | null,
    is_active: true,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        type: category.type,
        parent_id: category.parent_id,
        is_active: category.is_active,
      });
    } else {
      setFormData({
        name: '',
        type: 'despesa',
        parent_id: null,
        is_active: true,
      });
    }
  }, [category, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (category) {
      onSubmit({ id: category.id, ...formData });
    } else {
      onSubmit(formData);
    }
    onClose();
  };

  const parentCategories = categories.filter(cat => cat.type === formData.type && !cat.parent_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Categoria</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Alimentação, Salário..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'receita' | 'despesa') => 
                setFormData({ ...formData, type: value, parent_id: null })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="despesa">Despesa</SelectItem>
                <SelectItem value="receita">Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent">Categoria Pai (opcional)</Label>
            <Select
              value={formData.parent_id || 'none'}
              onValueChange={(value) => 
                setFormData({ ...formData, parent_id: value === 'none' ? null : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria pai" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma (categoria principal)</SelectItem>
                {parentCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {category && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_active: checked as boolean })
                }
              />
              <Label htmlFor="is_active">Categoria ativa</Label>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {category ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
