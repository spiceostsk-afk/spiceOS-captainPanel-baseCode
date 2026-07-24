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
  const { waitingList, loading, error, assignTable, addToWaitlist } = useRestaurant();

  const handleAssign = (entry) => {
    setAssigningEntry(entry);
    setShowModal(true);
  };

  const onModalSubmit = async (data) => {
    if (assigningEntry) {
      // Assigning from waitlist
      const result = await assignTable(data.tableId, { 
        ...data, 
        waitlistId: assigningEntry.id 
      });
      if (result.success) {
        setShowModal(false);
        setAssigningEntry(null);
      } else {
        alert('Assignment failed: ' + result.error);
      }
    } else {
      // Just adding to waitlist
      const result = await addToWaitlist(data);
      if (result.success) {
        setShowModal(false);
      } else {
        alert('Waitlist addition failed: ' + result.error);
      }
    }
  };

  if (loading && (!waitingList || waitingList.length === 0)) {
    return <div className="loading-container">Loading Waiting List...</div>;
  }

  if (error) {
    return <div className="error-container">Error: {error}</div>;
  }

  return (
    <div className="waiting-list-page" id="waiting-list-page">
      {/* Header */}
      <div className="waiting-list-page__header">
        <div className="waiting-list-page__title-group">
          <h1 className="waiting-list-page__title">
            Waiting List ({waitingList?.length || 0} Customers)
          </h1>
          <p className="waiting-list-page__subtitle">
            Manage arrivals and assign tables in real-time.
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
          <UserPlus />
          Add to Waitlist
        </button>
      </div>

      {/* List */}
      <div className="waiting-list-page__list" id="waitlist-entries">
        {waitingList && waitingList.length > 0 ? (
          waitingList.map((entry, index) => (
            <WaitlistEntry key={entry.id} entry={entry} index={index} onAssign={handleAssign} />
          ))
        ) : (
          <div className="empty-waitlist">No customers currently waiting.</div>
        )}
      </div>

      {/* Stats */}
      <WaitlistStats />

      {/* Assign Modal */}
      {showModal && (
        <AssignTableModal
          table={null} // Modal needs to be smarter about selecting a table if one isn't provided
          initialData={assigningEntry ? {
            customerName: assigningEntry.name,
            numberOfPeople: assigningEntry.people.toString(),
            preference: assigningEntry.preference,
            specialNote: assigningEntry.notes
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
