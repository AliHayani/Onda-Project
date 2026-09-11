import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | string;
  isStaff?: boolean;
  firstName?: string;
  lastName?: string;
  accessToken?: string;
  refreshToken?: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (authUser: AuthUser) => void;
  logout: () => void;
}

export const AUTH_STORAGE_KEY = 'onda_auth_state';

export const getStoredAuth = (): AuthUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    return null;
  }
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuth());

  useEffect(() => {
    if (user === null) {
      setUser(getStoredAuth());
    }
  }, [user]);

  const login = (authUser: AuthUser) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  };

  const logout = () => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(user),
      user,
      login,
      logout,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};

export default useAuth;
