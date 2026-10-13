# ADR 0004 — Connexion par lien magique et jetons HMAC

- **Statut :** accepté — 2026-10-13
- **Contexte :** Firebase Auth demande une configuration console (fournisseurs, domaines) difficile à automatiser ; l'application envoie déjà des e-mails.
- **Décision :** lien de connexion signé HMAC-SHA256 (15 min) envoyé par SMTP, cookie de session signé `httpOnly` (30 j), clés MCP signées sans expiration. Inscriptions limitées par `SILLAGE_INSCRIPTIONS`.
- **Conséquences :** + aucune dépendance d'authentification, testable unitairement. − révocation globale seulement (rotation de `SILLAGE_SECRET`) ; révocation par clé prévue en v0.2.
