import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentShift, openShift, closeShift, getShiftMovements } from '../api/shifts';

export default function Shift() {
  const [loading, setLoading] = useState(true);
  const [shift, setShift] = useState(null); // { data, expected_balance } or null if none open
  const [movements, setMovements] = useState([]);
  const [openingBalance, setOpeningBalance] = useState('');
  const [countedBalance, setCountedBalance] = useState('');
  const [closeResult, setCloseResult] = useState(null); // { expected_balance, counted_balance, discrepancy }
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isActive = true;

    const loadShift = async () => {
      setLoading(true);
      setError('');
      try {
        const current = await getCurrentShift();
        if (!isActive) return;
        setShift(current);
        const m = await getShiftMovements(current.data.id);
        if (!isActive) return;
        setMovements(m.movements);
      } catch (err) {
        if (!isActive) return;
        if (err.response?.status === 404) {
          setShift(null); // لا توجد وردية مفتوحة — حالة طبيعية، وليست خطأ
        } else {
          setError('تعذّر تحميل بيانات الوردية');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadShift();

    return () => {
      isActive = false;
    };
  }, []);

  const handleOpen = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await openShift({ opening_balance: Number(openingBalance) });
      setOpeningBalance('');
      navigate('/pos');
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر فتح الوردية');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await closeShift({ counted_balance: Number(countedBalance) });
      setCloseResult(result);
      setShift(null);
      setMovements([]);
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر إغلاق الوردية');
    } finally {
      setSubmitting(false);
    }
  };

  const startNewShift = () => {
    setCloseResult(null);
    setCountedBalance('');
  };

  if (loading) return <p>جارٍ التحميل...</p>;

  // --- حالة: تم إغلاق الوردية للتو، عرض ملخص الفرق ---
  if (closeResult) {
    const discrepancy = closeResult.discrepancy;
    const badgeClass = discrepancy === 0 ? 'bg-success' : discrepancy > 0 ? 'bg-info' : 'bg-danger';
    const discrepancyLabel =
      discrepancy === 0 ? 'مطابق تماماً' : discrepancy > 0 ? `زيادة ${discrepancy.toFixed(2)}` : `عجز ${Math.abs(discrepancy).toFixed(2)}`;

    return (
      <div style={{ maxWidth: 480 }}>
        <h5 className="mb-3">تم إغلاق الوردية</h5>
        <div className="border rounded p-3 mb-3">
          <div className="d-flex justify-content-between mb-2">
            <span>الرصيد المتوقع</span>
            <strong>{closeResult.expected_balance.toFixed(2)}</strong>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span>الرصيد المعدود</span>
            <strong>{closeResult.counted_balance.toFixed(2)}</strong>
          </div>
          <div className="d-flex justify-content-between align-items-center border-top pt-2">
            <span>الفرق</span>
            <span className={`badge ${badgeClass}`}>{discrepancyLabel}</span>
          </div>
        </div>
        <button className="btn btn-primary w-100" onClick={startNewShift}>
          فتح وردية جديدة
        </button>
      </div>
    );
  }

  // --- حالة: لا توجد وردية مفتوحة ---
  if (!shift) {
    return (
      <div style={{ maxWidth: 420 }}>
        <h5 className="mb-3">فتح وردية جديدة</h5>
        <p className="text-muted">يجب فتح وردية قبل البدء بعمليات البيع.</p>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <form onSubmit={handleOpen}>
          <div className="mb-3">
            <label className="form-label">الرصيد الافتتاحي للصندوق</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-control"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              required
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
            {submitting ? 'جارٍ الفتح...' : 'فتح الوردية'}
          </button>
        </form>
      </div>
    );
  }

  // --- حالة: وردية مفتوحة حالياً ---
  const openedAt = new Date(shift.data.opened_at).toLocaleString('ar');

  return (
    <div className="row">
      <div className="col-md-7">
        <h5 className="mb-3">الوردية الحالية</h5>
        {error && <div className="alert alert-danger py-2">{error}</div>}

        <div className="border rounded p-3 mb-3">
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">وقت الفتح</span>
            <span>{openedAt}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">الرصيد الافتتاحي</span>
            <span>{Number(shift.data.opening_balance).toFixed(2)}</span>
          </div>
          <div className="d-flex justify-content-between fw-bold border-top pt-2">
            <span>الرصيد المتوقع الآن</span>
            <span>{shift.expected_balance.toFixed(2)}</span>
          </div>
        </div>

        <h6 className="mb-2">حركات الصندوق</h6>
        {movements.length === 0 ? (
          <p className="text-muted">لا توجد حركات بعد ضمن هذه الوردية</p>
        ) : (
          <table className="table table-sm">
            <thead>
              <tr>
                <th>النوع</th>
                <th>المبلغ</th>
                <th>الوقت</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td>{m.type === 'sale' ? 'بيع' : 'مرتجع'}</td>
                  <td className={m.signed_amount < 0 ? 'text-danger' : 'text-success'}>
                    {m.signed_amount > 0 ? '+' : ''}
                    {Number(m.signed_amount).toFixed(2)}
                  </td>
                  <td className="text-muted small">{new Date(m.created_at).toLocaleTimeString('ar')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="col-md-5">
        <h6 className="mb-3">إغلاق الوردية</h6>
        <form onSubmit={handleClose}>
          <div className="mb-3">
            <label className="form-label">الرصيد الفعلي المعدود</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-control"
              value={countedBalance}
              onChange={(e) => setCountedBalance(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-danger w-100" disabled={submitting}>
            {submitting ? 'جارٍ الإغلاق...' : 'إغلاق الوردية'}
          </button>
        </form>
      </div>
    </div>
  );
}