import React, { useEffect, useState } from 'react';
import API from '../utils/api';

const STATUS_OPTIONS = ['present', 'late', 'half-day', 'absent', 'on-leave'];

export default function AdminAttendancePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRec, setEditRec] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const now = new Date();
  const [filters, setFilters] = useState({ month: now.getMonth() + 1, year: now.getFullYear(), page: 1 });
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchRecords(); }, [filters]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/attendance/all?month=${filters.month}&year=${filters.year}&page=${filters.page}&limit=30`);
      setRecords(res.data.records || []);
      setTotal(res.data.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await API.put(`/attendance/${editRec._id}`, {
        loginTime: editRec.loginTime,
        logoutTime: editRec.logoutTime,
        status: editRec.status,
        notes: editRec.notes
      });
      setMsg('Record updated');
      setEditRec(null);
      fetchRecords();
    } catch (e) { setMsg('Update failed'); }
    finally { setSaving(false); }
  };

  const toLocalInput = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toISOString().slice(0, 16);
  };

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">All Attendance</h2>
          <p className="text-gray-500 text-sm mt-1">{total} records found</p>
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-900/20 border border-emerald-800/50 text-emerald-400 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          {msg}
          <button onClick={() => setMsg('')} className="text-gray-500 hover:text-gray-400">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="card flex flex-wrap gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Month</label>
          <select className="input-field text-sm py-2"
            value={filters.month} onChange={e => setFilters({ ...filters, month: parseInt(e.target.value), page: 1 })}>
            {months.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Year</label>
          <select className="input-field text-sm py-2"
            value={filters.year} onChange={e => setFilters({ ...filters, year: parseInt(e.target.value), page: 1 })}>
            {years.map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <p className="text-3xl mb-3">📭</p>
              <p>No records found for this period</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Employee', 'Date', 'Login', 'Logout', 'Hours', 'Status', 'Method', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {records.map(r => (
                  <tr key={r._id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white text-sm">{r.userId?.name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{r.userId?.employeeId}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-300 text-xs">{r.date}</td>
                    <td className="px-4 py-3 font-mono text-gray-300 text-xs">
                      {r.loginTime ? new Date(r.loginTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-300 text-xs">
                      {r.logoutTime ? new Date(r.logoutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-400 text-xs">{r.totalHours ? `${r.totalHours}h` : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        r.status === 'present' ? 'bg-emerald-900/50 text-emerald-400' :
                        r.status === 'late' ? 'bg-amber-900/50 text-amber-400' :
                        r.status === 'half-day' ? 'bg-purple-900/50 text-purple-400' :
                        'bg-red-900/50 text-red-400'
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs capitalize">{r.loginMethod}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setEditRec({ ...r })}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > 30 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <span className="text-sm text-gray-500">Page {filters.page} of {Math.ceil(total / 30)}</span>
            <div className="flex gap-2">
              <button disabled={filters.page <= 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">← Prev</button>
              <button disabled={filters.page >= Math.ceil(total / 30)}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editRec && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Edit Attendance</h3>
            <p className="text-sm text-gray-500 mb-5">{editRec.userId?.name} — {editRec.date}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Login Time</label>
                <input type="datetime-local" className="input-field text-sm"
                  value={toLocalInput(editRec.loginTime)}
                  onChange={e => setEditRec({ ...editRec, loginTime: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Logout Time</label>
                <input type="datetime-local" className="input-field text-sm"
                  value={toLocalInput(editRec.logoutTime)}
                  onChange={e => setEditRec({ ...editRec, logoutTime: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Status</label>
                <select className="input-field text-sm" value={editRec.status}
                  onChange={e => setEditRec({ ...editRec, status: e.target.value })}>
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Notes</label>
                <input className="input-field text-sm" placeholder="Optional notes..."
                  value={editRec.notes || ''}
                  onChange={e => setEditRec({ ...editRec, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditRec(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSaveEdit} className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
