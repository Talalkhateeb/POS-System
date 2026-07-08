import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../api/settings';

export default function SettingsPage() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let ignore = false;

    const loadSettings = async () => {
      try {
        const data = await getSettings();
        if (!ignore) setForm(data);
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.message || 'حدث خطأ أثناء تحميل الإعدادات');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadSettings();

    return () => {
      ignore = true;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    setFieldErrors({});
    try {
      const data = await updateSettings(form);
      setForm(data);
      setMessage('تم حفظ الإعدادات بنجاح');
    } catch (err) {
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data.errors || {});
      } else {
        setError(err.response?.data?.message || 'حدث خطأ أثناء حفظ الإعدادات');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>جارٍ التحميل...</p>;
  if (!form) return <p className="alert alert-danger">{error || 'تعذر تحميل الإعدادات'}</p>;

  return (
    <div>
      <h5 className="mb-3">الإعدادات العامة</h5>

      {error && <div className="alert alert-danger py-2">{error}</div>}
      {message && <div className="alert alert-success py-2">{message}</div>}

      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            id="tax_enabled"
            name="tax_enabled"
            checked={!!form.tax_enabled}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="tax_enabled">
            تفعيل الضريبة
          </label>
        </div>

        <div className="mb-3">
          <label className="form-label">نسبة الضريبة (%)</label>
          <input
            type="number"
            step="0.01"
            className="form-control"
            name="tax_rate"
            value={form.tax_rate}
            onChange={handleChange}
            disabled={!form.tax_enabled}
          />
          {fieldErrors.tax_rate && (
            <small className="text-danger">{fieldErrors.tax_rate[0]}</small>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">اسم المحل</label>
          <input
            type="text"
            className="form-control"
            name="store_name"
            value={form.store_name}
            onChange={handleChange}
          />
          {fieldErrors.store_name && (
            <small className="text-danger">{fieldErrors.store_name[0]}</small>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">العملة</label>
          <input
            type="text"
            className="form-control"
            name="currency"
            value={form.currency}
            onChange={handleChange}
          />
          {fieldErrors.currency && (
            <small className="text-danger">{fieldErrors.currency[0]}</small>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">ترويسة الفاتورة</label>
          <input
            type="text"
            className="form-control"
            name="invoice_header"
            value={form.invoice_header || ''}
            onChange={handleChange}
          />
          {fieldErrors.invoice_header && (
            <small className="text-danger">{fieldErrors.invoice_header[0]}</small>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">الحد الأدنى للتنبيه بنقص المخزون</label>
          <input
            type="number"
            className="form-control"
            name="low_stock_threshold"
            value={form.low_stock_threshold}
            onChange={handleChange}
          />
          {fieldErrors.low_stock_threshold && (
            <small className="text-danger">{fieldErrors.low_stock_threshold[0]}</small>
          )}
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </form>
    </div>
  );
}