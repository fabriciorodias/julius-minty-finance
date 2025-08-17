
import { Categories } from '@/components/categories/Categories';

const Configuracoes = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Configure suas categorias e outras preferências do sistema
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">Categorias</h2>
          <Categories />
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
