import { CharacterAppearance } from '@/types/game';
import { DEFAULT_CHARACTER_APPEARANCE } from '../character/CharacterAppearance';
import {
  IStartNgAdapter,
  StartNgGuest,
  StartNgLeaderboardEntry,
  StartNgScoreResult,
  StartNgStyle,
  StartNgUser,
  StartNgWhoAmIReply,
} from './StartNgContracts';

export * from './StartNgContracts';

const START_NG = 'https://start.ng';
let framePromise: Promise<HTMLIFrameElement> | null = null;

function getConnectFrame(): Promise<HTMLIFrameElement> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window not available'));
  }

  if (!framePromise) {
    framePromise = new Promise((resolve, reject) => {
      const existing = document.getElementById('startng-connect-frame') as HTMLIFrameElement;
      if (existing) {
        resolve(existing);
        return;
      }

      const el = document.createElement('iframe');
      el.id = 'startng-connect-frame';
      el.src = `${START_NG}/connect`;
      el.hidden = true;
      el.style.display = 'none';
      el.onload = () => resolve(el);
      el.onerror = (err) => {
        framePromise = null;
        reject(err);
      };
      document.body.appendChild(el);
    });
  }
  return framePromise;
}

// Sends a message to start.ng connect iframe and resolves to start.ng's reply, or null if it didn't answer.
export async function askStartNg<T = any>(message: Record<string, any>, replyType: string, timeoutMs = 4000): Promise<T | null> {
  try {
    const el = await getConnectFrame();
    return new Promise((resolve) => {
      const requestId = Math.random().toString(36).slice(2);
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          window.removeEventListener('message', onMessage);
          resolve(null);
        }
      }, timeoutMs);

      function onMessage(e: MessageEvent) {
        if (e.origin !== START_NG || e.source !== el.contentWindow) return;
        if (e.data?.type === replyType && e.data?.requestId === requestId) {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            window.removeEventListener('message', onMessage);
            resolve(e.data as T);
          }
        }
      }

      window.addEventListener('message', onMessage);
      el.contentWindow?.postMessage({ ...message, requestId }, START_NG);
    });
  } catch {
    return null;
  }
}

export class StartNgAdapter implements IStartNgAdapter {
  private cachedPlayer: StartNgUser | StartNgGuest | null = null;

  getCachedPlayer(): StartNgUser | StartNgGuest | null {
    return this.cachedPlayer;
  }

  constructor() {
    this.initSessionFromUrl();
  }

  private initSessionFromUrl(): void {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const session = params.get('startng_session');
      if (session) {
        sessionStorage.setItem('startng_session', session);
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch {
      // ignore
    }
  }

  isPlatformConnected(): boolean {
    if (typeof window === 'undefined') return false;
    return window.location.hostname.endsWith('.start.ng') || !!sessionStorage.getItem('startng_session');
  }

  async getPlatformUser(): Promise<StartNgUser | StartNgGuest | null> {
    const reply = await askStartNg<StartNgWhoAmIReply>({ type: 'startng:whoami' }, 'startng:user');
    const player = reply?.user ?? reply?.guest ?? null;
    this.cachedPlayer = player;
    return player;
  }

  mapPlatformStyleToCharacter(style?: StartNgStyle | null): CharacterAppearance {
    if (!style) return { ...DEFAULT_CHARACTER_APPEARANCE };

    let accessoryId: string | null = null;
    const hat = (style.hat || '').toLowerCase();
    const acc = (style.accessory || '').toLowerCase();

    if (hat === 'cap' || hat === 'beanie' || hat === 'tophat') {
      accessoryId = 'cap';
    } else if (hat === 'crown' || acc === 'headband') {
      accessoryId = 'headband';
    } else if (acc === 'glasses' || acc === 'earrings') {
      accessoryId = 'glasses';
    }

    return {
      modelId: DEFAULT_CHARACTER_APPEARANCE.modelId,
      shirtColor: style.primaryColor && (style.primaryColor.startsWith('#') || style.primaryColor.startsWith('rgb'))
        ? style.primaryColor
        : DEFAULT_CHARACTER_APPEARANCE.shirtColor,
      trouserColor: style.secondaryColor && (style.secondaryColor.startsWith('#') || style.secondaryColor.startsWith('rgb'))
        ? style.secondaryColor
        : DEFAULT_CHARACTER_APPEARANCE.trouserColor,
      skinColor: style.skinColor && (style.skinColor.startsWith('#') || style.skinColor.startsWith('rgb'))
        ? style.skinColor
        : DEFAULT_CHARACTER_APPEARANCE.skinColor,
      shoesColor: DEFAULT_CHARACTER_APPEARANCE.shoesColor,
      accessoryId,
      body: style.body || DEFAULT_CHARACTER_APPEARANCE.body,
      hair: style.hair || DEFAULT_CHARACTER_APPEARANCE.hair,
      hairColor: style.hairColor || DEFAULT_CHARACTER_APPEARANCE.hairColor,
      hat: style.hat || DEFAULT_CHARACTER_APPEARANCE.hat,
      accessory: style.accessory || DEFAULT_CHARACTER_APPEARANCE.accessory,
    };
  }

  async saveScore(stats: { coins: number; deliverables: number; stars: number }): Promise<StartNgScoreResult | null> {
    const reply = await askStartNg<{ type: string; ok: boolean; result?: any; error?: string }>(
      { type: 'startng:score', stats },
      'startng:scoreSaved'
    );
    if (!reply) return null;
    return {
      ok: reply.ok,
      result: reply.result,
      error: reply.error,
    };
  }

  async getLeaderboard(limit = 10): Promise<StartNgLeaderboardEntry[]> {
    try {
      const reply = await askStartNg<{ type: string; ok: boolean; entries?: StartNgLeaderboardEntry[] }>(
        { type: 'startng:leaderboard', limit },
        'startng:leaderboardData',
        2000
      );
      if (reply?.entries && reply.entries.length > 0) {
        return reply.entries;
      }
    } catch {
      // ignore
    }

    // Direct HTTP API fallback (works for everyone including guests)
    try {
      const res = await fetch(`https://api.start.ng/games/job-hunt/leaderboard?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch {
      // ignore
    }
    return [];
  }

  redirectToSignIn(): void {
    if (typeof window === 'undefined') return;
    const returnTo = encodeURIComponent(window.location.origin + window.location.pathname);
    window.location.href = `https://start.ng/?return_to=${returnTo}`;
  }
}

let activeStartNgAdapter: IStartNgAdapter = new StartNgAdapter();

export function getStartNgAdapter(): IStartNgAdapter {
  return activeStartNgAdapter;
}

export function setStartNgAdapter(adapter: IStartNgAdapter): void {
  activeStartNgAdapter = adapter;
}
