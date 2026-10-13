# Feuille de route

Une tâche = un commit utile. La routine quotidienne prend la première case non cochée.

## v0.1 — socle (2026-10-13) ✅
- [x] Domaine : pipeline à transitions, relances en jours ouvrés français, série quotidienne
- [x] Serveur MCP (10 outils) + import des journaux d'agents
- [x] Espace privé : Aujourd'hui, Candidatures, Cibles, LinkedIn, Journal, Intégrations
- [x] Connexion par lien magique, Firestore multi-tenant, envoi Gmail en un clic

## v0.2 — fiabilité
- [ ] Révocation fine des clés MCP (version de clé par espace)
- [ ] Limitation de débit sur `/api/auth/lien` et `/api/mcp`
- [ ] Tests d'intégration des routes (MCP, fichiers, session) avec le dépôt mémoire
- [ ] Journal d'audit des envois (identifiant de message Gmail stocké dans l'historique)
- [ ] Export / import complet d'un espace (JSON) — réversibilité

## v0.3 — intelligence
- [ ] Détection des réponses : lecture IMAP des réponses aux candidatures → étape « réponse » automatique
- [ ] Score de cible explicable (pondérations visibles)
- [ ] Modèles d'e-mails de relance par étape, éditables
- [ ] Statistiques : taux de réponse par secteur, ville, canal, jour d'envoi

## v0.4 — réseau
- [ ] Publication LinkedIn via l'API officielle (Share on LinkedIn, OAuth) au lieu du copier-coller
- [ ] Carte des cibles (France, par ville)
- [ ] Ressource MCP `sillage://journal/{date}` et prompts MCP (« préparer ma journée »)
- [ ] Webhooks sortants (n8n, Slack) sur changement d'étape
