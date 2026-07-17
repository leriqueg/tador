import type { EntrySubtype, OperationType } from '../components/entry-builder/entry-builder-state.ts';

const STORAGE_KEY = 'tador.pro.entryBuilder.lastAccounts';

export interface StoredAccountPair {
  debitAccountId: string;
  creditAccountId: string;
}

export function accountMemoryKey(tipo: OperationType, subtype: EntrySubtype): string {
  return `${tipo}:${subtype}`;
}

function readMap(): Record<string, StoredAccountPair> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StoredAccountPair>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function readLastAccountPair(key: string): StoredAccountPair | null {
  const entry = readMap()[key];
  if (!entry?.debitAccountId || !entry?.creditAccountId) return null;
  if (entry.debitAccountId === entry.creditAccountId) return null;
  return entry;
}

export function writeLastAccountPair(
  key: string,
  debitAccountId: string,
  creditAccountId: string,
): void {
  if (!debitAccountId || !creditAccountId || debitAccountId === creditAccountId) return;
  try {
    const map = readMap();
    map[key] = { debitAccountId, creditAccountId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota / private mode
  }
}

/** Apply sticky defaults when both ids are still valid options. */
export function resolveStickyAccounts(
  key: string,
  debitOptions: Array<{ id: string }>,
  creditOptions: Array<{ id: string }>,
): StoredAccountPair | null {
  const stored = readLastAccountPair(key);
  if (!stored) return null;
  const debitOk = debitOptions.some((a) => a.id === stored.debitAccountId);
  const creditOk = creditOptions.some((a) => a.id === stored.creditAccountId);
  if (!debitOk || !creditOk) return null;
  return stored;
}
