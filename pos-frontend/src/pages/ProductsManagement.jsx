import { useEffect, useState } from 'react';
import { getProducts, createProduct, updateProduct } from '../api/products';

export default function ProductsManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    min_stock_threshold: 5
  });
  const [error, setError] = useState('');

  // تحميل المنتجات (بدون setLoading(true))
  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  // إعادة التحميل مع إظهار Loading
  const refreshProducts = async () => {
    setLoading(true);
    await loadProducts();
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await createProduct(form);

      setForm({
        name: '',
        category: '',
        price: '',
        stock: '',
        min_stock_threshold: 5
      });

      setShowModal(false);

      await refreshProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء إضافة المنتج');
    }
  };

  const toggleActive = async (p) => {
    await updateProduct(p.id, {
      is_active: !p.is_active
    });

    await refreshProducts();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>إدارة المنتجات</h5>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowModal(true)}
        >
          + إضافة منتج
        </button>
      </div>

      {loading ? (
        <p>جارٍ التحميل...</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>التصنيف</th>
              <th>السعر</th>
              <th>المخزون</th>
              <th>الحالة</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                className={p.is_low_stock ? 'table-warning' : ''}
              >
                <td>{p.name}</td>

                <td>{p.category || '—'}</td>

                <td>{Number(p.price).toFixed(2)}</td>

                <td>
                  {p.stock}

                  {p.is_low_stock && (
                    <span className="badge bg-danger ms-2">
                      مخزون منخفض
                    </span>
                  )}
                </td>

                <td>
                  <span
                    className={`badge ${
                      p.is_active ? 'bg-success' : 'bg-secondary'
                    }`}
                  >
                    {p.is_active ? 'مفعّل' : 'معطّل'}
                  </span>
                </td>

                <td>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => toggleActive(p)}
                  >
                    {p.is_active ? 'تعطيل' : 'تفعيل'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div
          className="modal d-block"
          style={{ background: 'rgba(0,0,0,0.4)' }}
        >
          <div className="modal-dialog">
            <div className="modal-content p-3">
              <form onSubmit={handleCreate}>
                <h6 className="mb-3">إضافة منتج جديد</h6>

                {error && (
                  <div className="alert alert-danger py-2">
                    {error}
                  </div>
                )}

                <input
                  className="form-control mb-2"
                  placeholder="اسم المنتج"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                />

                <input
                  className="form-control mb-2"
                  placeholder="التصنيف (اختياري)"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control mb-2"
                  placeholder="السعر"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  required
                />

                <input
                  type="number"
                  min="0"
                  className="form-control mb-2"
                  placeholder="الكمية الأولية"
                  value={form.stock}
                  onChange={(e) =>
                    setForm({ ...form, stock: e.target.value })
                  }
                  required
                />

                <input
                  type="number"
                  min="0"
                  className="form-control mb-3"
                  placeholder="الحد الأدنى للتنبيه"
                  value={form.min_stock_threshold}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      min_stock_threshold: e.target.value,
                    })
                  }
                />

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary flex-grow-1"
                  >
                    حفظ
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}