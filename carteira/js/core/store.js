// Wrapper simples e seguro sobre localStorage (nunca lança erro).

const PREFIX = "distribui-rico:";

export const KEYS = {
  ALLOC: `${PREFIX}alocador-v1`,
  CUSTOM: `${PREFIX}alocador-custom-v1`,
  EXCLUDED: `${PREFIX}alocador-excluded-v1`,
};

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
