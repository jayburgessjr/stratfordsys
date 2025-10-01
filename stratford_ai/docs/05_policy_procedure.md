# AI Coding Policy & Procedure – Stratford AI

## Policy Statement
Stratford AI must follow deterministic build practices.
AI coding assistants accelerate development but do not replace human review.

**Principles**
- No single prompt → production software.
- Smaller, scoped PRDs > large vague ones.
- Human review checkpoints mandatory.
- All randomness seeded for reproducibility.

## Procedure

### Phase 1: Research
Annotated screenshots + notes (`01_research.md`).

### Phase 2: Architecture
Architecture guide (`02_architecture.md`) defines stack + rules.

### Phase 3: PRD Creation
Feature-level PRDs stored in `/docs/prd/`.

### Phase 4: Planning
AI generates step-by-step plan from PRD.

### Phase 5: Coding
Implement step-by-step. Test immediately.

### Phase 6: Review & Deploy
Human verifies against PRD + tests. Deploy only after pass.

✅ Result: Stratford AI codebase is deterministic, auditable, and production-ready.