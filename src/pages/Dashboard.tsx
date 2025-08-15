
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-julius-primary">Dashboard</h1>
          <p className="text-julius-muted-foreground mt-1">
            Visão geral das suas finanças pessoais
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="julius-card julius-hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-julius-muted-foreground flex items-center">
              <span className="material-icons text-julius-accent mr-2">account_balance_wallet</span>
              Saldo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-julius-primary">R$ 12.345,67</div>
            <p className="text-sm text-julius-accent mt-1">+2.5% este mês</p>
          </CardContent>
        </Card>

        <Card className="julius-card julius-hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-julius-muted-foreground flex items-center">
              <span className="material-icons text-julius-accent mr-2">trending_up</span>
              Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-julius-primary">R$ 8.500,00</div>
            <p className="text-sm text-julius-accent mt-1">Este mês</p>
          </CardContent>
        </Card>

        <Card className="julius-card julius-hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-julius-muted-foreground flex items-center">
              <span className="material-icons text-julius-accent mr-2">trending_down</span>
              Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-julius-primary">R$ 4.230,45</div>
            <p className="text-sm text-julius-muted-foreground mt-1">Este mês</p>
          </CardContent>
        </Card>

        <Card className="julius-card julius-hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-julius-muted-foreground flex items-center">
              <span className="material-icons text-julius-accent mr-2">savings</span>
              Economia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-julius-accent">R$ 4.269,55</div>
            <p className="text-sm text-julius-accent mt-1">+50.2% este mês</p>
          </CardContent>
        </Card>
      </div>

      <Card className="julius-card">
        <CardHeader>
          <CardTitle className="text-julius-primary flex items-center">
            <span className="material-icons text-julius-accent mr-2">construction</span>
            Em Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-julius-muted-foreground">
            Esta seção está sendo desenvolvida. Em breve você terá acesso a gráficos detalhados, 
            análises de tendências e muito mais funcionalidades para gerenciar suas finanças.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
