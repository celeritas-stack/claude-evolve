# claude-evolve 🧠

> Your CLAUDE.md learns automatically from every correction you make.

You correct Claude. It never learns. Next session — same mistake.

**claude-evolve fixes that.**

Every time you correct Claude Code, it silently extracts the rule and writes it to your CLAUDE.md. Permanently. Zero manual work.

---

## What it does

```
You:    "Don't use console.log, use our logger utility"
Claude: [continues working]

claude-evolve: [background, silent]
  → Detected correction
  → Extracted rule: "Use logger utility instead of console.log"
  → Written to CLAUDE.md ✓
```

Next session. Claude reads CLAUDE.md. Never makes that mistake again.

---

## Install

```bash
# Inside Claude Code
/plugin marketplace add yourusername/claude-evolve
/plugin install claude-evolve
```

Or manual:
```bash
curl -fsSL https://raw.githubusercontent.com/yourusername/claude-evolve/main/install.sh | bash
```

**Requires:** `ANTHROPIC_API_KEY` in your environment.

---

## How it works

1. `UserPromptSubmit` hook fires on every message you send
2. Pattern matching detects corrections in < 1ms — zero latency
3. Confirmed corrections spawn a background process (async — never blocks you)
4. Background process calls Claude Haiku API (~$0.001) to extract the rule
5. Rule is deduped and appended to your `CLAUDE.md`
6. Next Claude Code session — the rule is in context from the start

---

## What gets learned

| Your correction | Rule added to CLAUDE.md |
|---|---|
| "Don't use any, use proper types" | "Never use TypeScript `any` — always define proper types" |
| "Stop adding console.logs" | "Do not add console.log statements unless explicitly requested" |
| "Use our API client, not fetch directly" | "Use the internal API client (`src/lib/api.ts`), not raw fetch" |
| "Always run tests after changes" | "Run the test suite after every significant code change" |
| "Don't commit directly to main" | "Never commit directly to main — always use feature branches" |

---

## Privacy

- Everything runs locally
- The only external call is to Anthropic API (same as Claude Code itself)
- Rules stay in your `CLAUDE.md` — your codebase, your control
- Add `<private>` tags to exclude sensitive prompts from processing

---

## Cost

~$0.001 per correction extracted. Haiku model.

If you make 50 corrections a month — that's $0.05/month.

---

## Configuration

```json
// ~/.claude-evolve/config.json
{
  "enabled": true,
  "minConfidence": 60,
  "maxRulesPerSession": 10,
  "excludePatterns": ["password", "secret", "token"]
}
```

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/claude-evolve&type=Date)](https://star-history.com/#yourusername/claude-evolve)

---

*Built by an engineer with 25 years of production scars.*
*Because CLAUDE.md should learn from you — not the other way around.*
