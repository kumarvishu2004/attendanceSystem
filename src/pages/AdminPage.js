import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';

export default function AdminPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/dashboard').then(r => {
      setDashboard(r.data.dashboard);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const stats = [
    { label: 'Total Employees', value: dashboard?.totalEmployees ?? 0, icon: '👥', color: 'bg-blue-900/50 text-blue-400' },
    { label: 'Present Today', value: dashboard?.presentToday ?? 0, icon: '✅', color: 'bg-emerald-900/50 text-emerald-400' },
    { label: 'Absent Today', value: dashboard?.absentToday ?? 0, icon: '❌', color: 'bg-red-900/50 text-red-400' },
    { label: 'Active Now', value: dashboard?.activeNow ?? 0, icon: '🟢', color: 'bg-purple-900/50 text-purple-400' },
    { label: 'Late Today', value: dashboard?.lateToday ?? 0, icon: '⏰', color: 'bg-amber-900/50 text-amber-400' },
    { label: 'Avg Hours/Month', value: `${dashboard?.avgHoursMonth ?? 0}h`, icon: '⌚', color: 'bg-indigo-900/50 text-indigo-400' },
  ];

  const quickLinks = [
    { to: '/admin/users', icon: '👤', label: 'Manage Users', desc: 'Add, edit, deactivate employees' },
    { to: '/admin/attendance', icon: '📋', label: 'All Attendance', desc: 'View & edit attendance records' },
    { to: '/admin/reports', icon: '📊', label: 'Reports & Export', desc: 'Monthly reports & Excel download' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
        <p className="text-gray-500 text-sm mt-1">System overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickLinks.map(l => (
          <Link key={l.to} to={l.to} className="card hover:border-blue-800/50 hover:bg-blue-900/10 transition-all duration-200 group">
            <div className="text-3xl mb-3">{l.icon}</div>
            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{l.label}</h3>
            <p className="text-xs text-gray-500 mt-1">{l.desc}</p>
          </Link>
        ))}
      </div>

      {/* Department Breakdown */}
      {dashboard?.byDepartment && Object.keys(dashboard.byDepartment).length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Today by Department</h3>
          <div className="space-y-3">
            {Object.entries(dashboard.byDepartment).map(([dept, count]) => (
              <div key={dept} className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-28 truncate">{dept}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${Math.min((count / (dashboard.totalEmployees || 1)) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-mono text-white w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Logins */}
      {dashboard?.recentLogins?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Logins Today</h3>
            <Link to="/admin/attendance" className="text-blue-400 text-xs hover:text-blue-300">View All →</Link>
          </div>
          <div className="space-y-2">
            {dashboard.recentLogins.map(r => (
              <div key={r._id} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                    {r.userId?.name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{r.userId?.name}</p>
                    <p className="text-xs text-gray-500">{r.userId?.department}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-gray-400">
                  {r.loginTime ? new Date(r.loginTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
