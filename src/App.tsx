
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Projecoes from "./pages/Projecoes";
import Planos from "./pages/Planos";
import Planejamento from "./pages/Planejamento";
import Lancamentos from "./pages/Lancamentos";
import LancamentosRecorrentes from "./pages/LancamentosRecorrentes";
import Investimentos from "./pages/Investimentos";
import Contas from "./pages/Contas";
import Configuracoes from "./pages/Configuracoes";
import Tutoriais from "./pages/Tutoriais";
import Ferramentas from "./pages/Ferramentas";
import Profile from "./pages/Profile";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import NotFound from "./pages/NotFound";
import ImportarTransacoes from "./pages/ImportarTransacoes";
import { useState } from "react";

console.log('App.tsx: App component loading...');

const App = () => {
  console.log('App.tsx: App component rendering...');
  
  // Initialize QueryClient inside the component to ensure proper React context
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
      },
    },
  }));
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Auth routes */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Navigate to="/projecoes" replace />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/projecoes" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Projecoes />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/planos" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Planos />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/planejamento" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Planejamento />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/lancamentos" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Lancamentos />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/lancamentos/recorrentes" element={
                <ProtectedRoute>
                  <LancamentosRecorrentes />
                </ProtectedRoute>
              } />
              <Route path="/investimentos" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Investimentos />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/contas" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Contas />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/configuracoes" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Configuracoes />
                  </AppLayout>
                </ProtectedRoute>
              } />
              {/* Redirect from old route to new route for backward compatibility */}
              <Route path="/entidades" element={
                <ProtectedRoute>
                  <Navigate to="/contas" replace />
                </ProtectedRoute>
              } />
              <Route path="/ferramentas" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Ferramentas />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/tutoriais" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Tutoriais />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Profile />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/importar" element={
                <ProtectedRoute>
                  <ImportarTransacoes />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

console.log('App.tsx: App component defined');

export default App;
