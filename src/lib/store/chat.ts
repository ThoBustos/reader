import { ChatMessage, ChatSession } from '@/types';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CHATS_DIR = path.join(DATA_DIR, 'chats');

function ensureChatDir() {
  if (!fs.existsSync(CHATS_DIR)) {
    fs.mkdirSync(CHATS_DIR, { recursive: true });
  }
}

function getChatFilePath(paperId: string): string {
  return path.join(CHATS_DIR, `${paperId}.json`);
}

export function getChatSession(paperId: string): ChatSession {
  ensureChatDir();
  const filePath = getChatFilePath(paperId);

  if (!fs.existsSync(filePath)) {
    return { paperId, messages: [] };
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return { paperId, messages: [] };
  }
}

export function saveChatMessage(paperId: string, message: ChatMessage): ChatSession {
  ensureChatDir();
  const session = getChatSession(paperId);
  session.messages.push(message);

  fs.writeFileSync(getChatFilePath(paperId), JSON.stringify(session, null, 2));
  return session;
}

export function clearChatSession(paperId: string): void {
  const filePath = getChatFilePath(paperId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
