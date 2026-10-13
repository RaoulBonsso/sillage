/**
 * Le vocabulaire de Sillage. Tout le reste de l'application parle ces types :
 * l'interface, le serveur MCP, les agents et l'import des journaux.
 */

export const ETAPES = [
  "reperee",
  "preparee",
  "envoyee",
  "relancee",
  "reponse",
  "entretien",
  "offre",
  "signee",
  "refusee",
  "close",
] as const;
export type Etape = (typeof ETAPES)[number];

export const CRENEAUX = ["matin", "midi", "soir"] as const;
export type Creneau = (typeof CRENEAUX)[number];

export type Confiance = "verifie" | "devine" | "";

export interface Source {
  texte?: string;
  titre?: string;
  url: string;
}

export interface Contact {
  nom: string;
  role: string;
  email: string;
  confiance: Confiance;
  linkedin: string;
  source: string;
}

export interface Entreprise {
  id: string;
  nom: string;
  ville: string;
  secteur: string;
  naf: string;
  effectif: string;
  site: string;
  signal: { texte: string; source: string };
  angle: string;
  score: number;
  contacts: Contact[];
  ajouteeLe: string;
}

export type TypeEvenement =
  | "reperage"
  | "preparation"
  | "envoi"
  | "relance"
  | "reponse"
  | "entretien"
  | "offre"
  | "signature"
  | "refus"
  | "cloture"
  | "note";

export interface Evenement {
  date: string; // ISO 8601
  type: TypeEvenement;
  texte: string;
  auteur: "humain" | "agent";
}

export interface Dossier {
  cv: string;
  lettre: string;
  email: { objet: string; corps: string };
  miniProjet: string;
}

export interface Candidature {
  id: string;
  entrepriseId: string;
  contactIndex: number;
  etape: Etape;
  dossier: Dossier;
  envoyeeLe: string | null;
  relances: number;
  prochaineRelance: string | null; // AAAA-MM-JJ
  historique: Evenement[];
  majLe: string;
}

export type StatutPost = "a_publier" | "publie" | "ignore";

export interface Post {
  id: string;
  date: string; // AAAA-MM-JJ
  creneau: Creneau;
  heure: string;
  titre: string;
  texte: string;
  hashtags: string[];
  sources: Source[];
  projet: string | null;
  statut: StatutPost;
  publieLe: string | null;
  url: string | null;
}

export interface Rapport {
  date: string; // AAAA-MM-JJ
  resume: string; // markdown
  auteur: string;
}
