import { useState } from 'react';
import { X, User, Phone, Armchair } from 'lucide-react';
import { useRestaurant } from '../../context/useRestaurant';
import './AssignTableModal.css';

function AssignTableModal({ table, onClose, onAssign, initialData }) {
  const { tables = [], sections = [] } = useRestaurant();
  const [arrivalStatus, setArrivalStatus] = useState('seated');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerName: initialData?.customerName || '',
    phoneNumber: initialData?.phoneNumber || '',
    numberOfPeople: initialData?.numberOfPeople || '2',
    specialNote: initialData?.specialNote || '',
    tableId: table?.dbId || '',
    preference: initialData?.preference || 'No Preference',
    waiter: '',
  });

  const MOCK_WAITERS = ['Alex', 'Sam', 'Jordan', 'Casey'];

  const isAddMode = !table && !initialData;
  const isAssignFromWaitlist = !table && !!initialData;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (isAssignFromWaitlist && !formData.tableId) {
      alert('Please select a table to assign.');
      return;
    }
    if (onAssign) {
      setSubmitting(true);
      try {
        await onAssign({ ...formData, arrivalStatus });
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} id="assign-table-modal-overlay">
      <div className="modal" onClick={(e) => e.stopPropagation()} id="assign-table-modal">
        {/* Header */}
        <div className="modal__header">
          <div className="modal__header-left">
            <div className="modal__header-icon">
              <Armchair />
            </div>
            <div className="modal__header-text">
              {isAddMode ? (
                <>
                  <h2>Add to Waitlist</h2>
                  <span>Join the queue for next available table</span>
                </>
              ) : isAssignFromWaitlist ? (
                <>
                  <h2>Assign Table to {initialData.customerName}</h2>
                  <span>Party of {initialData.numberOfPeople} • Pref: {initialData.preference}</span>
                </>
              ) : (
                <>
                  <h2>Assign Table {table?.id}</h2>
                  <span>Capacity: {table?.capacity || 2} Seats • Section: {table?.section || 'Main'}</span>
                </>
              )}
            </div>
          </div>
          <button className="modal__close" onClick={onClose} id="btn-modal-close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal__body">
          {/* Table Selector (if assigning from waitlist) */}
          {isAssignFromWaitlist && (
            <div className="modal__field modal__field--full">
              <label className="modal__label">Select Table</label>
              <div className="modal__input">
                <select
                  value={formData.tableId}
                  onChange={(e) => handleChange('tableId', e.target.value)}
                  id="select-table-assignment"
                  required
                >
                  <option value="">-- Choose an Available Table --</option>
                  {tables
                    .filter((t) => t.status === 'available')
                    .map((t) => (
                      <option key={t.dbId} value={t.dbId}>
                        {t.id} (Capacity: {t.capacity} seats - {t.section})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {/* Section Preference (if adding to waitlist) */}
          {isAddMode && (
            <div className="modal__field modal__field--full">
              <label className="modal__label">Section Preference</label>
              <div className="modal__input">
                <select
                  value={formData.preference}
                  onChange={(e) => handleChange('preference', e.target.value)}
                  id="select-section-preference"
                >
                  <option value="No Preference">No Preference</option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.section_name}>
                      {sec.section_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Customer Name + Phone */}
          <div className="modal__row">
            <div className="modal__field">
              <label className="modal__label">Customer Name</label>
              <div className="modal__input">
                <input
                  type="text"
                  placeholder="e.g. Robert Smith"
                  value={formData.customerName}
                  onChange={(e) => handleChange('customerName', e.target.value)}
                  id="input-customer-name"
                />
                <User />
              </div>
            </div>
            <div className="modal__field">
              <label className="modal__label">Phone Number</label>
              <div className="modal__input">
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  id="input-phone-number"
                />
                <Phone />
              </div>
            </div>
          </div>

          {/* Number of People + Arrival Status */}
          <div className="modal__row">
            <div className="modal__field">
              <label className="modal__label">Number of People</label>
              <div className="modal__input">
                <select
                  value={formData.numberOfPeople}
                  onChange={(e) => handleChange('numberOfPeople', e.target.value)}
                  id="select-people-count"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Person' : 'People'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {!isAddMode && (
              <div className="modal__field">
                <label className="modal__label">Arrival Status</label>
                <div className="modal__toggle" id="arrival-status-toggle">
                  <button
                    className={`modal__toggle-btn ${
                      arrivalStatus === 'seated' ? 'modal__toggle-btn--active' : ''
                    }`}
                    onClick={() => setArrivalStatus('seated')}
                  >
                    Seated
                  </button>
                  <button
                    className={`modal__toggle-btn ${
                      arrivalStatus === 'reserved' ? 'modal__toggle-btn--active' : ''
                    }`}
                    onClick={() => setArrivalStatus('reserved')}
                  >
                    Reserved
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Waiter Selection (if seating) */}
          {!isAddMode && arrivalStatus === 'seated' && (
            <div className="modal__field modal__field--full">
              <label className="modal__label">Assign Waiter</label>
              <div className="modal__input">
                <select
                  value={formData.waiter}
                  onChange={(e) => handleChange('waiter', e.target.value)}
                  id="select-waiter"
                >
                  <option value="">-- No Waiter Assigned --</option>
                  {MOCK_WAITERS.map((waiter) => (
                    <option key={waiter} value={waiter}>
                      {waiter}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Special Note */}
          <div className="modal__field modal__field--full">
            <label className="modal__label">Special Note</label>
            <textarea
              className="modal__textarea"
              placeholder="Allergies, birthday celebration, quiet corner request..."
              value={formData.specialNote}
              onChange={(e) => handleChange('specialNote', e.target.value)}
              id="input-special-note"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modal__footer">
          <button className="modal__btn-cancel" onClick={onClose} disabled={submitting} id="btn-modal-cancel">
            Cancel
          </button>
          <button className="modal__btn-submit" onClick={handleSubmit} disabled={submitting} id="btn-modal-assign">
            {submitting ? 'Saving...' : isAddMode ? 'Add to Waitlist' : 'Assign Table'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignTableModal;
