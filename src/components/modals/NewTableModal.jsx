import { useState } from 'react';
import { X, Grid3X3, Loader2 } from 'lucide-react';
import { useRestaurant } from '../../context/useRestaurant';
import './modal-shell.css';

/** Suggest the next free table number so the captain rarely has to think. */
function nextNumber(tables) {
  const used = tables
    .map((t) => parseInt(String(t.id).replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n));
  return used.length ? Math.max(...used) + 1 : 1;
}

function NewTableModal({ onClose }) {
  const { tables, sections, createTable } = useRestaurant();

  const [tableNumber, setTableNumber] = useState(String(nextNumber(tables)));
  const [capacity, setCapacity] = useState(4);
  const [section, setSection] = useState(sections?.[0] || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    const result = await createTable({ tableNumber, capacity, section });
    setSaving(false);
    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Could not create the table.');
    }
  };

  return (
    <div className="modal-overlay" onClick={!saving ? onClose : undefined} id="new-table-modal-overlay">
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} id="new-table-modal">
        <div className="modal__header">
          <div className="modal__header-left">
            <div className="modal__header-icon"><Grid3X3 /></div>
            <div className="modal__header-text">
              <h2>New table</h2>
              <span>Add a table to the floor</span>
            </div>
          </div>
          <button type="button" className="modal__close" onClick={onClose} disabled={saving}>
            <X size={17} />
          </button>
        </div>

        <div className="modal__body">
          {error && <div className="new-table__error">{error}</div>}

          <div className="modal__row">
            <div className="modal__field">
              <label className="modal__label" htmlFor="nt-number">Table number</label>
              <input
                id="nt-number"
                className="modal__input"
                type="number"
                min="1"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="modal__field">
              <label className="modal__label" htmlFor="nt-capacity">Seats</label>
              <input
                id="nt-capacity"
                className="modal__input"
                type="number"
                min="1"
                max="20"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal__field">
            <span className="modal__label">Section</span>
            <div className="modal__toggle">
              {(sections || []).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`modal__toggle-btn ${section === s ? 'modal__toggle-btn--active' : ''}`}
                  onClick={() => setSection(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal__footer">
          <button type="button" className="modal__btn-cancel" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="modal__btn-submit" disabled={saving} id="btn-create-table">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Adding…</> : 'Add table'}
          </button>
        </div>

        <style>{`
          .new-table__error {
            padding: 12px 14px;
            border-radius: var(--radius-md);
            background: var(--color-danger-soft);
            color: var(--color-danger);
            font-size: 13px;
            font-weight: var(--font-weight-semibold);
          }
        `}</style>
      </form>
    </div>
  );
}

export default NewTableModal;
