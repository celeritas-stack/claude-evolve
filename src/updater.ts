// ─────────────────────────────────────────────────────────────
// CLAUDE.MD UPDATER
// Reads existing CLAUDE.md, deduplicates, and appends new rules.
// Never destroys existing content. Always appends to the right section.
// ─────────────────────────────────────────────────────────────

import fs from 'fs';
import path from 'path';
import type { ExtractedRule } from './extractor';

const EVOLVE_SECTION_HEADER = '## Auto-learned Rules (claude-evolve)';
const EVOLVE_SECTION_NOTE = '> These rules were automatically learned from your corrections. Edit freely.\n';

export interface UpdateResult {
  added: boolean;
  reason: string;
  claudeMdPath: string;
}

export function updateClaudeMd(
  rule: ExtractedRule,
  projectRoot: string
): UpdateResult {
  const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');

  // Read existing content (or create fresh)
  let existing = '';
  try {
    existing = fs.readFileSync(claudeMdPath, 'utf-8');
  } catch {
    existing = '# Project Rules\n\n';
  }

  // Deduplicate — don't add if semantically similar rule already exists
  if (isDuplicate(rule.rule, existing)) {
    return { added: false, reason: 'Duplicate rule already exists', claudeMdPath };
  }

  // Find or create the auto-learned section
  const updatedContent = appendToEvolveSection(existing, rule);

  // Write atomically (write to temp, then rename)
  const tmpPath = claudeMdPath + '.evolve.tmp';
  fs.writeFileSync(tmpPath, updatedContent, 'utf-8');
  fs.renameSync(tmpPath, claudeMdPath);

  return { added: true, reason: 'Rule added successfully', claudeMdPath };
}

function isDuplicate(newRule: string, existing: string): boolean {
  // Simple word overlap check — good enough for deduplication
  const newWords = new Set(
    newRule.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3)
  );

  // Extract existing rules from evolve section
  const evolveMatch = existing.match(
    /## Auto-learned Rules[\s\S]*?(?=\n##|\s*$)/
  );
  if (!evolveMatch) return false;

  const existingRules = evolveMatch[0]
    .split('\n')
    .filter(l => l.startsWith('- '))
    .map(l => l.slice(2).toLowerCase());

  for (const existingRule of existingRules) {
    const existingWords = new Set(
      existingRule.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3)
    );
    const overlap = [...newWords].filter(w => existingWords.has(w)).length;
    const similarity = overlap / Math.max(newWords.size, existingWords.size);
    if (similarity > 0.6) return true; // 60% word overlap = duplicate
  }

  return false;
}

function appendToEvolveSection(existing: string, rule: ExtractedRule): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const newRule = `- ${rule.rule} *(learned ${timestamp})*`;

  // If section exists, append to it
  if (existing.includes(EVOLVE_SECTION_HEADER)) {
    // Find the section and append before the next ## or end of file
    return existing.replace(
      /(## Auto-learned Rules[\s\S]*?)(\n## |\s*$)/,
      (match, section, after) => {
        return `${section}\n${newRule}${after}`;
      }
    );
  }

  // Section doesn't exist — create it at the end
  const section = [
    '',
    EVOLVE_SECTION_HEADER,
    EVOLVE_SECTION_NOTE,
    `### ${rule.category}`,
    newRule,
    '',
  ].join('\n');

  return existing.trimEnd() + section;
}

// Get project root (where CLAUDE.md should live)
export function getProjectRoot(): string {
  return (
    process.env.CLAUDE_PROJECT_DIR ??
    process.env.PWD ??
    process.cwd()
  );
}
