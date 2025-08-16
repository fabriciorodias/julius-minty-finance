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
        .order('name');

      if (error) throw error;

      // Organizar categorias em hierarquia
      const categoriesMap = new Map<string, Category>();
      const rootCategories: Category[] = [];

      data.forEach(category => {
        categoriesMap.set(category.id, { 
          ...category, 
          type: category.type as 'receita' | 'despesa',
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
    mutationFn: async (categoryData: Omit<Category, 'id' | 'user_id' | 'created_at' | 'subcategories'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...categoryData,
          user_id: user.id,
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
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
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

  // Nova função para exclusão segura com pré-verificação melhorada
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
    deleteCategorySafely,
    isCreating: createCategoryMutation.isPending,
    isUpdating: updateCategoryMutation.isPending,
    isDeleting: deleteCategoryMutation.isPending,
  };
}
