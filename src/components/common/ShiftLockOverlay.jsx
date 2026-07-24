import React from 'react';
import { Play, Lock } from 'lucide-react';
import { useRestaurant } from '../../context/useRestaurant';
import './ShiftLockOverlay.css';

function ShiftLockOverlay() {
  const { startShift } = useRestaurant();

  return (
    <div className="shift-lock-overlay" id="shift-lock-overlay">
      <div className="shift-lock-card">
        <div className="shift-lock-icon">
          <Lock size={32} />
        </div>
        <h2>Shift is Inactive</h2>
        <p>
          To access table dashboards, waitlists, customer simulator, and active order features, please start your shift.
        </p>
        <button 
          className="start-shift-btn" 
          onClick={startShift}
          id="btn-overlay-start-shift"
        >
          <Play size={18} fill="currentColor" />
          <span>Start Shift</span>
        </button>
      </div>
    </div>
  );
}

export default ShiftLockOverlay;
