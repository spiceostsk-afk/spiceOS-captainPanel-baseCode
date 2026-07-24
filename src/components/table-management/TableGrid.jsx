import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronLeft, ChevronRight, UtensilsCrossed, Combine } from 'lucide-react';
import { useRestaurant } from '../../context/useRestaurant';
import './TableGrid.css';

function TableGrid({ onSelectTable, selectedTableId }) {
  const { tables = [], stats = { occupied: 0, totalTables: 0 }, loading, error } = useRestaurant();
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const totalPages = 1;

  if (loading && tables.length === 0) return <div>Loading Tables...</div>;

  return (
    <div className="table-grid-container">
      {/* Section Header */}
      <div className="table-grid__section-header">
        <h2 className="table-grid__section-title">All Sections</h2>
        <p className="table-grid__section-subtitle">
          {stats.occupied} / {stats.totalTables} Tables Occupied
        </p>
      </div>

      {/* Grid */}
      <div className="table-grid" id="table-management-grid">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`tm-card tm-card--${table.status} ${
              selectedTableId === table.id ? 'tm-card--active' : ''
            }`}
            onClick={() => onSelectTable(table)}
            id={`tm-card-${table.id}`}
          >
            <div className="tm-card__header">
              <span className="tm-card__id">{table.id}</span>
              <div className="tm-card__capacity">
                <Users size={12} />
                {table.seated}/{table.capacity}
              </div>
            </div>

            {table.mergedInto && (
              <span className="tm-card__merge-pill">
                <Combine size={11} /> Merged → {tables.find((t) => t.dbId === table.mergedInto)?.id || '—'}
              </span>
            )}
            {table.mergedTableIds?.length > 0 && (
              <span className="tm-card__merge-pill">
                <Combine size={11} /> Combined +{table.mergedTableIds.length}
              </span>
            )}

            {table.guest && (
              <>
                <span className="tm-card__guest-label">GUEST</span>
                <span className="tm-card__guest">{table.guest}</span>
              </>
            )}

            {!table.guest && table.status === 'available' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 'var(--space-4) 0',
                }}
              >
                <span
                  className="tm-card__status-badge tm-card__status-badge--available"
                >
                  AVAILABLE
                </span>
              </div>
            )}

            {table.status === 'occupied' && (
              <div className="tm-card__actions">
                <button
                  className="tm-card__action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/menu?tableId=${table.dbId}&sessionId=${table.sessionId || 'session-' + table.id}`);
                  }}
                  id={`btn-table-order-${table.id}`}
                >
                  <UtensilsCrossed size={12} />
                  Create Order
                </button>
              </div>
            )}

            <div className="tm-card__footer">
              <div>
                {table.time && (
                  <>
                    <span className="tm-card__time-label">
                      {table.status === 'reserved' ? 'STATUS' : 'SEATED'}
                    </span>
                    <p className="tm-card__time">{table.time}</p>
                  </>
                )}
              </div>
              {table.status !== 'available' && (
                <span
                  className={`tm-card__status-badge tm-card__status-badge--${
                    table.status === 'reserved' ? 'holding' : table.status
                  }`}
                >
                  {table.status === 'reserved' ? 'HOLDING' : table.status.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="table-grid__pagination" id="table-grid-pagination">
        <button
          className="table-grid__pagination-btn"
          onClick={() => setPage(Math.max(1, page - 1))}
          id="pagination-prev"
        >
          <ChevronLeft />
        </button>
        <span className="table-grid__pagination-text">
          {page} / {totalPages}
        </span>
        <button
          className="table-grid__pagination-btn"
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          id="pagination-next"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}

export default TableGrid;
