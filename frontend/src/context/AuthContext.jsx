import { createContext, useState, useContext, useEffect } from 'react';
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
    };
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch full profile from backend to get latest full_name etc.
  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      if (res.data?.success && res.data?.user) {
        const u = res.data.user;
        setUser((prev) => ({
          ...prev,
          full_name: u.full_name || prev?.full_name || '',
          email: u.email || prev?.email || '',
          phone: u.phone,
          profile_image: u.profile_image,
          city: u.city,
          address: u.address,
          gender: u.gender,
          state: u.state,
          pincode: u.pincode,
          role: u.role ? u.role.toLowerCase() : prev?.role || 'user',
        }));
      }
    } catch {
      // silently fail – token-based data is already set
    }
  };

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
  }, []);

  const login = async (token) => {
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
            full_name: u.full_name || parsed.full_name,
            email: u.email || parsed.email,
            phone: u.phone,
            profile_image: u.profile_image,
            city: u.city,
            address: u.address,
            gender: u.gender,
            state: u.state,
            pincode: u.pincode,
            role: u.role ? u.role.toLowerCase() : parsed.role,
          });
        }
      } catch {
        // Use token payload data as fallback
      }
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

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
