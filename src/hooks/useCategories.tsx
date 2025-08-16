import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Category {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  type: 'receita' | 'despesa';
  is_active: boolean;
  sort_index: number;
  created_at: string;
  subcategories?: Category[];
}

export function useCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_index', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      // Organizar categorias em hierarquia
      const categoriesMap = new Map<string, Category>();
      const rootCategories: Category[] = [];

      data.forEach(category => {
        categoriesMap.set(category.id, { 
          ...category, 
          type: category.type as 'receita' | 'despesa',
          sort_index: category.sort_index || 0,
          subcategories: [] 
        });
      });

      data.forEach(category => {
        if (category.parent_id) {
          const parent = categoriesMap.get(category.parent_id);
          if (parent) {
            parent.subcategories!.push(categoriesMap.get(category.id)!);
          }
        } else {
          rootCategories.push(categoriesMap.get(category.id)!);
        }
      });

      return rootCategories;
    },
    enabled: !!user?.id,
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: Omit<Category, 'id' | 'user_id' | 'created_at' | 'subcategories' | 'sort_index'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get the highest sort_index for this type and parent
      const { data: maxSortData } = await supabase
        .from('categories')
        .select('sort_index')
        .eq('user_id', user.id)
        .eq('type', categoryData.type)
        .eq('parent_id', categoryData.parent_id || null)
        .order('sort_index', { ascending: false })
        .limit(1);

      const nextSortIndex = maxSortData && maxSortData.length > 0 ? (maxSortData[0].sort_index || 0) + 1 : 0;

      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: categoryData.name,
          type: categoryData.type,
          parent_id: categoryData.parent_id,
          is_active: categoryData.is_active,
          user_id: user.id,
          sort_index: nextSortIndex,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', user?.id] });
      toast({
        title: "Categoria criada",
        description: "A categoria foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar categoria",
        description: "Não foi possível criar a categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      // Filter out properties that shouldn't be updated directly
      const { subcategories, ...updateData } = updates;
      
      const { data, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', user?.id] });
      toast({
        title: "Categoria atualizada",
        description: "A categoria foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar categoria",
        description: "Não foi possível atualizar a categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateCategoryOrderMutation = useMutation({
    mutationFn: async ({ dragCategoryId, dropCategoryId }: { dragCategoryId: string, dropCategoryId: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get both categories
      const { data: categoriesData, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .in('id', [dragCategoryId, dropCategoryId])
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      const dragCategory = categoriesData.find(cat => cat.id === dragCategoryId);
      const dropCategory = categoriesData.find(cat => cat.id === dropCategoryId);

      if (!dragCategory || !dropCategory) throw new Error('Categories not found');

      // Get all categories in the same group (same type and parent)
      const { data: groupCategories, error: groupError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', dragCategory.type)
        .eq('parent_id', dragCategory.parent_id || null)
        .order('sort_index', { ascending: true });

      if (groupError) throw groupError;

      // Remove the dragged category from its current position
      const filteredCategories = groupCategories.filter(cat => cat.id !== dragCategoryId);
      
      // Find the drop position
      const dropIndex = filteredCategories.findIndex(cat => cat.id === dropCategoryId);
      
      // Insert the dragged category before the drop category
      filteredCategories.splice(dropIndex, 0, dragCategory);

      // Update sort_index for all categories in the group
      const updates = filteredCategories.map((cat, index) => ({
        id: cat.id,
        sort_index: index
      }));

      // Perform batch update
      for (const update of updates) {
        const { error } = await supabase
          .from('categories')
          .update({ sort_index: update.sort_index })
          .eq('id', update.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', user?.id] });
    },
    onError: (error) => {
      console.error('Error updating category order:', error);
      toast({
        title: "Erro ao reordenar",
        description: "Não foi possível alterar a ordem das categorias.",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', user?.id] });
      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      // Tratar violação de foreign key (categoria em uso)
      if (error?.code === '23503') {
        toast({
          title: "Categoria em uso",
          description: "Não é possível excluir esta categoria porque ela já foi utilizada em lançamentos/orçamentos ou possui subcategorias. Para manter o histórico, considere desativá-la.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao excluir categoria",
          description: "Não foi possível excluir a categoria. Verifique se não há lançamentos associados.",
          variant: "destructive",
        });
      }
    },
  });

  const deleteCategorySafely = async (id: string) => {
    if (!user?.id) return;

    try {
      console.log('Iniciando verificação de dependências para categoria:', id);

      // Verificar se a categoria tem lançamentos associados
      const { data: transactions, error: transactionsError, count: transactionsCount } = await supabase
        .from('transactions')
        .select('id', { count: 'exact' })
        .eq('category_id', id)
        .limit(1);

      if (transactionsError) {
        console.error('Erro ao verificar transações:', transactionsError);
        throw transactionsError;
      }

      console.log('Transações encontradas:', transactionsCount);

      // Verificar se a categoria tem subcategorias
      const { data: subcategories, error: subcategoriesError, count: subcategoriesCount } = await supabase
        .from('categories')
        .select('id', { count: 'exact' })
        .eq('parent_id', id)
        .limit(1);

      if (subcategoriesError) {
        console.error('Erro ao verificar subcategorias:', subcategoriesError);
        throw subcategoriesError;
      }

      console.log('Subcategorias encontradas:', subcategoriesCount);

      // Verificar se a categoria tem orçamentos associados
      const { data: budgets, error: budgetsError, count: budgetsCount } = await supabase
        .from('budgets')
        .select('id', { count: 'exact' })
        .eq('category_id', id);

      if (budgetsError) {
        console.error('Erro ao verificar orçamentos:', budgetsError);
        throw budgetsError;
      }

      console.log('Orçamentos encontrados:', budgetsCount);

      // Se houver transações ou subcategorias, impedir a exclusão
      if ((transactionsCount && transactionsCount > 0) || (subcategoriesCount && subcategoriesCount > 0)) {
        const reasons = [];
        if (transactionsCount && transactionsCount > 0) {
          reasons.push(`${transactionsCount} transação${transactionsCount > 1 ? 'ões' : ''}`);
        }
        if (subcategoriesCount && subcategoriesCount > 0) {
          reasons.push(`${subcategoriesCount} subcategoria${subcategoriesCount > 1 ? 's' : ''}`);
        }

        toast({
          title: "Categoria em uso",
          description: `Não é possível excluir esta categoria porque ela possui ${reasons.join(' e ')} associada${reasons.length > 1 ? 's' : ''}. Para manter o histórico, considere desativá-la.`,
          variant: "destructive",
        });
        return;
      }

      // Se só existem orçamentos, deletá-los automaticamente antes de excluir a categoria
      if (budgetsCount && budgetsCount > 0) {
        console.log('Deletando orçamentos automaticamente...');
        const { error: deleteBudgetsError } = await supabase
          .from('budgets')
          .delete()
          .eq('category_id', id);

        if (deleteBudgetsError) {
          console.error('Erro ao deletar orçamentos:', deleteBudgetsError);
          toast({
            title: "Erro ao limpar orçamentos",
            description: "Não foi possível remover os orçamentos associados à categoria.",
            variant: "destructive",
          });
          return;
        }

        // Invalidar cache dos orçamentos
        queryClient.invalidateQueries({ queryKey: ['budgets', user.id] });
        console.log('Orçamentos deletados com sucesso');
      }

      // Prosseguir com a exclusão da categoria
      console.log('Procedendo com a exclusão da categoria...');
      deleteCategoryMutation.mutate(id);
    } catch (error) {
      console.error('Erro ao verificar dependências da categoria:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar se a categoria pode ser excluída. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return {
    categories,
    isLoading,
    error,
    createCategory: createCategoryMutation.mutate,
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
    updateCategoryOrder: (dragCategoryId: string, dropCategoryId: string) => 
      updateCategoryOrderMutation.mutate({ dragCategoryId, dropCategoryId }),
    deleteCategorySafely,
    isCreating: createCategoryMutation.isPending,
    isUpdating: updateCategoryMutation.isPending,
    isDeleting: deleteCategoryMutation.isPending,
  };
}
