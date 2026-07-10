// src/pages/Returns/ReturnPage.jsx
import { useState } from 'react';
import { lookupInvoice, submitReturn } from '../../api/returnService';

export default function ReturnPage() {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoice, setInvoice] = useState(null);
  const [returnQuantities, setReturnQuantities] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [needsManagerConfirmation, setNeedsManagerConfirmation] = useState(false);
  const [managerUsername, setManagerUsername] = useState('');
  const [managerPassword, setManagerPassword] = useState('');

  const handleSearch = async () => {
    setError(null);
    setSuccess(null);
    setInvoice(null);
    setLoading(true);
    try {
      const found = await lookupInvoice(invoiceNumber.trim());
      setInvoice(found);
      setReturnQuantities({});
    } catch (err) {
      setError(err.response?.data?.message || 'رقم الفاتورة غير موجود');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId, value) => {
    setReturnQuantities((prev) => ({ ...prev, [productId]: Number(value) }));
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    const items = Object.entries(returnQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([product_id, quantity]) => ({ product_id: Number(product_id), quantity }));

    if (items.length === 0) {
      setError('يجب تحديد كمية إرجاع لمنتج واحد على الأقل');
      return;
    }

    setLoading(true);
  try {
    const payload = { invoice_id: invoice.id, items };
    if (needsManagerConfirmation) {
      payload.manager_username = managerUsername;
      payload.manager_password = managerPassword;
    } const result = await submitReturn(payload);
    setSuccess(`تم إنشاء المرتجع بنجاح — المبلغ: ${result.total_return_amount}`);
    setInvoice(null);
    setInvoiceNumber('');
    setReturnQuantities({});
    setNeedsManagerConfirmation(false);
    setManagerUsername('');
    setManagerPassword('');
  } catch (err) {
    const message = err.response?.data?.message || 'حدث خطأ أثناء تنفيذ عملية الإرجاع';
    if (message.includes('تأكيد المدير')) {
      setNeedsManagerConfirmation(true);
    }
    setError(message);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="container mt-4">
      <h3>إرجاع منتج</h3>

      <div className="input-group mb-3" style={{ maxWidth: 400 }}>
        <input
          type="text"
          className="form-control"
          placeholder="رقم الفاتورة"
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
          بحث
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {invoice && (
        <div className="card p-3">
          <h5>الفاتورة #{invoice.invoice_number}</h5>
          <table className="table">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>الكمية المباعة</th>
                <th>السعر وقت البيع</th>
                <th>كمية الإرجاع</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.product_id}>
                  <td>{item.product_name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit_price_snapshot}</td>
                  <td style={{ width: 120 }}>
                    <input
                      type="number"
                      min="0"
                      max={item.quantity}
                      className="form-control"
                      value={returnQuantities[item.product_id] || ''}
                      onChange={(e) => handleQuantityChange(item.product_id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {needsManagerConfirmation && (
  <div className="border rounded p-3 mb-3 bg-light">
    <p className="mb-2 fw-bold text-warning">هذه العملية تتطلب تأكيد المدير</p>
    <div className="mb-2">
      <input
        type="text"
        className="form-control"
        placeholder="اسم مستخدم المدير"
        value={managerUsername}
        onChange={(e) => setManagerUsername(e.target.value)}
      />
    </div>
    <div>
      <input
        type="password"
        className="form-control"
        placeholder="كلمة سر المدير"
        value={managerPassword}
        onChange={(e) => setManagerPassword(e.target.value)}
      />
    </div>
  </div>
)}
          <button className="btn btn-danger" onClick={handleSubmit} disabled={loading}>
            تنفيذ الإرجاع
          </button>
        </div>
      )}
    </div>
  );
}