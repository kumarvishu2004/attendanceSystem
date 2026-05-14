import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
import API from '../utils/api';


function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function TimeDisplay() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-center">
      <p className="text-4xl font-mono font-bold text-white tracking-tight">
        {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className="text-gray-500 text-sm mt-1">
        {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const { todayAttendance, isLoggedIn, isLoggedOut } = useAttendance();
  const [stats, setStats] = useState(null);
  const [myHistory, setMyHistory] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      API.get('/attendance/stats').then(r => setStats(r.data.stats)).catch(() => {});
    }
    const now = new Date();
    API.get(`/attendance/my-history?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
      .then(r => setMyHistory(r.data.records || []))
      .catch(() => {});
  }, [isAdmin]);

  const getStatusBadge = () => {
    if (!isLoggedIn) return <span className="badge-absent">Not Checked In</span>;
    if (isLoggedOut) return <span className="badge-present">Completed</span>;
    return <span className="badge-present">Active Session</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="card bg-gradient-to-r from-blue-900/40 to-purple-900/20 border-blue-800/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-gray-400 text-sm">{user?.employeeId}</span>
              {getStatusBadge()}
            </div>
          </div>
          <TimeDisplay />
        </div>
      </div>

      {/* Today's Attendance Card */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Today's Attendance</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-800/50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Login Time</p>
            <p className="text-lg font-bold text-white font-mono">
              {todayAttendance?.loginTime
                ? new Date(todayAttendance.loginTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : '--:--'}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-800/50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Logout Time</p>
            <p className="text-lg font-bold text-white font-mono">
              {todayAttendance?.logoutTime
                ? new Date(todayAttendance.logoutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : '--:--'}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-800/50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Total Hours</p>
            <p className="text-lg font-bold text-white font-mono">
              {todayAttendance?.totalHours ? `${todayAttendance.totalHours}h` : '0h'}
            </p>
          </div>
        </div>

        {!isLoggedIn && (
          <Link to="/attendance" className="btn-primary w-full text-center block mt-4">
            🔍 Mark Attendance with Face
          </Link>
        )}
        {isLoggedIn && !isLoggedOut && (
          <Link to="/attendance" className="btn-danger w-full text-center block mt-4">
            👋 Mark Logout
          </Link>
        )}
      </div>

      {/* Admin Stats */}
      {isAdmin && stats && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Today's Overview</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="👥" label="Total Employees" value={stats.totalEmployees} color="bg-blue-900/50" />
            <StatCard icon="✅" label="Present Today" value={stats.todayPresent} color="bg-emerald-900/50" />
            <StatCard icon="❌" label="Absent Today" value={stats.todayAbsent} color="bg-red-900/50" />
            <StatCard icon="🟢" label="Active Now" value={stats.todayActive} color="bg-purple-900/50" />
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {myHistory.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Attendance</h3>
            <Link to="/my-attendance" className="text-blue-400 text-xs hover:text-blue-300">View All →</Link>
          </div>
          <div className="space-y-2">
            {myHistory.slice(0, 5).map((rec) => (
              <div key={rec._id} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    rec.status === 'present' ? 'bg-emerald-400' :
                    rec.status === 'late' ? 'bg-amber-400' :
                    rec.status === 'half-day' ? 'bg-purple-400' : 'bg-red-400'
                  }`}></div>
                  <span className="text-sm text-white font-medium">{rec.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-mono">
                    {rec.loginTime ? new Date(rec.loginTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    {' → '}
                    {rec.logoutTime ? new Date(rec.logoutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                  </span>
                  <span className={`text-xs font-semibold ${
                    rec.status === 'present' ? 'text-emerald-400' :
                    rec.status === 'late' ? 'text-amber-400' :
                    rec.status === 'half-day' ? 'text-purple-400' : 'text-red-400'
                  }`}>{rec.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/attendance', icon: '📹', label: 'Mark Attendance' },
          { to: '/face-register', icon: '👤', label: 'Register Face' },
          { to: '/my-attendance', icon: '📋', label: 'My History' },
          ...(isAdmin ? [{ to: '/admin/reports', icon: '📊', label: 'Reports' }] : []),
        ].map(link => (
          <Link key={link.to} to={link.to}
            className="card text-center py-5 hover:border-blue-800/50 hover:bg-blue-900/10 transition-all duration-200 cursor-pointer">
            <div className="text-2xl mb-2">{link.icon}</div>
            <p className="text-xs font-medium text-gray-400">{link.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
