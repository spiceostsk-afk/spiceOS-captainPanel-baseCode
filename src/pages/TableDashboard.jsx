import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid3X3, CheckCircle2, AlertCircle, Clock, UserPlus, AlertTriangle } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import FilterTabs from '../components/dashboard/FilterTabs';
import { TableCard, NewTableCard } from '../components/dashboard/TableCard';
import WaitlistPreview from '../components/dashboard/WaitlistPreview';
import PriorityCallsList from '../components/dashboard/PriorityCallsList';
import AssignTableModal from '../components/modals/AssignTableModal';
import TableDetailPanel from '../components/table-management/TableDetailPanel';
import { useRestaurant } from '../context/useRestaurant';
import './TableDashboard.css';

function TableDashboard() {
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState(null);
  const [assigningEntry, setAssigningEntry] = useState(null);
  const { tables, stats, loading, error, assignTable, addToWaitlist } = useRestaurant();

  const handleTableClick = (table) => {
    setSelectedTable(table);
    if (table.status === 'available') {
      setShowModal(true);
      setShowDetail(false);
    } else {
      setShowDetail(true);
      setShowModal(false);
    }
  };

  const handleAssignFromWaitlist = (entry) => {
    setAssigningEntry(entry);
    setSelectedTable(null);
    setShowModal(true);
    setShowDetail(false);
  };

  const handleAssign = async (data) => {
    if (selectedTable) {
      const result = await assignTable(selectedTable.dbId, data);
      if (result.success) {
        setShowModal(false);
        setSelectedTable(null);
      } else {
        alert('Failed to assign table: ' + result.error);
      }
    } else if (assigningEntry) {
      const result = await assignTable(data.tableId, {
        ...data,
        waitlistId: assigningEntry.id
      });
      if (result.success) {
        setShowModal(false);
        setAssigningEntry(null);
      } else {
        alert('Failed to assign table: ' + result.error);
      }
    } else {
      const result = await addToWaitlist(data);
      if (result.success) {
        setShowModal(false);
      } else {
        alert('Failed to add to waitlist: ' + result.error);
      }
    }
  };

  if (loading && tables.length === 0) {
    return <div className="loading-container">Loading Dashboard...</div>;
  }

  if (error) {
    return <div className="error-container">Error: {error}</div>;
  }

  return (
    <div className={`table-dashboard ${selectedTable && showDetail ? 'table-dashboard--with-panel' : ''}`} id="table-dashboard-page">
      {/* Stats */}
      <div className="table-dashboard__stats">
        <StatCard label="Total Tables" value={stats.totalTables} icon={Grid3X3} variant="total" />
        <StatCard label="Available" value={stats.available} icon={CheckCircle2} variant="available" />
        <StatCard label="Occupied" value={stats.occupied} icon={AlertCircle} variant="occupied" />
        <StatCard label="Waiting" value={stats.waiting} icon={Clock} variant="waiting" />
      </div>

      {/* All tables full banner */}
      {stats.totalTables > 0 && stats.available === 0 && (
        <div className="table-dashboard__full-banner" id="all-tables-full-banner">
          <AlertTriangle size={16} />
          <span>All tables are full — new walk-ins should go to the Waiting List.</span>
          <button
            onClick={() => {
              setSelectedTable(null);
              setAssigningEntry(null);
              setShowModal(true);
              setShowDetail(false);
            }}
            id="btn-full-banner-waitlist"
          >
            Add to Waiting List
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="table-dashboard__toolbar">
        <FilterTabs />
        <button
          className="table-dashboard__add-btn"
          onClick={() => {
            setSelectedTable(null);
            setAssigningEntry(null);
            setShowModal(true);
            setShowDetail(false);
          }}
          id="btn-add-to-waitlist"
        >
          <UserPlus />
          Add to Waitlist
        </button>
      </div>

      {/* Table Grid */}
      <div className="table-dashboard__grid" id="dashboard-table-grid">
        {tables.map((table) => (
          <TableCard
            key={table.dbId}
            table={table}
            onClick={handleTableClick}
            onClickOrder={(t) => {
              navigate(`/menu?tableId=${t.dbId}&sessionId=${t.sessionId || 'session-' + t.id}`);
            }}
          />
        ))}
        <NewTableCard onClick={() => {}} />
      </div>

      {/* Lists */}
      <div className="table-dashboard__lists">
        <WaitlistPreview onAssign={handleAssignFromWaitlist} />
        <PriorityCallsList />
      </div>

      {/* Assign Table Modal */}
      {showModal && (
        <AssignTableModal
          table={selectedTable}
          initialData={assigningEntry ? {
            customerName: assigningEntry.name,
            numberOfPeople: assigningEntry.people.toString(),
            preference: assigningEntry.preference
          } : null}
          onClose={() => {
            setShowModal(false);
            setSelectedTable(null);
            setAssigningEntry(null);
          }}
          onAssign={handleAssign}
        />
      )}

      {/* Table Detail Panel */}
      {showDetail && selectedTable && (
        <TableDetailPanel
          table={selectedTable}
          onClose={() => {
            setShowDetail(false);
            setSelectedTable(null);
          }}
        />
      )}
    </div>
  );
}

export default TableDashboard;
