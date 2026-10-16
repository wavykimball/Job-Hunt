import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getAuthAdapter, AuthUser } from '@/integrations/auth';
import { gameStorage } from '@/services/gameStorage';
import { SEEDED_COMPANIES } from '@/services/seedData';
import { useGameAudio } from '@/game/hooks/useGameAudio';
import { GameCanvas } from '@/game/components/GameCanvas';
import { HUD } from '@/components/HUD';
import { WelcomeScreen } from '@/features/auth/WelcomeScreen';
import { CharacterSetupModal } from '@/features/character/CharacterSetupModal';
import { HomeDashboard } from '@/features/dashboard/HomeDashboard';
import { JobHuntingMode } from '@/features/play/JobHuntingMode';
import { WorkingMode } from '@/features/play/WorkingMode';
import { JobOfferModal } from '@/features/offers/JobOfferModal';
import { LeaderboardModal } from '@/features/leaderboard/LeaderboardModal';
import { ProfileModal } from '@/features/profile/ProfileModal';
import { JobsButton } from '@/components/JobsButton';
import { JobsModal } from '@/features/jobs/JobsModal';
import {
  ActiveGameView,
  Application,
  Assignment,
  CharacterAppearance,
  Company,
  Employment,
  Player,
} from '@/types/game';
import { ShotEvaluation } from '@/game/engine/ShotEvaluator';
import { normalizeCharacterAppearance } from '@/integrations/character/CharacterAppearance';
import { getStartNgAdapter, StartNgUser, StartNgGuest } from '@/integrations/startNg';

