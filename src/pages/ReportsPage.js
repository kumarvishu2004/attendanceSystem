import React, { useState, useEffect } from 'react';
import API from '../utils/api';

export default function ReportsPage() {
  const [report, setReport]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [exporting, setExporting]   = useState(false);
  const [gsLoading, setGsLoading]   = useState(false);
  const [gsResult, setGsResult]     = useState(null);   // { url, monthName, year }
  const [gsError, setGsError]       = useState('');

  const now = new Date();
  const [filters, setFilters] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });

  const months = ['January','February','March','April','May','June','July',
                  'August','September','October','November','December'];
  const years  = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  useEffect(() => { fetchReport(); }, [filters]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/admin/monthly-report?month=${filters.month}&year=${filters.year}`);
      setReport(res.data.report || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── Traditional Excel download ──────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const url   = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/export/monthly?month=${filters.month}&year=${filters.year}`;
      const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const blob  = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Attendance_${months[filters.month - 1]}_${filters.year}.xlsx`;
      a.click();
    } catch (e) { alert('Export failed'); }
    finally { setExporting(false); }
  };

  // ── Generate Live Google Sheet ──────────────────────────────────────────────
  const handleGoogleSheet = async () => {
    setGsLoading(true);
    setGsResult(null);
    setGsError('');
    try {
      const res = await API.post('/export/google-sheet', {
        month: filters.month,
        year:  filters.year,
      });
      if (res.data.success) {
        setGsResult({ url: res.data.url, monthName: res.data.monthName, year: res.data.year });
      }
    } catch (e) {
      setGsError(e.response?.data?.message || 'Failed to create Google Sheet. Check server config.');
    } finally {
      setGsLoading(false);
    }
  };

  const getAttendancePct = (row) => {
    if (!row.totalDays) return 0;
    return Math.round((row.presentDays / row.totalDays) * 100);
  };

  const getPctColor = (pct) => {
    if (pct >= 90) return 'text-emerald-400';
    if (pct >= 75) return 'text-blue-400';
    if (pct >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Monthly Reports</h2>
          <p className="text-gray-500 text-sm mt-1">Attendance summary and export</p>
        </div>
        <div className="flex flex-wrap gap-2 self-start">
          {/* Download Excel */}
          <button onClick={handleExport} disabled={exporting}
            className="btn-success flex items-center gap-2">
            {exporting ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg> Exporting...</>
            ) : <><span>⬇️</span> Download Excel</>}
          </button>

          {/* Live Google Sheet */}
          <button onClick={handleGoogleSheet} disabled={gsLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all
                       bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-60 disabled:cursor-not-allowed">
            {gsLoading ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg> Creating Sheet...</>
            ) : (
              <>
                {/* Google Sheets icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="1" width="18" height="22" rx="2" fill="#34A853"/>
                  <rect x="7" y="8" width="10" height="1.5" rx="0.75" fill="white"/>
                  <rect x="7" y="11.5" width="10" height="1.5" rx="0.75" fill="white"/>
                  <rect x="7" y="15" width="7" height="1.5" rx="0.75" fill="white"/>
                  <path d="M15 1v5h5" fill="#1E8E3E"/>
                  <path d="M15 1l5 5h-5V1z" fill="#81C995"/>
                </svg>
                Live Google Sheet
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">Month</label>
          <select className="input-field text-sm py-2"
            value={filters.month}
            onChange={e => { setFilters({ ...filters, month: parseInt(e.target.value) }); setGsResult(null); }}>
            {months.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">Year</label>
          <select className="input-field text-sm py-2"
            value={filters.year}
            onChange={e => { setFilters({ ...filters, year: parseInt(e.target.value) }); setGsResult(null); }}>
            {years.map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Google Sheet result banner */}
      {gsError && (
        <div className="bg-red-900/30 border border-red-700/40 rounded-xl px-5 py-4 flex items-start gap-3">
          <span className="text-red-400 text-lg">⚠️</span>
          <div>
            <p className="text-red-400 font-semibold text-sm">Google Sheet creation failed</p>
            <p className="text-red-300/70 text-xs mt-1">{gsError}</p>
            <p className="text-gray-500 text-xs mt-2">
              Make sure <code className="text-gray-300">GOOGLE_SERVICE_ACCOUNT_JSON</code> is set in <code className="text-gray-300">server/.env</code>.
              See README for setup steps.
            </p>
          </div>
        </div>
      )}

      {gsResult && (
        <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl px-5 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-700/40 rounded-xl flex items-center justify-center text-xl">📊</div>
            <div>
              <p className="text-emerald-400 font-semibold">Live Google Sheet Created!</p>
              <p className="text-gray-400 text-xs mt-0.5">
                {gsResult.monthName} {gsResult.year} — Anyone with the link can edit in real time
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={gsResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              🔗 Open Google Sheet
            </a>
            <button
              onClick={() => { navigator.clipboard.writeText(gsResult.url); }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              📋 Copy Link
            </button>
          </div>
          <p className="text-gray-500 text-xs">
            🟢 Real-time collaboration enabled — multiple people can edit simultaneously and see changes live.
          </p>
        </div>
      )}

      {/* Stats */}
      {report.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Employees', value: report.length, icon: '👥', color: 'text-blue-400' },
            { label: 'Avg Attendance', value: `${Math.round(report.reduce((s,r) => s + getAttendancePct(r), 0) / report.length)}%`, icon: '📊', color: 'text-emerald-400' },
            { label: 'Avg Hours/Day', value: `${(report.reduce((s,r) => s + parseFloat(r.avgHours||0), 0) / report.length).toFixed(1)}h`, icon: '⌚', color: 'text-purple-400' },
            { label: 'Total Records', value: report.reduce((s,r) => s + r.presentDays, 0), icon: '📋', color: 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className="card text-center py-4">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold text-white">
            {months[filters.month - 1]} {filters.year} — Employee Summary
          </h3>
          <span className="text-xs text-gray-500">{report.length} employees</span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : report.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <p className="text-3xl mb-3">📭</p><p>No data for this period</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Employee','Dept','Present','Absent','Late','Half Day','Total Hours','Avg Hours','Attendance %'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {report.map(row => {
                  const pct = getAttendancePct(row);
                  return (
                    <tr key={row.employeeId}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{row.name}</p>
                        <p className="text-xs text-gray-500">{row.employeeId}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{row.department}</td>
                      <td className="px-4 py-3 text-emerald-400 font-mono font-bold">{row.presentDays}</td>
                      <td className="px-4 py-3 text-red-400 font-mono">{row.absentDays}</td>
                      <td className="px-4 py-3 text-amber-400 font-mono">{row.lateDays}</td>
                      <td className="px-4 py-3 text-purple-400 font-mono">{row.halfDays}</td>
                      <td className="px-4 py-3 text-gray-300 font-mono">{row.totalHours}h</td>
                      <td className="px-4 py-3 text-gray-300 font-mono">{row.avgHours}h</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-1.5 rounded-full ${
                              pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-blue-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
                            }`} style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className={`text-xs font-bold ${getPctColor(pct)}`}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card bg-blue-900/10 border-blue-800/30">
          <h3 className="font-semibold text-blue-400 mb-2 text-sm">⬇️ Download Excel includes:</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• <strong className="text-gray-300">Sheet 1:</strong> Monthly summary with all employee stats</li>
            <li>• <strong className="text-gray-300">Sheet 2:</strong> Daily attendance with colour coding</li>
            <li>• <strong className="text-gray-300">Sheet 3:</strong> Editable template for manual corrections</li>
          </ul>
        </div>
        <div className="card bg-emerald-900/10 border-emerald-800/30">
          <h3 className="font-semibold text-emerald-400 mb-2 text-sm">🟢 Live Google Sheet includes:</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Same 3 sheets as Excel export</li>
            <li>• <strong className="text-gray-300">Real-time editing</strong> — multiple people simultaneously</li>
            <li>• <strong className="text-gray-300">Shareable link</strong> — no login required to edit</li>
            <li>• Requires <code className="text-gray-300">GOOGLE_SERVICE_ACCOUNT_JSON</code> in server .env</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
