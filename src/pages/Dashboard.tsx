
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-mint-text-primary">Dashboard</h1>
          <p className="text-mint-text-secondary mt-1 font-normal">
            Visão geral das suas finanças pessoais
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="mint-card mint-hover-lift mint-gradient-green text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white opacity-90 flex items-center">
              <span className="material-icons text-white mr-2">account_balance_wallet</span>
              Saldo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">R$ 12.345,67</div>
            <p className="text-sm text-white opacity-90 mt-1 font-medium">+2.5% este mês</p>
          </CardContent>
        </Card>

        <Card className="mint-card mint-hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-mint-text-secondary flex items-center">
              <span className="material-icons text-primary mr-2">trending_up</span>
              Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-mint-text-primary">R$ 8.500,00</div>
            <p className="text-sm text-primary mt-1 font-medium">Este mês</p>
          </CardContent>
        </Card>

        <Card className="mint-card mint-hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-mint-text-secondary flex items-center">
              <span className="material-icons text-mint-text-secondary mr-2">trending_down</span>
              Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-mint-text-primary">R$ 4.230,45</div>
            <p className="text-sm text-mint-text-secondary mt-1 font-normal">Este mês</p>
          </CardContent>
        </Card>

        <Card className="mint-card mint-hover-lift border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-mint-text-secondary flex items-center">
              <span className="material-icons text-primary mr-2">savings</span>
              Economia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">R$ 4.269,55</div>
            <p className="text-sm text-primary mt-1 font-medium">+50.2% este mês</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mint-card mint-gradient-light">
        <CardHeader>
          <CardTitle className="text-mint-text-primary flex items-center font-bold">
            <span className="material-icons text-primary mr-2">construction</span>
            Em Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-mint-text-secondary font-normal">
            Esta seção está sendo desenvolvida. Em breve você terá acesso a gráficos detalhados, 
            análises de tendências e muito mais funcionalidades para gerenciar suas finanças.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
