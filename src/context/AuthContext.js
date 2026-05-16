import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import API from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken]     = useState(() => localStorage.getItem('token'));
  const logoutRef = useRef(null);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };
  logoutRef.current = logout;

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    let cancelled = false;
    API.get('/auth/me')
      .then(res => { if (!cancelled) setUser(res.data.user); })
      .catch(() => { if (!cancelled) logoutRef.current(); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const _saveSession = (t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  // Standard email+password login
  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const { token: t, user: u } = res.data;
    _saveSession(t, u);
    return { user: u };
  };

  // Google sign-in/sign-up
  // Returns { user } on success, or { needsEmployeeId: true, googleData } if new user needs extra info
 const googleLogin = async (credential, employeeId = null, department = null) => {
  const payload = { idToken: credential };

  if (employeeId) payload.employeeId = employeeId;
  if (department) payload.department = department;

  const res = await API.post('/auth/google', payload);

  const {
    token: t,
    user: u,
    needsEmployeeId,
    googleData
  } = res.data;

  if (needsEmployeeId) {
    return { needsEmployeeId: true, googleData };
  }

  _saveSession(t, u);

  return { user: u };
};

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const fetchMe = async () => {
    try {
      const res = await API.get('/auth/me');
      setUser(res.data.user);
    } catch { logout(); }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, token,
      isAdmin: user?.role === 'admin',
      isAuthenticated: !!user,
      login, logout, googleLogin, updateUser, fetchMe
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
