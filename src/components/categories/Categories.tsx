
import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { CategoryModal } from '@/components/entities/CategoryModal';

export function Categories() {
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategorySafely,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCategories();

  const handleEdit = (category: any) => {
    setSelectedCategory(category);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
  };

  const renderCategory = (category: any, level = 0) => (
    <div key={category.id} className="space-y-2">
      <div
        className={`flex items-center justify-between p-3 bg-card rounded-lg border ${
          !category.is_active ? 'opacity-50' : ''
        }`}
        style={{ marginLeft: level * 20 }}
      >
        <div className="flex items-center space-x-2">
          {!category.is_active && <EyeOff className="h-4 w-4 text-muted-foreground" />}
          <div>
            <h4 className="font-medium">{category.name}</h4>
            <p className="text-sm text-muted-foreground capitalize">
              {category.type}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(category)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteCategorySafely(category.id)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {category.subcategories?.map((sub: any) => renderCategory(sub, level + 1))}
    </div>
  );

  if (isLoading) {
    return <div>Carregando categorias...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Categorias</h2>
          <p className="text-muted-foreground">
            Organize suas receitas e despesas em categorias
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold mb-3 text-red-600">Despesas</h3>
          <div className="space-y-2">
            {categories
              .filter((cat) => cat.type === 'despesa')
              .map((category) => renderCategory(category))}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3 text-green-600">Receitas</h3>
          <div className="space-y-2">
            {categories
              .filter((cat) => cat.type === 'receita')
              .map((category) => renderCategory(category))}
          </div>
        </div>
      </div>

      <CategoryModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={selectedCategory ? updateCategory : createCategory}
        category={selectedCategory}
        categories={categories}
        isLoading={isCreating || isUpdating}
      />
    </div>
  );
}
