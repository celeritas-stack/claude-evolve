#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// EXTRACTOR PROCESS
// Runs in background. Calls Claude API. Updates CLAUDE.md.
// Never blocks the user session.
// ─────────────────────────────────────────────────────────────

import 'dotenv/config';
import { extractRule } from '../src/extractor.js';
import { updateClaudeMd, getProjectRoot } from '../src/updater.js';

async function main() {
  const args = process.argv.slice(2);

  const promptIdx = args.indexOf('--prompt');
  const contextIdx = args.indexOf('--context');
  const sessionIdx = args.indexOf('--session');

  const prompt = promptIdx !== -1 ? args[promptIdx + 1] : '';
  const context = contextIdx !== -1 ? args[contextIdx + 1] : '';
  const sessionId = sessionIdx !== -1 ? args[sessionIdx + 1] : 'unknown';

  if (!prompt) {
    process.exit(0);
  }

  // Extract rule via AI
  const rule = await extractRule(prompt, context || undefined);

  if (!rule) {
    console.error('[claude-evolve] No actionable rule extracted');
    process.exit(0);
  }

  // Update CLAUDE.md
  const projectRoot = getProjectRoot();
  const result = updateClaudeMd(rule, projectRoot);

  if (result.added) {
    console.error(
      `[claude-evolve] ✓ New rule learned: "${rule.rule}" → ${result.claudeMdPath}`
    );
  } else {
    console.error(
      `[claude-evolve] Rule skipped: ${result.reason}`
    );
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('[claude-evolve] Extractor error:', err);
  process.exit(0);
});
