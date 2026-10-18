import React from 'react';
import { Briefcase, ClipboardList } from 'lucide-react';

interface JobsButtonProps {
  badgeCount?: number;
  isEmployed?: boolean;
  onClick: () => void;
}

export const JobsButton: React.FC<JobsButtonProps> = ({ badgeCount = 0, isEmployed = false, onClick }) => {
  const displayLabel = isEmployed ? 'Apply to Other Jobs' : 'Jobs';
  const shortLabel = isEmployed ? 'Other Jobs' : 'Jobs';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`jobs-mission-btn ${isEmployed ? 'employed-jobs-btn' : ''}`}
      title={displayLabel}
      aria-label={displayLabel}
    >
      {/* Icon */}
      <div className="jobs-btn-icon-wrapper">
        {isEmployed ? (
          <Briefcase size={22} className="jobs-btn-icon" />
        ) : (
          <ClipboardList size={22} className="jobs-btn-icon" />
        )}
      </div>

      {/* Button Text */}
      <span className="jobs-btn-text">
        <span className="nav-btn-text-full">{displayLabel}</span>
        <span className="nav-btn-text-short">{shortLabel}</span>
      </span>

      {/* Red Notification Badge */}
      {badgeCount > 0 && (
        <span className="jobs-btn-badge" aria-label={`${badgeCount} applications`}>
          {badgeCount > 9 ? '9+' : badgeCount}
        </span>
      )}
    </button>
  );
};