export const App: React.FC = () => {
  const authAdapter = useMemo(() => getAuthAdapter(), []);
  const startNgAdapter = useMemo(() => getStartNgAdapter(), []);
  const audio = useGameAudio();
  const activeShotHandlerRef = useRef<((evaluation: ShotEvaluation) => void) | null>(null);

  // Authentication & Player State
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [startNgPlayer, setStartNgPlayer] = useState<StartNgUser | StartNgGuest | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Active Game View
  const [view, setView] = useState<ActiveGameView>('DASHBOARD');

  // Employment & Applications State
  const [currentEmployment, setCurrentEmployment] = useState<Employment | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Selection & 3D Stage State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(SEEDED_COMPANIES[0].id);
  const [renderMode, setRenderMode] = useState<'3d' | '2d'>('3d');

  // Modals
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isJobsModalOpen, setIsJobsModalOpen] = useState(false);
  const [pendingJobOffer, setPendingJobOffer] = useState<Company | null>(null);

  // 1a. Listen for start.ng platform user and presence (Runs cleanly once without looping)
  const startNgStyleSyncedRef = useRef(false);
  useEffect(() => {
    const checkStartNg = async () => {
      try {
        const p = await startNgAdapter.getPlatformUser();
        if (p) {
          setStartNgPlayer(p);
          // If no local session exists, sign in using start.ng user/guest name
          if (!authAdapter.getCurrentUser()) {
            await authAdapter.signIn(p.name);
          }
          // If style exists, sync it quietly once on initial connect
          if (p.style && !startNgStyleSyncedRef.current) {
            startNgStyleSyncedRef.current = true;
            const mapped = startNgAdapter.mapPlatformStyleToCharacter(p.style);
            const normalized = normalizeCharacterAppearance(mapped);
            setPlayer((prev) => {
              if (!prev) return prev;
              gameStorage.savePlayerAppearance(prev.id, normalized).catch(() => {});
              return { ...prev, character_config: normalized };
            });
          }
        }
      } catch {
        // ignore errors if not running on start.ng
      }
    };

    checkStartNg();
    window.addEventListener('visibilitychange', checkStartNg);
    window.addEventListener('focus', checkStartNg);
    return () => {
      window.removeEventListener('visibilitychange', checkStartNg);
      window.removeEventListener('focus', checkStartNg);
    };
  }, [authAdapter, startNgAdapter]);

  // 1b. Listen for Auth State Changes
  useEffect(() => {
    const unsubscribe = authAdapter.onAuthStateChange(async (state) => {
      setAuthUser(state.user);
      if (state.user) {
        try {
          const loadedPlayer = await gameStorage.getOrCreatePlayer(state.user.id, state.user.displayName);
          setPlayer(loadedPlayer);

          // Load employment & applications
          const activeEmp = await gameStorage.getActiveEmployment(loadedPlayer.id);
          setCurrentEmployment(activeEmp);

          const apps = await gameStorage.getApplications(loadedPlayer.id);
          setApplications(apps);

          if (activeEmp) {
            const tasks = await gameStorage.getAssignmentsForEmployment(activeEmp.id);
            setAssignments(tasks);
            setSelectedCompanyId(activeEmp.company_id);
          }
        } catch (err) {
          console.error('Failed to load player progress:', err);
        }
      } else {
        setPlayer(null);
        setCurrentEmployment(null);
        setApplications([]);
        setAssignments([]);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [authAdapter]);

  // Handle Sign In from Welcome Screen
  const handleSignIn = async (displayName: string) => {
    audio.playClick();
    setIsLoadingAuth(true);
    try {
      await authAdapter.signIn(displayName);
    } catch (err) {
      console.error('Sign in failed:', err);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    audio.playClick();
    setIsProfileModalOpen(false);
    await authAdapter.signOut();
    setView('DASHBOARD');
  };

  // Character Appearance Save
  const handleSaveAppearance = async (appearance: CharacterAppearance, playSound = true) => {
    if (!player) return;
    const normalized = normalizeCharacterAppearance(appearance);
    await gameStorage.savePlayerAppearance(player.id, normalized);
    setPlayer((prev) => (prev ? { ...prev, character_config: normalized } : null));
    if (playSound) {
      audio.playFanfare();
    }
  };

  // Profile Display Name Update
  const handleUpdateDisplayName = async (newName: string) => {
    if (!player) return;
    await gameStorage.updateDisplayName(player.id, newName);
    setPlayer((prev) => (prev ? { ...prev, display_name: newName } : null));
  };

  // Pause Employment
  const handlePauseEmployment = async () => {
    if (!currentEmployment) return;
    audio.playClick();
    const updated = await gameStorage.pauseEmployment(currentEmployment.id);
    if (updated) {
      setCurrentEmployment({ ...updated });
    }
  };

  // Resume Employment
  const handleResumeEmployment = async () => {
    if (!currentEmployment) return;
    audio.playClick();
    const updated = await gameStorage.resumeEmployment(currentEmployment.id);
    if (updated) {
      setCurrentEmployment({ ...updated });
    }
  };

  // Quit Employment
  const handleQuitEmployment = async () => {
    if (!currentEmployment) return;
    audio.playClick();
    await gameStorage.quitEmployment(currentEmployment.id);
    setCurrentEmployment(null);
    setAssignments([]);
    setView('DASHBOARD');
  };

  // Job Application Submitted from Court
  const handleApplicationSubmitted = async (
    company: Company,
    shotId: string,
    outcome: 'offered' | 'under_review' | 'rejected'
  ) => {
    if (!player) return;
    const app = await gameStorage.createApplication(player.id, company.id, shotId, outcome);
    setApplications((prev) => [app, ...prev]);

    if (outcome === 'offered') {
      setPendingJobOffer(company);
    }
  };

  // Accept Job Offer
  const handleAcceptJobOffer = async (company: Company) => {
    if (!player) return;
    audio.playCoinDing();
    audio.playFanfare();
    const newEmp = await gameStorage.startEmployment(player.id, company.id, company.role_title);
    setCurrentEmployment(newEmp);

    const tasks = await gameStorage.getAssignmentsForEmployment(newEmp.id);
    setAssignments(tasks);
    setSelectedCompanyId(company.id);

    setPendingJobOffer(null);
    setView('DASHBOARD');
  };

  // Decline Job Offer
  const handleDeclineJobOffer = (_company: Company) => {
    audio.playClick();
    setPendingJobOffer(null);
  };

  // Assignment Completed with Rewards
  const handleAssignmentCompleted = (assignmentId: string, newBalance: number) => {
    setPlayer((prev) => (prev ? { ...prev, total_coins: newBalance } : null));
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, status: 'completed', completed_at: new Date().toISOString() } : a))
    );
    // Sync score to start.ng leaderboard
    startNgAdapter.saveScore({
      coins: newBalance,
      deliverables: completedAssignmentsCount + 1,
      stars: player?.stars_count || 0,
    }).catch(() => {});
  };

  // Determine current employed company
  const employedCompany = useMemo(() => {
    if (!currentEmployment) return null;
    return SEEDED_COMPANIES.find((c) => c.id === currentEmployment.company_id) || null;
  }, [currentEmployment]);

  const completedAssignmentsCount = useMemo(() => {
    return assignments.filter((a) => a.status === 'completed').length;
  }, [assignments]);

  // Loading Screen
  if (isLoadingAuth) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-navy)',
          color: 'var(--color-golden-yellow)',
          fontFamily: 'var(--font-display)',
          fontSize: '1.4rem',
          fontWeight: 900,
        }}
      >
        <span className="coin-icon-spin" style={{ marginRight: 12 }}>🏀</span> Loading Job Hunt...
      </div>
    );
  }

  // Welcome Screen if not authenticated
  if (!authUser || !player) {
    return <WelcomeScreen onSignIn={handleSignIn} isLoading={isLoadingAuth} />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#FFF3D6' }}>
      {/* 3D Basketball Court Canvas (Persistent background) */}
      <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, overflow: 'hidden' }}>
        <GameCanvas
          selectedCompanyId={view === 'WORKING' && currentEmployment ? currentEmployment.company_id : selectedCompanyId}
          projectileType={view === 'WORKING' ? 'DELIVERABLE' : 'CV'}
          characterAppearance={player.character_config}
          isLocked={view === 'DASHBOARD' || Boolean(pendingJobOffer)}
          showHoops={view !== 'DASHBOARD'}
          visibleCompanyIds={view === 'WORKING' && currentEmployment ? [currentEmployment.company_id] : undefined}
          isEmployed={Boolean(currentEmployment && (currentEmployment.status === 'active' || currentEmployment.status === 'paused'))}
          onShotRelease={() => audio.playClick()}
          onShotComplete={(evaluation) => {
            activeShotHandlerRef.current?.(evaluation);
          }}
          onSelectCompany={(compId) => {
            audio.playClick();
            setSelectedCompanyId(compId);
          }}
          renderMode={renderMode}
          onRenderModeChange={setRenderMode}
        />
      </div>

      {/* Top Arcade HUD */}
      <HUD
        totalCoins={player.total_coins}
        isMuted={audio.isMuted}
        onToggleSound={audio.toggleMute}
        startNgPlayer={startNgPlayer}
        onOpenLeaderboard={() => {
          audio.playClick();
          setIsLeaderboardModalOpen(true);
        }}
        onOpenCharacterSetup={() => {
          audio.playClick();
          setIsCharacterModalOpen(true);
        }}
        onOpenProfile={() => {
          audio.playClick();
          setIsProfileModalOpen(true);
        }}
      />

      {/* Active Game View Overlays */}
      {view === 'DASHBOARD' && (
        <HomeDashboard
          playerName={player.display_name}
          totalCoins={player.total_coins}
          currentEmployment={currentEmployment}
          employedCompany={employedCompany}
          onStartJobHunting={() => {
            audio.playClick();
            setView('JOB_HUNT');
          }}
          onStartWorking={() => {
            audio.playClick();
            setView('WORKING');
          }}
          onPauseEmployment={handlePauseEmployment}
          onResumeEmployment={handleResumeEmployment}
          onQuitEmployment={handleQuitEmployment}
          onOpenCharacterSetup={() => setIsCharacterModalOpen(true)}
        />
      )}

      {view === 'JOB_HUNT' && (
        <JobHuntingMode
          selectedCompanyId={selectedCompanyId}
          onSelectCompany={(comp) => {
            audio.playClick();
            setSelectedCompanyId(comp);
          }}
          onApplicationSubmitted={handleApplicationSubmitted}
          onExitToDashboard={() => {
            audio.playClick();
            setView('DASHBOARD');
          }}
          onRegisterShotHandler={(handler) => {
            activeShotHandlerRef.current = handler;
          }}
          onPlaySwish={audio.playSwish}
          onPlayRimClank={audio.playRimClank}
          onPlayFanfare={audio.playFanfare}
        />
      )}

      {view === 'WORKING' && currentEmployment && employedCompany && (
        <WorkingMode
          playerId={player.id}
          employment={currentEmployment}
          company={employedCompany}
          assignments={assignments}
          onAssignmentCompleted={handleAssignmentCompleted}
          onExitToDashboard={() => {
            audio.playClick();
            setView('DASHBOARD');
          }}
          onApplyToOtherJobs={() => {
            audio.playClick();
            setView('JOB_HUNT');
          }}
          onTakeBreak={async () => {
            await handlePauseEmployment();
          }}
          onRegisterShotHandler={(handler) => {
            activeShotHandlerRef.current = handler;
          }}
          onPlaySwish={audio.playSwish}
          onPlayRimClank={audio.playRimClank}
          onPlayCoinDing={audio.playCoinDing}
          onPlayFanfare={audio.playFanfare}
        />
      )}

      {/* Character Customization Modal */}
      <CharacterSetupModal
        isOpen={isCharacterModalOpen}
        onClose={() => setIsCharacterModalOpen(false)}
        currentAppearance={player.character_config}
        onSave={handleSaveAppearance}
      />

      {/* Job Offer Modal */}
      <JobOfferModal
        isOpen={Boolean(pendingJobOffer)}
        offeredCompany={pendingJobOffer}
        currentEmployment={currentEmployment}
        onAccept={handleAcceptJobOffer}
        onDecline={handleDeclineJobOffer}
      />

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardModalOpen}
        onClose={() => setIsLeaderboardModalOpen(false)}
        currentPlayerId={player.id}
        isGuest={Boolean(!startNgPlayer || !('account' in startNgPlayer))}
      />

      {/* Profile & Settings Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        player={player}
        currentEmployment={currentEmployment}
        applications={applications}
        completedAssignmentsCount={completedAssignmentsCount}
        onUpdateDisplayName={handleUpdateDisplayName}
        onOpenCharacterSetup={() => setIsCharacterModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Floating Jobs Mission-style Button (Dashboard only) */}
      {view === 'DASHBOARD' && (
        <JobsButton
          badgeCount={applications.length}
          onClick={() => {
            audio.playClick();
            setIsJobsModalOpen(true);
          }}
        />
      )}

      {/* Jobs Application & History Modal */}
      <JobsModal
        isOpen={isJobsModalOpen}
        onClose={() => setIsJobsModalOpen(false)}
        applications={applications}
        currentEmployment={currentEmployment}
        onStartApplying={() => {
          audio.playClick();
          setIsJobsModalOpen(false);
          setView('JOB_HUNT');
        }}
        onViewOffer={(company) => {
          audio.playClick();
          setIsJobsModalOpen(false);
          setPendingJobOffer(company);
        }}
      />
    </div>
  );
};
