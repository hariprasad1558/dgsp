import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './AdminUserManagement.css';

const API = 'http://localhost:5000/api/users';
const MOBILE_REGEX = /^\+?[0-9]{10,15}$/;

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const UNION_TERRITORIES = [
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const CENTRAL_ORGANIZATIONS = [
  'AAI', 'Assam Rifles', 'BCAS', 'BPR&D', 'BSF', 'CAPFs', 'CAPFs/CPOs',
  'CBDT', 'CBI', 'CISF', 'CPOs', 'DGs of CAPFs/CPOs', 'ED', 'FIU-IND',
  'FS CD & HG', 'I4C', 'IB', 'ITBP', 'NATGRID', 'NCB', 'NCRB', 'NDRF',
  'NFSU', 'NIA', 'NTRO', 'R&AW', 'SSB', 'SVPNPA'
];

const MINISTRIES = [
  'MEA', 'MHA', 'MOD', 'MoF', 'MORTH', 'MeitY',
  'Ministry of Corporate Affairs', 'Ministry of Education',
  'Ministry of Finance', 'Ministry of Health & Family Welfare',
  'Ministry of I&B', 'Ministry of Labour', 'Ministry of Law & Justice',
  'Ministry of Ports, Shipping & Waterways',
  'Ministry of Social Justice & Empowerment', 'Ministry of Tourism',
  'Ministry of Tribal Affairs', 'Ministry of Women & Child Development',
  'Ministry of Youth Affairs & Sports'
];

const EMPTY_FORM = {
  userId: '',
  password: '',
  mobile: '',
  department: '',
  state: '',
  role: 'user'
};

function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [deptType, setDeptType] = useState(''); // 'state', 'org', 'ministry'

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(API, { headers });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'role' && value === 'admin') {
        updated.department = '';
        updated.state = '';
      }
      if (name === 'department' && deptType === 'state') {
        updated.state = value;
      }
      return updated;
    });
    if (name === 'role' && value === 'admin') setDeptType('');
    setFormError('');
    setFormSuccess('');
  };

  const validateForm = () => {
    if (!formData.userId.trim()) return 'User ID is required.';
    if (!formData.password.trim()) return 'Password is required.';
    if (formData.password.length < 6) return 'Password must be at least 6 characters.';
    if (!formData.mobile.trim()) return 'Mobile number is required.';
    if (!MOBILE_REGEX.test(formData.mobile.trim())) return 'Enter a valid 10-15 digit mobile number.';
    if (formData.role !== 'admin' && !formData.department.trim()) return 'Department / Organisation is required.';
    return null;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) { setFormError(err); return; }

    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      await axios.post(`${API}/add`, {
        ...formData,
        userId: formData.userId.trim(),
        mobile: formData.mobile.trim(),
        department: formData.department.trim(),
        state: formData.state.trim()
      }, { headers });

      setFormSuccess(`User "${formData.userId}" added successfully.`);
      setFormData(EMPTY_FORM);
      setDeptType('');
      await loadUsers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add user.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (user) => {
    setConfirmDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.userId);
    setConfirmDelete(null);
    try {
      await axios.delete(`${API}/${confirmDelete.userId}`, { headers });
      await loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="um-page">
      <div className="um-header">
        <h2 className="um-title">User Management</h2>
        <span className="um-badge">{users.length} User{users.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Add User Form ─────────────────────────────────────── */}
      <div className="um-card">
        <h3 className="um-section-title">Add New User</h3>

        {formError && <div className="um-alert um-alert-error">{formError}</div>}
        {formSuccess && <div className="um-alert um-alert-success">{formSuccess}</div>}

        <form className="um-form" onSubmit={handleAddUser} autoComplete="off">
          <div className="um-form-grid">
            <div className="um-field">
              <label>User ID <span className="req">*</span></label>
              <input
                name="userId"
                placeholder="e.g. state_ap_01"
                value={formData.userId}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>

            <div className="um-field">
              <label>Password <span className="req">*</span></label>
              <div className="um-password-wrap">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button type="button" className="um-eye-btn" onClick={() => setShowPassword(p => !p)}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="um-field">
              <label>Mobile Number <span className="req">*</span></label>
              <input
                name="mobile"
                placeholder="e.g. 9876543210"
                value={formData.mobile}
                onChange={handleChange}
              />
            </div>

            {formData.role !== 'admin' && (
            <div className="um-field um-field-full">
              <label>Department / Organisation <span className="req">*</span></label>
              <div className="um-dept-tabs">
                <button
                  type="button"
                  className={`um-dept-tab${deptType === 'state' ? ' active' : ''}`}
                  onClick={() => { setDeptType('state'); setFormData(p => ({ ...p, department: '', state: '' })); }}
                >
                  🏛️ States / UTs
                </button>
                <button
                  type="button"
                  className={`um-dept-tab${deptType === 'org' ? ' active' : ''}`}
                  onClick={() => { setDeptType('org'); setFormData(p => ({ ...p, department: '', state: '' })); }}
                >
                  🏢 Central Organizations
                </button>
                <button
                  type="button"
                  className={`um-dept-tab${deptType === 'ministry' ? ' active' : ''}`}
                  onClick={() => { setDeptType('ministry'); setFormData(p => ({ ...p, department: '', state: '' })); }}
                >
                  📂 Ministries
                </button>
              </div>

              {deptType === 'state' && (
                <select name="department" value={formData.department} onChange={handleChange}>
                  <option value="">— Select State / UT —</option>
                  <optgroup label="States">
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </optgroup>
                  <optgroup label="Union Territories">
                    {UNION_TERRITORIES.map(u => <option key={u} value={u}>{u}</option>)}
                  </optgroup>
                </select>
              )}

              {deptType === 'org' && (
                <select name="department" value={formData.department} onChange={handleChange}>
                  <option value="">— Select Central Organization —</option>
                  {CENTRAL_ORGANIZATIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              )}

              {deptType === 'ministry' && (
                <select name="department" value={formData.department} onChange={handleChange}>
                  <option value="">— Select Ministry —</option>
                  {MINISTRIES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              )}

              {!deptType && (
                <input
                  name="department"
                  placeholder="Select a category above or type manually"
                  value={formData.department}
                  onChange={handleChange}
                />
              )}
            </div>
            )}



            <div className="um-field">
              <label>Role <span className="req">*</span></label>
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <button type="submit" className="um-btn-primary" disabled={submitting}>
            {submitting ? 'Adding…' : '+ Add User'}
          </button>
        </form>
      </div>

      {/* ── Users Table ───────────────────────────────────────── */}
      <div className="um-card">
        <h3 className="um-section-title">Registered Users</h3>

        {loading ? (
          <div className="um-loading">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="um-empty">No users found. Add one above.</div>
        ) : (
          <div className="um-table-wrap">
            <table className="um-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User ID</th>
                  <th>Mobile</th>
                  <th>Department</th>
                  <th>State</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u.userId}>
                    <td>{idx + 1}</td>
                    <td><strong>{u.userId}</strong></td>
                    <td>{u.mobile || '—'}</td>
                    <td>{u.department}</td>
                    <td>{u.state || '—'}</td>
                    <td>
                      <span className={`um-role-badge ${u.role === 'admin' ? 'admin' : 'user'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                    <td>
                      <button
                        className="um-btn-delete"
                        onClick={() => handleDeleteClick(u)}
                        disabled={deletingId === u.userId}
                      >
                        {deletingId === u.userId ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Delete Confirm Modal ──────────────────────────────── */}
      {confirmDelete && (
        <div className="um-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <h4>Confirm Delete</h4>
            <p>
              Are you sure you want to delete user <strong>{confirmDelete.userId}</strong>?
              This action cannot be undone.
            </p>
            <div className="um-modal-actions">
              <button className="um-btn-primary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="um-btn-delete" onClick={handleConfirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUserManagement;
