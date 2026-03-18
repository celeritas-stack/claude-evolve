// ─────────────────────────────────────────────────────────────
// SESSION STORE
// Lightweight file-based store for last N tool actions.
// Used to give the AI extractor context about what Claude just did.
// ─────────────────────────────────────────────────────────────

import fs from 'fs';
import os from 'os';
import path from 'path';

const STORE_DIR = path.join(os.homedir(), '.claude-evolve');
const MAX_ACTIONS = 5; // Keep last 5 tool actions per session

export interface SessionAction {
  tool: string;
  summary: string;
  timestamp: string;
}

function getStorePath(sessionId: string): string {
  return path.join(STORE_DIR, `${sessionId}.json`);
}

function ensureDir(): void {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
}

export function appendAction(sessionId: string, action: SessionAction): void {
  try {
    ensureDir();
    const storePath = getStorePath(sessionId);
    let actions: SessionAction[] = [];

    if (fs.existsSync(storePath)) {
      const raw = fs.readFileSync(storePath, 'utf-8');
      actions = JSON.parse(raw) as SessionAction[];
    }

    actions.push(action);

    // Keep only last N
    if (actions.length > MAX_ACTIONS) {
      actions = actions.slice(-MAX_ACTIONS);
    }

    fs.writeFileSync(storePath, JSON.stringify(actions, null, 2), 'utf-8');
  } catch {
    // Silently fail — never crash user session
  }
}

export function getRecentActions(sessionId: string): string {
  try {
    const storePath = getStorePath(sessionId);
    if (!fs.existsSync(storePath)) return '';

    const raw = fs.readFileSync(storePath, 'utf-8');
    const actions = JSON.parse(raw) as SessionAction[];

    return actions
      .map(a => `[${a.tool}] ${a.summary}`)
      .join('\n');
  } catch {
    return '';
  }
}

export function cleanOldSessions(): void {
  try {
    ensureDir();
    const files = fs.readdirSync(STORE_DIR);
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours

    for (const file of files) {
      const filePath = path.join(STORE_DIR, file);
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
      }
    }
  } catch {
    // Silently fail
  }
}
