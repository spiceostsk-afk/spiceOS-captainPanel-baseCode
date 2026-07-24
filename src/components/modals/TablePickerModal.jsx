import { X, ArrowRightLeft } from 'lucide-react';
import './TablePickerModal.css';

function TablePickerModal({ title, subtitle, tables, emptyMessage, onSelect, onClose }) {
  return (
    <div className="tp-modal-overlay" onClick={onClose} id="table-picker-modal-overlay">
      <div className="tp-modal" onClick={(e) => e.stopPropagation()} id="table-picker-modal">
        <div className="tp-modal__header">
          <div className="tp-modal__header-left">
            <div className="tp-modal__header-icon">
              <ArrowRightLeft />
            </div>
            <div className="tp-modal__header-text">
              <h2>{title}</h2>
              <span>{subtitle}</span>
            </div>
          </div>
          <button className="tp-modal__close" onClick={onClose} id="btn-table-picker-close">
            <X size={18} />
          </button>
        </div>

        <div className="tp-modal__body">
          {tables.length === 0 ? (
            <div className="table-picker__empty">{emptyMessage || 'No eligible tables available.'}</div>
          ) : (
            <div className="table-picker__grid">
              {tables.map((t) => (
                <button
                  key={t.dbId}
                  className="table-picker__option"
                  onClick={() => onSelect(t)}
                  id={`table-picker-option-${t.id}`}
                >
                  <span className="table-picker__option-id">{t.id}</span>
                  <span className="table-picker__option-meta">
                    {t.section} • {t.capacity} seats
                  </span>
                  {t.guest && <span className="table-picker__option-guest">{t.guest}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TablePickerModal;
