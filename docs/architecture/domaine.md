# Domaine

```mermaid
stateDiagram-v2
  [*] --> reperee
  reperee --> preparee
  preparee --> envoyee: clic humain (Gmail)
  envoyee --> relancee: J+5 ouvrés
  relancee --> relancee: J+7 ouvrés (2 relances max)
  envoyee --> reponse
  relancee --> reponse
  envoyee --> entretien
  relancee --> entretien
  reponse --> entretien
  entretien --> offre
  reponse --> offre
  offre --> signee
  envoyee --> refusee
  relancee --> refusee
  reponse --> refusee
  entretien --> refusee
  offre --> refusee
  signee --> [*]
  refusee --> close
  close --> [*]
```

```mermaid
classDiagram
  class Entreprise { id; nom; ville; secteur; signal{texte, source}; score; contacts[] }
  class Contact { nom; role; email; confiance; linkedin; source }
  class Candidature { id; entrepriseId; etape; dossier; envoyeeLe; relances; prochaineRelance; historique[] }
  class Evenement { date; type; texte; auteur }
  class Post { id = date-creneau; creneau; texte; hashtags; sources; statut; publieLe; url }
  class Rapport { date; resume; auteur }
  Entreprise "1" o-- "*" Contact
  Entreprise "1" -- "0..1" Candidature
  Candidature "1" *-- "*" Evenement
```
