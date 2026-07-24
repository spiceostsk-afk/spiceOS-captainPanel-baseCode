import { useState } from 'react';
import { X, Receipt, Percent, DollarSign } from 'lucide-react';
import './BillModal.css';

function BillModal({ table, mergedTables = [], onClose, onConfirm }) {
  const [discountType, setDiscountType] = useState(table?.billDiscount?.type || 'flat');
  const [discountValue, setDiscountValue] = useState(table?.billDiscount?.value || 0);
  const [submitting, setSubmitting] = useState(false);

  const groups = [
    { label: `Table ${table.id}`, items: table.orders || [] },
    ...mergedTables.map((mt) => ({ label: `Merged: Table ${mt.id} (${mt.guest || 'Guest'})`, items: mt.orders || [] })),
  ];

  const subtotal = groups.reduce(
    (sum, g) => sum + g.items.reduce((s, i) => s + i.qty * i.price, 0),
    0
  );
  const tax = subtotal * 0.1;
  const discountAmount = Math.max(
    0,
    Math.min(
      discountType === 'percent' ? (subtotal * (parseFloat(discountValue) || 0)) / 100 : parseFloat(discountValue) || 0,
      subtotal + tax
    )
  );
  const total = Math.max(0, subtotal + tax - discountAmount);

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    const discount = parseFloat(discountValue) > 0 ? { type: discountType, value: parseFloat(discountValue) } : null;
    await onConfirm(discount);
    setSubmitting(false);
  };

  return (
    <div className="bm-modal-overlay" onClick={!submitting ? onClose : undefined} id="bill-modal-overlay">
      <div className="bm-modal" onClick={(e) => e.stopPropagation()} id="bill-modal">
        <div className="bm-modal__header">
          <div className="bm-modal__header-left">
            <div className="bm-modal__header-icon">
              <Receipt />
            </div>
            <div className="bm-modal__header-text">
              <h2>Bill Preview — Table {table.id}</h2>
              <span>{table.guest || 'Walk-in Guest'}</span>
            </div>
          </div>
          <button className="bm-modal__close" onClick={onClose} id="btn-bill-close" disabled={submitting}>
            <X size={18} />
          </button>
        </div>

        <div className="bm-modal__body">
          <div className="bill-groups">
            {groups.map((g, gi) => (
              <div key={gi} className="bill-group">
                <h4 className="bill-group__label">{g.label}</h4>
                {g.items.length === 0 ? (
                  <p className="bill-group__empty">No items.</p>
                ) : (
                  g.items.map((item, idx) => (
                    <div key={idx} className="bill-line">
                      <span className="bill-line__name">{item.qty}x {item.name}</span>
                      <span className="bill-line__price">${(item.qty * item.price).toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>

          <div className="bill-discount">
            <label className="bm-modal__label">Discount</label>
            <div className="bill-discount__row">
              <div className="bill-discount__toggle">
                <button
                  className={`bill-discount__toggle-btn ${discountType === 'flat' ? 'bill-discount__toggle-btn--active' : ''}`}
                  onClick={() => setDiscountType('flat')}
                  type="button"
                >
                  <DollarSign size={14} /> Flat
                </button>
                <button
                  className={`bill-discount__toggle-btn ${discountType === 'percent' ? 'bill-discount__toggle-btn--active' : ''}`}
                  onClick={() => setDiscountType('percent')}
                  type="button"
                >
                  <Percent size={14} /> %
                </button>
              </div>
              <input
                type="number"
                min="0"
                className="bill-discount__input"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="0"
                id="input-bill-discount"
              />
            </div>
          </div>

          <div className="bill-summary">
            <div className="bill-summary__row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="bill-summary__row">
              <span>GST / Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="bill-summary__row bill-summary__row--discount">
                <span>Discount</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="bill-summary__total">
              <span>Total Due</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bm-modal__footer">
          <button className="bm-modal__btn-cancel" onClick={onClose} disabled={submitting} id="btn-bill-cancel">
            Cancel
          </button>
          <button className="bm-modal__btn-submit" onClick={handleConfirm} disabled={submitting} id="btn-bill-confirm">
            {submitting ? 'Sending...' : 'Confirm & Send to Billing'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BillModal;
