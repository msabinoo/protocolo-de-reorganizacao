import { initialData, migrateData, type Data } from './domain';

export const STORAGE_KEY = 'protocolo-de-reorganizacao-v1';

export type LoadResult = { data: Data; recovered?: string };

/**
 * Lê os dados do navegador. Se o conteúdo estiver ilegível, ele é copiado para uma chave
 * de segurança ANTES de qualquer substituição, para nunca perder registros silenciosamente.
 */
export function load(): LoadResult {
  let raw: string | null = null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch { return { data: initialData() }; }
  if (!raw) return { data: initialData() };
  try {
    const migrated = migrateData(JSON.parse(raw));
    if (migrated) return { data: migrated };
  } catch { /* tratado abaixo */ }
  const backupKey = `${STORAGE_KEY}-recuperacao-${Date.now()}`;
  try { localStorage.setItem(backupKey, raw); } catch { /* sem espaço: ainda assim não sobrescrevemos sem avisar */ }
  return { data: initialData(), recovered: backupKey };
}

export function save(data: Data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; }
  catch { return false; }
}

export function parseBackup(text: string): Data | null {
  try { return migrateData(JSON.parse(text)); } catch { return null; }
}

export function storageUsageKb() {
  try { return Math.round((localStorage.getItem(STORAGE_KEY)?.length ?? 0) * 2 / 1024); } catch { return 0; }
}
