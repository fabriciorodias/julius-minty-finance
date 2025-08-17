
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useTags } from '@/hooks/useTags';
import { Edit2, Trash2, Plus, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TagsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EditingTag {
  id: string;
  name: string;
  color: string;
}

export function TagsManagerModal({ isOpen, onClose }: TagsManagerModalProps) {
  const { tags, createTag, updateTag, deleteTag, isLoading } = useTags();
  const [editingTag, setEditingTag] = useState<EditingTag | null>(null);
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState({ name: '', color: '#3b82f6' });

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para a nova tag.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTag({
        name: newTag.name.trim(),
        color: newTag.color,
      });
      setNewTag({ name: '', color: '#3b82f6' });
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const handleStartEdit = (tag: any) => {
    setEditingTag({
      id: tag.id,
      name: tag.name,
      color: tag.color || '#3b82f6',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTag || !editingTag.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para a tag.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateTag({
        id: editingTag.id,
        name: editingTag.name.trim(),
        color: editingTag.color,
      });
      setEditingTag(null);
    } catch (error) {
      console.error('Error updating tag:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
  };

  const handleDeleteTag = async () => {
    if (!deleteTagId) return;

    try {
      await deleteTag(deleteTagId);
      setDeleteTagId(null);
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Gerenciar Tags
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Create New Tag */}
            <div className="p-4 border rounded-lg bg-muted/30">
              <h3 className="font-medium mb-3">Criar Nova Tag</h3>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label htmlFor="new-tag-name">Nome</Label>
                  <Input
                    id="new-tag-name"
                    value={newTag.name}
                    onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                    placeholder="Nome da tag"
                  />
                </div>
                <div>
                  <Label htmlFor="new-tag-color">Cor</Label>
                  <Input
                    id="new-tag-color"
                    type="color"
                    value={newTag.color}
                    onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                    className="w-16 h-9 p-1 border rounded"
                  />
                </div>
                <Button onClick={handleCreateTag} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Criar
                </Button>
              </div>
            </div>

            {/* Tags List */}
            <div>
              <h3 className="font-medium mb-3">Tags Existentes</h3>
              {tags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma tag criada ainda
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cor</TableHead>
                      <TableHead>Prévia</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tags.map((tag) => (
                      <TableRow key={tag.id}>
                        <TableCell>
                          {editingTag?.id === tag.id ? (
                            <Input
                              value={editingTag.name}
                              onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                              className="w-full"
                            />
                          ) : (
                            <span className="font-medium">{tag.name}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingTag?.id === tag.id ? (
                            <Input
                              type="color"
                              value={editingTag.color}
                              onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                              className="w-16 h-8 p-1 border rounded"
                            />
                          ) : (
                            <div
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: tag.color || '#3b82f6' }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={
                              editingTag?.id === tag.id
                                ? {
                                    borderColor: editingTag.color,
                                    color: editingTag.color,
                                    backgroundColor: `${editingTag.color}10`,
                                  }
                                : tag.color
                                ? {
                                    borderColor: tag.color,
                                    color: tag.color,
                                    backgroundColor: `${tag.color}10`,
                                  }
                                : undefined
                            }
                          >
                            {editingTag?.id === tag.id ? editingTag.name : tag.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {editingTag?.id === tag.id ? (
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleSaveEdit}
                                className="flex items-center gap-1"
                              >
                                <Save className="h-3 w-3" />
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                className="flex items-center gap-1"
                              >
                                <X className="h-3 w-3" />
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartEdit(tag)}
                                className="flex items-center gap-1"
                              >
                                <Edit2 className="h-3 w-3" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteTagId(tag.id)}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                                Excluir
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTagId} onOpenChange={() => setDeleteTagId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tag? Esta ação não pode ser desfeita.
              A tag será removida de todos os lançamentos associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTagId(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTag} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
