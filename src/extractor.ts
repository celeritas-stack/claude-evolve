// ─────────────────────────────────────────────────────────────
// RULE EXTRACTOR
// Uses Anthropic API to extract a clean, reusable rule
// from a correction prompt + session context.
// Cost per extraction: ~$0.001. Runs async, never blocks user.
// ─────────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ExtractedRule {
  rule: string;           // The actual rule to add to CLAUDE.md
  category: string;       // e.g., "Code Style", "Architecture", "Workflow"
  confidence: number;     // 0-100
  isActionable: boolean;  // Can this be written as a clear rule?
}

export async function extractRule(
  correctionPrompt: string,
  sessionContext?: string
): Promise<ExtractedRule | null> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', // Cheapest model — this runs on every correction
      max_tokens: 256,
      system: `You extract reusable rules from developer corrections to AI coding assistants.
A rule must be:
- Clear and specific (not vague)
- Actionable (AI can follow it in future sessions)
- General enough to apply beyond this specific instance
- Written as an imperative instruction

Respond ONLY with valid JSON. No preamble.`,
      messages: [
        {
          role: 'user',
          content: `Developer correction: "${correctionPrompt}"
${sessionContext ? `\nSession context (last few actions): ${sessionContext}` : ''}

Extract a reusable CLAUDE.md rule from this correction.
If no clear rule can be extracted, set isActionable to false.

Respond with:
{
  "rule": "the rule as an imperative sentence",
  "category": "Code Style|Architecture|Workflow|Testing|Git|Security|Performance|Other",
  "confidence": 0-100,
  "isActionable": true|false
}`,
        },
      ],
    });

    const text = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as Anthropic.TextBlock).text)
      .join('');

    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean) as ExtractedRule;

    // Only return rules we're confident about
    if (!parsed.isActionable || parsed.confidence < 60) {
      return null;
    }

    return parsed;
  } catch (err) {
    // Silently fail — never crash the user's session
    console.error('[claude-evolve] Rule extraction failed:', err);
    return null;
  }
}
