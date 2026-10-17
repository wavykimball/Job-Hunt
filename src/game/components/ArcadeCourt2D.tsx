import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ThrownObjectType } from '../engine/CourtScene';
import { ShotEvaluation, ShotEvaluator } from '../engine/ShotEvaluator';
import { CharacterAppearance } from '@/types/game';
import { SEEDED_COMPANIES } from '@/services/seedData';
import { normalizeCharacterAppearance } from '@/integrations/character/CharacterAppearance';

interface ArcadeCourt2DProps {
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
  onSwitchTo3D?: () => void;
  webGLUnavailableMessage?: string | null;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

export const ArcadeCourt2D: React.FC<ArcadeCourt2DProps> = ({
  selectedCompanyId,
  projectileType,
  characterAppearance,
  isLocked = false,
  showHoops = true,
  isEmployed = false,
  visibleCompanyIds,
  onShotRelease,
  onShotComplete,
  onSelectCompany,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Normalized appearance
  const config = normalizeCharacterAppearance(characterAppearance);

  // Interaction State
  const [isAiming, setIsAiming] = useState(false);
  const [dragOffset, setDragOffset] = useState({ dx: 0, dy: 0 });
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Animation & Projectile state
  const stateRef = useRef({
    animTimer: 0,
    characterState: 'idle' as 'idle' | 'aiming' | 'throw' | 'celebrate' | 'disappointed',
    isThrowing: false,
    throwElapsed: 0,
    flightDuration: 1.0,
    projX: 0,
    projY: 0,
    projRot: 0,
    particles: [] as Particle[],
  });

  // Calculate court layout dimensions relative to canvas size
  const getLayout = useCallback((w: number, h: number) => {
    const isMobile = w < 640;

    // Filter hoops by visibleCompanyIds if provided (e.g. single hoop in working mode)
    const filteredCompanies = visibleCompanyIds && visibleCompanyIds.length > 0
      ? SEEDED_COMPANIES.filter((c) => visibleCompanyIds.includes(c.id))
      : SEEDED_COMPANIES;

    const hoopY = h * (isMobile ? 0.32 : 0.30);
    const count = filteredCompanies.length;
    const hoops = filteredCompanies.map((c, i) => {
      // If only 1 hoop is visible (employed deliverable mode), center it directly on court
      const x = count === 1 ? w * 0.5 : (w / (count + 1)) * (i + 1);
      return {
        company: c,
        x,
        y: hoopY,
        isSelected: count === 1 ? true : c.id === selectedCompanyId,
      };
    });

    // Character position standing at bottom center
    const charX = w * 0.5;
    const charY = h * (isMobile ? 0.74 : 0.76);
    const charScale = isMobile ? 0.8 : 1.0;

    // Hand launch position
    const handX = charX + 28 * charScale;
    const handY = charY - 60 * charScale;

    // Responsive hoop dimensions so boards never overlap on mobile
    const bbW = isMobile ? Math.min(84, Math.max(54, w * 0.20)) : 100;
    const bbH = Math.round(bbW * 0.68);
    const badgeW = Math.round(bbW * 1.12);
    const badgeH = isMobile ? 24 : 34;
    const rimRadiusX = isMobile ? Math.round(bbW * 0.27) : 26;
    const rimRadiusY = Math.max(5, Math.round(rimRadiusX * 0.32));
    const netHeight = isMobile ? 32 : 44;

    return {
      hoops,
      charX,
      charY,
      charScale,
      handX,
      handY,
      isMobile,
      bbW,
      bbH,
      badgeW,
      badgeH,
      rimRadiusX,
      rimRadiusY,
      netHeight,
    };
  }, [selectedCompanyId, visibleCompanyIds]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (now: number) => {
      animFrameRef.current = requestAnimationFrame(render);
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;

      const state = stateRef.current;
      state.animTimer += delta;

      const layout = getLayout(w, h);
      const {
        hoops,
        charX,
        charY,
        charScale,
        handX,
        handY,
        isMobile,
        bbW,
        bbH,
        badgeW,
        badgeH,
        rimRadiusX,
        rimRadiusY,
        netHeight,
      } = layout;

      const targetHoop = hoops.find((hp) => hp.isSelected) || hoops[0];

      // 1. Clear background & draw sunset sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
      skyGrad.addColorStop(0, '#FFEAC2');
      skyGrad.addColorStop(0.55, '#FFD89B');
      skyGrad.addColorStop(1, '#FFC371');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Arena Stadium Back Wall (runs plain and clean from left to right)
      const wallTop = h * 0.20;
      const wallBottom = h * 0.50;
      const wallHeight = wallBottom - wallTop;

      const wallGrad = ctx.createLinearGradient(0, wallTop, 0, wallBottom);
      wallGrad.addColorStop(0, '#193A46');
      wallGrad.addColorStop(0.5, '#14313B');
      wallGrad.addColorStop(1, '#0F262E');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, wallTop, w, wallHeight);

      // Top golden accent runner
      ctx.fillStyle = '#FFE85A';
      ctx.fillRect(0, wallTop - 3, w, 3);

      // Stadium padded bumper line above hardwood
      ctx.fillStyle = '#08BFE8';
      ctx.fillRect(0, wallBottom - 5, w, 5);

      // 3. Hardwood Basketball Court
      const courtGrad = ctx.createLinearGradient(0, h * 0.48, 0, h);
      courtGrad.addColorStop(0, '#E09B52');
      courtGrad.addColorStop(1, '#C97D32');
      ctx.fillStyle = courtGrad;

      ctx.beginPath();
      ctx.moveTo(0, h * 0.50);
      ctx.lineTo(w, h * 0.50);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Court Planks lines
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1.5;
      for (let y = h * 0.50; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Court painted baseline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = isMobile ? 2 : 3;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.50);
      ctx.lineTo(w, h * 0.50);
      ctx.stroke();

      // Target hoop glowing ring on court (when hoops are visible)
      if (showHoops) {
        hoops.forEach((hp) => {
          if (hp.isSelected) {
            const pulse = 1.0 + Math.sin(state.animTimer * 4) * 0.12;
            ctx.save();
            ctx.strokeStyle = hp.company.accent_color;
            ctx.lineWidth = isMobile ? 3 : 4;
            ctx.shadowColor = hp.company.accent_color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.ellipse(hp.x, h * 0.56, (isMobile ? 32 : 42) * pulse, (isMobile ? 10 : 14) * pulse, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        });
      }

      // Free throw circle near character
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.ellipse(charX, charY + 20, isMobile ? 55 : 75, isMobile ? 18 : 24, 0, 0, Math.PI * 2);
      ctx.stroke();

      if (!showHoops) {
        // 4. LARGE "JOB HUNT" TEXT IN THE MIDDLE (Homepage View)
        ctx.save();
        const wallCenterY = (wallTop + wallBottom) * 0.5;
        const titleY = wallCenterY - (isMobile ? 12 : 16);
        const titleSize = isMobile ? Math.min(50, Math.max(32, w * 0.12)) : Math.min(92, Math.max(58, w * 0.08));

        ctx.font = `900 ${titleSize}px Nunito, "Arial Black", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 3D Shadow Layers
        const shadowDepth = isMobile ? 6 : 9;
        for (let s = shadowDepth; s >= 1; s--) {
          ctx.fillStyle = '#0A1D24';
          ctx.fillText('JOB HUNT', w * 0.5, titleY + s);
        }

        // Bold Outer Border
        ctx.strokeStyle = '#0A1D24';
        ctx.lineWidth = isMobile ? 8 : 14;
        ctx.lineJoin = 'round';
        ctx.strokeText('JOB HUNT', w * 0.5, titleY);

        // Golden Sunrise Gradient
        const textGrad = ctx.createLinearGradient(0, titleY - titleSize * 0.5, 0, titleY + titleSize * 0.5);
        textGrad.addColorStop(0, '#FFF59D');
        textGrad.addColorStop(0.45, '#FFC629');
        textGrad.addColorStop(1, '#FF7A00');
        ctx.fillStyle = textGrad;
        ctx.fillText('JOB HUNT', w * 0.5, titleY);

        // Subtle Top Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillText('JOB HUNT', w * 0.5, titleY - 2);

        // Subtitle badge in accessible high-contrast golden yellow with dark shadow
        const subSize = isMobile ? 12 : 16;
        const subY = titleY + titleSize * 0.62;
        ctx.font = `800 ${subSize}px Nunito, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // High contrast shadow
        ctx.fillStyle = '#0A1D24';
        ctx.fillText('★ 3D BASKETBALL CAREER ARCADE ★', w * 0.5, subY + 2);

        // Accessible bright golden yellow text (WCAG AAA)
        ctx.fillStyle = '#FFE85A';
        ctx.fillText('★ 3D BASKETBALL CAREER ARCADE ★', w * 0.5, subY);

        ctx.restore();
      } else {
        // 4. Render All 4 Hoops (Posts, Backboard, Rim, and Visible Net)
        hoops.forEach((hp) => {
          const { company, x, y, isSelected } = hp;

          // Post
          ctx.fillStyle = '#102F3A';
          const postW = isMobile ? 6 : 10;
          ctx.fillRect(x - postW / 2, y, postW, h * 0.55 - y);

          // Backboard
          const bbX = x - bbW / 2;
          const bbY = y - bbH;

          ctx.fillStyle = isSelected ? '#FFFFFF' : '#F0F5F7';
          ctx.strokeStyle = isSelected ? company.accent_color : '#102F3A';
          ctx.lineWidth = isSelected ? (isMobile ? 2.5 : 3.5) : 2;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(bbX, bbY, bbW, bbH, isMobile ? 6 : 8) : ctx.rect(bbX, bbY, bbW, bbH);
          ctx.fill();
          ctx.stroke();

          // Inner target square
          ctx.strokeStyle = company.accent_color;
          ctx.lineWidth = isMobile ? 2 : 2.5;
          const sqW = bbW * 0.44;
          const sqH = bbH * 0.50;
          ctx.strokeRect(x - sqW / 2, bbY + (bbH - sqH) * 0.7, sqW, sqH);

          // Company Billboard Banner above backboard
          const badgeX = x - badgeW / 2;
          const badgeY = bbY - badgeH - 4;

          ctx.fillStyle = isSelected ? '#193A46' : '#2A4A57';
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 5) : ctx.rect(badgeX, badgeY, badgeW, badgeH);
          ctx.fill();

          // Banner accent stripe
          ctx.fillStyle = company.accent_color;
          ctx.fillRect(badgeX + 3, badgeY + badgeH - 3, badgeW - 6, isMobile ? 2 : 3);

          // Company Name text
          ctx.fillStyle = '#FFFFFF';
          ctx.font = isMobile ? 'bold 9.5px Nunito, sans-serif' : 'bold 12px Nunito, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(company.name, x, badgeY + (isMobile ? 11 : 15));

          // Role title text
          ctx.fillStyle = company.accent_color;
          ctx.font = isMobile ? 'bold 7.5px Nunito, sans-serif' : 'bold 10px Nunito, sans-serif';
          ctx.fillText(company.role_title, x, badgeY + (isMobile ? 20 : 27));

          // RIM (Orange/Accent, elliptical perspective)
          const rimY = y;
          ctx.strokeStyle = '#FF6B4A';
          ctx.lineWidth = isMobile ? 3 : 4;
          ctx.beginPath();
          ctx.ellipse(x, rimY, rimRadiusX, rimRadiusY, 0, 0, Math.PI * 2);
          ctx.stroke();

          // BRIGHT WHITE NET (Clear cross-hatched lines hanging from rim)
          const netTopY = rimY + 2;
          const netBottomY = rimY + netHeight;
          const netBottomRadiusX = Math.round(rimRadiusX * 0.55);

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = isMobile ? 1.4 : 1.8;
          ctx.beginPath();

          // Outer net boundaries
          ctx.moveTo(x - rimRadiusX + 2, netTopY);
          ctx.lineTo(x - netBottomRadiusX, netBottomY);
          ctx.moveTo(x + rimRadiusX - 2, netTopY);
          ctx.lineTo(x + netBottomRadiusX, netBottomY);

          // Bottom opening loop
          ctx.ellipse(x, netBottomY, netBottomRadiusX, isMobile ? 3 : 4, 0, 0, Math.PI * 2);

          // Criss-cross netting strands
          const strandCount = isMobile ? 5 : 7;
          for (let s = 0; s <= strandCount; s++) {
            const t = s / strandCount;
            const topX = (x - rimRadiusX + 2) + t * (rimRadiusX * 2 - 4);
            const botX = (x - netBottomRadiusX) + (1 - t) * (netBottomRadiusX * 2);
            ctx.moveTo(topX, netTopY);
            ctx.lineTo(botX, netBottomY);

            // Reverse diagonal
            const botX2 = (x - netBottomRadiusX) + t * (netBottomRadiusX * 2);
            ctx.moveTo(topX, netTopY);
            ctx.lineTo(botX2, netBottomY);
          }
          ctx.stroke();

          // Selected indicator arrow above board
          if (isSelected) {
            ctx.fillStyle = company.accent_color;
            ctx.beginPath();
            ctx.moveTo(x - 7, badgeY - 12);
            ctx.lineTo(x + 7, badgeY - 12);
            ctx.lineTo(x, badgeY - 4);
            ctx.closePath();
            ctx.fill();
          }
        });
      }

      // 5. Aiming Trajectory Dots
      if (isAiming) {
        ctx.save();
        const aimDx = dragOffset.dx;
        const aimDy = dragOffset.dy;

        const targetX = targetHoop.x + aimDx * (isMobile ? 60 : 80);
        const targetY = targetHoop.y - (aimDy - 0.5) * (isMobile ? 40 : 50);

        const dotCount = 18;
        for (let i = 1; i <= dotCount; i++) {
          const t = i / dotCount;
          const px = handX + (targetX - handX) * t;
          const arcLift = Math.sin(t * Math.PI) * (140 * aimDy * charScale);
          const py = handY + (targetY - handY) * t - arcLift;

          ctx.fillStyle = '#FFE85A';
          ctx.shadowColor = '#FFC629';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(2, (isMobile ? 5 : 6) * (1 - t * 0.4)), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 6. Projectile in Flight
      if (state.isThrowing) {
        state.throwElapsed += delta;
        const t = Math.min(1.0, state.throwElapsed / state.flightDuration);

        const targetX = targetHoop.x + dragOffset.dx * (isMobile ? 60 : 80);
        const targetY = targetHoop.y;
        const arcLift = Math.sin(t * Math.PI) * (150 * dragOffset.dy * charScale);

        state.projX = handX + (targetX - handX) * t;
        state.projY = handY + (targetY - handY) * t - arcLift;
        state.projRot += delta * 8;

        ctx.save();
        ctx.translate(state.projX, state.projY);
        ctx.rotate(state.projRot);
        ctx.scale(charScale, charScale);

        if (projectileType === 'CV') {
          // Stylized CV Document
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#102F3A';
          ctx.lineWidth = 1.5;
          ctx.fillRect(-16, -22, 32, 44);
          ctx.strokeRect(-16, -22, 32, 44);

          // Blue text lines
          ctx.fillStyle = '#08BFE8';
          ctx.fillRect(-10, -14, 20, 3);
          ctx.fillRect(-10, -7, 16, 3);
          ctx.fillRect(-10, 0, 18, 3);
          ctx.fillRect(-10, 7, 12, 3);

          // Golden Seal
          ctx.fillStyle = '#FFC629';
          ctx.beginPath();
          ctx.arc(6, 12, 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Deliverable crate
          ctx.fillStyle = '#39CF61';
          ctx.strokeStyle = '#102F3A';
          ctx.lineWidth = 2;
          ctx.fillRect(-18, -18, 36, 36);
          ctx.strokeRect(-18, -18, 36, 36);

          // Gold band
          ctx.fillStyle = '#FFE85A';
          ctx.fillRect(-18, -4, 36, 8);
        }
        ctx.restore();

        // Check Arrival at Hoop
        if (t >= 1.0) {
          state.isThrowing = false;

          // Normalized offset relative to rim radius
          const landingOffsetPixels = Math.abs(state.projX - targetHoop.x);
          const normalizedOffset = (landingOffsetPixels / rimRadiusX) * 0.55;
          const fakeImpactPos = new THREE.Vector3(normalizedOffset, 2.5, -4.5);
          const fakeHoopPos = new THREE.Vector3(0, 2.5, -4.5);
          const evaluation = ShotEvaluator.evaluate(fakeImpactPos, fakeHoopPos, 0.55);

          if (evaluation.success) {
            state.characterState = 'celebrate';
            for (let i = 0; i < 35; i++) {
              state.particles.push({
                x: targetHoop.x,
                y: targetHoop.y,
                vx: (Math.random() - 0.5) * 320,
                vy: (Math.random() - 0.8) * 280,
                color: ['#FFC629', '#08BFE8', '#39CF61', '#FF6B4A'][Math.floor(Math.random() * 4)],
                alpha: 1.0,
                size: Math.random() * 6 + 3,
              });
            }
          } else {
            state.characterState = 'disappointed';
          }

          onShotComplete(evaluation);
        }
      }

      // 7. Swish Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.vy += 450 * delta;
        p.alpha -= delta * 1.2;

        if (p.alpha <= 0) {
          state.particles.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 8. RENDER CUSTOMIZED CHARACTER (Standing at Free Throw Line)
      ctx.save();
      ctx.translate(charX, charY);
      ctx.scale(charScale, charScale);

      const charHop = state.characterState === 'celebrate' ? Math.abs(Math.sin(state.animTimer * 8)) * 26 : 0;
      const breath = Math.sin(state.animTimer * 3) * 3;
      const cY = -charHop;

      // Drop shadow under feet
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, 12, 38, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shoes
      ctx.fillStyle = config.shoesColor;
      ctx.fillRect(-24, cY + 4, 18, 12);
      ctx.fillRect(6, cY + 4, 18, 12);

      // Trousers
      ctx.fillStyle = config.trouserColor;
      ctx.fillRect(-22, cY - 32, 16, 38);
      ctx.fillRect(6, cY - 32, 16, 38);

      // Torso / Shirt
      ctx.fillStyle = config.shirtColor;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-28, cY - 82 + breath, 56, 52, 8) : ctx.rect(-28, cY - 82 + breath, 56, 52);
      ctx.fill();

      // Head & Face
      const headY = cY - 126 + breath;
      ctx.fillStyle = config.skinColor;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-22, headY, 44, 44, 10) : ctx.rect(-22, headY, 44, 44);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#102F3A';
      ctx.fillRect(-12, headY + 16, 6, 6);
      ctx.fillRect(6, headY + 16, 6, 6);

      // Smile / Expression
      ctx.strokeStyle = '#C92C47';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (state.characterState === 'disappointed') {
        ctx.arc(0, headY + 34, 8, Math.PI, 0);
      } else {
        ctx.arc(0, headY + 26, 8, 0, Math.PI);
      }
      ctx.stroke();

      // Accessory
      if (config.accessoryId === 'headband') {
        ctx.fillStyle = '#FFE85A';
        ctx.fillRect(-24, headY + 8, 48, 8);
      } else if (config.accessoryId === 'cap') {
        ctx.fillStyle = '#08BFE8';
        ctx.fillRect(-24, headY - 4, 48, 14);
        ctx.fillRect(-24, headY + 4, 60, 6);
      } else if (config.accessoryId === 'glasses') {
        ctx.strokeStyle = '#102F3A';
        ctx.lineWidth = 2;
        ctx.strokeRect(-16, headY + 12, 12, 10);
        ctx.strokeRect(4, headY + 12, 12, 10);
        ctx.beginPath();
        ctx.moveTo(-4, headY + 17);
        ctx.lineTo(4, headY + 17);
        ctx.stroke();
      }

      // Arms & Hands
      ctx.fillStyle = config.shirtColor;
      if (state.characterState === 'celebrate') {
        ctx.fillRect(-38, cY - 100, 12, 40);
        ctx.fillRect(26, cY - 100, 12, 40);
        ctx.fillStyle = config.skinColor;
        ctx.beginPath();
        ctx.arc(-32, cY - 104, 7, 0, Math.PI * 2);
        ctx.arc(32, cY - 104, 7, 0, Math.PI * 2);
        ctx.fill();
      } else if (isAiming) {
        ctx.fillRect(-38, cY - 76, 12, 38);
        ctx.fillRect(22, cY - 84, 14, 30);
        ctx.fillStyle = config.skinColor;
        ctx.beginPath();
        ctx.arc(28, -50, 8, 0, Math.PI * 2);
        ctx.fill();

        // Projectile in hand ready to shoot
        if (projectileType === 'CV') {
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#102F3A';
          ctx.lineWidth = 1.5;
          ctx.fillRect(20, -72, 22, 28);
          ctx.strokeRect(20, -72, 22, 28);
          ctx.fillStyle = '#FFC629';
          ctx.beginPath();
          ctx.arc(34, -54, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#39CF61';
          ctx.strokeStyle = '#102F3A';
          ctx.lineWidth = 1.5;
          ctx.fillRect(18, -72, 24, 24);
          ctx.strokeRect(18, -72, 24, 24);
        }
      } else {
        // Idle relaxed arms
        ctx.fillRect(-38, cY - 78 + breath, 12, 38);
        ctx.fillRect(26, cY - 78 + breath, 12, 38);
        ctx.fillStyle = config.skinColor;
        ctx.beginPath();
        ctx.arc(-32, cY - 38 + breath, 7, 0, Math.PI * 2);
        ctx.arc(32, cY - 38 + breath, 7, 0, Math.PI * 2);
        ctx.fill();

        if (!state.isThrowing) {
          if (projectileType === 'CV') {
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#102F3A';
            ctx.lineWidth = 1;
            ctx.fillRect(26, cY - 48 + breath, 18, 22);
            ctx.strokeRect(26, cY - 48 + breath, 18, 22);
          } else {
            ctx.fillStyle = '#39CF61';
            ctx.strokeStyle = '#102F3A';
            ctx.lineWidth = 1;
            ctx.fillRect(24, cY - 48 + breath, 20, 20);
            ctx.strokeRect(24, cY - 48 + breath, 20, 20);
          }
        }
        if (isEmployed) {
          // Draw small cute suitcase on the floor beside character
          const caseX = 34;
          const caseY = cY + 4; // on ground level

          // Suitcase shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
          ctx.beginPath();
          ctx.ellipse(caseX + 11, caseY + 12, 16, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Suitcase Body (Rich classic leather brown)
          ctx.fillStyle = '#8B4513';
          ctx.strokeStyle = '#53290B';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(caseX, caseY - 14, 22, 16, 3) : ctx.rect(caseX, caseY - 14, 22, 16);
          ctx.fill();
          ctx.stroke();

          // Leather straps / corners
          ctx.fillStyle = '#5A2D0C';
          ctx.fillRect(caseX + 2, caseY - 14, 4, 16);
          ctx.fillRect(caseX + 16, caseY - 14, 4, 16);

          // Golden latches / buckles
          ctx.fillStyle = '#FFC629';
          ctx.fillRect(caseX + 3, caseY - 8, 3, 4);
          ctx.fillRect(caseX + 16, caseY - 8, 3, 4);

          // Top Handle
          ctx.strokeStyle = '#3D1D07';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(caseX + 11, caseY - 14, 4, Math.PI, 0);
          ctx.stroke();
        }
      }
      ctx.restore();
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [config, isAiming, dragOffset, projectileType, selectedCompanyId, getLayout, onShotComplete, showHoops, isEmployed]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width || window.innerWidth;
      canvas.height = rect.height || 600;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pointer interactions: Board selection on tap, Aim & Drag on court
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isLocked || stateRef.current.isThrowing) return;

    // Check if clicked directly on any company backboard or hoop (when hoops are visible)
    const canvas = canvasRef.current;
    if (showHoops && canvas && onSelectCompany) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      const { hoops, bbW, bbH, badgeH } = getLayout(canvas.width, canvas.height);
      const clickedHoop = hoops.find((hp) => {
        const dx = Math.abs(clickX - hp.x);
        const inX = dx <= bbW * 0.65;
        const inY = clickY >= (hp.y - bbH - badgeH - 24) && clickY <= (hp.y + 60);
        return inX && inY;
      });

      if (clickedHoop) {
        onSelectCompany(clickedHoop.company.id);
        return; // Clicked a board -> select it, do not drag or throw!
      }
    }

    // Otherwise, start drag-and-aim towards the selected company
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setIsAiming(true);
    stateRef.current.characterState = 'aiming';
    setDragOffset({ dx: 0, dy: 0.5 });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isAiming || !dragStartRef.current) return;
    const rawDx = (e.clientX - dragStartRef.current.x) / 180;
    const rawDy = (dragStartRef.current.y - e.clientY) / 180;

    const dx = Math.max(-0.9, Math.min(0.9, rawDx));
    const dy = Math.max(0.1, Math.min(1.2, rawDy + 0.45));
    setDragOffset({ dx, dy });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isAiming) return;
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

    // Launch Projectile
    const state = stateRef.current;
    state.isThrowing = true;
    state.throwElapsed = 0;
    state.characterState = 'throw';
    state.flightDuration = 1.0;
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        touchAction: 'none',
        userSelect: 'none',
        cursor: isLocked ? 'default' : isAiming ? 'grabbing' : 'grab',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        setIsAiming(false);
        stateRef.current.characterState = 'idle';
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />


      {/* Power HUD meter when aiming */}
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
              background: 'rgba(25, 58, 70, 0.92)',
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
