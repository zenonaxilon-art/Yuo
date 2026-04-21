import React, { createContext, useContext, useState, useEffect } from 'react';

type User = {
  id: number;
  username: string;
  role: string;
  verified: boolean;
  karma: number;
} | null;

interface AuthContextType {
  user: User;
  token: string | null;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer \${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
        else {
          setToken(null);
          localStorage.removeItem('token');
        }
      })
      .catch(() => {
        setToken(null);
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (userData: User, newToken: string) => {
    setUser(userData);
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    fetch('/api/auth/logout', { method: 'POST' });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
