
import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <Construction className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold text-muted-foreground">
            Em Construção
          </h2>
          <p className="text-muted-foreground">
            Esta página está sendo desenvolvida e estará disponível em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
