// Local progress only (no accounts, no personal data): best stars per level in localStorage.
const KEY = 'cloud-shepherd-v1';

interface Save { stars: Record<number, number>; muted?: boolean; seenControls?: boolean }

function read(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Save;
      if (s && typeof s.stars === 'object') return s;
    }
  } catch { /* private mode or blocked storage */ }
  return { stars: {} };
}

let save = read();

function write() {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch { /* ignore */ }
}

export const progress = {
  stars: (id: number) => save.stars[id] ?? 0,
  record(id: number, s: number) {
    if (s > (save.stars[id] ?? 0)) { save.stars[id] = s; write(); }
  },
  unlocked(id: number) {
    return id === 1 || (save.stars[id - 1] ?? 0) > 0 || (save.stars[id] ?? 0) > 0;
  },
  get muted() { return !!save.muted; },
  set muted(v: boolean) { save.muted = v; write(); },
  get seenControls() { return !!save.seenControls; },
  set seenControls(v: boolean) { save.seenControls = v; write(); },
  reset() { save = { stars: {} }; write(); },
};
