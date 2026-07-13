import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getUsers, createUser, updateUser } from '../api/users';

export default function UsersManagement() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', email: '', role: 'cashier' });
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState(null); // shown once, per UC-07 note

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await createUser(form);
      setTempPassword(result.temp_password); // surfaced once, never re-fetchable
      setForm({ name: '', username: '', email: '', role: 'cashier' });
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || t('errorOccurred'));
      setLoading(false);
    }
  };

  const toggleActive = async (u) => {
    setLoading(true);
    try {
      await updateUser(u.id, { is_active: !u.is_active });
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || t('errorOccurred'));
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>{t('cashiersManagement')}</h5>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowModal(true); setTempPassword(null); }}>
          {t('addCashierButton')}
        </button>
      </div>

      {loading ? (
        <p>{t('loading')}</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>{t('tableName')}</th><th>{t('tableUsername')}</th><th>{t('tableEmail')}</th><th>{t('tableRole')}</th><th>{t('tableStatus')}</th><th></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.role === 'admin' ? t('roleAdmin') : t('roleCashier')}</td>
                <td>
                  <span className={`badge ${u.is_active ? 'bg-success' : 'bg-secondary'}`}>
                    {u.is_active ? t('activeStatus') : t('inactiveStatus')}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleActive(u)}>
                    {u.is_active ? t('disableAction') : t('enableAction')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog">
            <div className="modal-content p-3">
              {tempPassword ? (
                <div>
                  <h6>{t('userCreationSuccess')}</h6>
                  <p className="alert alert-warning">
                    {t('tempPasswordLabel')}: <strong>{tempPassword}</strong><br />
                    {t('temporaryPasswordNote')}
                  </p>
                  <button className="btn btn-primary w-100" onClick={() => setShowModal(false)}>{t('closeModal')}</button>
                </div>
              ) : (
                <form onSubmit={handleCreate}>
                  <h6 className="mb-3">{t('addUserTitle')}</h6>
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <input className="form-control mb-2" placeholder={t('fullNamePlaceholder')}
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  <input className="form-control mb-2" placeholder={t('usernamePlaceholder')}
                    value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
                  <input type="email" className="form-control mb-2" placeholder={t('emailPlaceholder')}
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                  <select className="form-select mb-3" value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="cashier">{t('roleCashier')}</option>
                    <option value="admin">{t('roleAdmin')}</option>
                  </select>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary flex-grow-1">{t('save')}</button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>{t('cancel')}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}