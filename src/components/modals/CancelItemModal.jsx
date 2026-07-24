import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import './CancelItemModal.css';

const PRESET_REASONS = ['Guest changed mind', 'Kitchen out of stock', 'Order taken in error', 'Duplicate item'];

function CancelItemModal({ item, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim() || submitting) return;
    setSubmitting(true);
    await onConfirm(reason.trim());
    setSubmitting(false);
  };

  return (
    <div className="ci-modal-overlay" onClick={!submitting ? onClose : undefined} id="cancel-item-modal-overlay">
      <div className="ci-modal" onClick={(e) => e.stopPropagation()} id="cancel-item-modal">
        <div className="ci-modal__header">
          <div className="ci-modal__header-left">
            <div className="ci-modal__header-icon">
              <AlertTriangle />
            </div>
            <div className="ci-modal__header-text">
              <h2>Cancel Item</h2>
              <span>{item.qty}x {item.name}</span>
            </div>
          </div>
          <button className="ci-modal__close" onClick={onClose} id="btn-cancel-item-close" disabled={submitting}>
            <X size={18} />
          </button>
        </div>

        <div className="ci-modal__body">
          <p className="cancel-item-warning">
            This will void the item and print a cancellation ticket to the kitchen. A reason is required.
          </p>

          <div className="cancel-item-presets">
            {PRESET_REASONS.map((r) => (
              <button
                key={r}
                className={`cancel-item-preset ${reason === r ? 'cancel-item-preset--active' : ''}`}
                onClick={() => setReason(r)}
                type="button"
              >
                {r}
              </button>
            ))}
          </div>

          <textarea
            className="ci-modal__textarea"
            placeholder="Reason for cancellation (required)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            id="input-cancel-reason"
          />
        </div>

        <div className="ci-modal__footer">
          <button className="ci-modal__btn-cancel" onClick={onClose} disabled={submitting} id="btn-cancel-item-dismiss">
            Back
          </button>
          <button
            className="ci-modal__btn-submit ci-modal__btn-submit--danger"
            onClick={handleConfirm}
            disabled={!reason.trim() || submitting}
            id="btn-cancel-item-confirm"
          >
            {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CancelItemModal;
