// ─────────────────────────────────────────────────────────────
// CORRECTION DETECTOR
// Detects when a user is correcting Claude.
// Fast pattern matching first — AI extraction only on confirmed hits.
// Must run in < 1ms for non-corrections.
// ─────────────────────────────────────────────────────────────

export interface CorrectionSignal {
  isCorrection: boolean;
  confidence: 'high' | 'medium' | 'low';
  pattern: string;
  prompt: string;
}

// High-confidence correction patterns
// These are phrases humans use when Claude did something wrong
const HIGH_CONFIDENCE_PATTERNS = [
  /^no[,.]?\s/i,
  /^don'?t\s/i,
  /^stop\s/i,
  /^never\s/i,
  /^not like that/i,
  /^that'?s wrong/i,
  /^that'?s not/i,
  /^wrong[,.]?\s/i,
  /^incorrect/i,
  /^you should(n'?t)? /i,
  /^don'?t do that/i,
  /^don'?t use/i,
  /^always use/i,
  /^never use/i,
  /^instead[,]?\s/i,
  /^actually[,]?\s/i,
  /^revert\s/i,
  /^undo\s/i,
  /^go back\s/i,
  /please don'?t/i,
  /i said don'?t/i,
  /i told you/i,
  /how many times/i,
  /again[?!]/i,
];

// Medium-confidence patterns (need more context)
const MEDIUM_CONFIDENCE_PATTERNS = [
  /\bdon'?t\b/i,
  /\bnever\b/i,
  /\balways\b/i,
  /\binstead\b/i,
  /\bwrong\b/i,
  /\bincorrect\b/i,
  /\bnot what i wanted/i,
  /\bnot what i asked/i,
  /\bthat'?s not right/i,
  /\buse .+ instead/i,
  /\bshould be\b/i,
  /\bi prefer\b/i,
  /\bplease use\b/i,
  /\bstop using\b/i,
];

// Exclusion patterns — these look like corrections but aren't
const EXCLUSION_PATTERNS = [
  /^don'?t (forget|hesitate|worry|be)/i,
  /^never mind/i,
  /^actually (that'?s (great|perfect|correct|good|fine|right))/i,
  /^no (problem|worries|rush|pressure|need)/i,
  /^stop (the clock|timer)/i,
];

export function detectCorrection(prompt: string): CorrectionSignal {
  const trimmed = prompt.trim();

  // Check exclusions first
  for (const pattern of EXCLUSION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { isCorrection: false, confidence: 'low', pattern: 'excluded', prompt: trimmed };
    }
  }

  // Check high confidence
  for (const pattern of HIGH_CONFIDENCE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { isCorrection: true, confidence: 'high', pattern: pattern.toString(), prompt: trimmed };
    }
  }

  // Check medium confidence (only if prompt is short — long prompts are new tasks)
  if (trimmed.length < 200) {
    for (const pattern of MEDIUM_CONFIDENCE_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { isCorrection: true, confidence: 'medium', pattern: pattern.toString(), prompt: trimmed };
      }
    }
  }

  return { isCorrection: false, confidence: 'low', pattern: 'none', prompt: trimmed };
}
