import { useLanguage } from '../context/LanguageContext';

const money = (value) => Number(value || 0).toFixed(2);

export default function InvoiceReceipt({ invoice, onClose }) {
  const { t, language } = useLanguage();
  const items = invoice?.items?.data ?? invoice?.items ?? [];

  return (
    <div>
      <div className="d-flex justify-content-between mb-3 no-print">
        <h5>{t('invoiceSuccess')}</h5>
        <div>
          <button className="btn btn-primary btn-sm me-2" onClick={() => window.print()}>{t('print')}</button>
          <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>{t('newInvoice')}</button>
        </div>
      </div>

      <div className="border p-3" style={{ maxWidth: 400 }}>
        <h6 className="text-center mb-3">{t('invoiceNumberLabel')} {invoice?.invoice_number}</h6>
        <p className="small text-muted">{invoice?.created_at ? new Date(invoice.created_at).toLocaleString(language === 'ar' ? 'ar' : 'en-US') : ''}</p>
        <table className="table table-sm">
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id ?? index}>
                <td>{item.product_name}</td>
                <td>{item.quantity} ×</td>
                <td className="text-end">{money(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="d-flex justify-content-between"><span>{t('subtotalLabel')}</span><span>{money(invoice?.subtotal)}</span></div>
        {Number(invoice?.tax_amount || 0) > 0 && (
          <div className="d-flex justify-content-between"><span>{t('taxLabel')} ({invoice.tax_rate_applied}%)</span><span>{money(invoice.tax_amount)}</span></div>
        )}
        <div className="d-flex justify-content-between fw-bold border-top pt-2"><span>{t('totalAmountLabel')}</span><span>{money(invoice?.total)}</span></div>
        <p className="small text-muted mt-2">{t('paymentMethodText')}: {invoice?.payment_method === 'cash' ? t('paymentCashText') : t('paymentCardText')}</p>
      </div>
    </div>
  );
}
