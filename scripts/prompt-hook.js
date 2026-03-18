#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// PROMPT HOOK — UserPromptSubmit
// Fires on every user message. Detects corrections.
// Must exit in < 1 second for non-corrections.
// Corrections run async via background process.
// ─────────────────────────────────────────────────────────────

import { detectCorrection } from '../src/detector.js';
import { getRecentActions } from '../src/store.js';
import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // Read hook input from stdin
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  let hookData: Record<string, unknown>;
  try {
    hookData = JSON.parse(input) as Record<string, unknown>;
  } catch {
    // Not JSON — pass through
    process.exit(0);
  }

  const prompt = String(hookData.prompt ?? '');
  const sessionId = String(hookData.session_id ?? 'unknown');

  // Fast detection — pattern matching only (< 1ms)
  const signal = detectCorrection(prompt);

  if (!signal.isCorrection) {
    // Not a correction — exit immediately, don't block Claude
    process.exit(0);
  }

  // Correction detected. Get recent session context for better extraction.
  const context = getRecentActions(sessionId);

  // Spawn background extractor process — don't block Claude's response
  const extractorPath = path.join(__dirname, 'extractor-process.js');
  const child = spawn(
    'node',
    [extractorPath, '--prompt', prompt, '--context', context || '', '--session', sessionId],
    {
      detached: true,
      stdio: 'ignore',
    }
  );
  child.unref();

  // Log what we detected (goes to Claude's debug output if verbose)
  console.error(
    `[claude-evolve] Correction detected (${signal.confidence} confidence): "${prompt.slice(0, 60)}..."`
  );

  // Always allow Claude to continue — we never block
  process.exit(0);
}

main().catch(() => process.exit(0));
