import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { ArcadeButton } from '@/components/ArcadeButton';
import { gameStorage } from '@/services/gameStorage';
import { getStartNgAdapter } from '@/integrations/startNg';
import { Coins } from 'lucide-react';

interface DisplayLeaderboardEntry {
  rank: number;
  player_id: string;
  name: string;
  color?: string;
  coins: number;
  deliverables?: number;
  isMe: boolean;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayerId: string;
  isGuest?: boolean;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentPlayerId,
  isGuest = false,
}) => {
  const [entries, setEntries] = useState<DisplayLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const startNgAdapter = getStartNgAdapter();
      const startNgEntries = await startNgAdapter.getLeaderboard(20);

      if (startNgEntries && startNgEntries.length > 0) {
        // Map official start.ng leaderboard entries
        const mapped: DisplayLeaderboardEntry[] = startNgEntries.map((e) => {
          const coins = e.stats?.coins ?? e.score ?? 0;
          const deliverables = e.stats?.deliverables;
          return {
            rank: e.rank,
            player_id: String(e.player_id),
            name: e.name,
            color: e.color || '#F23855',
            coins,
            deliverables,
            isMe: String(e.player_id) === String(currentPlayerId),
          };
        });
        setEntries(mapped);
      } else {
        // Fallback to local gameStorage if platform leaderboard has no entries yet
        const localData = await gameStorage.getLeaderboard();
        const mapped: DisplayLeaderboardEntry[] = localData.map((e) => ({
          rank: e.rank,
          player_id: e.player_id,
          name: e.display_name,
          color: e.character_config?.shirtColor || '#F23855',
          coins: e.total_coins,
          isMe: e.player_id === currentPlayerId,
        }));
        setEntries(mapped);
      }
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

  const handleStartNgSignIn = () => {
    const returnTo = encodeURIComponent(window.location.origin + window.location.pathname);
    window.location.href = `https://start.ng/?return_to=${returnTo}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Global Leaderboard"
      headerVariant="teal"
      footer={
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
          <ArcadeButton
            variant="secondary"
            fullWidth
            size="sm"
            onClick={loadLeaderboard}
            disabled={isLoading}
            style={{
              justifyContent: 'center',
              height: '42px',
              minHeight: '42px',
              fontSize: '0.95rem',
            }}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </ArcadeButton>
          <ArcadeButton
            variant="primary"
            fullWidth
            size="sm"
            style={{
              justifyContent: 'center',
              height: '42px',
              minHeight: '42px',
              fontSize: '0.95rem',
            }}
            onClick={onClose}
          >
            Close
          </ArcadeButton>
        </div>
      }
    >
      <div>
        {/* Guest Invite Banner (Following official start.ng guidelines) */}
        {isGuest && (
          <div
            style={{
              background: '#292a23',
              color: '#fffefa',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              marginBottom: '14px',
              border: '1.5px solid #d8fd71',
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.3 }}>
              <span style={{ color: '#d8fd71', fontWeight: 900 }}>⚡ Playing as Guest:</span> Sign in to claim your rank and save your scores!
            </div>
            <button
              onClick={handleStartNgSignIn}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: '#d8fd71',
                color: '#292a23',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Sign In
            </button>
          </div>
        )}

        {/* Column Headers */}
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
            No players ranked yet. Shoot hoops and complete deliverables to claim the #1 spot!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '52vh', overflowY: 'auto' }}>
            {entries.map((entry) => {
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
                    border: `2px solid ${entry.isMe ? 'var(--color-golden-yellow)' : 'var(--color-muted)'}`,
                    background: entry.isMe ? '#FFFCEB' : 'var(--color-paper)',
                    boxShadow: entry.isMe ? '0 2px 0 var(--color-orange)' : 'none',
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
                        background: entry.color || 'var(--color-coral)',
                        border: '1.5px solid rgba(0,0,0,0.2)',
                      }}
                      title="Player Color"
                    />

                    <div>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-ink)' }}>
                        {entry.name} {entry.isMe && '(You)'}
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
                    {entry.coins.toLocaleString()}
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
          🔒 Public leaderboard strictly shows character names and verified coins.
        </div>
      </div>
    </Modal>
  );
};
