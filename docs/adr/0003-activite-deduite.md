# ADR 0003 — L'activité est déduite, jamais saisie

- **Statut :** accepté — 2026-10-13
- **Contexte :** un tableau de bord déclaratif (« j'ai envoyé 5 candidatures ») finit toujours par mentir.
- **Décision :** le bilan du jour est calculé à partir des événements horodatés (`envoi`, `relance`), des posts marqués publiés et du calendrier de contributions GitHub. Aucun compteur n'est stocké.
- **Conséquences :** + impossible de « gonfler » la série ; l'historique fait foi. − une candidature envoyée par un autre canal doit être marquée « envoyée » à la main (bouton dédié).
