import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  present: 'badge-present',
  late: 'badge-late',
  'half-day': 'badge-half',
  absent: 'badge-absent',
  'on-leave': 'badge-half'
};

export default function MyAttendancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const [filters, setFilters] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear()
  });

  useEffect(() => {
    fetchHistory();
  }, [filters]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/attendance/my-history?month=${filters.month}&year=${filters.year}`);
      setRecords(res.data.records || []);
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const token = localStorage.getItem('token');
    window.open(
      `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/export/employee/${user._id}?month=${filters.month}&year=${filters.year}`,
      '_blank'
    );
  };

  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">My Attendance</h2>
          <p className="text-gray-500 text-sm mt-1">Your attendance history and statistics</p>
        </div>
        {/* <button onClick={handleExport} className="btn-success text-sm flex items-center gap-2 self-start">
          <span>⬇️</span> Export Excel
        </button> */}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Month</label>
            <select
              className="input-field text-sm py-2 pr-8"
              value={filters.month}
              onChange={e => setFilters({ ...filters, month: parseInt(e.target.value) })}
            >
              {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Year</label>
            <select
              className="input-field text-sm py-2"
              value={filters.year}
              onChange={e => setFilters({ ...filters, year: parseInt(e.target.value) })}
            >
              {years.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Days', value: summary.total, icon: '📅', color: 'text-blue-400' },
            { label: 'Present', value: summary.present, icon: '✅', color: 'text-emerald-400' },
            { label: 'Late', value: summary.late, icon: '⏰', color: 'text-amber-400' },
            { label: 'Avg Hours', value: `${summary.avgHours}h`, icon: '⌚', color: 'text-purple-400' },
          ].map(item => (
            <div key={item.label} className="card text-center py-4">
              <p className="text-2xl mb-1">{item.icon}</p>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">
            Attendance Log — {months[filters.month - 1]} {filters.year}
          </h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <p className="text-3xl mb-3">📭</p>
              <p>No attendance records for this period</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Login</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Logout</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hours</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {records.map(rec => (
                  <tr key={rec._id} className="transition-colors">
                    <td className="px-6 py-3 font-medium text-white">{rec.date}</td>
                    <td className="px-6 py-3 font-mono text-gray-300">
                      {rec.loginTime ? new Date(rec.loginTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-6 py-3 font-mono text-gray-300">
                      {rec.logoutTime ? new Date(rec.logoutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-6 py-3 font-mono text-gray-300">
                      {rec.totalHours ? `${rec.totalHours}h` : '-'}
                    </td>
                    <td className="px-6 py-3">
                      <span className={STATUS_COLORS[rec.status] || 'badge-absent'}>{rec.status}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-500 capitalize text-xs">{rec.loginMethod || 'face'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
