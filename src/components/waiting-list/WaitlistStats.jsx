import { Clock, TrendingUp, Users } from 'lucide-react';
import { waitlistStats } from '../../data/mockData';
import './WaitlistStats.css';

function WaitlistStats() {
  return (
    <div className="waitlist-stats" id="waitlist-stats">
      <div className="waitlist-stats__card">
        <div className="waitlist-stats__icon waitlist-stats__icon--time">
          <Clock />
        </div>
        <div className="waitlist-stats__info">
          <span className="waitlist-stats__label">Avg. Wait Time</span>
          <span className="waitlist-stats__value">{waitlistStats.avgWaitTime}</span>
        </div>
      </div>

      <div className="waitlist-stats__card">
        <div className="waitlist-stats__icon waitlist-stats__icon--section">
          <TrendingUp />
        </div>
        <div className="waitlist-stats__info">
          <span className="waitlist-stats__label">Busiest Section</span>
          <span className="waitlist-stats__value">{waitlistStats.busiestSection}</span>
        </div>
      </div>

      <div className="waitlist-stats__card">
        <div className="waitlist-stats__icon waitlist-stats__icon--seated">
          <Users />
        </div>
        <div className="waitlist-stats__info">
          <span className="waitlist-stats__label">Seated (Hourly)</span>
          <span className="waitlist-stats__value">{waitlistStats.seatedHourly}</span>
        </div>
      </div>
    </div>
  );
}

export default WaitlistStats;
