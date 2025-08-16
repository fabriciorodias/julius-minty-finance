import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, Eye, EyeOff, TrendingUp, TrendingDown, MoreVertical, ChevronRight, ChevronDown, GripVertical } from 'lucide-react';
import { CategoryModal } from '@/components/entities/CategoryModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export function Categories() {
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [preselectedType, setPreselectedType] = useState<'receita' | 'despesa' | null>(null);
  
  // Local storage for collapsed states
  const [collapsedCategories, setCollapsedCategories] = useLocalStorage<Record<string, boolean>>('collapsed-categories', {});

  const {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategorySafely,
    updateCategoryOrder,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCategories();

  const handleEdit = (category: any) => {
    setSelectedCategory(category);
    setPreselectedType(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
    setPreselectedType(null);
  };

  const handleQuickToggleStatus = (category: any) => {
    updateCategory({
      id: category.id,
      is_active: !category.is_active,
    });
  };

  const handleNewCategory = (type: 'receita' | 'despesa') => {
    setSelectedCategory(null);
    setPreselectedType(type);
    setShowModal(true);
  };

  const toggleCollapsed = (categoryId: string) => {
    setCollapsedCategories((prev: Record<string, boolean>) => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleDragStart = (e: React.DragEvent, categoryId: string, type: 'receita' | 'despesa', parentId: string | null) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      categoryId,
      type,
      parentId
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropCategoryId: string, dropType: 'receita' | 'despesa', dropParentId: string | null) => {
    e.preventDefault();
    const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
    
    // Only allow reordering within the same type and parent group
    if (dragData.type === dropType && dragData.parentId === dropParentId && dragData.categoryId !== dropCategoryId) {
      updateCategoryOrder(dragData.categoryId, dropCategoryId);
    }
  };

  const renderCategory = (category: any, level = 0) => {
    const isCollapsed = collapsedCategories[category.id];
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;

    return (
      <div key={category.id} className="space-y-2">
        <div
          className={cn(
            "group flex items-center justify-between p-4 bg-card rounded-lg border transition-all duration-200 hover:shadow-sm cursor-move",
            !category.is_active && "opacity-60 bg-gray-50"
          )}
          style={{ marginLeft: level * 24 }}
          draggable
          onDragStart={(e) => handleDragStart(e, category.id, category.type, category.parent_id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, category.id, category.type, category.parent_id)}
        >
          <div className="flex items-center space-x-3 flex-1">
            {/* Drag Handle */}
            <GripVertical className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Collapse/Expand Button */}
            {hasSubcategories && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCollapsed(category.id)}
                className="h-6 w-6 p-0"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            )}

            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              {category.type === 'receita' ? (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                </div>
              )}
            </div>

            {/* Category Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className={cn(
                  "font-medium text-sm",
                  !category.is_active && "line-through text-gray-500"
                )}>
                  {category.name}
                </h4>
                {!category.is_active && (
                  <EyeOff className="h-3 w-3 text-gray-400" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground capitalize">
                  {category.type === 'receita' ? 'Receita' : 'Despesa'}
                  {level > 0 && ' • Subcategoria'}
                </p>
                {hasSubcategories && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {category.subcategories.length} subcategoria{category.subcategories.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Quick Edit */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(category)}
              className="h-8 w-8 p-0"
              title="Editar categoria"
            >
              <Edit2 className="h-3 w-3" />
            </Button>

            {/* Quick Toggle Status */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickToggleStatus(category)}
              className="h-8 w-8 p-0"
              title={category.is_active ? "Desativar categoria" : "Ativar categoria"}
            >
              {category.is_active ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3" />
              )}
            </Button>

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(category)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleQuickToggleStatus(category)}
                >
                  {category.is_active ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Ativar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => deleteCategorySafely(category.id)}
                  disabled={isDeleting}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Render subcategories if not collapsed */}
        {hasSubcategories && !isCollapsed && (
          <div className="space-y-2">
            {category.subcategories.map((sub: any) => renderCategory(sub, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando categorias...</p>
        </div>
      </div>
    );
  }

  const despesaCategories = categories.filter((cat) => cat.type === 'despesa');
  const receitaCategories = categories.filter((cat) => cat.type === 'receita');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Categorias</h2>
          <p className="text-muted-foreground">
            Organize suas receitas e despesas em categorias e subcategorias
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => handleNewCategory('receita')}
            className="border-green-200 text-green-700 hover:bg-green-50"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Nova Receita
          </Button>
          <Button 
            onClick={() => handleNewCategory('despesa')}
            className="bg-red-600 hover:bg-red-700"
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Nova Despesa
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Despesas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-red-200">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-700">
              Despesas ({despesaCategories.length})
            </h3>
          </div>
          <div className="space-y-3">
            {despesaCategories.length > 0 ? (
              despesaCategories.map((category) => renderCategory(category))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingDown className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma categoria de despesa criada</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleNewCategory('despesa')}
                >
                  Criar primeira categoria
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Receitas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-green-200">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-green-700">
              Receitas ({receitaCategories.length})
            </h3>
          </div>
          <div className="space-y-3">
            {receitaCategories.length > 0 ? (
              receitaCategories.map((category) => renderCategory(category))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma categoria de receita criada</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleNewCategory('receita')}
                >
                  Criar primeira categoria
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CategoryModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={selectedCategory ? updateCategory : createCategory}
        category={selectedCategory}
        categories={categories}
        preselectedType={preselectedType}
        isLoading={isCreating || isUpdating}
      />
    </div>
  );
}
