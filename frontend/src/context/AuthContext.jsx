import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          email: payload.email,
          role: payload.role,
          id: payload.user_id,
        });
      } catch (e) {
        console.error('Failed to parse token', e);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({
        email: payload.email,
        role: payload.role,
        id: payload.user_id,
      });
    } catch (e) {
      console.error('Failed to parse token during login', e);
    }
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const getToken = () => localStorage.getItem('token');
  const isAuthenticated = () => !!user;

  if (loading) return null; // Wait to initialize state from localStorage before rendering tree

  return (
    <AuthContext.Provider value={{ user, login, logout, getToken, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
