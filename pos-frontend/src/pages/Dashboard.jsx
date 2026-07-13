import { useEffect, useMemo, useState } from 'react';
import {
  getCashierPerformance,
  getDashboardHistory,
  getDashboardSummary,
  getTopProducts,
} from '../api/dashboard';

import { useLanguage } from '../context/LanguageContext';

const PERIOD_OPTIONS = [
  { value: 'today', labelKey: 'today' },
  { value: 'yesterday', labelKey: 'yesterday' },
  { value: 'this_week', labelKey: 'thisWeek' },
  { value: 'last_week', labelKey: 'lastWeek' },
  { value: 'this_month', labelKey: 'thisMonth' },
  { value: 'last_month', labelKey: 'lastMonth' },
  { value: 'custom', labelKey: 'customPeriod' },
];

const money = (value) => Number(value || 0).toFixed(2);

function ChangeBadge({ value }) {
  if (value === null || value === undefined) {
    return <span className="badge bg-secondary ms-2">-</span>;
  }

  const numeric = Number(value);
  const isPositive = numeric > 0;
  const isNegative = numeric < 0;
  const className = isPositive ? 'bg-success' : isNegative ? 'bg-danger' : 'bg-secondary';
  const arrow = isPositive ? '↑' : isNegative ? '↓' : '-';

  return <span className={`badge ${className} ms-2`}>{arrow} {Math.abs(numeric).toFixed(1)}%</span>;
}

function Sparkline({ points }) {
  const { t } = useLanguage();
  const values = points.map((point) => Number(point.net_revenue || 0));
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const width = 520;
  const height = 120;
  const padding = 12;
  const range = max - min || 1;

  const path = values
    .map((value, index) => {
      const x = values.length === 1
        ? width / 2
        : padding + (index * (width - padding * 2)) / (values.length - 1);
      const y = height - padding - ((value - min) * (height - padding * 2)) / range;

      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <svg className="w-100" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={t('directionNetRevenueLabel')}>
      <path d={path} fill="none" stroke="#0d6efd" strokeWidth="3" />
      {values.map((value, index) => {
        const x = values.length === 1
          ? width / 2
          : padding + (index * (width - padding * 2)) / (values.length - 1);
        const y = height - padding - ((value - min) * (height - padding * 2)) / range;

        return <circle key={`${points[index]?.label}-${index}`} cx={x} cy={y} r="4" fill="#0d6efd" />;
      })}
    </svg>
  );
}

export default function Dashboard() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState('today');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [summary, setSummary] = useState(null);
  const [cashiers, setCashiers] = useState([]);
  const [products, setProducts] = useState({ top_selling: [], top_returned: [] });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const params = useMemo(() => {
    const nextParams = { period };

    if (period === 'custom' && from && to) {
      nextParams.from = from;
      nextParams.to = to;
    }

    return nextParams;
  }, [period, from, to]);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const [summaryRes, cashiersRes, productsRes, historyRes] = await Promise.all([
          getDashboardSummary(params),
          getCashierPerformance(params),
          getTopProducts({ ...params, limit: 5 }),
          getDashboardHistory('day', 7),
        ]);

        if (cancelled) return;

        setSummary(summaryRes);
        setCashiers(cashiersRes.cashier_performance || []);
        setProducts({
          top_selling: productsRes.top_selling || [],
          top_returned: productsRes.top_returned || [],
        });
        setHistory(historyRes || []);
      } catch (err) {
        if (cancelled) return;
        setError(
          err?.response?.status === 403
            ? t('managerOnly')
            : t('dashboardLoadError')
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [params, t]);

  return (
    <div className="container-fluid py-3">
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <h5 className="mb-0">{t('dashboardTitle')}</h5>
        <div className="d-flex flex-wrap gap-2">
          <select className="form-select w-auto" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
            ))}
          </select>
          {period === 'custom' && (
            <>
              <input className="form-control w-auto" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <input className="form-control w-auto" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </>
          )}
        </div>
      </div>

      {loading && <p>{t('loading')}</p>}
      {!loading && error && <div className="alert alert-danger">{error}</div>}
      {!loading && !error && summary && !summary.has_data && (
        <p className="text-muted">{t('insufficientData')}</p>
      )}

      {!loading && !error && summary && summary.has_data && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card p-3">
                <div className="text-muted small">{t('totalSalesLabel')} <ChangeBadge value={summary.comparison?.sales_total_change_percent} /></div>
                <div className="fs-4 fw-bold">{money(summary.sales?.total)}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card p-3">
                <div className="text-muted small">{t('invoicesCountLabel')}</div>
                <div className="fs-4 fw-bold">{summary.sales?.invoice_count || 0}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card p-3">
                <div className="text-muted small">{t('totalReturnsLabel')}</div>
                <div className="fs-4 fw-bold">{money(summary.returns?.total)}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card p-3">
                <div className="text-muted small">{t('netRevenueLabel')} <ChangeBadge value={summary.comparison?.net_revenue_change_percent} /></div>
                <div className="fs-4 fw-bold">{money(summary.net_revenue)}</div>
              </div>
            </div>
          </div>

          <div className="card p-3 mb-4">
            <h6>{t('directionNetRevenueLabel')}</h6>
            {history.length === 0 ? <p className="text-muted small">{t('noDataLabel')}</p> : <Sparkline points={history} />}
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <h6>{t('cashierPerformanceTitle')}</h6>
              {cashiers.length === 0 ? (
                <p className="text-muted small">{t('noDataLabel')}</p>
              ) : (
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>{t('cashierTitle')}</th>
                      <th>{t('invoicesCountLabel')}</th>
                      <th>{t('totalLabel')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashiers.map((cashier) => (
                      <tr key={cashier.cashier_id}>
                        <td>{cashier.cashier_name ?? `#${cashier.cashier_id}`}</td>
                        <td>{cashier.invoice_count}</td>
                        <td>{money(cashier.total_sales)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="col-md-6">
              <h6>{t('topSellingTitle')}</h6>
              {products.top_selling.length === 0 ? (
                <p className="text-muted small">{t('noDataLabel')}</p>
              ) : (
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>{t('product')}</th>
                      <th>{t('quantity')}</th>
                      <th>{t('revenue')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.top_selling.map((product) => (
                      <tr key={product.product_id}>
                        <td>{product.product_name}</td>
                        <td>{product.total_quantity}</td>
                        <td>{money(product.total_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <h6 className="mt-3">{t('topReturnedTitle')}</h6>
              {products.top_returned.length === 0 ? (
                <p className="text-muted small">{t('noDataLabel')}</p>
              ) : (
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>{t('product')}</th>
                      <th>{t('quantity')}</th>
                      <th>{t('amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.top_returned.map((product) => (
                      <tr key={product.product_id}>
                        <td>{product.product_name}</td>
                        <td>{product.total_quantity}</td>
                        <td>{money(product.total_amount)}</td>
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
