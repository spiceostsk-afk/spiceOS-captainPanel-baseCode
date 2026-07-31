import { waitlistStats } from '../../data/mockData';
import './WaitlistStats.css';

const CARDS = [
  { key: 'avgWaitTime', label: 'Avg wait' },
  { key: 'busiestSection', label: 'Busiest section' },
  { key: 'seatedHourly', label: 'Seated this hour' },
];

function WaitlistStats() {
  return (
    <div className="waitlist-stats" id="waitlist-stats">
      {CARDS.map((c) => (
        <div key={c.key} className="waitlist-stats__card">
          <span className="waitlist-stats__label">{c.label}</span>
          <span className="waitlist-stats__value">{waitlistStats[c.key]}</span>
        </div>
      ))}
    </div>
  );
}

export default WaitlistStats;
