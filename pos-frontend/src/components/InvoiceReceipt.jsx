export default function InvoiceReceipt({ invoice, onClose }) {
  return (
    <div>
      <div className="d-flex justify-content-between mb-3 no-print">
        <h5>تم إتمام البيع بنجاح</h5>
        <div>
          <button className="btn btn-primary btn-sm me-2" onClick={() => window.print()}>طباعة</button>
          <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>فاتورة جديدة</button>
        </div>
      </div>

      <div className="border p-3" style={{ maxWidth: 400 }}>
        <h6 className="text-center mb-3">فاتورة رقم {invoice.invoice_number}</h6>
        <p className="small text-muted">{new Date(invoice.created_at).toLocaleString('ar')}</p>
        <table className="table table-sm">
          <tbody>
            {invoice.items.map(item => (
              <tr key={item.id}>
                <td>{item.product_name}</td>
                <td>{item.quantity} ×</td>
                <td className="text-end">{item.line_total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="d-flex justify-content-between"><span>المجموع الفرعي</span><span>{invoice.subtotal.toFixed(2)}</span></div>
        {invoice.tax_amount > 0 && (
          <div className="d-flex justify-content-between"><span>الضريبة ({invoice.tax_rate_applied}%)</span><span>{invoice.tax_amount.toFixed(2)}</span></div>
        )}
        <div className="d-flex justify-content-between fw-bold border-top pt-2"><span>الإجمالي</span><span>{invoice.total.toFixed(2)}</span></div>
        <p className="small text-muted mt-2">طريقة الدفع: {invoice.payment_method === 'cash' ? 'نقدي' : 'بطاقة'}</p>
      </div>
    </div>
  );
}