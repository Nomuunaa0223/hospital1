import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hms_user')); } catch { return null; }
  });
  const [checking, setChecking] = useState(true);

  const login = (u, t) => {
    setUser(u);
    localStorage.setItem('hms_user', JSON.stringify(u));
    localStorage.setItem('hms_token', t);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hms_user');
    localStorage.removeItem('hms_token');
  };

  useEffect(() => {
    const token = localStorage.getItem('hms_token');
    if (!token) { setChecking(false); return; }
    api.get('/auth/me')
      .then(({ data }) => {
        if (data?.user) {
          setUser({ id: data.user.id, email: data.user.email, role: data.user.role, must_change_password: !!data.user.must_change_password });
          localStorage.setItem('hms_user', JSON.stringify({ id: data.user.id, email: data.user.email, role: data.user.role, must_change_password: !!data.user.must_change_password }));
        } else {
          logout();
        }
      })
      .catch(() => logout())
      .finally(() => setChecking(false));
  }, []);

  return <AuthCtx.Provider value={{ user, login, logout, checking }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
