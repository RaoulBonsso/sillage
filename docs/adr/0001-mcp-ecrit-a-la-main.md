# ADR 0001 — Serveur MCP écrit à la main, sans état

- **Statut :** accepté — 2026-10-13
- **Contexte :** les agents doivent piloter Sillage. Options : SDK officiel `@modelcontextprotocol/sdk`, adaptateur `mcp-handler`, ou implémentation directe du transport Streamable HTTP.
- **Exigences :** fonctionner en fonction serverless (Vercel), sans session serveur ; tests unitaires sans réseau ; schémas d'entrée identiques à ceux de l'interface.
- **Décision :** implémentation directe (~80 lignes) de `initialize`, `ping`, `tools/list`, `tools/call`, réponses JSON (pas de SSE). Les schémas d'entrée sont les schémas Zod du domaine, convertis par `z.toJSONSchema`.
- **Conséquences :** + aucune dépendance sur le chemin critique, testable en mémoire, un seul jeu de règles. − pas de ressources ni de prompts MCP pour l'instant (feuille de route v0.4) ; à réévaluer si la spécification évolue fortement.
