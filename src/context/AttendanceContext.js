import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from './AuthContext';

const AttendanceContext = createContext(null);

export const AttendanceProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTodayAttendance = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await API.get('/attendance/today');
      setTodayAttendance(res.data.attendance);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchTodayAttendance();
  }, [isAuthenticated]);

  // Heartbeat every 5 minutes to prevent auto-logout
  useEffect(() => {
    if (!isAuthenticated || !todayAttendance?.isActive) return;
    const interval = setInterval(async () => {
      try { await API.put('/attendance/heartbeat'); } catch {}
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, todayAttendance?.isActive]);

  const markLogin = async (method = 'face') => {
    const res = await API.post('/attendance/login', { method });
    setTodayAttendance(res.data.attendance);
    return res.data;
  };

  const markLogout = async (method = 'face') => {
    const res = await API.post('/attendance/logout', { method });
    setTodayAttendance(res.data.attendance);
    return res.data;
  };

  const isLoggedIn = !!todayAttendance?.loginTime;
  const isLoggedOut = !!todayAttendance?.logoutTime;
  const isActiveSession = todayAttendance?.isActive;

  return (
    <AttendanceContext.Provider value={{
      todayAttendance, loading, isLoggedIn, isLoggedOut, isActiveSession,
      markLogin, markLogout, fetchTodayAttendance
    }}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => useContext(AttendanceContext);
export default AttendanceContext;
