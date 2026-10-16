import React, { useState } from 'react';
import { DEV_PERSONAS } from '@/integrations/auth/MockAuthAdapter';
import { ArcadeButton } from '@/components/ArcadeButton';
import { ArcadeCard } from '@/components/ArcadeCard';
import { Briefcase, Sparkles, UserCheck } from 'lucide-react';

interface WelcomeScreenProps {
  onSignIn: (displayName: string) => Promise<void>;
  isLoading: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSignIn, isLoading }) => {
  const [customName, setCustomName] = useState('');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(DEV_PERSONAS[0].id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenPersona = DEV_PERSONAS.find((p) => p.id === selectedPersonaId);
    const finalName = customName.trim() || chosenPersona?.name || 'Hoops Rookie';
    onSignIn(finalName);
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #193A46 0%, #102F3A 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        overflowY: 'auto',
      }}
    >
      <ArcadeCard
        style={{
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          border: '3px solid var(--color-golden-yellow)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
        }}
      >
        {/* Arcade Title Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--color-golden-yellow)',
            color: 'var(--color-navy)',
            padding: '6px 16px',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 900,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '16px',
          }}
        >
          <Sparkles size={16} /> 3D Basketball Career Arcade
        </div>

        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 2.8rem)',
            color: 'var(--color-coral)',
            marginBottom: '8px',
            letterSpacing: '-0.02em',
          }}
        >
          JOB HUNT
        </h1>

        <p
          style={{
            fontSize: '1.05rem',
            color: 'var(--color-teal)',
            fontWeight: 700,
            marginBottom: '24px',
            lineHeight: 1.4,
          }}
        >
          Apply with your CV. Get hired. Complete work deliverables. Earn coins and rule the leaderboard.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontWeight: 800,
                fontSize: '0.85rem',
                color: 'var(--color-navy)',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              Choose a Development Persona:
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {DEV_PERSONAS.map((persona) => {
                const isSelected = selectedPersonaId === persona.id && !customName;
                return (
                  <div
                    key={persona.id}
                    onClick={() => {
                      setSelectedPersonaId(persona.id);
                      setCustomName('');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${isSelected ? 'var(--color-coral)' : 'var(--color-muted)'}`,
                      background: isSelected ? '#FFF1F3' : 'var(--color-paper)',
                      cursor: 'pointer',
                      transition: 'all 120ms ease',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--color-ink)' }}>{persona.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-teal)' }}>{persona.rolePrompt}</div>
                    </div>
                    {isSelected && <UserCheck size={18} color="var(--color-coral)" />}
                  </div>
                );
              })}
            </div>

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
              Or Enter Custom Player Name:
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Jordan Rookie"
              maxLength={24}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--color-teal)',
                fontSize: '1rem',
                fontFamily: 'inherit',
                fontWeight: 700,
                color: 'var(--color-ink)',
                outline: 'none',
              }}
            />
          </div>

          <ArcadeButton
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading}
            style={{ fontSize: '1.1rem', padding: '14px 20px', marginBottom: '12px' }}
          >
            <Briefcase size={20} />
            {isLoading ? 'Entering Arena...' : 'Play Job Hunt'}
          </ArcadeButton>

          <button
            type="button"
            onClick={() => {
              const returnTo = encodeURIComponent(window.location.origin + window.location.pathname);
              window.location.href = `https://start.ng/?return_to=${returnTo}`;
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 'var(--radius-pill)',
              border: '2px solid #292a23',
              background: '#d8fd71',
              color: '#292a23',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'transform 100ms ease',
            }}
          >
            <span>⚡</span> Sign in with start.ng
          </button>
        </form>

        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--color-muted)',
            fontSize: '0.78rem',
            color: 'var(--color-teal)',
            lineHeight: 1.4,
          }}
        >
          <strong>Standalone MVP:</strong> Runs fully decoupled from start.ng services with persistent local progress and Supabase compatibility.
        </div>
      </ArcadeCard>
    </div>
  );
};
