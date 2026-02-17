import { ChatMessage, ChatSession } from '@/types';
import { getSettings } from './settings';
import { getPaper } from './papers';
import {
  parseSidecar,
  appendToSection,
  updateSection,
  type ChatMessage as SidecarChatMessage,
} from '@/lib/vault';

// Get chat session for a paper (from sidecar ## Chat section)
export function getChatSession(paperId: string): ChatSession {
  const paper = getPaper(paperId);
  if (!paper) {
    return { paperId, messages: [] };
  }

  try {
    const sidecar = parseSidecar(paper.sidecarPath);
    // Convert sidecar chat messages to ChatMessage type
    const messages: ChatMessage[] = sidecar.chat.map((m, idx) => ({
      id: `${paperId}-${idx}`,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    }));

    return { paperId, messages };
  } catch {
    return { paperId, messages: [] };
  }
}

// Save a chat message to the sidecar
export function saveChatMessage(paperId: string, message: ChatMessage): ChatSession {
  const paper = getPaper(paperId);
  if (!paper) {
    return { paperId, messages: [] };
  }

  // Format the message for the sidecar
  const formatted = `**${message.role}** (${message.timestamp}):\n${message.content}\n`;
  appendToSection(paper.sidecarPath, 'Chat', formatted);

  // Return the updated session
  return getChatSession(paperId);
}

// Clear chat session - replaces ## Chat section with empty content
export function clearChatSession(paperId: string): boolean {
  const paper = getPaper(paperId);
  if (!paper) return false;

  try {
    updateSection(paper.sidecarPath, 'Chat', '');
    return true;
  } catch (error) {
    console.error('Failed to clear chat:', error);
    return false;
  }
}
