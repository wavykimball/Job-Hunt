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
    if (style.hat && style.hat !== 'none') {
      accessoryId = style.hat === 'cap' ? 'cap' : 'headband';
    } else if (style.accessory && style.accessory !== 'none') {
      accessoryId = style.accessory === 'glasses' ? 'glasses' : 'headband';
    }

    return {
      modelId: DEFAULT_CHARACTER_APPEARANCE.modelId,
      shirtColor: style.primaryColor && style.primaryColor.startsWith('#') ? style.primaryColor : DEFAULT_CHARACTER_APPEARANCE.shirtColor,
      trouserColor: style.secondaryColor && style.secondaryColor.startsWith('#') ? style.secondaryColor : DEFAULT_CHARACTER_APPEARANCE.trouserColor,
      skinColor: style.skinColor && style.skinColor.startsWith('#') ? style.skinColor : DEFAULT_CHARACTER_APPEARANCE.skinColor,
      shoesColor: DEFAULT_CHARACTER_APPEARANCE.shoesColor,
      accessoryId,
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
    const reply = await askStartNg<{ type: string; ok: boolean; entries?: StartNgLeaderboardEntry[] }>(
      { type: 'startng:leaderboard', limit },
      'startng:leaderboardData'
    );
    return reply?.entries || [];
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
