import './StatCard.css';

function StatCard({ label, value, icon: Icon, variant = 'total' }) {
  return (
    <div className="stat-card" id={`stat-${variant}`}>
      <div className="stat-card__content">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__value">{value}</span>
      </div>
      <div className={`stat-card__icon stat-card__icon--${variant}`}>
        <Icon />
      </div>
    </div>
  );
}

export default StatCard;
