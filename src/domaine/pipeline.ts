import { ajouterJoursOuvres } from "./jours-ouvres";
import type { Candidature, Dossier, Etape, TypeEvenement } from "./types";

/** Délais de relance, en jours ouvrés : J+5 après l'envoi, J+7 après la 1re relance. */
export const DELAIS_RELANCE = [5, 7] as const;

/** Transitions autorisées. Tout ce qui n'est pas listé est refusé. */
const TRANSITIONS: Record<Etape, readonly Etape[]> = {
  reperee: ["preparee", "close"],
  preparee: ["envoyee", "close"],
  envoyee: ["relancee", "reponse", "entretien", "refusee", "close"],
  relancee: ["relancee", "reponse", "entretien", "refusee", "close"],
  reponse: ["entretien", "offre", "refusee", "close"],
  entretien: ["entretien", "offre", "refusee", "close"],
  offre: ["signee", "refusee", "close"],
  signee: [],
  refusee: ["close"],
  close: [],
};

const EVENEMENT: Record<Etape, TypeEvenement> = {
  reperee: "reperage",
  preparee: "preparation",
  envoyee: "envoi",
  relancee: "relance",
  reponse: "reponse",
  entretien: "entretien",
  offre: "offre",
  signee: "signature",
  refusee: "refus",
  close: "cloture",
};

export const LIBELLES: Record<Etape, string> = {
  reperee: "Repérée",
  preparee: "Préparée",
  envoyee: "Envoyée",
  relancee: "Relancée",
  reponse: "Réponse",
  entretien: "Entretien",
  offre: "Offre",
  signee: "Signée",
  refusee: "Refus",
  close: "Close",
};

export function transitionsPossibles(etape: Etape): readonly Etape[] {
  return TRANSITIONS[etape];
}

export function nouvelleCandidature(entrepriseId: string, dossier: Dossier, maintenant: string, auteur: "humain" | "agent" = "agent"): Candidature {
  return {
    id: entrepriseId,
    entrepriseId,
    contactIndex: 0,
    etape: "preparee",
    dossier,
    envoyeeLe: null,
    relances: 0,
    prochaineRelance: null,
    historique: [{ date: maintenant, type: "preparation", texte: "Dossier préparé (CV, lettre, e-mail, mini-projet).", auteur }],
    majLe: maintenant,
  };
}

export function avancer(
  c: Candidature,
  vers: Etape,
  maintenant: string,
  texte = "",
  auteur: "humain" | "agent" = "humain",
): Candidature {
  if (!TRANSITIONS[c.etape].includes(vers)) {
    throw new Error(`Transition refusée : ${c.etape} → ${vers}`);
  }
  const suite: Candidature = {
    ...c,
    etape: vers,
    historique: [...c.historique, { date: maintenant, type: EVENEMENT[vers], texte: texte || LIBELLES[vers], auteur }],
    majLe: maintenant,
  };
  if (vers === "envoyee") {
    suite.envoyeeLe = maintenant;
    suite.prochaineRelance = ajouterJoursOuvres(maintenant, DELAIS_RELANCE[0]);
  } else if (vers === "relancee") {
    suite.relances = c.relances + 1;
    const delai = DELAIS_RELANCE[suite.relances];
    suite.prochaineRelance = delai ? ajouterJoursOuvres(maintenant, delai) : null;
  } else {
    suite.prochaineRelance = null;
  }
  return suite;
}

export function enRetard(c: Candidature, aujourdhui: string): boolean {
  return c.prochaineRelance !== null && c.prochaineRelance < aujourdhui;
}

export function relancesDues(liste: Candidature[], aujourdhui: string): Candidature[] {
  return liste
    .filter((c) => c.prochaineRelance !== null && c.prochaineRelance <= aujourdhui)
    .sort((a, b) => (a.prochaineRelance! < b.prochaineRelance! ? -1 : 1));
}
