
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 font-normal">
            Visão geral das suas finanças pessoais
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="mint-card mint-hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <span className="material-icons text-primary mr-2">account_balance_wallet</span>
              Saldo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">R$ 12.345,67</div>
            <p className="text-sm text-primary mt-1 font-medium">+2.5% este mês</p>
          </CardContent>
        </Card>

        <Card className="mint-card mint-hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <span className="material-icons text-primary mr-2">trending_up</span>
              Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">R$ 8.500,00</div>
            <p className="text-sm text-primary mt-1 font-medium">Este mês</p>
          </CardContent>
        </Card>

        <Card className="mint-card mint-hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <span className="material-icons text-primary mr-2">trending_down</span>
              Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">R$ 4.230,45</div>
            <p className="text-sm text-muted-foreground mt-1 font-normal">Este mês</p>
          </CardContent>
        </Card>

        <Card className="mint-card mint-hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
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

      <Card className="mint-card">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center font-bold">
            <span className="material-icons text-primary mr-2">construction</span>
            Em Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground font-normal">
            Esta seção está sendo desenvolvida. Em breve você terá acesso a gráficos detalhados, 
            análises de tendências e muito mais funcionalidades para gerenciar suas finanças.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
