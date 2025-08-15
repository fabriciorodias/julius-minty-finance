import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PlusCircle, Edit2, ChevronDown, ChevronRight } from "lucide-react";
import { useCategories, Category } from '@/hooks/useCategories';
import { useBudgets } from '@/hooks/useBudgets';
import { BudgetModal } from '@/components/planning/BudgetModal';
import { MonthSelector } from '@/components/planning/MonthSelector';

const Planejamento = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialValues, setInitialValues] = useState<{
    type: 'fixed' | 'variable';
    fixedAmount?: number;
    monthlyAmounts?: number[];
  } | undefined>(undefined);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Initialize current month using local date to avoid timezone issues
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState<string>(
    `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`
  );
  
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { budgets, createFixedBudget, createVariableBudget, getYearlyBudgets, isCreatingFixed, isCreatingVariable } = useBudgets(currentMonth);

  // Extract year from string to avoid timezone issues
  const currentYear = parseInt(currentMonth.slice(0, 4), 10);

  // Separar categorias por tipo
  const receitas = categories.filter(cat => cat.type === 'receita');
  const despesas = categories.filter(cat => cat.type === 'despesa');

  // Função para obter o valor orçado de uma categoria no mês atual
  const getBudgetedAmount = (categoryId: string): number => {
    const budget = budgets.find(b => b.category_id === categoryId && b.month === currentMonth);
    return budget?.budgeted_amount || 0;
  };

  // Função para calcular a soma dos orçamentos das subcategorias
  const getSubcategoriesTotal = (category: Category): number => {
    if (!category.subcategories || category.subcategories.length === 0) {
      return getBudgetedAmount(category.id);
    }
    
    return category.subcategories.reduce((total, subcategory) => {
      return total + getBudgetedAmount(subcategory.id);
    }, 0);
  };

  // Por enquanto, valores realizados são zero (serão implementados com o módulo de lançamentos)
  const getRealizedAmount = (categoryId: string): number => {
    return 0; // Placeholder - será implementado com transactions
  };

  // Função para calcular a soma dos valores realizados das subcategorias
  const getSubcategoriesRealizedTotal = (category: Category): number => {
    if (!category.subcategories || category.subcategories.length === 0) {
      return getRealizedAmount(category.id);
    }
    
    return category.subcategories.reduce((total, subcategory) => {
      return total + getRealizedAmount(subcategory.id);
    }, 0);
  };

  const getDifference = (category: Category, categoryType: 'receita' | 'despesa'): number => {
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    
    let budgeted: number;
    let realized: number;
    
    if (hasSubcategories) {
      // Para categorias-pai, somar as diferenças das subcategorias
      return category.subcategories!.reduce((total, subcategory) => {
        return total + getDifference(subcategory, categoryType);
      }, 0);
    } else {
      // Para subcategorias, calcular a diferença individual
      budgeted = getBudgetedAmount(category.id);
      realized = getRealizedAmount(category.id);
    }
    
    // Para despesas: Planejado - Realizado (positivo = dentro do orçamento)
    // Para receitas: Realizado - Planejado (positivo = acima da meta)
    return categoryType === 'despesa' ? budgeted - realized : realized - budgeted;
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleEditBudget = async (category: Category) => {
    // Only allow editing for categories without subcategories
    if (category.subcategories && category.subcategories.length > 0) {
      return;
    }

    setSelectedCategory(category);
    
    try {
      // Fetch existing yearly budget data
      const yearlyBudgets = await getYearlyBudgets(category.id, currentYear);
      
      if (yearlyBudgets.length > 0) {
        // Check if all months have the same value (fixed) or different values (variable)
        const amounts = yearlyBudgets.map(b => b.budgeted_amount);
        const isFixed = amounts.every(amount => amount === amounts[0]);
        
        if (isFixed) {
          setInitialValues({
            type: 'fixed',
            fixedAmount: amounts[0]
          });
        } else {
          // Create array with 12 months, filling missing months with 0
          const monthlyAmounts = Array(12).fill(0);
          yearlyBudgets.forEach(budget => {
            // Fix the month index calculation to avoid timezone issues
            const monthIndex = parseInt(budget.month.slice(5, 7), 10) - 1;
            monthlyAmounts[monthIndex] = budget.budgeted_amount;
          });
          
          setInitialValues({
            type: 'variable',
            monthlyAmounts
          });
        }
      } else {
        // No existing budgets, start fresh
        setInitialValues(undefined);
      }
    } catch (error) {
      console.error('Error fetching yearly budgets:', error);
      setInitialValues(undefined);
    }
    
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

  const CategoryRow = ({ category, type }: { category: Category; type: 'receita' | 'despesa' }) => {
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const budgeted = hasSubcategories ? getSubcategoriesTotal(category) : getBudgetedAmount(category.id);
    const realized = hasSubcategories ? getSubcategoriesRealizedTotal(category) : getRealizedAmount(category.id);
    const difference = getDifference(category, type);
    const hasExceeded = type === 'despesa' && realized > budgeted && budgeted > 0;
    const isEditable = !hasSubcategories;
    const isExpanded = expandedCategories.has(category.id);

    if (hasSubcategories) {
      // Categoria-pai com subcategorias
      return (
        <>
          <tr className="border-b border-mint-border/50 bg-mint-hover/30">
            <td className="py-4 px-2">
              <Collapsible open={isExpanded} onOpenChange={() => toggleCategoryExpansion(category.id)}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-2 p-0 h-auto font-semibold text-mint-text-primary hover:bg-transparent"
                  >
                    {isExpanded ? 
                      <ChevronDown className="w-4 h-4" /> : 
                      <ChevronRight className="w-4 h-4" />
                    }
                    <span className="text-base font-bold">{category.name}</span>
                    <Badge variant="outline" className="text-xs ml-2">
                      {category.subcategories?.length} subcategorias
                    </Badge>
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            </td>
            <td className="py-4 px-2 text-center">
              <span className="text-mint-text-primary font-bold text-base">
                {formatCurrency(budgeted)}
              </span>
            </td>
            <td className={`py-4 px-2 text-center font-bold text-base ${
              hasExceeded ? 'text-red-600' : 'text-mint-text-primary'
            }`}>
              {formatCurrency(realized)}
            </td>
            <td className={`py-4 px-2 text-center font-bold text-base ${
              hasExceeded ? 'text-red-600' : 
              difference > 0 ? 'text-green-600' : 
              difference < 0 ? 'text-red-600' : 'text-mint-text-secondary'
            }`}>
              {formatCurrency(Math.abs(difference))}
              {difference > 0 && <span className="text-xs ml-1">↑</span>}
              {difference < 0 && <span className="text-xs ml-1">↓</span>}
            </td>
            <td className="py-4 px-2 text-center">
              <span className="text-mint-text-secondary text-sm">-</span>
            </td>
          </tr>
          
          {/* Subcategorias colapsáveis */}
          <tr>
            <td colSpan={5} className="p-0">
              <Collapsible open={isExpanded} onOpenChange={() => toggleCategoryExpansion(category.id)}>
                <CollapsibleContent>
                  <div className="bg-mint-hover/10">
                    {category.subcategories?.map((subcategory, index) => (
                      <SubcategoryRow 
                        key={subcategory.id} 
                        category={subcategory} 
                        type={type}
                        isLast={index === category.subcategories!.length - 1}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </td>
          </tr>
        </>
      );
    } else {
      // Categoria sem subcategorias (categoria independente)
      return (
        <tr className="border-b border-mint-border/50 hover:bg-mint-hover">
          <td className="py-3 px-2">
            <span className="font-medium text-mint-text-primary text-base">
              {category.name}
            </span>
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
    }
  };

  const SubcategoryRow = ({ 
    category, 
    type, 
    isLast 
  }: { 
    category: Category; 
    type: 'receita' | 'despesa';
    isLast: boolean;
  }) => {
    const budgeted = getBudgetedAmount(category.id);
    const realized = getRealizedAmount(category.id);
    const difference = getDifference(category, type);
    const hasExceeded = type === 'despesa' && realized > budgeted && budgeted > 0;

    return (
      <tr className={`hover:bg-mint-hover/50 ${!isLast ? 'border-b border-mint-border/20' : ''}`}>
        <td className="py-3 px-2 pl-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-mint-border"></div>
            <span className="font-medium text-mint-text-secondary text-sm">
              {category.name}
            </span>
          </div>
        </td>
        <td className="py-3 px-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditBudget(category)}
            className="text-mint-text-primary hover:bg-mint-hover text-sm"
          >
            {budgeted > 0 ? formatCurrency(budgeted) : 'Definir'}
          </Button>
        </td>
        <td className={`py-3 px-2 text-center font-medium text-sm ${
          hasExceeded ? 'text-red-600' : 'text-mint-text-primary'
        }`}>
          {formatCurrency(realized)}
        </td>
        <td className={`py-3 px-2 text-center font-medium text-sm ${
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
            <Edit2 className="w-3 h-3" />
          </Button>
        </td>
      </tr>
    );
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const allCategoryIds = new Set(categoriesList
                .filter(cat => cat.subcategories && cat.subcategories.length > 0)
                .map(cat => cat.id)
              );
              setExpandedCategories(
                expandedCategories.size === allCategoryIds.size ? 
                new Set() : 
                allCategoryIds
              );
            }}
            className="ml-auto text-xs text-mint-text-secondary hover:text-mint-text-primary"
          >
            {expandedCategories.size > 0 ? 'Recolher Todas' : 'Expandir Todas'}
          </Button>
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
              {categoriesList.map((category) => (
                <CategoryRow key={category.id} category={category} type={type} />
              ))}
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
        <div className="flex flex-col items-end gap-2">
          <p className="text-sm text-mint-text-secondary">Período de Referência</p>
          <MonthSelector 
            selectedMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
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
          setInitialValues(undefined);
        }}
        onSubmit={handleBudgetSubmit}
        category={selectedCategory}
        initialValues={initialValues}
        isLoading={isCreatingFixed || isCreatingVariable}
      />
    </div>
  );
};

export default Planejamento;
