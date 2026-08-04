import { Users, MapPin, Armchair, Pin, X, Info, MessageSquare } from 'lucide-react';
import './WaitlistEntry.css';

const AMBER_AFTER = 30;
const RED_AFTER = 60;

/** "42 mins" / "1h 20m" → minutes, or null when unknown. */
function parseMinutes(time) {
  if (!time || time === '--') return null;
  const hm = /(\d+)\s*h\s*(\d+)\s*m/.exec(time);
  if (hm) return Number(hm[1]) * 60 + Number(hm[2]);
  const m = /(\d+)/.exec(time);
  return m ? Number(m[1]) : null;
}

/** The longer a party has waited, the louder the row reads. */
function waitTone(time) {
  const mins = parseMinutes(time);
  if (mins === null) return '';
  if (mins >= RED_AFTER) return 'is-critical';
  if (mins >= AMBER_AFTER) return 'is-warning';
  return '';
}

function WaitlistEntry({ entry, index, onAssign, onPin, onRemove }) {
  const isNext = entry.isNext;
  const position = index !== undefined ? index + 1 : 1;

  return (
    <div
      className={`waitlist-entry ${isNext ? 'waitlist-entry--next' : ''}`}
      id={`waitlist-entry-${entry.id}`}
    >
      <div className={`waitlist-entry__position ${isNext ? 'is-next' : ''}`}>
        <span className="waitlist-entry__position-label">Pos</span>
        <span className="waitlist-entry__position-number">{position}</span>
      </div>

      <div className="waitlist-entry__content">
        <div className="waitlist-entry__name-row">
          <span className="waitlist-entry__name">{entry?.name}</span>
          {isNext && <span className="waitlist-entry__next-badge">Next up</span>}
        </div>

        <div className="waitlist-entry__meta">
          <span className="waitlist-entry__meta-item">
            <Users size={14} />
            {entry?.people} {entry?.people === 1 ? 'guest' : 'guests'}
          </span>
          <span className={`waitlist-entry__wait ${waitTone(entry?.waitTime)}`}>
            waited {entry?.waitTime}
          </span>
          {entry?.preference && (
            <span className="waitlist-entry__meta-item">
              <MapPin size={14} />
              {entry.preference}
            </span>
          )}
        </div>

        {entry?.suggestion && (
          <div className="waitlist-entry__hint">
            <Info size={13} />
            <span>Suggested: {entry.suggestion}</span>
          </div>
        )}

        {entry?.notes && (
          <div className="waitlist-entry__hint">
            <MessageSquare size={13} />
            <span><b>Remark:</b> {entry.notes}</span>
          </div>
        )}
      </div>

      <div className="waitlist-entry__actions">
        <button
          className="waitlist-entry__assign-btn"
          onClick={() => onAssign && onAssign(entry)}
          id={`btn-assign-${entry.id}`}
        >
          <Armchair size={15} />
          Seat now
        </button>
        <button
          className={`waitlist-entry__icon-btn ${isNext ? 'is-on' : ''}`}
          title={isNext ? 'Already next up' : 'Move to front of queue'}
          onClick={() => onPin && onPin(entry)}
          disabled={isNext}
          id={`btn-pin-${entry.id}`}
        >
          <Pin size={15} />
        </button>
        <button
          className="waitlist-entry__icon-btn is-danger"
          title="Remove from waitlist"
          onClick={() => onRemove && onRemove(entry)}
          id={`btn-remove-${entry.id}`}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

export default WaitlistEntry;
