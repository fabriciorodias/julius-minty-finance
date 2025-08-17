
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTagData {
  name: string;
  color?: string;
}

export interface UpdateTagData {
  name?: string;
  color?: string;
}

export function useTags() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: tags = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tags', user?.id],
    queryFn: async (): Promise<Tag[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createTagMutation = useMutation({
    mutationFn: async (tagData: CreateTagData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tags')
        .insert({
          ...tagData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', user?.id] });
      toast({
        title: "Tag criada",
        description: "A tag foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error creating tag:', error);
      toast({
        title: "Erro ao criar tag",
        description: error.message || "Não foi possível criar a tag. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTagData & { id: string }) => {
      const { data, error } = await supabase
        .from('tags')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', user?.id] });
      toast({
        title: "Tag atualizada",
        description: "A tag foi atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error updating tag:', error);
      toast({
        title: "Erro ao atualizar tag",
        description: error.message || "Não foi possível atualizar a tag. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      toast({
        title: "Tag excluída",
        description: "A tag foi excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting tag:', error);
      toast({
        title: "Erro ao excluir tag",
        description: error.message || "Não foi possível excluir a tag. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    tags,
    isLoading,
    error,
    createTag: createTagMutation.mutate,
    updateTag: updateTagMutation.mutate,
    deleteTag: deleteTagMutation.mutate,
    isCreating: createTagMutation.isPending,
    isUpdating: updateTagMutation.isPending,
    isDeleting: deleteTagMutation.isPending,
  };
}
