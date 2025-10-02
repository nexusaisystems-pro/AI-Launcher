import { nanoid } from 'nanoid';

const SESSION_KEY = 'dayz-launcher-session-id';

export function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    sessionId = nanoid();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  
  return sessionId;
}
