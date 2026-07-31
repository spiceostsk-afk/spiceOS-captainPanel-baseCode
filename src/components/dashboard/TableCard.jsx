import { Users, Clock, Plus, Combine, Bell } from 'lucide-react';
import { useRestaurant } from '../../context/useRestaurant';
import './TableCard.css';

/** Strip colour + badge tone per table status. Green free, blue dining, amber bill, red SOS. */
const STATUS = {
  available: { label: 'Free', tone: 'free' },
  occupied: { label: 'Dining', tone: 'dining' },
  reserved: { label: 'Reserved', tone: 'bill' },
  payment: { label: 'Bill ready', tone: 'bill' },
  cleaning: { label: 'Cleaning', tone: 'cleaning' },
};

const OVERDUE_MINUTES = 45;

/** "42 mins" / "1h 20m" / "--" → minutes, or null when unknown. */
function parseMinutes(time) {
  if (!time || time === '--') return null;
  const hm = /(\d+)\s*h\s*(\d+)\s*m/.exec(time);
  if (hm) return Number(hm[1]) * 60 + Number(hm[2]);
  const m = /(\d+)/.exec(time);
  return m ? Number(m[1]) : null;
}

const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

function TableCard({ table, onClick, onClickOrder }) {
  const { tables = [] } = useRestaurant();

  const config = STATUS[table?.status] || STATUS.available;
  const seated = table?.seated || 0;
  const capacity = table?.capacity || 1;
  const occupied = table?.status !== 'available';

  const subtotal = (table?.orders || []).reduce((sum, item) => sum + item.qty * item.price, 0);
  const mergedIntoTable = table?.mergedInto ? tables.find((t) => t.dbId === table.mergedInto) : null;
  const combinedCount = table?.mergedTableIds?.length || 0;

  const minutes = parseMinutes(table?.time);
  const late = table?.hasPendingCall
    || table?.status === 'payment'
    || (minutes !== null && minutes > OVERDUE_MINUTES);

  const sos = !!table?.hasPendingCall;

  return (
    <div
      className={`table-card table-card--${config.tone} ${sos ? 'table-card--sos' : ''}`}
      onClick={() => onClick && onClick(table)}
      id={`table-card-${table.id}`}
    >
      <div className="table-card__strip" />

      <div className="table-card__body">
        <div className="table-card__top">
          <span className="table-card__id">{table.id}</span>
          <span className="table-card__seats">
            <Users size={13} />
            {seated}/{capacity}
          </span>
        </div>

        <div className="table-card__badges">
          <span className={`table-card__badge table-card__badge--${config.tone}`}>
            {config.label}
          </span>

          {sos && (
            <span className="table-card__badge table-card__badge--sos" title="Guest is calling">
              <Bell size={11} /> Needs help
            </span>
          )}

          {(mergedIntoTable || combinedCount > 0) && (
            <span
              className="table-card__badge table-card__badge--merge"
              title={mergedIntoTable ? `Merged into ${mergedIntoTable.id}` : 'Combined with another table'}
            >
              <Combine size={11} />
              {mergedIntoTable ? `→ ${mergedIntoTable.id}` : `+${combinedCount}`}
            </span>
          )}
        </div>

        {occupied && (
          <div className="table-card__meta">
            <span className={`table-card__time ${late ? 'is-late' : ''}`}>
              <Clock size={13} />
              {table.time}
            </span>
            {subtotal > 0 && <span className="table-card__total tnum">{inr(subtotal)}</span>}
          </div>
        )}

        {table.status === 'occupied' && (
          <button
            className="table-card__order-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClickOrder && onClickOrder(table);
            }}
            id={`btn-table-order-${table.id}`}
          >
            Add items
          </button>
        )}
      </div>
    </div>
  );
}

function NewTableCard({ onClick }) {
  return (
    <div className="table-card table-card--new" onClick={onClick} id="btn-new-table">
      <span className="table-card__new-mark"><Plus size={20} /></span>
      <span>New table</span>
    </div>
  );
}

export { TableCard, NewTableCard };
