import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import WaitlistEntry from '../components/waiting-list/WaitlistEntry';
import WaitlistStats from '../components/waiting-list/WaitlistStats';
import AssignTableModal from '../components/modals/AssignTableModal';
import { useRestaurant } from '../context/useRestaurant';
import './WaitingList.css';

function WaitingList() {
  const [showModal, setShowModal] = useState(false);
  const [assigningEntry, setAssigningEntry] = useState(null);
  const {
    waitingList, loading, error, assignTable, addToWaitlist,
    removeFromWaitlist, pinWaitlistEntry,
  } = useRestaurant();

  const handleAssign = (entry) => {
    setAssigningEntry(entry);
    setShowModal(true);
  };

  const handleRemove = async (entry) => {
    if (!window.confirm(`Remove ${entry.name} from the waiting list?`)) return;
    const result = await removeFromWaitlist(entry.id);
    if (!result.success) {
      alert('Could not remove guest: ' + result.error);
    }
  };

  const onModalSubmit = async (data) => {
    if (assigningEntry) {
      const result = await assignTable(data.tableId, {
        ...data,
        waitlistId: assigningEntry.id,
      });
      if (result.success) {
        setShowModal(false);
        setAssigningEntry(null);
      } else {
        alert('Assignment failed: ' + result.error);
      }
    } else {
      const result = await addToWaitlist(data);
      if (result.success) {
        setShowModal(false);
      } else {
        alert('Waitlist addition failed: ' + result.error);
      }
    }
  };

  if (loading && (!waitingList || waitingList.length === 0)) {
    return <div className="loading-container">Loading waiting list…</div>;
  }

  if (error) {
    return <div className="error-container">Error: {error}</div>;
  }

  const count = waitingList?.length || 0;

  return (
    <div className="waiting-list-page" id="waiting-list-page">
      <div className="waiting-list-page__header">
        <div>
          <h1 className="waiting-list-page__title">Waiting list ({count})</h1>
          <p className="waiting-list-page__subtitle">
            Manage arrivals and seat guests in real time.
          </p>
        </div>
        <button
          className="waiting-list-page__add-btn"
          onClick={() => {
            setAssigningEntry(null);
            setShowModal(true);
          }}
          id="btn-add-waitlist"
        >
          <UserPlus size={17} />
          Add guest
        </button>
      </div>

      <WaitlistStats />

      <div className="waiting-list-page__list" id="waitlist-entries">
        {count > 0 ? (
          waitingList.map((entry, index) => (
            <WaitlistEntry
              key={entry.id}
              entry={entry}
              index={index}
              onAssign={handleAssign}
              onPin={(e) => pinWaitlistEntry(e.id)}
              onRemove={handleRemove}
            />
          ))
        ) : (
          <div className="waiting-list-page__empty">No guests waiting right now.</div>
        )}
      </div>

      {showModal && (
        <AssignTableModal
          table={null}
          initialData={assigningEntry ? {
            customerName: assigningEntry.name,
            numberOfPeople: assigningEntry.people.toString(),
            preference: assigningEntry.preference,
            specialNote: assigningEntry.notes,
          } : null}
          onClose={() => {
            setShowModal(false);
            setAssigningEntry(null);
          }}
          onAssign={onModalSubmit}
        />
      )}
    </div>
  );
}

export default WaitingList;
