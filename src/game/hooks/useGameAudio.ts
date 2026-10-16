import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Web Audio API synthesizer for Job Hunt
 * Features:
 * - Master Dynamics Compressor limiter to eliminate popping/clipping
 * - Subtle, mellow ambient arcade background music (lo-fi pentatonic chords)
 * - Soft, polished sound effects calibrated for comfort
 */
export function useGameAudio() {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('jobhunt_sound_muted') === 'true';
    } catch {
      return false;
    }
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterCompressorRef = useRef<DynamicsCompressorNode | null>(null);
  const bgmGainRef = useRef<GainNode | null>(null);
  const bgmIntervalRef = useRef<number | null>(null);
  const lastFanfareTimeRef = useRef<number>(0);
  const isBgmPlayingRef = useRef<boolean>(false);

  // Initialize AudioContext with master compressor limiter
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        // Dynamics Compressor as master limiter
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-18, ctx.currentTime);
        compressor.knee.setValueAtTime(30, ctx.currentTime);
        compressor.ratio.setValueAtTime(12, ctx.currentTime);
        compressor.attack.setValueAtTime(0.003, ctx.currentTime);
        compressor.release.setValueAtTime(0.25, ctx.currentTime);
        compressor.connect(ctx.destination);
        masterCompressorRef.current = compressor;

        // Master BGM gain node (soft and subtle)
        const bgmGain = ctx.createGain();
        bgmGain.gain.setValueAtTime(0.025, ctx.currentTime);
        bgmGain.connect(compressor);
        bgmGainRef.current = bgmGain;
      }
    }

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }

    return audioCtxRef.current;
  }, []);

  // Safe audio destination: routing through the compressor
  const getDestination = useCallback(() => {
    return masterCompressorRef.current || audioCtxRef.current?.destination;
  }, []);

  // Start Subtle Ambient Arcade Music
  const startBackgroundMusic = useCallback(() => {
    if (isBgmPlayingRef.current || isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    isBgmPlayingRef.current = true;

    // Relaxing, subtle lo-fi chord progression (Cmaj7 -> Am7 -> Fmaj7 -> Em7)
    const chordProgressions = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0],  // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [164.81, 196.0, 246.94, 293.66], // Em7
    ];

    let chordIndex = 0;
    const playNextChord = () => {
      if (!isBgmPlayingRef.current || !audioCtxRef.current || !bgmGainRef.current) return;
      if (audioCtxRef.current.state === 'suspended') return;

      const currentChord = chordProgressions[chordIndex % chordProgressions.length];
      chordIndex++;

      const now = audioCtxRef.current.currentTime;
      currentChord.forEach((freq, noteIdx) => {
        try {
          const osc = audioCtxRef.current!.createOscillator();
          const noteGain = audioCtxRef.current!.createGain();
          const filter = audioCtxRef.current!.createBiquadFilter();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + noteIdx * 0.18);

          // Warm low-pass filter for silky soft tone
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(650, now);

          // Gentle fade in and lingering release
          noteGain.gain.setValueAtTime(0.0001, now + noteIdx * 0.18);
          noteGain.gain.linearRampToValueAtTime(0.015, now + noteIdx * 0.18 + 0.3);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + noteIdx * 0.18 + 2.2);

          osc.connect(filter);
          filter.connect(noteGain);
          noteGain.connect(bgmGainRef.current!);

          osc.start(now + noteIdx * 0.18);
          osc.stop(now + noteIdx * 0.18 + 2.3);
        } catch {
          // ignore transient audio scheduling errors
        }
      });
    };

    playNextChord();
    bgmIntervalRef.current = window.setInterval(playNextChord, 2600);
  }, [getAudioContext, isMuted]);

  const stopBackgroundMusic = useCallback(() => {
    isBgmPlayingRef.current = false;
    if (bgmIntervalRef.current !== null) {
      clearInterval(bgmIntervalRef.current);
      bgmIntervalRef.current = null;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('jobhunt_sound_muted', String(next));
      } catch {
        // ignore
      }
      if (next) {
        stopBackgroundMusic();
      } else {
        startBackgroundMusic();
      }
      return next;
    });
  }, [startBackgroundMusic, stopBackgroundMusic]);

  // Start background music automatically on first user click/touch
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!isMuted) {
        getAudioContext();
        startBackgroundMusic();
      }
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      stopBackgroundMusic();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [getAudioContext, isMuted, startBackgroundMusic, stopBackgroundMusic]);

  // 1. Arcade button click (Soft blip)
  const playClick = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    const dest = getDestination();
    if (!ctx || !dest) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // ignore
    }
  }, [isMuted, getAudioContext, getDestination]);

  // 2. Swish / Net Splash (Smooth filtered air whoosh)
  const playSwish = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    const dest = getDestination();
    if (!ctx || !dest) return;

    try {
      const bufferSize = Math.floor(ctx.sampleRate * 0.16);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.16);
      filter.Q.value = 2.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      noise.start();
    } catch {
      // ignore
    }
  }, [isMuted, getAudioContext, getDestination]);

  // 3. Rim Clank (Soft resonant thud)
  const playRimClank = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    const dest = getDestination();
    if (!ctx || !dest) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(75, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // ignore
    }
  }, [isMuted, getAudioContext, getDestination]);

  // 4. Coin Ding (Gentle dual bell chime)
  const playCoinDing = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    const dest = getDestination();
    if (!ctx || !dest) return;

    try {
      const now = ctx.currentTime;
      [987.77, 1318.51].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.06, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.28);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.28);
      });
    } catch {
      // ignore
    }
  }, [isMuted, getAudioContext, getDestination]);

  // 5. Celebration fanfare (Warm, non-overlapping arpeggio)
  const playFanfare = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    const dest = getDestination();
    if (!ctx || !dest) return;

    // Cooldown throttle: prevent overlapping glitch fanfare
    const nowMs = Date.now();
    if (nowMs - lastFanfareTimeRef.current < 1200) return;
    lastFanfareTimeRef.current = nowMs;

    try {
      const chords = [523.25, 659.25, 783.99, 1046.5];
      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.05, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.36);
      });
    } catch {
      // ignore
    }
  }, [isMuted, getAudioContext, getDestination]);

  return {
    isMuted,
    toggleMute,
    playClick,
    playSwish,
    playRimClank,
    playCoinDing,
    playFanfare,
  };
}
