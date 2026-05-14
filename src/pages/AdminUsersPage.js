import React, { useEffect, useState } from 'react';
import API from '../utils/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/users/all');
      setUsers(res.data.users || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleToggleActive = async (id) => {
    try {
      await API.put(`/users/${id}/toggle-active`);
      fetchUsers();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user and all their attendance records?')) return;
    try {
      await API.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (e) { console.error(e); }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await API.put(`/admin/users/${editUser._id}`, editUser);
      setMsg('User updated successfully');
      setEditUser(null);
      fetchUsers();
    } catch (e) { setMsg('Update failed'); }
    finally { setSaving(false); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.employeeId.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Manage Users</h2>
          <p className="text-gray-500 text-sm mt-1">{users.length} total users</p>
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-900/20 border border-emerald-800/50 text-emerald-400 px-4 py-3 rounded-xl text-sm">
          {msg}
        </div>
      )}

      {/* Search */}
      <div className="card">
        <input
          className="input-field"
          placeholder="Search by name, employee ID, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Employee', 'ID', 'Department', 'Role', 'Face', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filtered.map(u => (
                  <tr key={u._id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-xs">
                          {u.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-white">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-300 text-xs">{u.employeeId}</td>
                    <td className="px-4 py-3 text-gray-400">{u.department}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        u.role === 'admin' ? 'bg-amber-900/50 text-amber-400' : 'bg-blue-900/50 text-blue-400'
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.faceRegistered
                        ? <span className="text-emerald-400 text-xs">✓ Registered</span>
                        : <span className="text-red-400 text-xs">✗ Not set</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        u.isActive ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'
                      }`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditUser({ ...u })}
                          className="text-xs text-blue-400 hover:text-blue-300 font-medium">Edit</button>
                        <button onClick={() => handleToggleActive(u._id)}
                          className={`text-xs font-medium ${u.isActive ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'}`}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => handleDelete(u._id)}
                          className="text-xs text-red-400 hover:text-red-300 font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-5">Edit User</h3>
            <div className="space-y-4">
              {[
                { label: 'Name', key: 'name', type: 'text' },
                { label: 'Employee ID', key: 'employeeId', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Department', key: 'department', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-gray-500 mb-1.5">{f.label}</label>
                  <input
                    className="input-field text-sm"
                    type={f.type}
                    value={editUser[f.key] || ''}
                    onChange={e => setEditUser({ ...editUser, [f.key]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Role</label>
                <select className="input-field text-sm" value={editUser.role}
                  onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditUser(null)} className="btn-secondary flex-1">Cancel</button>
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
