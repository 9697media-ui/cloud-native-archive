import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type TestPersona = {
  id: string;
  name: string;
  email: string;
  permission_level: 'admin_geral' | 'diretor' | 'gestor_unidade' | 'coordenador' | 'analista' | 'usuario_padrao' | 'assistente' | 'estagiario' | 'visualizador';
  role: 'admin' | 'editor' | 'viewer' | null;
  unit: string;
  is_active: boolean;
};

export const TEST_PERSONAS: TestPersona[] = [
  {
    id: 'test-admin',
    name: 'Admin Geral (Teste)',
    email: 'admin.teste@lovable.local',
    permission_level: 'admin_geral',
    role: 'admin',
    unit: 'Evento Geral do Grupo',
    is_active: true,
  },
  {
    id: 'test-diretor',
    name: 'Diretor (Teste)',
    email: 'diretor.teste@lovable.local',
    permission_level: 'diretor',
    role: 'admin',
    unit: 'Evento Geral do Grupo',
    is_active: true,
  },
  {
    id: 'test-gestor-dic',
    name: 'Gestor DIC (Teste)',
    email: 'gestor.dic@lovable.local',
    permission_level: 'gestor_unidade',
    role: 'editor',
    unit: 'DIC',
    is_active: true,
  },
  {
    id: 'test-coordenador',
    name: 'Coordenador (Teste)',
    email: 'coord.teste@lovable.local',
    permission_level: 'coordenador',
    role: 'editor',
    unit: 'Santana',
    is_active: true,
  },
  {
    id: 'test-analista',
    name: 'Analista (Teste)',
    email: 'analista.teste@lovable.local',
    permission_level: 'analista',
    role: 'editor',
    unit: 'Nilópolis',
    is_active: true,
  },
  {
    id: 'test-usuario',
    name: 'Usuário Padrão (Teste)',
    email: 'usuario.teste@lovable.local',
    permission_level: 'usuario_padrao',
    role: 'viewer',
    unit: 'DIC',
    is_active: true,
  },
  {
    id: 'test-assistente',
    name: 'Assistente (Teste)',
    email: 'assistente.teste@lovable.local',
    permission_level: 'assistente',
    role: 'viewer',
    unit: 'Santana',
    is_active: true,
  },
  {
    id: 'test-estagiario',
    name: 'Estagiário (Teste)',
    email: 'estagiario.teste@lovable.local',
    permission_level: 'estagiario',
    role: 'viewer',
    unit: 'Nilópolis',
    is_active: true,
  },
  {
    id: 'test-visualizador',
    name: 'Visualizador (Teste)',
    email: 'view.teste@lovable.local',
    permission_level: 'visualizador',
    role: 'viewer',
    unit: 'Santana',
    is_active: true,
  },
  {
    id: 'test-pendente',
    name: 'Usuário Pendente (Teste)',
    email: 'pendente.teste@lovable.local',
    permission_level: 'visualizador',
    role: null,
    unit: 'Pendente',
    is_active: false,
  },
];

const ALLOWED_TESTERS = ['mkt@anabrasil.org', 'alyson-viana@hotmail.com'];

const STORAGE_KEY = 'test_persona_id';

interface TestViewContextType {
  canUseTestMode: boolean;
  activePersona: TestPersona | null;
  setActivePersona: (persona: TestPersona | null) => void;
  resetView: () => void;
}

const TestViewContext = createContext<TestViewContextType | undefined>(undefined);

export function TestViewProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activePersona, setActivePersonaState] = useState<TestPersona | null>(null);

  const canUseTestMode = !!user?.email && ALLOWED_TESTERS.includes(user.email);

  // Load persona from sessionStorage on mount / user change
  useEffect(() => {
    if (!canUseTestMode) {
      setActivePersonaState(null);
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    const savedId = sessionStorage.getItem(STORAGE_KEY);
    if (savedId) {
      const found = TEST_PERSONAS.find(p => p.id === savedId);
      if (found) setActivePersonaState(found);
    }
  }, [canUseTestMode, user?.id]);

  const setActivePersona = useCallback((persona: TestPersona | null) => {
    if (persona) {
      sessionStorage.setItem(STORAGE_KEY, persona.id);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    setActivePersonaState(persona);
  }, []);

  const resetView = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setActivePersonaState(null);
  }, []);

  return (
    <TestViewContext.Provider value={{ canUseTestMode, activePersona, setActivePersona, resetView }}>
      {children}
    </TestViewContext.Provider>
  );
}

export function useTestView() {
  const ctx = useContext(TestViewContext);
  if (!ctx) throw new Error('useTestView must be used within TestViewProvider');
  return ctx;
}
