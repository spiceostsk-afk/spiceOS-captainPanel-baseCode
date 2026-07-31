import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, AlertTriangle } from 'lucide-react';
import FilterTabs from '../components/dashboard/FilterTabs';
import { TableCard, NewTableCard } from '../components/dashboard/TableCard';
import WaitlistPreview from '../components/dashboard/WaitlistPreview';
import PriorityCallsList from '../components/dashboard/PriorityCallsList';
import AssignTableModal from '../components/modals/AssignTableModal';
import TableDetailPanel from '../components/table-management/TableDetailPanel';
import { useRestaurant } from '../context/useRestaurant';
import './TableDashboard.css';

const ALL = 'All';

const LEGEND = [
  { key: 'available', label: 'Free', color: 'var(--color-success)' },
  { key: 'occupied', label: 'Dining', color: 'var(--color-info)' },
  { key: 'payment', label: 'Bill ready', color: 'var(--color-warning)' },
  { key: 'sos', label: 'Needs help', color: 'var(--color-danger)' },
];

function TableDashboard({ search = '' }) {
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [assigningEntry, setAssigningEntry] = useState(null);
  const [section, setSection] = useState(ALL);

  const navigate = useNavigate();
  const { tables, sections, stats, loading, error, assignTable, addToWaitlist } = useRestaurant();

  const sectionOptions = useMemo(() => [ALL, ...(sections || [])], [sections]);

  const legend = useMemo(() => LEGEND.map((l) => ({
    label: l.label,
    color: l.color,
    count: l.key === 'sos'
      ? tables.filter((t) => t.hasPendingCall).length
      : tables.filter((t) => t.status === l.key).length,
  })), [tables]);

  const visibleTables = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tables.filter((t) => {
      const inSection = section === ALL || t.section === section;
      if (!inSection) return false;
      if (!q) return true;
      return (t.id || '').toLowerCase().includes(q)
        || (t.guest || '').toLowerCase().includes(q);
    });
  }, [tables, section, search]);

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

  const openWaitlistModal = () => {
    setSelectedTable(null);
    setAssigningEntry(null);
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
        waitlistId: assigningEntry.id,
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
    return <div className="loading-container">Loading floor…</div>;
  }

  if (error) {
    return <div className="error-container">Error: {error}</div>;
  }

  return (
    <div
      className={`table-dashboard ${selectedTable && showDetail ? 'table-dashboard--with-panel' : ''}`}
      id="table-dashboard-page"
    >
      {stats.totalTables > 0 && stats.available === 0 && (
        <div className="table-dashboard__full-banner" id="all-tables-full-banner">
          <AlertTriangle size={16} />
          <span>All tables are full — new walk-ins should go to the waiting list.</span>
          <button onClick={openWaitlistModal} id="btn-full-banner-waitlist">
            Add to waiting list
          </button>
        </div>
      )}

      <div className="table-dashboard__toolbar">
        <FilterTabs
          sections={sectionOptions}
          active={section}
          onSectionChange={setSection}
          legend={legend}
        />
        <button
          className="table-dashboard__add-btn"
          onClick={openWaitlistModal}
          id="btn-add-to-waitlist"
        >
          <UserPlus size={16} />
          Add to waitlist
        </button>
      </div>

      <div className="table-dashboard__grid" id="dashboard-table-grid">
        {visibleTables.map((table) => (
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

      {visibleTables.length === 0 && (
        <div className="table-dashboard__empty">
          {search.trim()
            ? `No table or guest matches “${search.trim()}”.`
            : 'No tables in this section yet.'}
        </div>
      )}

      <div className="table-dashboard__lists">
        <WaitlistPreview onAssign={handleAssignFromWaitlist} />
        <PriorityCallsList />
      </div>

      {showModal && (
        <AssignTableModal
          table={selectedTable}
          initialData={assigningEntry ? {
            customerName: assigningEntry.name,
            numberOfPeople: assigningEntry.people.toString(),
            preference: assigningEntry.preference,
          } : null}
          onClose={() => {
            setShowModal(false);
            setSelectedTable(null);
            setAssigningEntry(null);
          }}
          onAssign={handleAssign}
        />
      )}

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
