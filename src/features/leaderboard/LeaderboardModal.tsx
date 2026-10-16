import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { ArcadeButton } from '@/components/ArcadeButton';
import { LeaderboardEntry } from '@/types/game';
import { gameStorage } from '@/services/gameStorage';
import { Coins, RefreshCw } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayerId: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentPlayerId,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await gameStorage.getLeaderboard();
      setEntries(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLeaderboard();
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Global Leaderboard"
      headerVariant="teal"
      footer={
        <>
          <button
            onClick={loadLeaderboard}
            disabled={isLoading}
            className="arcade-btn arcade-btn-secondary arcade-btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={isLoading ? 'coin-icon-spin' : ''} /> Refresh
          </button>
          <ArcadeButton variant="primary" size="sm" onClick={onClose}>
            Close
          </ArcadeButton>
        </>
      }
    >
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            fontSize: '0.8rem',
            fontWeight: 800,
            color: 'var(--color-teal)',
            textTransform: 'uppercase',
            borderBottom: '2px solid var(--color-muted)',
            marginBottom: '8px',
          }}
        >
          <span>Rank & Player</span>
          <span>Coins Earned</span>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-teal)', fontWeight: 700 }}>
            Loading arcade rankings...
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-teal)' }}>
            No players ranked yet. Complete assignments to climb the leaderboard!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '55vh', overflowY: 'auto' }}>
            {entries.map((entry) => {
              const isMe = entry.player_id === currentPlayerId;
              const isTop3 = entry.rank <= 3;
              const medalColor =
                entry.rank === 1 ? '#FFD700' : entry.rank === 2 ? '#C0C0C0' : entry.rank === 3 ? '#CD7F32' : 'transparent';

              return (
                <div
                  key={`${entry.player_id}_${entry.rank}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${isMe ? 'var(--color-golden-yellow)' : 'var(--color-muted)'}`,
                    background: isMe ? '#FFFCEB' : 'var(--color-paper)',
                    boxShadow: isMe ? '0 2px 0 var(--color-orange)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Rank Badge */}
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: isTop3 ? medalColor : 'var(--color-cloud)',
                        color: isTop3 ? '#102F3A' : 'var(--color-teal)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.85rem',
                      }}
                    >
                      {entry.rank}
                    </div>

                    {/* Character Swatch Dot */}
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '4px',
                        background: entry.character_config.shirtColor,
                        border: '1.5px solid rgba(0,0,0,0.2)',
                      }}
                      title="Character Jersey Color"
                    />

                    <div>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-ink)' }}>
                        {entry.display_name} {isMe && '(You)'}
                      </span>
                    </div>
                  </div>

                  {/* Coin Count */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 900,
                      color: 'var(--color-navy)',
                      fontSize: '1rem',
                    }}
                  >
                    <Coins size={16} color="var(--color-golden-yellow)" />
                    {entry.total_coins.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div
          style={{
            marginTop: '16px',
            fontSize: '0.75rem',
            color: 'var(--color-teal)',
            textAlign: 'center',
          }}
        >
          🔒 Public leaderboard strictly shows display names and earned coins. Private emails and auth data are never exposed.
        </div>
      </div>
    </Modal>
  );
};
