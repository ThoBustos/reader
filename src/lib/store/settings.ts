import { Settings } from '@/types';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'reader.config.json');

const DEFAULT_SETTINGS: Settings = {
  theme: 'paper',
  layout: 'sidebar-right',
  llmProvider: 'gemini',
  geminiModel: 'gemini-3-flash-preview',
  vaultPath: '',
  papersPath: '',  // Primary config for vault-first architecture
  geminiApiKey: '',
  claudeApiKey: '',
};

export function getSettings(): Settings {
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    return DEFAULT_SETTINGS;
  }

  try {
    const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    const settings = { ...DEFAULT_SETTINGS, ...data };

    // Auto-derive papersPath from vaultPath if not set
    if (!settings.papersPath && settings.vaultPath) {
      settings.papersPath = path.join(settings.vaultPath, '06_READING', 'Papers');
    }

    return settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<Settings>): Settings {
  const current = getSettings();
  const updated = { ...current, ...settings };

  // Auto-derive papersPath from vaultPath if vaultPath changed and papersPath wasn't explicitly set
  if (settings.vaultPath && !settings.papersPath) {
    updated.papersPath = path.join(settings.vaultPath, '06_READING', 'Papers');
  }

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2));
  return updated;
}

// Ensure papers folder exists in vault
export function ensurePapersFolder(): string | null {
  const settings = getSettings();

  if (!settings.papersPath) {
    return null;
  }

  if (!fs.existsSync(settings.papersPath)) {
    fs.mkdirSync(settings.papersPath, { recursive: true });
  }

  return settings.papersPath;
}
