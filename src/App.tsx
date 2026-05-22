import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useSearchParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TestViewProvider } from "@/contexts/TestViewContext";
import AppLayout from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import UsersPage from "./pages/UsersPage";
import AuditPage from "./pages/AuditPage";
import LoginPage from "./pages/LoginPage";
import PublicEventsPage from "./pages/PublicEventsPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DesignManualPage from "./pages/DesignManualPage";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  
  if (loading) return null;
  if (isAuthenticated) return <Navigate to={redirect} replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <TestViewProvider>
          <AppProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={
                  <AuthRedirect><LoginPage /></AuthRedirect>
                } />
                <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
                <Route element={<AppLayout />}>
                  <Route path="/" element={<PublicEventsPage />} />
                  <Route path="/visao-geral" element={
                    <ProtectedRoute><Dashboard /></ProtectedRoute>
                  } />
                  <Route path="/calendario" element={
                    <ProtectedRoute><CalendarPage /></ProtectedRoute>
                  } />
                  <Route path="/eventos" element={<Navigate to="/" replace />} />
                  <Route path="/usuarios" element={
                    <ProtectedRoute><UsersPage /></ProtectedRoute>
                  } />
                  <Route path="/auditoria" element={
                    <ProtectedRoute><AuditPage /></ProtectedRoute>
                  } />
                  <Route path="/design-manual" element={
                    <ProtectedRoute><DesignManualPage /></ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </AppProvider>
        </TestViewProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
