import React from 'react';
import { Trophy, Palette, Volume2, VolumeX, User as UserIcon, Coins } from 'lucide-react';
import { EmploymentStatus } from '@/types/game';

export interface HUDProps {
  totalCoins: number;
  employmentStatus?: EmploymentStatus;
  companyName?: string;
  isMuted: boolean;
  onToggleSound: () => void;
  onOpenLeaderboard: () => void;
  onOpenCharacterSetup: () => void;
  onOpenProfile: () => void;
  renderMode?: '3d' | '2d';
  onToggleRenderMode?: () => void;
  startNgPlayer?: { name: string; face?: string; account?: string } | null;
}

export const HUD: React.FC<HUDProps> = ({
  totalCoins,
  isMuted,
  onToggleSound,
  onOpenLeaderboard,
  onOpenCharacterSetup,
  onOpenProfile,
  startNgPlayer,
}) => {
  return (
    <header className="game-hud">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Coin Balance Chip */}
        <div className="coin-badge" title="Total Coins Earned">
          <Coins size={20} className="coin-icon-spin" />
          <span>{totalCoins.toLocaleString()}</span>
        </div>

        {/* start.ng Player badge if available */}
        {startNgPlayer && (
          <div
            onClick={onOpenProfile}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#292a23',
              color: '#fffefa',
              padding: '4px 10px 4px 6px',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: '1.5px solid #d8fd71',
            }}
            title={startNgPlayer.account ? `@${startNgPlayer.account}` : startNgPlayer.name}
          >
            {startNgPlayer.face ? (
              <img
                src={startNgPlayer.face}
                alt={startNgPlayer.name}
                style={{ width: 22, height: 22, borderRadius: '50%', background: '#d8fd71' }}
              />
            ) : (
              <span style={{ fontSize: '12px' }}>⚡</span>
            )}
            <span>{startNgPlayer.name}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="hud-actions">

        <button
          onClick={onToggleSound}
          className="arcade-btn arcade-btn-secondary arcade-btn-sm arcade-btn-icon"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>

        <button
          onClick={onOpenCharacterSetup}
          className="arcade-btn arcade-btn-golden arcade-btn-sm arcade-btn-icon"
          title="Customize Character Appearance"
          aria-label="Customize Character Appearance"
        >
          <Palette size={17} />
        </button>

        <button
          onClick={onOpenLeaderboard}
          className="arcade-btn arcade-btn-accent arcade-btn-sm arcade-btn-icon"
          title="Leaderboard"
          aria-label="Leaderboard"
        >
          <Trophy size={17} />
        </button>

        <button
          onClick={onOpenProfile}
          className="arcade-btn arcade-btn-secondary arcade-btn-sm arcade-btn-icon"
          title="Profile & Settings"
          aria-label="Profile & Settings"
        >
          <UserIcon size={17} />
        </button>
      </div>
    </header>
  );
};
