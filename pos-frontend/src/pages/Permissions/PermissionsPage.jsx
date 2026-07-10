// src/pages/Permissions/PermissionsPage.jsx
import { useEffect, useState } from 'react';
import { getCashierPermissions, updateCashierPermission } from '../../api/permissionService';

export default function PermissionsPage() {
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getCashierPermissions();
        if (!ignore) setCashiers(data);
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || 'تعذر تحميل بيانات الصلاحيات');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleToggle = async (user) => {
    setSavingId(user.id);
    setError(null);
    try {
      await updateCashierPermission(user.id, !user.can_return_without_approval);
      setCashiers((prev) =>
        prev.map((c) =>
          c.id === user.id ? { ...c, can_return_without_approval: !c.can_return_without_approval } : c
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'تعذر تحديث الصلاحية');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4 text-center">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  return (
    <div className="container mt-4" style={{ maxWidth: 720 }}>
      <h3>إدارة الصلاحيات</h3>
      <p className="text-muted">
        تحديد الكاشيرين المسموح لهم بتنفيذ عمليات الإرجاع دون الحاجة لتأكيد المدير.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      {cashiers.length === 0 ? (
        <p className="text-muted">لا يوجد حسابات كاشير بعد.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>اسم المستخدم</th>
              <th>الحالة</th>
              <th>إرجاع بدون موافقة</th>
            </tr>
          </thead>
          <tbody>
            {cashiers.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.username}</td>
                <td>
                  <span className={`badge ${c.is_active ? 'bg-success' : 'bg-secondary'}`}>
                    {c.is_active ? 'فعال' : 'معطل'}
                  </span>
                </td>
                <td>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={c.can_return_without_approval}
                      disabled={savingId === c.id}
                      onChange={() => handleToggle(c)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}