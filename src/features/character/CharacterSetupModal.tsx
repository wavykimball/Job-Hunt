import React, { useState } from 'react';
import { Modal } from '@/components/Modal';
import { ArcadeButton } from '@/components/ArcadeButton';
import { COLOR_OPTIONS } from '@/integrations/character/CharacterAppearance';
import { CharacterAppearance } from '@/types/game';
import { Check } from 'lucide-react';

interface CharacterSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAppearance: CharacterAppearance;
  onSave: (appearance: CharacterAppearance) => Promise<void>;
}

export const CharacterSetupModal: React.FC<CharacterSetupModalProps> = ({
  isOpen,
  onClose,
  currentAppearance,
  onSave,
}) => {
  const [appearance, setAppearance] = useState<CharacterAppearance>({ ...currentAppearance });
  const [activeTab, setActiveTab] = useState<'shirt' | 'trouser' | 'skin' | 'shoes' | 'accessory'>('shirt');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(appearance);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customize Character"
      headerVariant="teal"
      footer={
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
          <ArcadeButton
            variant="secondary"
            fullWidth
            size="sm"
            onClick={onClose}
            disabled={isSaving}
            style={{ justifyContent: 'center', height: '42px', minHeight: '42px', fontSize: '0.95rem' }}
          >
            Cancel
          </ArcadeButton>
          <ArcadeButton
            variant="primary"
            fullWidth
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            style={{ justifyContent: 'center', height: '42px', minHeight: '42px', fontSize: '0.95rem' }}
          >
            {isSaving ? 'Saving...' : 'Save Appearance'}
          </ArcadeButton>
        </div>
      }
    >
      <div>
        {/* Category Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '12px',
            borderBottom: '2px solid var(--color-muted)',
            marginBottom: '16px',
          }}
        >
          {(
            [
              { key: 'shirt', label: 'Jersey' },
              { key: 'trouser', label: 'Pants' },
              { key: 'skin', label: 'Skin' },
              { key: 'shoes', label: 'Sneakers' },
              { key: 'accessory', label: 'Gear' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                background: activeTab === tab.key ? 'var(--color-navy)' : 'var(--color-cloud)',
                color: activeTab === tab.key ? 'var(--color-golden-yellow)' : 'var(--color-ink)',
                transition: 'all 120ms ease',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Swatches according to active tab */}
        {activeTab === 'shirt' && (
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px', color: 'var(--color-teal)' }}>
              Select Jersey / Shirt Color:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {COLOR_OPTIONS.shirt.map((opt) => (
                <button
                  key={opt.hex}
                  onClick={() => setAppearance((prev) => ({ ...prev, shirtColor: opt.hex }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${appearance.shirtColor === opt.hex ? 'var(--color-coral)' : 'var(--color-muted)'}`,
                    background: 'var(--color-paper)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: opt.hex,
                      border: '1.5px solid rgba(0,0,0,0.2)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {appearance.shirtColor === opt.hex && <Check size={14} color="#FFF" />}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trouser' && (
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px', color: 'var(--color-teal)' }}>
              Select Pants / Trouser Color:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {COLOR_OPTIONS.trouser.map((opt) => (
                <button
                  key={opt.hex}
                  onClick={() => setAppearance((prev) => ({ ...prev, trouserColor: opt.hex }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${appearance.trouserColor === opt.hex ? 'var(--color-coral)' : 'var(--color-muted)'}`,
                    background: 'var(--color-paper)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: opt.hex,
                      border: '1.5px solid rgba(0,0,0,0.2)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {appearance.trouserColor === opt.hex && <Check size={14} color="#FFF" />}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'skin' && (
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px', color: 'var(--color-teal)' }}>
              Select Skin Tone:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {COLOR_OPTIONS.skin.map((opt) => (
                <button
                  key={opt.hex}
                  onClick={() => setAppearance((prev) => ({ ...prev, skinColor: opt.hex }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${appearance.skinColor === opt.hex ? 'var(--color-coral)' : 'var(--color-muted)'}`,
                    background: 'var(--color-paper)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: opt.hex,
                      border: '1.5px solid rgba(0,0,0,0.2)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {appearance.skinColor === opt.hex && <Check size={14} color="#FFF" />}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'shoes' && (
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px', color: 'var(--color-teal)' }}>
              Select Sneaker Shoes:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {COLOR_OPTIONS.shoes.map((opt) => (
                <button
                  key={opt.hex}
                  onClick={() => setAppearance((prev) => ({ ...prev, shoesColor: opt.hex }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${appearance.shoesColor === opt.hex ? 'var(--color-coral)' : 'var(--color-muted)'}`,
                    background: 'var(--color-paper)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: opt.hex,
                      border: '1.5px solid rgba(0,0,0,0.2)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {appearance.shoesColor === opt.hex && <Check size={14} color="#FFF" />}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'accessory' && (
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px', color: 'var(--color-teal)' }}>
              Select Headwear & Accessories:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {COLOR_OPTIONS.accessories.map((opt) => (
                <button
                  key={String(opt.id)}
                  onClick={() => setAppearance((prev) => ({ ...prev, accessoryId: opt.id }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${appearance.accessoryId === opt.id ? 'var(--color-coral)' : 'var(--color-muted)'}`,
                    background: appearance.accessoryId === opt.id ? '#FFF1F3' : 'var(--color-paper)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  {opt.label}
                  {appearance.accessoryId === opt.id && <Check size={16} color="var(--color-coral)" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
