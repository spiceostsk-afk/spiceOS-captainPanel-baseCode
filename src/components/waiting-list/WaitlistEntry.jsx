import {
  Users,
  Clock,
  MapPin,
  Armchair,
  Pin,
  X,
  Info,
  MessageSquare,
} from 'lucide-react';
import './WaitlistEntry.css';

function WaitlistEntry({ entry, index, onAssign }) {
  const isNext = entry.isNext;
  const position = index !== undefined ? index + 1 : 1;

  return (
    <div
      className={`waitlist-entry ${isNext ? 'waitlist-entry--next' : ''}`}
      id={`waitlist-entry-${entry.id}`}
    >
      {/* Position */}
      <div
        className={`waitlist-entry__position ${
          isNext
            ? 'waitlist-entry__position--next'
            : 'waitlist-entry__position--default'
        }`}
      >
        <span className="waitlist-entry__position-label">POS</span>
        <span className="waitlist-entry__position-number">#{position}</span>
      </div>

      {/* Content */}
      <div className="waitlist-entry__content">
        <div className="waitlist-entry__name-row">
          <span className="waitlist-entry__name">{entry?.name}</span>
          {isNext && <span className="waitlist-entry__next-badge">NEXT UP</span>}
        </div>

        <div className="waitlist-entry__meta">
          <span className="waitlist-entry__meta-item">
            <Users />
            {entry?.people} {entry?.people === 1 ? 'person' : 'people'}
          </span>
          <span className="waitlist-entry__meta-dot" />
          <span
            className={`waitlist-entry__meta-item ${
              isNext ? 'waitlist-entry__wait--urgent' : ''
            }`}
          >
            <Clock />
            {entry?.waitTime} wait
          </span>
          <span className="waitlist-entry__meta-dot" />
          <span className="waitlist-entry__meta-item">
            <MapPin />
            {entry?.preference}
          </span>
        </div>

        {entry?.suggestion && (
          <div className="waitlist-entry__suggestion">
            <Info />
            <span>Suggested: {entry?.suggestion}</span>
          </div>
        )}

        {entry?.notes && (
          <div className="waitlist-entry__notes">
            <MessageSquare />
            <span className="waitlist-entry__notes-label">Remark:</span>
            <span className="waitlist-entry__notes-content">{entry.notes}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="waitlist-entry__actions">
        <button
          className={`waitlist-entry__assign-btn ${
            isNext
              ? 'waitlist-entry__assign-btn--primary'
              : 'waitlist-entry__assign-btn--outline'
          }`}
          onClick={() => onAssign && onAssign(entry)}
          id={`btn-assign-${entry.id}`}
        >
          <Armchair />
          Assign Table
        </button>
        <button className="waitlist-entry__icon-btn" title="Pin">
          <Pin />
        </button>
        <button className="waitlist-entry__icon-btn" title="Remove">
          <X />
        </button>
      </div>
    </div>
  );
}

export default WaitlistEntry;
