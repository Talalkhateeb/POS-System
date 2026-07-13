import { useEffect, useState } from 'react';
import { getProducts, createProduct, updateProduct } from '../api/products';
import { useLanguage } from '../context/LanguageContext';

export default function ProductsManagement() {
  const { t } = useLanguage();
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
  const [success, setSuccess] = useState('');

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
    setSuccess('');

    try {
      const result = await createProduct(form);

      setForm({
        name: '',
        category: '',
        price: '',
        stock: '',
        min_stock_threshold: 5
      });

      setShowModal(false);
      setSuccess(result.message || t('productSaved'));

      await refreshProducts();
    } catch (err) {
        setError(err.response?.data?.message || t('errorOccurred'));
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
        <h5>{t('productsManagement')}</h5>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowModal(true)}
        >
          {t('addProductButton')}
        </button>
      </div>

      {success && <div className="alert alert-success py-2">{success}</div>}

      {loading ? (
        <p>{t('loading')}</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>{t('tableName')}</th>
              <th>{t('productCategoryPlaceholder')}</th>
              <th>{t('productPricePlaceholder')}</th>
              <th>{t('productStockPlaceholder')}</th>
              <th>{t('tableStatus')}</th>
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
                      {t('productLowStockBadge')}
                    </span>
                  )}
                </td>

                <td>
                    <span
                    className={`badge ${
                      p.is_active ? 'bg-success' : 'bg-secondary'
                    }`}
                  >
                    {p.is_active ? t('activeStatus') : t('inactiveStatus')}
                  </span>
                </td>

                <td>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => toggleActive(p)}
                  >
                    {p.is_active ? t('disableAction') : t('enableAction')}
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
                <h6 className="mb-3">{t('addProductButton')}</h6>

                {error && (
                  <div className="alert alert-danger py-2">
                    {error}
                  </div>
                )}

                <input
                  className="form-control mb-2"
                  placeholder={t('productNamePlaceholder')}
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                />

                <input
                  className="form-control mb-2"
                  placeholder={t('productCategoryPlaceholder')}
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
                  placeholder={t('productPricePlaceholder')}
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
                  placeholder={t('productStockPlaceholder')}
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
                  placeholder={t('productMinStockPlaceholder')}
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
                    {t('save')}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    {t('cancel')}
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
