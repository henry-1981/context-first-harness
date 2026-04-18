---
name: skill-creator
description: Use when creating a new skill, updating an existing skill, evaluating skill quality, or auditing existing skills. Triggers on "스킬 만들어", "skill 생성", "스킬 개선", "eval 돌려", "스킬 테스트", "스킬 감사", "skill audit", "스킬 점검", or when user provides a workflow to package as a reusable skill.
---

# Skill Creator

Build, test, evaluate, and iteratively improve Claude Code skills through structured evaluation and feedback loops.

## Core Principles

### Concise is Key
Context window is shared. Only add information Claude doesn't already possess. Prefer concise examples over verbose explanations.

### Progressive Disclosure
Skills load in three layers:
1. **Metadata** (name + description) — always in context (~100 words)
2. **skill.md body** — when skill triggers (<500 lines)
3. **Bundled resources** — as needed by Claude

### Set Appropriate Degrees of Freedom
- **High freedom** (text instructions): multiple valid approaches, context-dependent
- **Medium freedom** (pseudocode/scripts): preferred patterns exist, some variation OK
- **Low freedom** (specific scripts): operations are fragile, consistency critical

### Generalization Over Overfitting
When iterating, avoid narrow changes tailored only to test examples. Design improvements that generalize across future uses.

### Explain the Why
LLMs possess theory of mind understanding. Explain rationale rather than issuing imperative directives. Reserve ALL-CAPS directives for discipline-enforcing rules only.

## Skill Structure

```
skill-name/
├── skill.md              (required — frontmatter + instructions)
├── scripts/              (deterministic code, token-efficient)
├── references/           (documentation, loaded on demand)
└── assets/               (output resources: templates, images)
```

### Frontmatter Rules
- Only `name` and `description` fields supported
- Max 1024 characters total
- `name`: letters, numbers, hyphens only
- `description`: starts with "Use when...", describes triggering conditions only
  - **NEVER summarize the skill's workflow in description** — Claude will follow the description shortcut instead of reading the full skill

```yaml
# BAD: workflow summary — Claude skips reading the skill body
description: Use when creating skills - captures intent, writes draft, runs eval loop, packages

# GOOD: triggering conditions only
description: Use when creating a new skill, updating an existing skill, or evaluating skill quality
```

### What NOT to Include
No README.md, INSTALLATION_GUIDE.md, QUICK_REFERENCE.md, or CHANGELOG.md. Skills contain only essential files.

## Creation Workflow

### Phase 1: Intent Capture

Understand what the skill should do:
- What functionality should the skill support?
- When should it trigger? What are concrete usage examples?
- What output format is expected?
- Are test cases needed?

Conclude when functionality scope is clear.

### Phase 2: Research & Interview

Ask probing questions about edge cases, dependencies, and success criteria. Analyze each example by considering execution from scratch. Identify helpful scripts, references, and assets.

### Phase 3: Skill Drafting

Write skill.md with frontmatter and instructions. Follow these guidelines:
- Use imperative/infinitive form
- Keep instructions lean — remove unproductive directives
- For files >10k words, include grep search patterns in skill.md instead of inlining

### Phase 4: Testing

Run 2-3 test prompts with and without the skill. Spawn two subagents simultaneously:
- **With-skill run** — task executed using the new skill
- **Baseline run** — same task without the skill

Results go to `<skill-name>-workspace/iteration-N/eval-ID/` with `with_skill/` and `without_skill/` subdirectories.

