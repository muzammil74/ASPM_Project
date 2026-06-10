import { createContext, useContext, useState, ReactNode } from "react";

interface AuthState {
  token: string | null;
  role: "student" | "admin" | null;
  userId: string | null;
  name: string | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  login: (token: string, role: string, userId: string, name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadInitial(): AuthState {
  return {
    token: localStorage.getItem("token"),
    role: (localStorage.getItem("role") as "student" | "admin") ?? null,
    userId: localStorage.getItem("userId"),
    name: localStorage.getItem("userName"),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(loadInitial);

  const login = (token: string, role: string, userId: string, name: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("userId", userId);
    localStorage.setItem("userName", name);
    setAuth({ token, role: role as "student" | "admin", userId, name });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    setAuth({ token: null, role: null, userId: null, name: null });
  };

  return (
    <AuthContext.Provider value={{ ...auth, isAuthenticated: !!auth.token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
