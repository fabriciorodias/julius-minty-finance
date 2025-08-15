
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit2 } from "lucide-react";
import { useCategories, Category } from '@/hooks/useCategories';
import { useBudgets } from '@/hooks/useBudgets';
import { BudgetModal } from '@/components/planning/BudgetModal';

const Planejamento = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { budgets, createFixedBudget, createVariableBudget, isCreatingFixed, isCreatingVariable } = useBudgets();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

  // Separar categorias por tipo
  const receitas = categories.filter(cat => cat.type === 'receita');
  const despesas = categories.filter(cat => cat.type === 'despesa');

  // Função para obter o valor orçado de uma categoria no mês atual
  const getBudgetedAmount = (categoryId: string): number => {
    const budget = budgets.find(b => b.category_id === categoryId && b.month === currentMonth);
    return budget?.budgeted_amount || 0;
  };

  // Por enquanto, valores realizados são zero (serão implementados com o módulo de lançamentos)
  const getRealizedAmount = (categoryId: string): number => {
    return 0; // Placeholder - será implementado com transactions
  };

  const getDifference = (categoryId: string, categoryType: 'receita' | 'despesa'): number => {
    const budgeted = getBudgetedAmount(categoryId);
    const realized = getRealizedAmount(categoryId);
    
    // Para despesas: Planejado - Realizado (positivo = dentro do orçamento)
    // Para receitas: Realizado - Planejado (positivo = acima da meta)
    return categoryType === 'despesa' ? budgeted - realized : realized - budgeted;
  };

  const handleEditBudget = (category: Category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleBudgetSubmit = (type: 'fixed' | 'variable', amount?: number, monthlyAmounts?: number[]) => {
    if (!selectedCategory) return;

    if (type === 'fixed' && amount !== undefined) {
      createFixedBudget({
        categoryId: selectedCategory.id,
        amount,
        year: currentYear
      });
    } else if (type === 'variable' && monthlyAmounts) {
      createVariableBudget({
        categoryId: selectedCategory.id,
        monthlyAmounts,
        year: currentYear
      });
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const CategoryTable = ({ title, categoriesList, type }: { 
    title: string; 
    categoriesList: Category[]; 
    type: 'receita' | 'despesa' 
  }) => (
    <Card className="mint-card">
      <CardHeader>
        <CardTitle className="text-mint-text-primary flex items-center">
          <span className="material-icons mr-2">
            {type === 'receita' ? 'trending_up' : 'trending_down'}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-mint-border">
                <th className="text-left py-3 px-2 text-mint-text-secondary font-medium">Categoria</th>
                <th className="text-center py-3 px-2 text-mint-text-secondary font-medium">Planejado</th>
                <th className="text-center py-3 px-2 text-mint-text-secondary font-medium">Realizado</th>
                <th className="text-center py-3 px-2 text-mint-text-secondary font-medium">Diferença</th>
                <th className="text-center py-3 px-2 text-mint-text-secondary font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categoriesList.map((category) => {
                const budgeted = getBudgetedAmount(category.id);
                const realized = getRealizedAmount(category.id);
                const difference = getDifference(category.id, type);
                const hasExceeded = type === 'despesa' && realized > budgeted && budgeted > 0;

                return (
                  <tr key={category.id} className="border-b border-mint-border/50 hover:bg-mint-hover">
                    <td className="py-3 px-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-mint-text-primary">{category.name}</span>
                        {category.subcategories.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {category.subcategories.map((sub) => (
                              <Badge key={sub.id} variant="secondary" className="text-xs">
                                {sub.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditBudget(category)}
                        className="text-mint-text-primary hover:bg-mint-hover"
                      >
                        {budgeted > 0 ? formatCurrency(budgeted) : 'Definir'}
                      </Button>
                    </td>
                    <td className={`py-3 px-2 text-center font-medium ${
                      hasExceeded ? 'text-red-600' : 'text-mint-text-primary'
                    }`}>
                      {formatCurrency(realized)}
                    </td>
                    <td className={`py-3 px-2 text-center font-medium ${
                      hasExceeded ? 'text-red-600' : 
                      difference > 0 ? 'text-green-600' : 
                      difference < 0 ? 'text-red-600' : 'text-mint-text-secondary'
                    }`}>
                      {formatCurrency(Math.abs(difference))}
                      {difference > 0 && <span className="text-xs ml-1">↑</span>}
                      {difference < 0 && <span className="text-xs ml-1">↓</span>}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditBudget(category)}
                        className="text-mint-text-secondary hover:text-mint-text-primary hover:bg-mint-hover"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  if (categoriesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-mint-text-primary">Planejamento e Controle</h1>
            <p className="text-mint-text-secondary mt-1 font-normal">
              Organize e controle seu orçamento
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-mint-text-secondary">Carregando categorias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-mint-text-primary">Planejamento e Controle</h1>
          <p className="text-mint-text-secondary mt-1 font-normal">
            Organize e controle seu orçamento mensal
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-mint-text-secondary">Período de Referência</p>
          <p className="font-semibold text-mint-text-primary">
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {receitas.length > 0 && (
          <CategoryTable title="Receitas" categoriesList={receitas} type="receita" />
        )}
        
        {despesas.length > 0 && (
          <CategoryTable title="Despesas" categoriesList={despesas} type="despesa" />
        )}

        {receitas.length === 0 && despesas.length === 0 && (
          <Card className="mint-card">
            <CardContent className="text-center py-8">
              <PlusCircle className="mx-auto h-12 w-12 text-mint-text-secondary mb-4" />
              <h3 className="text-lg font-semibold text-mint-text-primary mb-2">
                Nenhuma categoria encontrada
              </h3>
              <p className="text-mint-text-secondary mb-4">
                Você precisa criar categorias antes de poder definir orçamentos.
              </p>
              <Button 
                onClick={() => window.location.href = '/entidades'} 
                className="bg-mint-primary hover:bg-mint-primary/90"
              >
                Gerenciar Categorias
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCategory(null);
        }}
        onSubmit={handleBudgetSubmit}
        category={selectedCategory}
        isLoading={isCreatingFixed || isCreatingVariable}
      />
    </div>
  );
};

export default Planejamento;
