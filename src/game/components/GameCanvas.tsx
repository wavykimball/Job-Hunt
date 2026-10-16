import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CourtScene, ThrownObjectType } from '../engine/CourtScene';
import { ShotEvaluation } from '../engine/ShotEvaluator';
import { CharacterAppearance } from '@/types/game';
import { ArcadeCourt2D } from './ArcadeCourt2D';

interface GameCanvasProps {
  selectedCompanyId: string;
  projectileType: ThrownObjectType;
  characterAppearance: CharacterAppearance;
  isLocked?: boolean;
  showHoops?: boolean;
  isEmployed?: boolean;
  visibleCompanyIds?: string[];
  onShotRelease?: () => void;
  onShotComplete: (evaluation: ShotEvaluation) => void;
  onResetReady?: () => void;
  onSelectCompany?: (companyId: string) => void;
  renderMode?: '3d' | '2d';
  onRenderModeChange?: (mode: '3d' | '2d') => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  selectedCompanyId,
  projectileType,
  characterAppearance,
  isLocked = false,
  showHoops = true,
  isEmployed = false,
  visibleCompanyIds,
  onShotRelease,
  onShotComplete,
  onResetReady,
  onSelectCompany,
  renderMode: controlledRenderMode,
  onRenderModeChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CourtScene | null>(null);

  const [internalRenderMode, setInternalRenderMode] = useState<'3d' | '2d'>('3d');
  const activeRenderMode = controlledRenderMode ?? internalRenderMode;

  const [webGLError, setWebGLError] = useState<string | null>(null);

  const [isAiming, setIsAiming] = useState(false);
  const [dragOffset, setDragOffset] = useState({ dx: 0, dy: 0 });
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const switchMode = useCallback(
    (mode: '3d' | '2d') => {
      if (onRenderModeChange) {
        onRenderModeChange(mode);
      } else {
        setInternalRenderMode(mode);
      }
    },
    [onRenderModeChange]
  );

