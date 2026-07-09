import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthUser, RoleId } from "@/types";
import { ROLES } from "@/rbac/roles";

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  login: (role: RoleId) => void;
  logout: () => void;
  switchRole: (role: RoleId) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "hst.auth";

function userFromRole(role: RoleId): AuthUser {
  const def = ROLES[role];
  return {
    id: `USR-${role}`,
    name: def.demoUser.name,
    email: def.demoUser.email,
    title: def.demoUser.title,
    department: def.demoUser.department,
    role,
    avatarInitials: def.demoUser.avatarInitials,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: AuthUser | null) => {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
    setUser(next);
  }, []);

  const login = useCallback((role: RoleId) => persist(userFromRole(role)), [persist]);
  const switchRole = useCallback((role: RoleId) => persist(userFromRole(role)), [persist]);
  const logout = useCallback(() => persist(null), [persist]);

  return (
    <AuthContext.Provider value={{ user, ready, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
