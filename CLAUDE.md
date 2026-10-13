# Sillage — consignes pour les agents

- Langue : français (code, commits, docs). Commits conventionnels, **sans** trailer Co-Authored-By.
- Branche de travail : `dev` (branche par défaut). Jamais de push sur `main`.
- TDD : le domaine (`src/domaine`, `src/mcp`, `src/lib/jeton.ts`) ne change pas sans test rouge d'abord.
- Les règles métier vivent dans `src/domaine` ; l'interface et le MCP ne font qu'appeler ce domaine.
- Aucune donnée personnelle (cibles, dossiers, posts) dans le dépôt. Aucun secret : voir `.env.example`.
- Avant de terminer : `npm test && npm run typecheck && npm run lint && npm run build`.
- Feuille de route : `ROADMAP.md` — une case = un commit utile.