  // Initialize Three.js 3D scene when renderMode is '3d'
  useEffect(() => {
    if (activeRenderMode !== '3d' || !containerRef.current) return;

    try {
      const scene = new CourtScene(containerRef.current, characterAppearance);
      sceneRef.current = scene;
      scene.selectCompany(selectedCompanyId);
      scene.createProjectileMesh(projectileType);
      scene.setHoopsVisible(showHoops);
      scene.setVisibleCompanyIds(visibleCompanyIds);
      scene.setSuitcaseVisible(isEmployed);

      // Force immediate resize & deferred layout updates
      scene.handleResize();
      const rafId = requestAnimationFrame(() => scene.handleResize());
      const timeoutId = setTimeout(() => scene.handleResize(), 80);

      // Listen to element layout changes
      const resizeObserver = new ResizeObserver(() => {
        scene.handleResize();
      });
      resizeObserver.observe(containerRef.current);

      const handleResize = () => scene.handleResize();
      window.addEventListener('resize', handleResize);

      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timeoutId);
        resizeObserver.disconnect();
        window.removeEventListener('resize', handleResize);
        scene.destroy();
        sceneRef.current = null;
      };
    } catch (err: unknown) {
      console.warn('WebGL 3D CourtScene could not initialize, falling back to Arcade 2D Court:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setWebGLError(errMsg);
      switchMode('2d');
    }
  }, [activeRenderMode, switchMode]);

  // Update selected company in 3D
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.selectCompany(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  // Update projectile type in 3D (CV vs Deliverable)
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.createProjectileMesh(projectileType);
      sceneRef.current.resetProjectileToHand();
    }
  }, [projectileType]);

  // Update character appearance in 3D
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.character.updateAppearance(characterAppearance);
    }
  }, [characterAppearance]);

  // Update hoops visibility in 3D
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setHoopsVisible(showHoops);
    }
  }, [showHoops]);

  // Update visible company hoops in 3D
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setVisibleCompanyIds(visibleCompanyIds);
    }
  }, [visibleCompanyIds]);

  // Update suitcase visibility in 3D
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setSuitcaseVisible(isEmployed);
    }
  }, [isEmployed]);

  // Pointer / Touch aiming interactions for 3D
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isLocked || !sceneRef.current) return;

      // Check if user clicked/tapped directly on a company hoop in 3D (when hoops are visible)
      if (showHoops && onSelectCompany) {
        const clickedCompId = sceneRef.current.checkHoopClick(e.clientX, e.clientY);
        if (clickedCompId) {
          onSelectCompany(clickedCompId);
          return; // Tapped on a board -> select it, don't throw!
        }
      }

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      setIsAiming(true);
      setDragOffset({ dx: 0, dy: 0 });
    },
    [isLocked, onSelectCompany, showHoops]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isAiming || !dragStartRef.current || !sceneRef.current) return;

      const rawDx = (e.clientX - dragStartRef.current.x) / 180;
      const rawDy = (dragStartRef.current.y - e.clientY) / 180;

      // Clamp values
      const dx = Math.max(-0.9, Math.min(0.9, rawDx));
      const dy = Math.max(0.05, Math.min(1.2, rawDy + 0.45));

      setDragOffset({ dx, dy });
      sceneRef.current.updateAiming(dx, dy);
    },
    [isAiming]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isAiming || !sceneRef.current) return;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      setIsAiming(false);
      dragStartRef.current = null;

      if (onShotRelease) {
        onShotRelease();
      }

      sceneRef.current.throwObject(dragOffset.dx, dragOffset.dy, (evaluation) => {
        onShotComplete(evaluation);
      });
    },
    [isAiming, dragOffset, onShotRelease, onShotComplete]
  );

  // If activeRenderMode is '2d' (either manual or automatic fallback)
  if (activeRenderMode === '2d') {
    return (
      <ArcadeCourt2D
        selectedCompanyId={selectedCompanyId}
        projectileType={projectileType}
        characterAppearance={characterAppearance}
        isLocked={isLocked}
        showHoops={showHoops}
        isEmployed={isEmployed}
        visibleCompanyIds={visibleCompanyIds}
        onShotRelease={onShotRelease}
        onShotComplete={onShotComplete}
        onResetReady={onResetReady}
        onSelectCompany={onSelectCompany}
        onSwitchTo3D={() => switchMode('3d')}
        webGLUnavailableMessage={webGLError}
      />
    );
  }

  // Otherwise render 3D Court Scene
  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        setIsAiming(false);
        if (sceneRef.current) {
          sceneRef.current.hideTrajectoryPreview();
          sceneRef.current.resetProjectileToHand();
        }
      }}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        touchAction: 'none',
        cursor: isLocked ? 'default' : isAiming ? 'grabbing' : 'grab',
      }}
    >
      {/* Aiming power HUD indicator when dragging in 3D */}
      {isAiming && (
        <div
          style={{
            position: 'absolute',
            bottom: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            zIndex: 40,
          }}
        >
          <div
            style={{
              background: 'rgba(25, 58, 70, 0.9)',
              color: 'var(--color-paper)',
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              fontWeight: 800,
              fontSize: '0.9rem',
              border: '2px solid var(--color-golden-yellow)',
            }}
          >
            Power: {Math.round(dragOffset.dy * 100)}%
          </div>
          <div
            style={{
              width: '140px',
              height: '10px',
              background: 'rgba(255,255,255,0.3)',
              borderRadius: 'var(--radius-pill)',
              overflow: 'hidden',
              border: '1.5px solid var(--color-navy)',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(10, dragOffset.dy * 90))}%`,
                height: '100%',
                background:
                  dragOffset.dy > 0.8
                    ? 'var(--color-coral)'
                    : dragOffset.dy > 0.4
                    ? 'var(--color-golden-yellow)'
                    : 'var(--color-cyan)',
                borderRadius: 'var(--radius-pill)',
                transition: 'width 60ms linear',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