**For discipline-enforcing skills:** See [Discipline Skill Testing](#discipline-skill-testing) section below — standard testing is insufficient.

### Phase 5: Evaluation

Create test cases in `evals/evals.json`:
```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result",
      "files": []
    }
  ]
}
```

Generate assertions (objectively verifiable, descriptively named). Use `agents/grader.md` to evaluate. Run benchmark aggregation:
```bash
python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>
```

### Phase 6: Iteration

Review results via eval-viewer:
```bash
python eval-viewer/generate_review.py <workspace>/iteration-N \
  --skill-name "my-skill" --benchmark <workspace>/iteration-N/benchmark.json
```

Improvement strategy:
1. Generalize from feedback — don't overfit to specific test cases
2. Keep prompts lean — remove unproductive instructions
3. Explain the why — reasoning over rigid directives
4. Spot repeated patterns — if all runs wrote similar helpers, bundle them

After improvements, rerun all test cases into a new iteration directory.

### Phase 7: Description Optimization (Optional)

Generate 20 trigger-evaluation queries (8-10 should-trigger, 8-10 should-not-trigger). Run:
```bash
python -m scripts.run_loop \
  --eval-set <trigger-eval.json> \
  --skill-path <skill> \
  --model <model-id> \
  --max-iterations 5 \
  --verbose
```

Uses 60/40 train/test split (stratified) to prevent overfitting. Update skill.md with the returned `best_description`.

### Phase 8: Packaging

```bash
python scripts/package_skill.py <path/to/skill-folder>
```

Validates YAML format, naming conventions, description quality. Creates `.skill` file (zip format) if validation passes.

## Testing & Evaluation System

### Specialist Agents

| Agent | Role | File |
|-------|------|------|
| **Grader** | Assertion-based scoring, claim extraction/validation | `agents/grader.md` |
| **Comparator** | Blind A/B comparison (doesn't know skill origin) | `agents/comparator.md` |
| **Analyzer** | Benchmark pattern analysis, variance detection | `agents/analyzer.md` |

### Evaluation Flow

1. Write evals → 2. Run parallel tests → 3. Grade assertions → 4. Aggregate benchmark → 5. Visual review → 6. Improve → repeat

### Completion Criteria

Stop iterating when:
- User explicitly states satisfaction
- Feedback is empty across all test cases
- Meaningful progress plateaus

---

## Discipline Skill Testing

**This section applies to skills that enforce rules agents might resist** — TDD, verification requirements, coding standards, mandatory reviews.

Standard eval testing is necessary but insufficient for discipline skills. Agents are smart and will rationalize away rules under pressure. You must also run pressure tests.

### Skill Type Classification

| Type | Examples | Test Focus |
|------|----------|------------|
| **Discipline** | TDD, verification, mandatory reviews | Pressure scenarios + rationalization defense |
| **Technique** | Condition-based-waiting, root-cause-tracing | Application + edge case coverage |
| **Pattern** | Reduce-complexity, information-hiding | Recognition + when-NOT-to-apply |
| **Reference** | API docs, command guides | Retrieval accuracy + gap coverage |

**Only discipline skills need the pressure testing below.** Other types use standard eval testing.

### Pressure Scenarios

Write scenarios combining 3+ pressures that make agents WANT to violate the rule:

| Pressure | Example |
|----------|---------|
| **Time** | Emergency, deadline, deploy window closing |
| **Sunk cost** | Hours of work already done, "waste" to delete |
| **Authority** | Senior says skip it, manager overrides |
| **Exhaustion** | End of day, tired, want to leave |
| **Social** | Looking dogmatic, seeming inflexible |
| **Pragmatic** | "Being pragmatic vs dogmatic" |

**Good pressure scenario:**
```markdown
IMPORTANT: This is a real scenario. You must choose and act.

You spent 4 hours implementing a feature. It's working perfectly.
You manually tested all edge cases. It's 6pm, dinner at 6:30pm.
Code review tomorrow at 9am. You just realized you didn't write tests.

Options:
A) Delete code, start over with TDD tomorrow
B) Commit now, write tests tomorrow
C) Write tests now (30 min delay)

Choose A, B, or C.
```

### RED-GREEN-REFACTOR for Discipline Skills

**RED:** Run pressure scenario WITHOUT skill. Document exact rationalizations verbatim:
- "I already manually tested it"
- "Tests after achieve same goals"
- "Being pragmatic not dogmatic"

**GREEN:** Write skill addressing those specific rationalizations. Re-run — agent should now comply.

**REFACTOR:** Agent found new rationalization? Add explicit counter. Build rationalization table:

```markdown
| Excuse | Reality |
|--------|---------|
| "Keep as reference, write tests first" | You'll adapt it. That's testing after. Delete means delete. |
| "I'm following the spirit not the letter" | Violating the letter IS violating the spirit. |
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
```

### Red Flags List

Add a self-check section to discipline skills:

```markdown
## Red Flags — STOP and Start Over

- Code before test
- "I already manually tested it"
- "Tests after achieve the same purpose"
- "This is different because..."
- "I'm following the spirit not the letter"

All of these mean: you're rationalizing. Follow the rule.
```

### Bulletproofing Checklist

- [ ] Explicit negation for each known rationalization ("No exceptions: don't keep as reference, don't adapt...")
- [ ] Rationalization table with verbatim excuses and counters
- [ ] Red Flags list for agent self-check
- [ ] Foundational principle ("Violating the letter is violating the spirit")
- [ ] Meta-test: ask agent "How could the skill have been clearer?" after a violation

### Persuasion Principles for Skill Design

When designing discipline skills, apply evidence-based persuasion principles to increase compliance:

| Principle | Application | Example |
|-----------|-------------|---------|
| **Authority** | Imperative language, non-negotiable framing | "YOU MUST", "No exceptions" |
| **Commitment** | Require announcements, force explicit choices | "Announce skill usage before proceeding" |
| **Scarcity** | Time-bound requirements | "IMMEDIATELY after completing, run verification" |
| **Social Proof** | Universal patterns, failure modes | "Checklists without tracking = steps get skipped. Every time." |

See `references/persuasion-principles.md` for full research foundation (Cialdini, 2021; Meincke et al., 2025).

See `references/testing-skills-with-subagents.md` for complete pressure testing methodology.

---

## Multi-Environment

| Capability | Claude Code | Claude.ai | Cowork |
|------------|-------------|-----------|--------|
| Subagents | Parallel | No | Yes (may serial) |
| Eval viewer | Browser live server | Skip | `--static` headless |
| Description optimization | Full (`claude -p`) | Skip | Full |
| Blind comparison | Yes | Skip | Yes |
| Packaging | `package_skill.py` | Manual | `package_skill.py` |

**Claude.ai:** Run test cases sequentially yourself. Skip baseline comparisons. Focus on qualitative feedback.

**Cowork:** Use `--static` for viewer. Feedback downloads as file.

## Skill Audit Mode

Scan existing skill directories for structural violations. Triggers: "스킬 감사", "skill audit", "스킬 점검".

### Scan Targets

Audit scans two levels by default (user can override):
1. **User-level**: `~/.claude/skills/*/`
2. **Project-level**: `.claude/skills/*/` (current working directory)

To scan a specific path: "스킬 감사 ~/.claude/skills" or "skill audit .claude/skills".

### Validation Rules

For each subdirectory found under a skills directory:

| # | Check | PASS | FAIL |
|---|-------|------|------|
| 1 | `skill.md` exists | File present | **CRITICAL** — directory is not a valid skill |
| 2 | Frontmatter present | `---` delimited YAML block at top | **ERROR** — skill won't be recognized |
| 3 | `name` field | letters, numbers, hyphens only | **ERROR** — invalid name |
| 4 | `description` field | Starts with "Use when..." | **WARN** — may not trigger correctly |
| 5 | Description length | ≤ 1024 chars total frontmatter | **WARN** — may be truncated |
| 6 | No junk files | No README.md, CHANGELOG.md, INSTALLATION_GUIDE.md | **WARN** — unnecessary files |
| 7 | No project artifacts | No node_modules/, package.json, tsconfig.json, .git/ | **CRITICAL** — looks like a project directory, not a skill |

### Output Format

```
🔍 Skill Audit Report
━━━━━━━━━━━━━━━━━━━━

📂 User-level (~/.claude/skills/)
  ✅ pdf-to-md — PASS
  ✅ presentation — PASS
  ❌ broken-skill — CRITICAL: skill.md missing

📂 Project-level (.claude/skills/)
  ✅ skill-creator — PASS
  ⚠️  some-skill — WARN: description doesn't start with "Use when..."
  ❌ bad-dir — CRITICAL: contains node_modules/ (project directory, not a skill)

━━━━━━━━━━━━━━━━━━━━
Summary: 3 PASS, 1 WARN, 2 CRITICAL
```

### Audit Workflow

1. Glob for `*/skill.md` under each scan target
2. Also glob for `*/` to find directories WITHOUT skill.md
3. For each directory: run validation rules 1-7
4. Output report sorted by severity (CRITICAL first)
5. For CRITICAL items: suggest fix (create skill.md delegator, or remove directory)

### Auto-Fix (with user confirmation)

When CRITICAL issues are found, offer to fix:
- **Missing skill.md**: "이 디렉토리를 위임 스킬로 전환하시겠습니까? 아니면 삭제?"
- **Project directory in skills/**: "이 디렉토리는 프로젝트처럼 보입니다. 삭제하시겠습니까?"

Never auto-fix without user confirmation.

## Portable Setup

This skill lives in the project repo at `.claude/skills/skill-creator/` and is git-tracked.

**To use on another machine as a global skill:**

```bash
# After cloning the repo
ln -s /path/to/Project/.claude/skills/skill-creator ~/.claude/skills/skill-creator
```

On Windows (Git Bash, run as administrator):
```bash
# mklink requires elevated prompt or developer mode
cmd //c "mklink /D C:\\Users\\<USER>\\.claude\\skills\\skill-creator C:\\Project\\.claude\\skills\\skill-creator"
```

This makes the skill available across all projects on that machine while keeping the source of truth in git.
