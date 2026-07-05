import { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser } from '../api/users';

export default function UsersManagement() {
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
      setError(err.response?.data?.message || 'حدث خطأ أثناء إنشاء الحساب');
      setLoading(false);
    }
  };

  const toggleActive = async (u) => {
    setLoading(true);
    try {
      await updateUser(u.id, { is_active: !u.is_active });
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء تحديث الحالة');
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>إدارة المستخدمين</h5>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowModal(true); setTempPassword(null); }}>
          + إضافة موظف جديد
        </button>
      </div>

      {loading ? (
        <p>جارٍ التحميل...</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>الاسم</th><th>اسم المستخدم</th><th>البريد</th><th>الدور</th><th>الحالة</th><th></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.role === 'admin' ? 'مدير' : 'كاشير'}</td>
                <td>
                  <span className={`badge ${u.is_active ? 'bg-success' : 'bg-secondary'}`}>
                    {u.is_active ? 'مفعّل' : 'معطّل'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleActive(u)}>
                    {u.is_active ? 'تعطيل' : 'تفعيل'}
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
                  <h6>تم إنشاء الحساب بنجاح</h6>
                  <p className="alert alert-warning">
                    كلمة السر المؤقتة: <strong>{tempPassword}</strong><br />
                    سلّمها للموظف الآن — لن تظهر مرة أخرى.
                  </p>
                  <button className="btn btn-primary w-100" onClick={() => setShowModal(false)}>إغلاق</button>
                </div>
              ) : (
                <form onSubmit={handleCreate}>
                  <h6 className="mb-3">إضافة موظف جديد</h6>
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <input className="form-control mb-2" placeholder="الاسم الكامل"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  <input className="form-control mb-2" placeholder="اسم المستخدم"
                    value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
                  <input type="email" className="form-control mb-2" placeholder="البريد الإلكتروني"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                  <select className="form-select mb-3" value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="cashier">كاشير</option>
                    <option value="admin">مدير</option>
                  </select>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary flex-grow-1">حفظ</button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
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