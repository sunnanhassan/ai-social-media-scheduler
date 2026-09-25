---
name: git-auto-commit
description: "Automated git commit workflow adhering to Conventional Commits standards, mandatory pre-commit Graphify knowledge graph synchronization, clean staging, and push procedures."
---

# Git Auto-Commit Workflow Skill

This skill enforces atomic, well-structured, conventional Git commits while guaranteeing pre-commit codebase knowledge graph synchronization (`graphify-out/`).

---

## 1. Mandatory Pre-Commit Enforcement Rule

**BEFORE every git commit**, you MUST run:
```powershell
python scripts/run-graphify.py
```
This ensures:
1. All newly added or modified TypeScript, Python, and SQL files are parsed into AST nodes.
2. `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` are updated.
3. Updated knowledge graph artifacts are automatically staged into the commit.

---

## 2. Conventional Commit Standards

Every commit message must follow the Conventional Commits format:
```
<type>(<optional scope>): <short description in present tense>

[optional body explaining why the change was made and any technical trade-offs]

[optional footer(s), e.g. BREAKING CHANGE or issue reference]
```

### Allowed Types:
- `feat`: A new feature or major enhancement for users/attendees/admins.
- `fix`: A bug fix or patch resolving an issue or runtime error.
- `refactor`: Code reorganization with zero behavior change.
- `test`: Adding or updating test suites (Vitest, Playwright).
- `perf`: A code change that improves performance.
- `chore`: Maintenance tasks, dependencies, git hooks, or configs.
- `docs`: Documentation updates or markdown guides.

---

## 3. Staging & Execution Checklist

Follow this exact sequence for automated commits:

1. **Verify Changes & Status**:
   ```powershell
   git status -s
   ```
2. **Never Stage Secrets**:
   Verify that `.env`, `.env.local`, `.env.production`, credentials, or `node_modules` are NOT staged.
3. **Execute Pre-Commit Graphify**:
   ```powershell
   python scripts/run-graphify.py
   ```
4. **Stage Relevant Files**:
   ```powershell
   git add <modified-files> graphify-out/
   ```
5. **Commit with Descriptive Message**:
   ```powershell
   git commit -m "<type>(<scope>): <clear description>"
   ```
6. **Push when Requested**:
   ```powershell
   git push origin <branch-name>
   ```
