"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";

interface AuthUser {
  id: number;
  email: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  isAdmin: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const me = await api.auth.me();
      setUser({ id: me.id, email: me.email, role: me.role });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    setUser(res.user);
    router.push("/empleados");
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
