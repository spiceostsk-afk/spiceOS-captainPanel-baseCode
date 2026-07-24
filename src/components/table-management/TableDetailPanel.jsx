import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ArrowRightLeft,
  Receipt,
  Unlock,
  StickyNote,
  UtensilsCrossed,
  Combine,
  Unlink,
  Printer,
  Ban,
  Phone,
  Loader2,
  UserCheck,
} from 'lucide-react';
import { useRestaurant } from '../../context/useRestaurant';
import { printKOT, printCancellationKOT } from '../../lib/printKOT';
import TablePickerModal from '../modals/TablePickerModal';
import CancelItemModal from '../modals/CancelItemModal';
import BillModal from '../modals/BillModal';
import './TableDetailPanel.css';

function TableDetailPanel({ table, onClose }) {
  const [isEditingServer, setIsEditingServer] = useState(false);
  const [showMovePicker, setShowMovePicker] = useState(false);
  const [showMergePicker, setShowMergePicker] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null); // { item, kot }
  const [showBillModal, setShowBillModal] = useState(false);
  const [freeing, setFreeing] = useState(false);
  const [billing, setBilling] = useState(false);
  const [actionError, setActionError] = useState('');
  const [freedPrompt, setFreedPrompt] = useState(null); // { tableDbId, tableLabel }
  const [assigningNext, setAssigningNext] = useState(false);

  const {
    tables,
    waitingList,
    freeTable,
    markBilling,
    assignWaiter,
    assignTable,
    cancelOrderItem,
    mergeTables,
    unmergeTable,
    transferTable,
  } = useRestaurant();
  const navigate = useNavigate();
  const MOCK_WAITERS = ['Alex', 'Sam', 'Jordan', 'Casey'];

  // Resolve the live table from context so the panel stays in sync as
  // cancellations / merges / KOTs happen without needing to be re-opened.
  const liveTable = tables.find((t) => t.dbId === table?.dbId) || table;
  const mergedSecondaries = tables.filter((t) => t.mergedInto === liveTable?.dbId);

  const getAvatarInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .filter((n) => n)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const activeGuest = liveTable?.guest || null;
  const numGuests = liveTable?.seated || 0;
  const combinedGuestCount = numGuests + mergedSecondaries.reduce((s, t) => s + (t.seated || 0), 0);

  const detail = {
    id: liveTable?.id || 'T-01',
    statusLabel: liveTable ? `${liveTable.status.toUpperCase()} • ${liveTable.section}` : 'Occupied • High Priority',
    currentStatus: liveTable ? liveTable.status.charAt(0).toUpperCase() + liveTable.status.slice(1) : 'Preparing',
    customerName: activeGuest || 'Walk-in Guest',
    avatarInitials: getAvatarInitials(activeGuest || 'Walk-in Guest'),
    people: combinedGuestCount > 0 ? `${combinedGuestCount} ${combinedGuestCount === 1 ? 'Guest' : 'Guests'}` : 'Empty',
    phone: liveTable?.phone || null,
    timeSeated: liveTable?.time && liveTable.time !== '--' ? liveTable.time : 'Just seated',
    server: liveTable?.server || 'Not Assigned',
    kots: liveTable?.kots || [],
    subtotal: (liveTable?.orders || []).reduce((sum, item) => sum + item.qty * item.price, 0),
    managerNote: liveTable?.status === 'reserved' ? 'VIP Client Reservation.' : 'Regular customer session.',
  };

  const handleCreateOrderClick = () => {
    navigate(`/menu?tableId=${liveTable.dbId}&sessionId=${liveTable.sessionId || 'session-' + liveTable.id}`);
  };

  const handleFreeTable = async () => {
    if (!liveTable?.dbId || freeing) return;
    const confirmFree = window.confirm(`Are you sure you want to free Table ${liveTable.id}?`);
    if (!confirmFree) return;
    setFreeing(true);
    setActionError('');
    const freedDbId = liveTable.dbId;
    const freedLabel = liveTable.id;
    const result = await freeTable(freedDbId);
    setFreeing(false);
    if (result.success) {
      if (waitingList.length > 0) {
        setFreedPrompt({ tableDbId: freedDbId, tableLabel: freedLabel });
      } else {
        onClose();
      }
    } else {
      setActionError('Failed to free table: ' + result.error);
    }
  };

  const handleAssignNextWaiting = async () => {
    if (!freedPrompt || assigningNext) return;
    const entry = waitingList[0];
    if (!entry) {
      onClose();
      return;
    }
    setAssigningNext(true);
    const result = await assignTable(freedPrompt.tableDbId, {
      customerName: entry.name,
      numberOfPeople: entry.people,
      arrivalStatus: 'seated',
      waitlistId: entry.id,
    });
    setAssigningNext(false);
    if (!result.success) {
      setActionError('Failed to seat waiting guest: ' + result.error);
    }
    setFreedPrompt(null);
    onClose();
  };

  const handleConfirmBill = async (discount) => {
    setBilling(true);
    setActionError('');
    const result = await markBilling(liveTable.dbId, discount);
    setBilling(false);
    if (result.success) {
      setShowBillModal(false);
      onClose();
    } else {
      setActionError('Failed to mark billing: ' + result.error);
    }
  };

  const handleMergeSelect = async (target) => {
    setActionError('');
    const result = await mergeTables(liveTable.dbId, target.dbId);
    setShowMergePicker(false);
    if (!result.success) {
      setActionError('Failed to merge: ' + result.error);
    }
  };

  const handleUnmerge = async (secondaryDbId) => {
    setActionError('');
    const result = await unmergeTable(secondaryDbId);
    if (!result.success) {
      setActionError('Failed to un-merge: ' + result.error);
    }
  };

  const handleMoveSelect = async (target) => {
    setActionError('');
    const result = await transferTable(liveTable.dbId, target.dbId);
    setShowMovePicker(false);
    if (result.success) {
      onClose();
    } else {
      setActionError('Failed to move table: ' + result.error);
    }
  };

  const handleReprint = (kot) => {
    const activeItems = (kot.items || []).filter((i) => !i.cancelled);
    if (activeItems.length === 0) return;
    const printed = printKOT({
      tableId: liveTable.id,
      sessionId: liveTable.sessionId,
      kotNumber: kot.kotNumber,
      items: activeItems,
      guestName: liveTable.guest,
      section: liveTable.section,
      orderNote: 'REPRINT',
    });
    if (!printed) {
      setActionError('Reprint failed — pop-up blocked. Please allow pop-ups for this site.');
    }
  };

  const handleCancelConfirm = async (reason) => {
    const { item, kot } = cancelTarget;
    const result = await cancelOrderItem(liveTable.dbId, item.id, reason);
    if (result.success) {
      printCancellationKOT({
        tableId: liveTable.id,
        guestName: liveTable.guest,
        kotNumber: kot.kotNumber,
        item: { name: item.name, qty: item.qty, notes: item.notes },
        reason,
      });
      setCancelTarget(null);
    } else {
      setActionError('Failed to cancel item: ' + result.error);
    }
  };

  const availableTables = tables.filter((t) => t.status === 'available' && t.dbId !== liveTable?.dbId);
  const mergeableTables = tables.filter(
    (t) => t.status === 'occupied' && t.dbId !== liveTable?.dbId && !t.mergedInto
  );

  return (
    <aside className="detail-panel" id="table-detail-panel">
      {/* Header */}
      <div className="detail-panel__header">
        <div className="detail-panel__title-group">
          <h2 className="detail-panel__title">Table {detail.id}</h2>
          <span className="detail-panel__subtitle">{detail.statusLabel}</span>
        </div>
        <button className="detail-panel__close" onClick={onClose} id="btn-close-detail">
          <X size={18} />
        </button>
      </div>

      {actionError && (
        <div className="detail-panel__error" id="detail-panel-error">
          {actionError}
        </div>
      )}

      {liveTable?.mergedInto && (
        <div className="detail-panel__merge-banner">
          <Combine size={14} />
          <span>Merged into Table {tables.find((t) => t.dbId === liveTable.mergedInto)?.id || '—'}</span>
          <button onClick={() => handleUnmerge(liveTable.dbId)} id="btn-unmerge-self">
            <Unlink size={12} /> Un-merge
          </button>
        </div>
      )}

      {mergedSecondaries.length > 0 && (
        <div className="detail-panel__merge-banner detail-panel__merge-banner--primary">
          <Combine size={14} />
          <span>
            Combined with: {mergedSecondaries.map((t) => t.id).join(', ')}
          </span>
        </div>
      )}

      {/* Current Status */}
      <div className="detail-panel__status">
        <p className="detail-panel__status-label">Current Status</p>
        <p className="detail-panel__status-value">{detail.currentStatus}</p>
      </div>

      {/* Customer Info */}
      <div className="detail-panel__info">
        <div className="detail-panel__info-item">
          <span className="detail-panel__info-label">Customer Name</span>
          <span className="detail-panel__info-value">
            <span className="detail-panel__info-avatar">{detail.avatarInitials}</span>
            {detail.customerName}
          </span>
        </div>
        <div className="detail-panel__info-item">
          <span className="detail-panel__info-label">People</span>
          <span className="detail-panel__info-value">{detail.people}</span>
        </div>
        <div className="detail-panel__info-item">
          <span className="detail-panel__info-label">Phone</span>
          <span className="detail-panel__info-value">
            {detail.phone ? (
              <>
                <Phone size={13} /> {detail.phone}
              </>
            ) : (
              '—'
            )}
          </span>
        </div>
        <div className="detail-panel__info-item">
          <span className="detail-panel__info-label">Time Seated</span>
          <span className="detail-panel__info-value">{detail.timeSeated}</span>
        </div>
        <div className="detail-panel__info-item" style={{ alignItems: 'flex-start' }}>
          <span className="detail-panel__info-label">Server</span>
          <span className="detail-panel__info-value">
            {isEditingServer ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={detail.server || ''}
                  onChange={async (e) => {
                    const newServer = e.target.value;
                    if (newServer && liveTable.sessionId) {
                      const result = await assignWaiter(liveTable.sessionId, newServer);
                      if (!result.success) {
                        setActionError("Failed to assign waiter. Please make sure you have added the 'server_name' column to the 'customer_sessions' table in Supabase.");
                      }
                    }
                    setIsEditingServer(false);
                  }}
                  autoFocus
                  onBlur={() => setIsEditingServer(false)}
                  style={{
                    padding: '4px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    outline: 'none'
                  }}
                >
                  <option value="" disabled>Select Waiter</option>
                  {MOCK_WAITERS.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            ) : (
              <span
                style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', color: 'var(--brand-primary)' }}
                onClick={() => setIsEditingServer(true)}
                title="Click to assign waiter"
              >
                {detail.server || 'Not Assigned'}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Active Order — grouped by KOT */}
      <div className="detail-panel__orders">
        <div className="detail-panel__orders-header">
          <span className="detail-panel__orders-title">KOT History ({detail.kots.length})</span>
        </div>

        {detail.kots.length === 0 && (
          <div className="order-item" style={{ justifyContent: 'center', opacity: 0.6 }}>
            <span>No items ordered yet.</span>
          </div>
        )}

        {detail.kots.map((kot) => (
          <div key={kot.id} className="kot-block" id={`kot-block-${kot.id}`}>
            <div className="kot-block__header">
              <span className="kot-block__title">KOT #{kot.kotNumber}</span>
              <span className="kot-block__time">{new Date(kot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <button
                className="kot-block__reprint"
                onClick={() => handleReprint(kot)}
                title="Reprint this KOT"
                id={`btn-reprint-${kot.id}`}
              >
                <Printer size={13} /> Reprint
              </button>
            </div>
            {kot.items.map((item) => (
              <div key={item.id} className={`order-item ${item.cancelled ? 'order-item--cancelled' : ''}`}>
                <div className="order-item__info">
                  <span className="order-item__name">
                    {item.qty}x {item.name}
                  </span>
                  {item.notes && <span className="order-item__note">{item.notes}</span>}
                  {item.cancelled && (
                    <span className="order-item__cancel-reason">Cancelled: {item.cancelReason}</span>
                  )}
                </div>
                <div className="order-item__right">
                  <span className="order-item__price">
                    ${(item.price * item.qty).toFixed(2)}
                  </span>
                  {!item.cancelled && (
                    <button
                      className="order-item__cancel-btn"
                      onClick={() => setCancelTarget({ item, kot })}
                      title="Cancel item"
                      id={`btn-cancel-item-${item.id}`}
                    >
                      <Ban size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}

        {mergedSecondaries.map((mt) => (
          <div key={mt.dbId} className="kot-block kot-block--merged">
            <div className="kot-block__header">
              <span className="kot-block__title">Merged: Table {mt.id}</span>
            </div>
            {(mt.orders || []).map((item, idx) => (
              <div key={idx} className="order-item">
                <div className="order-item__info">
                  <span className="order-item__name">{item.qty}x {item.name}</span>
                </div>
                <span className="order-item__price">${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
            {(mt.orders || []).length === 0 && (
              <div className="order-item" style={{ opacity: 0.6 }}><span>No items.</span></div>
            )}
          </div>
        ))}

        <div className="detail-panel__subtotal">
          <span className="detail-panel__subtotal-label">Subtotal</span>
          <span className="detail-panel__subtotal-value">
            ${(detail.subtotal + mergedSecondaries.reduce((s, t) => s + (t.orders || []).reduce((a, i) => a + i.qty * i.price, 0), 0)).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Manager Notes */}
      <div className="detail-panel__notes">
        <div className="detail-panel__notes-box">
          <p className="detail-panel__notes-title">
            <StickyNote />
            Manager Notes
          </p>
          <p className="detail-panel__notes-text">
            &ldquo;{detail.managerNote}&rdquo;
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="detail-panel__actions">
        {liveTable?.status === 'occupied' && (
          <button
            className="detail-panel__btn detail-panel__btn--primary"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white', marginBottom: 'var(--space-2)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={handleCreateOrderClick}
            id="btn-create-order"
          >
            <UtensilsCrossed size={16} />
            Create Order
          </button>
        )}

        {liveTable?.status === 'occupied' && !liveTable?.mergedInto && (
          <div className="detail-panel__actions-row">
            <button
              className="detail-panel__btn detail-panel__btn--outline"
              id="btn-move-table"
              onClick={() => setShowMovePicker(true)}
            >
              <ArrowRightLeft />
              Move Table
            </button>
            <button
              className="detail-panel__btn detail-panel__btn--outline"
              id="btn-merge-table"
              onClick={() => setShowMergePicker(true)}
            >
              <Combine />
              Merge With
            </button>
          </div>
        )}

        <div className="detail-panel__actions-row">
          <button
            className="detail-panel__btn detail-panel__btn--primary"
            id="btn-mark-billing"
            onClick={() => setShowBillModal(true)}
            disabled={billing || liveTable?.status === 'payment'}
          >
            {billing ? <Loader2 size={16} className="animate-spin" /> : <Receipt />}
            {liveTable?.status === 'payment' ? 'Sent to Billing' : 'Mark Billing'}
          </button>
        </div>
        <button
          className="detail-panel__btn detail-panel__btn--secondary"
          id="btn-free-table"
          onClick={handleFreeTable}
          disabled={freeing}
        >
          {freeing ? <Loader2 size={16} className="animate-spin" /> : <Unlock />}
          {freeing ? 'Freeing...' : 'Free Table'}
        </button>
      </div>

      {showMovePicker && (
        <TablePickerModal
          title="Move Table"
          subtitle={`Transfer Table ${liveTable.id} to an available table`}
          tables={availableTables}
          emptyMessage="No available tables to move to."
          onSelect={handleMoveSelect}
          onClose={() => setShowMovePicker(false)}
        />
      )}

      {showMergePicker && (
        <TablePickerModal
          title="Merge With"
          subtitle={`Combine Table ${liveTable.id} with another occupied table`}
          tables={mergeableTables}
          emptyMessage="No other occupied, unmerged tables available."
          onSelect={handleMergeSelect}
          onClose={() => setShowMergePicker(false)}
        />
      )}

      {cancelTarget && (
        <CancelItemModal
          item={cancelTarget.item}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelConfirm}
        />
      )}

      {showBillModal && (
        <BillModal
          table={liveTable}
          mergedTables={mergedSecondaries}
          onClose={() => setShowBillModal(false)}
          onConfirm={handleConfirmBill}
        />
      )}

      {freedPrompt && waitingList.length > 0 && (
        <div className="freed-prompt-overlay" onClick={!assigningNext ? () => { setFreedPrompt(null); onClose(); } : undefined} id="freed-table-prompt-overlay">
          <div className="freed-prompt-card" onClick={(e) => e.stopPropagation()} id="freed-table-prompt">
            <div className="freed-prompt-card__icon">
              <UserCheck size={22} />
            </div>
            <h3>Table {freedPrompt.tableLabel} is now free</h3>
            <p>
              Seat next waiting guest <strong>{waitingList[0].name}</strong> (party of {waitingList[0].people}) here?
            </p>
            <div className="freed-prompt-card__actions">
              <button onClick={() => { setFreedPrompt(null); onClose(); }} disabled={assigningNext} id="btn-freed-prompt-skip">
                Not Now
              </button>
              <button className="freed-prompt-card__primary" onClick={handleAssignNextWaiting} disabled={assigningNext} id="btn-freed-prompt-assign">
                {assigningNext ? 'Seating...' : 'Seat Them Here'}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default TableDetailPanel;
