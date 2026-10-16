import React from 'react';
import { ClipboardList } from 'lucide-react';

interface JobsButtonProps {
  badgeCount?: number;
  onClick: () => void;
}

export const JobsButton: React.FC<JobsButtonProps> = ({ badgeCount = 0, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="jobs-mission-btn"
      title="View Jobs & Applications"
      aria-label="View Jobs & Applications"
    >
      {/* Clipboard Icon */}
      <div className="jobs-btn-icon-wrapper">
        <ClipboardList size={22} className="jobs-btn-icon" />
      </div>

      {/* Button Text */}
      <span className="jobs-btn-text">Jobs</span>

      {/* Red Notification Badge (like the Missions button from reference) */}
      {badgeCount > 0 && (
        <span className="jobs-btn-badge" aria-label={`${badgeCount} applications`}>
          {badgeCount > 9 ? '9+' : badgeCount}
        </span>
      )}
    </button>
  );
};
