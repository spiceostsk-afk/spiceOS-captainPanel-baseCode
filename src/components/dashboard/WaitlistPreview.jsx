import { ArrowUpRight, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '../../context/useRestaurant';
import './WaitlistPreview.css';

function WaitlistPreview({ onAssign }) {
  const navigate = useNavigate();
  const { waitingList = [], stats = { waiting: 0 } } = useRestaurant();

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .filter(n => n)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const formatWait = (addedAt) => {
    if (!addedAt) return '0 min wait';
    const start = new Date(addedAt);
    const now = new Date();
    const diffMins = Math.floor((now - start) / 60000);
    return `${diffMins} min wait`;
  };

  return (
    <section className="waitlist-preview" id="upcoming-waitlist">
      <h2 className="waitlist-preview__title">Upcoming Waitlist</h2>

      <div className="waitlist-preview__cards">
        {waitingList && waitingList.length > 0 ? (
          waitingList.slice(0, 2).map((guest) => (
            <div 
              key={guest.id} 
              className="waitlist-preview__card"
              onClick={() => onAssign && onAssign(guest)}
              id={`waitlist-preview-card-${guest.id}`}
            >
              <div className="waitlist-preview__avatar">{getInitials(guest.name)}</div>
              <div className="waitlist-preview__info">
                <span className="waitlist-preview__name">{guest.name}</span>
                <span className="waitlist-preview__meta">
                  {guest.people} Guests • {formatWait(guest.addedAt)}
                </span>
              </div>
              <ArrowUpRight size={18} className="waitlist-preview__arrow" />
            </div>
          ))
        ) : (
          <div className="waitlist-preview__empty">No guests waiting</div>
        )}

        <button
          className="waitlist-preview__view-all"
          onClick={() => navigate('/waiting-list')}
          id="btn-view-all-waiting"
        >
          <Eye size={18} />
          View All {stats?.waiting || 0} Waiting
        </button>
      </div>
    </section>
  );
}

export default WaitlistPreview;
