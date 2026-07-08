import { useEffect, useState } from 'react';
import { getProducts } from '../api/products';
import { createInvoice } from '../api/invoices';
import InvoiceReceipt from '../components/InvoiceReceipt';

export default function Pos() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]); // [{ product, quantity }]
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);

  useEffect(() => {
    getProducts().then(data => setProducts(data.filter(p => p.is_active)));
  }, []);

  const addToCart = (product) => {
    setError('');
    setCart(prev => {
      const existing = prev.find(line => line.product.id === product.id);
      if (existing) {
        return prev.map(line =>
          line.product.id === product.id
            ? { ...line, quantity: line.quantity + 1 }
            : line
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(line =>
      line.product.id === productId ? { ...line, quantity } : line
    ));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(line => line.product.id !== productId));
  };

  const cancelSale = () => {
    // Nothing was ever persisted to the backend — cancelling is just clearing local state (UC-02 alt flow)
    setCart([]);
    setError('');
  };

  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const invoice = await createInvoice({
        payment_method: paymentMethod,
        items: cart.map(line => ({ product_id: line.product.id, quantity: line.quantity })),
      });
      setCompletedInvoice(invoice);
      setCart([]);
      const refreshed = await getProducts();
      setProducts(refreshed.filter(p => p.is_active));
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء إتمام البيع');
    } finally {
      setLoading(false);
    }
  };

  if (completedInvoice) {
    return (
      <InvoiceReceipt
        invoice={completedInvoice}
        onClose={() => setCompletedInvoice(null)}
      />
    );
  }

  return (
    <div className="row">
      <div className="col-md-7">
        <h5 className="mb-3">المنتجات</h5>
        <div className="row row-cols-2 row-cols-md-3 g-2">
          {products.map(p => (
            <div className="col" key={p.id}>
              <button
                className="btn btn-outline-primary w-100 h-100 text-start p-2"
                onClick={() => addToCart(p)}
                disabled={p.stock === 0}
              >
                <div className="fw-bold">{p.name}</div>
                <div className="small text-muted">{p.price.toFixed(2)} — متوفر: {p.stock}</div>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="col-md-5">
        <h5 className="mb-3">الفاتورة الحالية</h5>
        {error && <div className="alert alert-danger py-2">{error}</div>}

        {cart.length === 0 ? (
          <p className="text-muted">لا توجد منتجات مضافة</p>
        ) : (
          <table className="table table-sm">
            <tbody>
              {cart.map(line => (
                <tr key={line.product.id}>
                  <td>{line.product.name}</td>
                  <td style={{ width: 80 }}>
                    <input type="number" min="1" className="form-control form-control-sm"
                      value={line.quantity}
                      onChange={e => updateQuantity(line.product.id, parseInt(e.target.value) || 1)} />
                  </td>
                  <td className="text-end">{(line.product.price * line.quantity).toFixed(2)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => removeFromCart(line.product.id)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="d-flex justify-content-between fw-bold border-top pt-2 mb-3">
          <span>المجموع الفرعي</span>
          <span>{subtotal.toFixed(2)}</span>
        </div>

        <div className="mb-3">
          <label className="form-label">طريقة الدفع</label>
          <select className="form-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
            <option value="cash">نقدي</option>
            <option value="card">بطاقة</option>
          </select>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-success flex-grow-1" disabled={cart.length === 0 || loading} onClick={handleCheckout}>
            {loading ? 'جارٍ الإتمام...' : 'إتمام البيع'}
          </button>
          <button className="btn btn-outline-secondary" disabled={cart.length === 0} onClick={cancelSale}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}