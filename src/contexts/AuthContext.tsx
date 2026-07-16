import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "@/types";
import { API_BASE_URL, API_BASE_NORMALIZED, STORAGE_KEYS } from "@/config/environment";

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  login: (params: { identifier: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const persistUser = useCallback((next: AuthUser | null) => {
    if (next) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEYS.USER);
    setUser(next);
  }, []);

  const refreshMe = useCallback(async () => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return;

    const resp = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!resp.ok) {
      persistUser(null);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      return;
    }

    const payload = (await resp.json()) as { success: boolean; data?: any };
    // backend returns new tokens + user in `data` (depending on implementation)
    if (payload?.data?.refreshToken)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, payload.data.refreshToken);

    const me = payload?.data?.user;
    if (me) persistUser(me as AuthUser);
  }, [persistUser]);

  const login = useCallback(
    async ({ identifier, password }: { identifier: string; password: string }) => {
      const resp = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      if (!resp.ok) {
        // Backend returns: { success:false, error:{ code, message, details } }
        // Parse it so the UI can show a friendly warning.
        const contentType = resp.headers.get("content-type") || "";
        let backendMessage: string | undefined;
        let backendCode: string | undefined;

        if (contentType.includes("application/json")) {
          try {
            const body = (await resp.json()) as { error?: { message?: string; code?: string } };
            backendMessage = body?.error?.message;
            backendCode = body?.error?.code;
          } catch {
            // ignore parsing errors
          }
        } else {
          const text = await resp.text().catch(() => "");
          backendMessage = text || undefined;
        }

        if (resp.status === 401 || backendCode === "UNAUTHORIZED") {
          throw new Error("Incorrect username or password.");
        }

        throw new Error(backendMessage || `Login failed (${resp.status})`);
      }

      const payload = (await resp.json()) as { success: boolean; data?: any };
      const { accessToken, refreshToken, user } = payload.data ?? {};
      
      // Store both access and refresh tokens
      if (accessToken) localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      if (refreshToken) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

      // Backend auth response shape differs from our frontend AuthUser.
      // Normalize so the rest of the app can rely on user.role/name/department.
      const normalized = normalizeBackendUser(user);
      persistUser((normalized ?? null) as AuthUser | null);
    },
    [persistUser],
  );

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    try {
      // If refresh token is stored, backend logout can still work with authenticate middleware only.
      // Keep it best-effort; always clear local state.
      if (refreshToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        }).catch(() => undefined);
      }
    } finally {
      persistUser(null);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    }
  }, [persistUser]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, login, logout, refreshMe }),
    [user, ready, login, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function normalizeBackendUser(backendUser: any): Partial<AuthUser> | null {
  if (!backendUser) return null;

  const roles: string[] = Array.isArray(backendUser.roles) ? backendUser.roles : [];
  const role = (roles[0] ?? null) as AuthUser["role"] | null;

  // Backend sends displayName; frontend expects name.
  const name =
    typeof backendUser.displayName === "string"
      ? backendUser.displayName
      : (backendUser.name ?? "");

  // Frontend expects department. Backend user currently may not include it explicitly.
  // Fallbacks keep the app from crashing; if missing, modules will show AccessDenied instead.
  const department =
    typeof backendUser.department === "string"
      ? backendUser.department
      : typeof backendUser.employeeDepartment === "string"
        ? backendUser.employeeDepartment
        : "";

  const title = typeof backendUser.title === "string" ? backendUser.title : "";
  const email = typeof backendUser.email === "string" ? backendUser.email : "";

  // Try permissions-derived role if roles[0] is missing but permissions include module grants.
  // (Not enough info for department; we keep safe fallbacks.)

  // avatarInitials is optional for runtime safety; use a conservative fallback.
  const avatarInitials =
    typeof backendUser.avatarInitials === "string"
      ? backendUser.avatarInitials
      : name
        ? String(name)
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((s: string) => s[0]?.toUpperCase())
            .join("")
        : "";

  return {
    id: String(backendUser.id ?? ""),
    name,
    email,
    title,
    department,
    role: role ?? ("employee" as AuthUser["role"]),
    avatarInitials,
  };
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
