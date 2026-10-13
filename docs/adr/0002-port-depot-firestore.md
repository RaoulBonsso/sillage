# ADR 0002 — Port `Depot`, Firestore en production, mémoire en test

- **Statut :** accepté — 2026-10-13
- **Contexte :** stack par défaut de l'entreprise : Firebase. Le domaine doit rester testable sans réseau, et un client doit pouvoir partir avec ses données.
- **Décision :** une interface `Depot` (collections `entreprises`, `candidatures`, `posts`, `rapports`, `fichiers`), deux adaptateurs. En Firestore, tout vit sous `espaces/{espace}/…` où `espace` = SHA-256 tronqué de l'e-mail : l'isolation est structurelle, pas une clause `where`. Les CV PDF (< 900 Ko) sont stockés en base64 dans Firestore plutôt que dans Cloud Storage, qui exige désormais le forfait Blaze pour un nouveau bucket.
- **Conséquences :** + bascule triviale vers SQLite/PostgreSQL (nouvel adaptateur). − documents de fichiers lourds en lecture : ne jamais les lister, seulement les lire par identifiant.
