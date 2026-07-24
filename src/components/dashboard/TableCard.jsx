import {
  UtensilsCrossed,
  CheckCircle2,
  CalendarClock,
  SprayCan,
  CreditCard,
  Users,
  PlusCircle,
  MessageCircle,
  Bell,
  Combine,
} from 'lucide-react';
import { useRestaurant } from '../../context/useRestaurant';
import './TableCard.css';

const statusConfig = {
  occupied: {
    label: 'Occupied',
    icon: UtensilsCrossed,
    timeLabel: 'TIME',
  },
  available: {
    label: 'Available',
    icon: CheckCircle2,
    timeLabel: 'TIME',
  },
  reserved: {
    label: 'Reserved',
    icon: CalendarClock,
    timeLabel: 'GUEST',
  },
  cleaning: {
    label: 'Cleaning',
    icon: SprayCan,
    timeLabel: 'WAIT',
  },
  payment: {
    label: 'Payment Pending',
    icon: MessageCircle,
    timeLabel: 'SESSION',
  },
};

function getCapacityVariant(seated, capacity) {
  if (seated === 0) return 'empty';
  if (seated >= capacity) return 'full';
  return 'partial';
}

function TableCard({ table, onClick, onClickOrder }) {
  const { tables = [] } = useRestaurant();
  const config = statusConfig[table?.status] || statusConfig.available;
  const StatusIcon = config.icon;
  const seated = table?.seated || 0;
  const capacity = table?.capacity || 1;
  const capacityVariant = getCapacityVariant(seated, capacity);

  const subtotal = (table?.orders || []).reduce((sum, item) => sum + item.qty * item.price, 0);
  const mergedIntoTable = table?.mergedInto ? tables.find((t) => t.dbId === table.mergedInto) : null;
  const combinedCount = table?.mergedTableIds?.length || 0;

  const getSecondaryValue = () => {
    if (table.status === 'reserved') return table.guest;
    if (table.status === 'cleaning') return table.time;
    if (table.status === 'payment') return table.time;
    return table.time;
  };

  const getStatusDisplay = () => {
    if (table.status === 'reserved') {
      return `Reserved (${table.time})`;
    }
    return config.label;
  };

  return (
    <div
      className={`table-card table-card--${table.status} ${table.hasPendingCall ? 'table-card--has-call' : ''}`}
      onClick={() => onClick && onClick(table)}
      id={`table-card-${table.id}`}
    >
      {/* Pulsing Bell Badge if there is a pending waiter call */}
      {table.hasPendingCall && (
        <div className="table-card__bell-badge" title="Active Waiter Call!">
          <Bell size={12} className="animate-pulse" />
        </div>
      )}

      {(mergedIntoTable || combinedCount > 0) && (
        <div className="table-card__merge-badge" title={mergedIntoTable ? `Merged into ${mergedIntoTable.id}` : 'Combined with another table'}>
          <Combine size={11} />
          {mergedIntoTable ? `→ ${mergedIntoTable.id}` : `+${combinedCount}`}
        </div>
      )}

      {/* Header */}
      <div className="table-card__header">
        <span className="table-card__id">{table.id}</span>
        <div className={`table-card__capacity table-card__capacity--${capacityVariant}`}>
          <Users />
          {table.seated}/{table.capacity}
        </div>
      </div>

      {/* Body */}
      <div className="table-card__body">
        <div className="table-card__field">
          <span className="table-card__field-label">STATUS</span>
          <span className={`table-card__field-value table-card__field-value--${table.status}`}>
            {getStatusDisplay()}
          </span>
        </div>

        <div className="table-card__field">
          <span className="table-card__field-label">{config.timeLabel}</span>
          <span className="table-card__field-value">
            {getSecondaryValue()}
          </span>
        </div>

        {subtotal > 0 && (
          <div className="table-card__field">
            <span className="table-card__field-label">SUBTOTAL</span>
            <span className="table-card__field-value table-card__field-value--subtotal">
              ${subtotal.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="table-card__footer">
        {table.status === 'occupied' && (
          <button
            className="table-card__order-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClickOrder && onClickOrder(table);
            }}
            id={`btn-table-order-${table.id}`}
          >
            <UtensilsCrossed size={12} />
            Create Order
          </button>
        )}
        <div className={`table-card__footer-icon table-card__footer-icon--${table.status}`}>
          <StatusIcon />
        </div>
      </div>
    </div>
  );
}

function NewTableCard({ onClick }) {
  return (
    <div className="table-card table-card--new" onClick={onClick} id="btn-new-table">
      <PlusCircle />
      <span>New Table</span>
    </div>
  );
}

export { TableCard, NewTableCard };
