import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useSearchParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TestViewProvider } from "@/contexts/TestViewContext";
import AppLayout from "@/components/AppLayout";
import { ThemeProvider } from "@/components/ThemeProvider";
import Dashboard from "./pages/Dashboard";

import CalendarPage from "./pages/CalendarPage";
import UsersPage from "./pages/UsersPage";
import AuditPage from "./pages/AuditPage";
import LoginPage from "./pages/LoginPage";
import PublicEventsPage from "./pages/PublicEventsPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AuthConfirmPage from "./pages/AuthConfirmPage";
import DesignManualPage from "./pages/DesignManualPage";
import NewsGeneratorPage from "./pages/NewsGeneratorPage";
import TransparencyPage from "./pages/TransparencyPage";
import NotFound from "./pages/NotFound";
import EmailPreview from "./pages/EmailPreview";
import AdminToolboxPage from "./pages/AdminToolboxPage";



const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get('embed') === 'true';

  if (loading) return null;
  if (!isAuthenticated && !isEmbed) return <Navigate to="/login" replace />;
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
    <ThemeProvider defaultTheme="light" storageKey="anabrasil-theme">
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
                <Route path="/auth/confirm" element={<AuthConfirmPage />} />
                <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
                <Route path="/email-preview" element={<EmailPreview />} />
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
                  <Route path="/noticias" element={
                    <ProtectedRoute><NewsGeneratorPage /></ProtectedRoute>
                  } />
                  <Route path="/portal-transparencia" element={
                    <ProtectedRoute><TransparencyPage /></ProtectedRoute>
                  } />
                  <Route path="/admin-toolbox" element={
                    <ProtectedRoute><AdminToolboxPage /></ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />

                </Route>
              </Routes>
            </BrowserRouter>
          </AppProvider>
        </TestViewProvider>
      </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);


export default App;
