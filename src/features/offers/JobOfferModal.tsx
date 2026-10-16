import React, { useState } from 'react';
import { Modal } from '@/components/Modal';
import { ArcadeButton } from '@/components/ArcadeButton';
import { Company, Employment } from '@/types/game';
import { Building2 } from 'lucide-react';

interface JobOfferModalProps {
  isOpen: boolean;
  offeredCompany: Company | null;
  currentEmployment: Employment | null;
  onAccept: (company: Company) => Promise<void>;
  onDecline: (company: Company) => void;
}

export const JobOfferModal: React.FC<JobOfferModalProps> = ({
  isOpen,
  offeredCompany,
  currentEmployment,
  onAccept,
  onDecline,
}) => {
  const [isAccepting, setIsAccepting] = useState(false);

  if (!isOpen || !offeredCompany) return null;

  const hasExistingActiveJob = currentEmployment && (currentEmployment.status === 'active' || currentEmployment.status === 'paused');
  const isSameCompany = currentEmployment?.company_id === offeredCompany.id;

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept(offeredCompany);
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onDecline(offeredCompany)}
      title="Official Job Offer!"
      headerVariant="coral"
      maxWidth={480}
      footer={
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
          <ArcadeButton
            variant="secondary"
            fullWidth
            size="sm"
            style={{ justifyContent: 'center', height: '42px', minHeight: '42px', fontSize: '0.95rem' }}
            onClick={() => onDecline(offeredCompany)}
            disabled={isAccepting}
          >
            Decline
          </ArcadeButton>
          <ArcadeButton
            variant="primary"
            fullWidth
            size="sm"
            style={{ justifyContent: 'center', height: '42px', minHeight: '42px', fontSize: '0.95rem' }}
            onClick={handleAccept}
            disabled={isAccepting}
          >
            {isAccepting ? 'Accepting...' : 'Accept Offer'}
          </ArcadeButton>
        </div>
      }
    >
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: offeredCompany.accent_color,
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: `0 0 20px ${offeredCompany.accent_color}66`,
          }}
        >
          <Building2 size={36} />
        </div>

        <h3 style={{ fontSize: '1.4rem', color: 'var(--color-ink)', marginBottom: '4px' }}>
          {offeredCompany.name}
        </h3>
        <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-coral)', marginBottom: '14px' }}>
          Role: {offeredCompany.role_title}
        </p>

        <p style={{ fontSize: '0.92rem', color: 'var(--color-teal)', marginBottom: '18px', lineHeight: 1.4 }}>
          Congratulations on your successful CV shot! {offeredCompany.name} reviewed your submission and wants to bring you onto the team immediately.
        </p>

        {/* Existing job switch warning if player already has an active job */}
        {hasExistingActiveJob && !isSameCompany && (
          <div
            style={{
              background: '#FFF8E6',
              border: '2px solid #FFD868',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              textAlign: 'left',
              fontSize: '0.85rem',
              color: '#8A5800',
              fontWeight: 700,
              lineHeight: 1.45,
            }}
          >
            <strong>Note on switching jobs:</strong> You currently have an active job. Accepting this offer will conclude your current job and set {offeredCompany.name} as your active employer. Your earned coins are always preserved!
          </div>
        )}
      </div>
    </Modal>
  );
};
