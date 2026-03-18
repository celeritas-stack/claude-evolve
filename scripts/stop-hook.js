#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// STOP HOOK — fires when Claude finishes responding
// Shows the user what was learned this session.
// ─────────────────────────────────────────────────────────────

import { readFileSync } from 'fs';
import path from 'path';
import os from 'os';

async function main() {
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  let hookData: Record<string, unknown>;
  try {
    hookData = JSON.parse(input) as Record<string, unknown>;
  } catch {
    process.exit(0);
  }

  const sessionId = String(hookData.session_id ?? 'unknown');
  const storePath = path.join(os.homedir(), '.claude-evolve', `${sessionId}.json`);

  // Check if any rules were learned this session
  try {
    const raw = readFileSync(storePath, 'utf-8');
    // If store has data, session was active
    // Note: actual rule logging is handled by extractor-process
  } catch {
    // No activity this session
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
