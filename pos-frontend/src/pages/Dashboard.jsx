import { useEffect, useState } from 'react';
import { getDashboardSummary, getCashierPerformance, getTopProducts } from '../api/dashboard';

const PERIOD_LABELS = { today: 'اليوم', week: 'هذا الأسبوع', month: 'هذا الشهر' };

export default function Dashboard() {
  const [period, setPeriod] = useState('today');
  const [summary, setSummary] = useState(null);
  const [cashiers, setCashiers] = useState([]);
  const [products, setProducts] = useState({ top_selling: [], top_returned: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // دالة مخصصة لتحديث الفترة وتجهيز حالة التحميل في نفس الوقت
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setLoading(true);
    setError(null);
  };

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getDashboardSummary(period),
      getCashierPerformance(period),
      getTopProducts(period),
    ])
      .then(([summaryRes, cashiersRes, productsRes]) => {
        if (cancelled) return;
        setSummary(summaryRes);
        setCashiers(cashiersRes.cashier_performance);
        setProducts(productsRes);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err?.response?.status === 403
            ? 'هذه الصفحة متاحة للمدير فقط'
            : 'حدث خطأ أثناء تحميل بيانات لوحة التحكم'
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">لوحة التحكم</h5>
        <select
          className="form-select w-auto"
          value={period}
          onChange={(e) => handlePeriodChange(e.target.value)} >
          {Object.entries(PERIOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>جارٍ التحميل...</p>}

      {!loading && error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && summary && !summary.has_data && (
        <p className="text-muted">لا توجد بيانات كافية لهذه الفترة</p>
      )}

      {!loading && !error && summary && summary.has_data && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card p-3">
                <div className="text-muted small">إجمالي المبيعات</div>
                <div className="fs-4 fw-bold">{summary.sales.total.toFixed(2)}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card p-3">
                <div className="text-muted small">عدد الفواتير</div>
                <div className="fs-4 fw-bold">{summary.sales.invoice_count}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card p-3">
                <div className="text-muted small">إجمالي المرتجعات</div>
                <div className="fs-4 fw-bold">{summary.returns.total.toFixed(2)}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card p-3">
                <div className="text-muted small">صافي الإيراد</div>
                <div className="fs-4 fw-bold">{summary.net_revenue.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <h6>أداء الكاشيرين</h6>
              {cashiers.length === 0 ? (
                <p className="text-muted small">لا توجد بيانات</p>
              ) : (
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>الكاشير</th>
                      <th>عدد الفواتير</th>
                      <th>الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashiers.map((c) => (
                      <tr key={c.user_id}>
                        <td>{c.cashier_name ?? `#${c.user_id}`}</td>
                        <td>{c.invoice_count}</td>
                        <td>{c.total_sales.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="col-md-6">
              <h6>الأكثر مبيعاً</h6>
              {products.top_selling.length === 0 ? (
                <p className="text-muted small">لا توجد بيانات</p>
              ) : (
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>المنتج</th>
                      <th>الكمية</th>
                      <th>الإيراد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.top_selling.map((p) => (
                      <tr key={p.product_id}>
                        <td>{p.product_name}</td>
                        <td>{p.total_quantity}</td>
                        <td>{p.total_revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <h6 className="mt-3">الأكثر ترجيعاً</h6>
              {products.top_returned.length === 0 ? (
                <p className="text-muted small">لا توجد بيانات</p>
              ) : (
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>المنتج</th>
                      <th>الكمية</th>
                      <th>القيمة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.top_returned.map((p) => (
                      <tr key={p.product_id}>
                        <td>{p.product_name}</td>
                        <td>{p.total_quantity}</td>
                        <td>{p.total_amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}