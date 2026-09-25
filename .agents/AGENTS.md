# Custom Rules

- Create reusable components whenever possible.
- Component code files should not exceed 300 lines of code. Split them up into smaller, modular components if they become too large.
- **Graphify Pre-Commit Rule**: Before every git commit, `python scripts/run-graphify.py` must run to extract and synchronize the codebase AST knowledge graph (`graphify-out/`). All updated graph artifacts must be staged alongside code commits.

