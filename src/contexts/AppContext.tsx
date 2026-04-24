import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppEvent, AppUser, Unit } from '@/types';
import { mockEvents, mockUsers } from '@/data/mockData';

interface AppContextType {
  events: AppEvent[];
  users: AppUser[];
  selectedEvent: AppEvent | null;
  selectedUser: AppUser | null;
  selectedMonth: Date;
  setSelectedEvent: (event: AppEvent | null) => void;
  setSelectedUser: (user: AppUser | null) => void;
  setSelectedMonth: (date: Date) => void;
  addEvent: (event: AppEvent) => void;
  updateEvent: (event: AppEvent) => void;
  deleteEvent: (id: string) => void;
  updateUser: (user: AppUser) => void;
  deleteUser: (id: string) => void;
  detectConflicts: (event: AppEvent) => AppEvent[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function hasOverlap(a: AppEvent, b: AppEvent): boolean {
  if (a.id === b.id) return false;
  if (a.status === 'cancelado' || b.status === 'cancelado') return false;
  const aStart = new Date(a.start_datetime).getTime();
  const aEnd = new Date(a.end_datetime).getTime();
  const bStart = new Date(b.start_datetime).getTime();
  const bEnd = new Date(b.end_datetime).getTime();
  const sameScope = a.unit === b.unit || a.unit === 'Evento Geral do Grupo' || b.unit === 'Evento Geral do Grupo';
  return sameScope && aStart < bEnd && aEnd > bStart;
}

function recalculateAllConflicts(events: AppEvent[]): AppEvent[] {
  // For each event, check if it has ANY overlap with another event
  return events.map(ev => {
    const hasConflict = events.some(other => hasOverlap(ev, other));
    if (ev.has_conflict !== hasConflict) {
      return { ...ev, has_conflict: hasConflict, updated_at: new Date().toISOString() };
    }
    return ev;
  });
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<AppEvent[]>(() => recalculateAllConflicts(mockEvents));
  const [users, setUsers] = useState<AppUser[]>(mockUsers);
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const detectConflicts = useCallback((event: AppEvent): AppEvent[] => {
    return events.filter(e => hasOverlap(event, e));
  }, [events]);

  const addEvent = useCallback((event: AppEvent) => {
    setEvents(prev => recalculateAllConflicts([...prev, event]));
  }, []);

  const updateEvent = useCallback((event: AppEvent) => {
    setEvents(prev => recalculateAllConflicts(prev.map(e => e.id === event.id ? event : e)));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => recalculateAllConflicts(prev.filter(e => e.id !== id)));
  }, []);

  const updateUser = useCallback((user: AppUser) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      events, users, selectedEvent, selectedUser, selectedMonth,
      setSelectedEvent, setSelectedUser, setSelectedMonth,
      addEvent, updateEvent, deleteEvent, updateUser, deleteUser, detectConflicts,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
