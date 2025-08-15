
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Planos from "./pages/Planos";
import Planejamento from "./pages/Planejamento";
import Lancamentos from "./pages/Lancamentos";
import Investimentos from "./pages/Investimentos";
import Entidades from "./pages/Entidades";
import Tutoriais from "./pages/Tutoriais";
import NotFound from "./pages/NotFound";

console.log('App.tsx: App component loading...');

const queryClient = new QueryClient();

const App = () => {
  console.log('App.tsx: App component rendering...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/planos" element={<Planos />} />
              <Route path="/planejamento" element={<Planejamento />} />
              <Route path="/lancamentos" element={<Lancamentos />} />
              <Route path="/investimentos" element={<Investimentos />} />
              <Route path="/entidades" element={<Entidades />} />
              <Route path="/tutoriais" element={<Tutoriais />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

console.log('App.tsx: App component defined');

export default App;
