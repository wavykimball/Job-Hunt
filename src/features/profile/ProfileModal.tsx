import React, { useState } from 'react';
import { Modal } from '@/components/Modal';
import { ArcadeButton } from '@/components/ArcadeButton';
import { Player, Employment, Application } from '@/types/game';
import { LogOut, Palette, Check } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  currentEmployment: Employment | null;
  applications: Application[];
  completedAssignmentsCount: number;
  onUpdateDisplayName: (newName: string) => Promise<void>;
  onOpenCharacterSetup: () => void;
  onSignOut: () => Promise<void>;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  player,
  currentEmployment,
  applications,
  completedAssignmentsCount,
  onUpdateDisplayName,
  onOpenCharacterSetup,
  onSignOut,
}) => {
  const [nameInput, setNameInput] = useState(player.display_name);
  const [isSavingName, setIsSavingName] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setIsSavingName(true);
    try {
      await onUpdateDisplayName(nameInput.trim());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Player Profile & Career"
      headerVariant="teal"
      footer={
        <>
          <ArcadeButton variant="danger" size="sm" onClick={onSignOut}>
            <LogOut size={16} /> Sign Out
          </ArcadeButton>
          <ArcadeButton variant="primary" size="sm" onClick={onClose}>
            Done
          </ArcadeButton>
        </>
      }
    >
      <div>
        {/* Name Edit Section */}
        <form onSubmit={handleSaveName} style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontWeight: 800,
              fontSize: '0.85rem',
              color: 'var(--color-navy)',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            Display Name:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={24}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--color-teal)',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                fontWeight: 700,
                color: 'var(--color-ink)',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isSavingName || nameInput === player.display_name}
              className="arcade-btn arcade-btn-secondary arcade-btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {saveSuccess ? <Check size={16} color="var(--color-green)" /> : 'Save'}
            </button>
          </div>
        </form>

        {/* Character Appearance Link */}
        <div
          onClick={() => {
            onClose();
            onOpenCharacterSetup();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'var(--color-cloud)',
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--color-muted)',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Palette size={20} color="var(--color-coral)" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-ink)' }}>
                Customize Character
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-teal)' }}>
                Change jersey, pants, skin, shoes & accessories
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-coral)' }}>Edit &rarr;</span>
        </div>

        {/* Career Stats Grid */}
        <h4 style={{ fontSize: '0.9rem', color: 'var(--color-navy)', textTransform: 'uppercase', marginBottom: '10px' }}>
          Career Statistics
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: '#FFFCEB', padding: '12px', borderRadius: 'var(--radius-md)', border: '1.5px solid #FFD868' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#A66E00' }}>TOTAL COINS</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--color-navy)' }}>
              {player.total_coins.toLocaleString()}
            </div>
          </div>

          <div style={{ background: 'var(--color-cloud)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-muted)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-teal)' }}>CURRENT JOB</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-ink)' }}>
              {currentEmployment ? currentEmployment.role_title : 'Unemployed'}
            </div>
          </div>

          <div style={{ background: 'var(--color-cloud)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-muted)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-teal)' }}>APPLICATIONS FILED</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--color-navy)' }}>
              {applications.length}
            </div>
          </div>

          <div style={{ background: 'var(--color-cloud)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-muted)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-teal)' }}>DELIVERABLES SHIPPED</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--color-navy)' }}>
              {completedAssignmentsCount}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
