import { Settings } from '@/types';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'reader.config.json');

const DEFAULT_SETTINGS: Settings = {
  theme: 'paper',
  layout: 'sidebar-right',
  llmProvider: 'gemini',
  vaultPath: '',
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
    return { ...DEFAULT_SETTINGS, ...data };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<Settings>): Settings {
  const current = getSettings();
  const updated = { ...current, ...settings };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2));
  return updated;
}
