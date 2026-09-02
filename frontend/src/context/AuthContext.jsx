import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const parseToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      email: payload.email,
      role: payload.role ? payload.role.toLowerCase() : 'user',
      id: payload.user_id,
      full_name: payload.full_name || '',
      account_status: payload.account_status ? payload.account_status.toLowerCase() : 'approved',
    };
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch full profile from backend to get latest full_name etc.
  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/users/profile');
      if (res.data?.success && res.data?.user) {
        const u = res.data.user;
        setUser((prev) => ({
          ...prev,
          ...u,
          full_name: u.full_name || prev?.full_name || '',
          email: u.email || prev?.email || '',
          role: u.role ? u.role.toLowerCase() : prev?.role || 'user',
          account_status: u.account_status ? u.account_status.toLowerCase() : prev?.account_status || 'approved',
        }));
      }
    } catch {
      // silently fail – token-based data is already set
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const parsed = parseToken(token);
      if (parsed) {
        setUser(parsed);
        // Enrich with backend profile data
        fetchProfile();
      } else {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, [fetchProfile]);

  const login = useCallback(async (token) => {
    localStorage.setItem('token', token);
    const parsed = parseToken(token);
    if (parsed) {
      setUser(parsed);
      // Fetch fresh profile data from backend right after login
      try {
        const res = await api.get('/users/profile');
        if (res.data?.success && res.data?.user) {
          const u = res.data.user;
          setUser({
            ...parsed,
            ...u,
            full_name: u.full_name || parsed.full_name,
            email: u.email || parsed.email,
            role: u.role ? u.role.toLowerCase() : parsed.role,
            account_status: u.account_status ? u.account_status.toLowerCase() : parsed.account_status,
          });
        }
      } catch {
        // Use token payload data as fallback
      }
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
  }, []);

  const getToken = () => localStorage.getItem('token');
  const isAuthenticated = () => !!user;

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, getToken, isAuthenticated, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
