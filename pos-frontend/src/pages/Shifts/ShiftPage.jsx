import { useEffect, useState } from 'react';
import { getCurrentShift, openShift, closeShift, getShiftMovements } from '../../api/shiftService';

export default function ShiftPage() {
  const [shift, setShift] = useState(null);
  const [expectedBalance, setExpectedBalance] = useState(null);
  const [movements, setMovements] = useState([]);
  const [openingInput, setOpeningInput] = useState('');
  const [countedInput, setCountedInput] = useState('');
  const [closeResult, setCloseResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Shared loader used by button handlers (open/close shift) after a mutation
  const loadCurrentShift = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCurrentShift();
      setShift(result.data);
      setExpectedBalance(result.expected_balance);
      const movementsResult = await getShiftMovements(result.data.id);
      setMovements(movementsResult.movements);
    } catch (err) {
      if (err.response?.status === 404) {
        setShift(null); // no open shift — expected state, not an error
      } else {
        setError(err.response?.data?.message || 'حدث خطأ أثناء تحميل بيانات الوردية');
      }
    } finally {
      setLoading(false);
    }
  };

  // Effect-scoped fetch with an ignore guard, only for the initial mount
  useEffect(() => {
    let ignore = false;

    async function fetchShift() {
      setLoading(true);
      setError(null);
      try {
        const result = await getCurrentShift();
        if (ignore) return;
        setShift(result.data);
        setExpectedBalance(result.expected_balance);
        const movementsResult = await getShiftMovements(result.data.id);
        if (ignore) return;
        setMovements(movementsResult.movements);
      } catch (err) {
        if (ignore) return;
        if (err.response?.status === 404) {
          setShift(null);
        } else {
          setError(err.response?.data?.message || 'حدث خطأ أثناء تحميل بيانات الوردية');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchShift();

    return () => {
      ignore = true;
    };
  }, []);

  const handleOpenShift = async (e) => {
    e.preventDefault();
    setError(null);
    const amount = Number(openingInput);
    if (!amount || amount < 0) {
      setError('الرجاء إدخال رصيد بداية صحيح');
      return;
    }
    setActionLoading(true);
    try {
      await openShift(amount);
      setOpeningInput('');
      await loadCurrentShift();
    } catch (err) {
      setError(err.response?.data?.message || 'تعذر فتح الوردية');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    setError(null);
    const amount = Number(countedInput);
    if (!countedInput || amount < 0) {
      setError('الرجاء إدخال الرصيد الفعلي المعدود');
      return;
    }
    setActionLoading(true);
    try {
      const result = await closeShift(amount);
      setCloseResult(result);
      setCountedInput('');
      setShift(null);
      setMovements([]);
      setExpectedBalance(null);
    } catch (err) {
      setError(err.response?.data?.message || 'تعذر إغلاق الوردية');
    } finally {
      setActionLoading(false);
    }
  };

  const startNewShift = () => {
    setCloseResult(null);
  };

  if (loading) {
    return (
      <div className="container mt-4 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4" style={{ maxWidth: 720 }}>
      <h3>الصندوق — إدارة الوردية</h3>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Shift just closed: show the discrepancy summary */}
      {closeResult && (
        <div className="card p-3 mb-4">
          <h5>تم إغلاق الوردية</h5>
          <table className="table table-sm mb-3">
            <tbody>
              <tr>
                <td>الرصيد المتوقع</td>
                <td className="text-end fw-bold">{closeResult.expected_balance}</td>
              </tr>
              <tr>
                <td>الرصيد المعدود</td>
                <td className="text-end fw-bold">{closeResult.counted_balance}</td>
              </tr>
              <tr>
                <td>الفرق</td>
                <td
                  className={`text-end fw-bold ${
                    closeResult.discrepancy === 0
                      ? 'text-success'
                      : closeResult.discrepancy > 0
                      ? 'text-primary'
                      : 'text-danger'
                  }`}
                >
                  {closeResult.discrepancy > 0 ? '+' : ''}
                  {closeResult.discrepancy}
                  {closeResult.discrepancy === 0 && ' (متطابق)'}
                  {closeResult.discrepancy > 0 && ' (زيادة)'}
                  {closeResult.discrepancy < 0 && ' (نقص)'}
                </td>
              </tr>
            </tbody>
          </table>
          <button className="btn btn-primary" onClick={startNewShift}>
            فتح وردية جديدة
          </button>
        </div>
      )}

      {/* No open shift and no just-closed summary showing: offer to open one */}
      {!shift && !closeResult && (
        <div className="card p-3">
          <h5>لا توجد وردية مفتوحة حالياً</h5>
          <form onSubmit={handleOpenShift} className="mt-3">
            <div className="mb-3">
              <label className="form-label">رصيد بداية الوردية</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                value={openingInput}
                onChange={(e) => setOpeningInput(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <button type="submit" className="btn btn-success" disabled={actionLoading}>
              {actionLoading ? 'جاري الفتح...' : 'فتح وردية'}
            </button>
          </form>
        </div>
      )}

      {/* Shift is open: show status, movements, and the close form */}
      {shift && (
        <>
          <div className="card p-3 mb-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h5 className="mb-1">
                  وردية مفتوحة{' '}
                  <span className="badge bg-success">نشطة</span>
                </h5>
                <div className="text-muted small">
                  بدأت في {new Date(shift.opened_at).toLocaleString('ar-EG')}
                </div>
              </div>
              <div className="text-end">
                <div className="text-muted small">الرصيد المتوقع الآن</div>
                <div className="fs-4 fw-bold">{expectedBalance}</div>
              </div>
            </div>
            <div className="row mt-3">
              <div className="col-6">
                <div className="text-muted small">رصيد البداية</div>
                <div>{shift.opening_balance}</div>
              </div>
              <div className="col-6">
                <div className="text-muted small">الكاشير</div>
                <div>{shift.cashier_name}</div>
              </div>
            </div>
          </div>

          <div className="card p-3 mb-4">
            <h5>حركات الصندوق</h5>
            {movements.length === 0 ? (
              <p className="text-muted mb-0">لا توجد حركات بعد ضمن هذه الوردية</p>
            ) : (
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>النوع</th>
                    <th>المبلغ</th>
                    <th>المرجع</th>
                    <th>الوقت</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <span
                          className={`badge ${
                            m.type === 'sale' ? 'bg-success' : 'bg-warning text-dark'
                          }`}
                        >
                          {m.type === 'sale' ? 'بيع' : 'إرجاع'}
                        </span>
                      </td>
                      <td className={m.signed_amount < 0 ? 'text-danger' : 'text-success'}>
                        {m.signed_amount > 0 ? '+' : ''}
                        {m.signed_amount}
                      </td>
                      <td>
                        {m.reference_type} #{m.reference_id}
                      </td>
                      <td>{new Date(m.created_at).toLocaleTimeString('ar-EG')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card p-3">
            <h5>إغلاق الوردية</h5>
            <form onSubmit={handleCloseShift} className="mt-3">
              <div className="mb-3">
                <label className="form-label">الرصيد الفعلي المعدود</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  value={countedInput}
                  onChange={(e) => setCountedInput(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <button type="submit" className="btn btn-danger" disabled={actionLoading}>
                {actionLoading ? 'جاري الإغلاق...' : 'إغلاق الوردية'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}