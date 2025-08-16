import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CategoryParentCombobox } from './CategoryParentCombobox';
import { categorySchema, CategoryFormData } from './categoryValidation';
import { Category } from '@/hooks/useCategories';
import { TrendingUp, TrendingDown, DollarSign, Target, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (categoryData: any) => void;
  category?: Category;
  categories: Category[];
  preselectedType?: 'receita' | 'despesa' | null;
  isLoading?: boolean;
}

export function CategoryModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  category, 
  categories, 
  preselectedType,
  isLoading 
}: CategoryModalProps) {
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: 'despesa',
      parent_id: null,
      is_active: true,
    },
  });

  const watchedType = form.watch('type');
  const watchedParentId = form.watch('parent_id');
  const watchedName = form.watch('name');

  // Reset form when modal opens/closes or category changes
  useEffect(() => {
    if (isOpen) {
      if (category) {
        form.reset({
          name: category.name,
          type: category.type,
          parent_id: category.parent_id,
          is_active: category.is_active,
        });
      } else {
        form.reset({
          name: '',
          type: preselectedType || 'despesa',
          parent_id: null,
          is_active: true,
        });
      }
    }
  }, [category, isOpen, preselectedType, form]);

  // Check for duplicate names
  const checkDuplicateName = (name: string, type: 'receita' | 'despesa') => {
    if (!name.trim()) return false;
    
    return categories.some(cat => 
      cat.name.toLowerCase() === name.toLowerCase() && 
      cat.type === type && 
      cat.id !== category?.id
    );
  };

  const isDuplicate = checkDuplicateName(watchedName, watchedType);

  // Get parent category for hierarchy preview
  const parentCategory = watchedParentId 
    ? categories.find(cat => cat.id === watchedParentId)
    : null;

  const handleSubmit = (data: CategoryFormData) => {
    if (isDuplicate) return;

    if (category) {
      onSubmit({ id: category.id, ...data });
    } else {
      onSubmit(data);
    }
  };

  const handleClose = () => {
    if (form.formState.isDirty) {
      const confirmClose = window.confirm(
        'Você tem alterações não salvas. Tem certeza que deseja fechar?'
      );
      if (!confirmClose) return;
    }
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {watchedType === 'receita' ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Type Selection with Visual Cues */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tipo da Categoria</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    form.setValue('type', 'despesa');
                    form.setValue('parent_id', null);
                  }}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-3",
                    watchedType === 'despesa'
                      ? "border-red-200 bg-red-50 shadow-sm"
                      : "border-gray-200 hover:border-red-100 hover:bg-red-25"
                  )}
                >
                  <TrendingDown className={cn(
                    "h-5 w-5",
                    watchedType === 'despesa' ? "text-red-600" : "text-gray-400"
                  )} />
                  <div className="text-left">
                    <div className={cn(
                      "font-medium text-sm",
                      watchedType === 'despesa' ? "text-red-800" : "text-gray-600"
                    )}>
                      Despesa
                    </div>
                    <div className="text-xs text-gray-500">
                      Gastos e saídas
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    form.setValue('type', 'receita');
                    form.setValue('parent_id', null);
                  }}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-3",
                    watchedType === 'receita'
                      ? "border-green-200 bg-green-50 shadow-sm"
                      : "border-gray-200 hover:border-green-100 hover:bg-green-25"
                  )}
                >
                  <TrendingUp className={cn(
                    "h-5 w-5",
                    watchedType === 'receita' ? "text-green-600" : "text-gray-400"
                  )} />
                  <div className="text-left">
                    <div className={cn(
                      "font-medium text-sm",
                      watchedType === 'receita' ? "text-green-800" : "text-gray-600"
                    )}>
                      Receita
                    </div>
                    <div className="text-xs text-gray-500">
                      Ganhos e entradas
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Category Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Nome da Categoria
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder={`Ex: ${watchedType === 'receita' ? 'Salário, Freelance, Investimentos' : 'Alimentação, Transporte, Moradia'}`}
                        className={cn(
                          "pr-10",
                          isDuplicate && "border-red-500 focus:border-red-500"
                        )}
                        autoFocus
                      />
                      {isDuplicate && (
                        <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </FormControl>
                  {isDuplicate && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Já existe uma categoria de {watchedType} com este nome
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Parent Category Selection */}
            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Categoria Superior (opcional)
                  </FormLabel>
                  <FormControl>
                    <CategoryParentCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      categories={categories}
                      type={watchedType}
                      currentCategoryId={category?.id}
                    />
                  </FormControl>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>
                      Subcategorias ajudam a organizar melhor seus {watchedType === 'receita' ? 'ganhos' : 'gastos'}. 
                      {!parentCategory && ' Deixe vazio para criar uma categoria principal.'}
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hierarchy Preview */}
            {(parentCategory || watchedName) && (
              <div className={cn(
                "p-3 rounded-lg border",
                watchedType === 'receita' ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              )}>
                <div className="text-xs font-medium text-gray-600 mb-1">Pré-visualização:</div>
                <div className="flex items-center gap-2 text-sm">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    watchedType === 'receita' ? "bg-green-500" : "bg-red-500"
                  )} />
                  {parentCategory ? (
                    <span>
                      <span className="text-gray-600">{parentCategory.name}</span>
                      <span className="mx-2 text-gray-400">→</span>
                      <span className="font-medium">{watchedName || 'Nova subcategoria'}</span>
                    </span>
                  ) : (
                    <span className="font-medium">{watchedName || 'Nova categoria'}</span>
                  )}
                </div>
              </div>
            )}

            {/* Active Status (only for editing) */}
            {category && (
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium">
                        Categoria ativa
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Categorias inativas não aparecem ao criar novos lançamentos
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || isDuplicate || !form.formState.isValid}
                className={cn(
                  watchedType === 'receita' 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-red-600 hover:bg-red-700"
                )}
              >
                {isLoading ? 'Salvando...' : (category ? 'Atualizar' : 'Criar Categoria')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
