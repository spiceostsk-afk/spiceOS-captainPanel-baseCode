import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '../../context/useRestaurant';
import { TableCard } from '../dashboard/TableCard';
import './TableGrid.css';

/**
 * Every table with a live session, using the same card as the floor so a
 * captain reads one visual language across both screens.
 */
function TableGrid({ onSelectTable, selectedTableId }) {
  const { tables = [], stats = { occupied: 0, totalTables: 0 }, loading } = useRestaurant();
  const navigate = useNavigate();

  if (loading && tables.length === 0) {
    return <div className="loading-container">Loading tables…</div>;
  }

  return (
    <div className="table-grid-container">
      <div className="table-grid__section-header">
        <h2 className="table-grid__section-title">Active customers</h2>
        <p className="table-grid__section-subtitle">
          {stats.occupied} of {stats.totalTables} tables occupied
        </p>
      </div>

      {tables.length === 0 ? (
        <div className="table-grid__empty">No tables set up yet.</div>
      ) : (
        <div className="table-grid" id="table-management-grid">
          {tables.map((table) => (
            <div
              key={table.id}
              className={selectedTableId === table.id ? 'table-grid__cell is-selected' : 'table-grid__cell'}
            >
              <TableCard
                table={table}
                onClick={onSelectTable}
                onClickOrder={(t) => {
                  navigate(`/menu?tableId=${t.dbId}&sessionId=${t.sessionId || 'session-' + t.id}`);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TableGrid;
