import type { Contact, Entreprise } from "./types";

/** Pondérations visibles du score de cible (total : 100). */
export const PONDERATIONS = {
  signal: 30,
  contact: 25,
  angle: 15,
  site: 10,
  effectif: 10,
  secteur: 10,
} as const;

export type CleCritere = keyof typeof PONDERATIONS;

export interface Critere {
  cle: CleCritere;
  libelle: string;
  points: number;
  max: number;
  raison: string;
}

export interface ScoreExplique {
  total: number;
  criteres: Critere[];
}

const rempli = (s: string) => s.trim() !== "";

function critereContact(contacts: Contact[]): { points: number; raison: string } {
  const max = PONDERATIONS.contact;
  if (contacts.some((c) => rempli(c.email) && c.confiance === "verifie")) {
    return { points: max, raison: "Contact avec e-mail vérifié" };
  }
  if (contacts.some((c) => rempli(c.email))) {
    return { points: Math.round(max * 0.6), raison: "E-mail de contact deviné, non vérifié" };
  }
  if (contacts.length > 0) {
    return { points: Math.round(max * 0.2), raison: "Contact identifié mais sans e-mail" };
  }
  return { points: 0, raison: "Aucun contact identifié" };
}

/** Décompose le score d'une cible critère par critère : chaque point est justifié. */
export function expliquerScore(e: Entreprise): ScoreExplique {
  const { signal } = e;
  const signalPts =
    rempli(signal.texte) && rempli(signal.source)
      ? { points: PONDERATIONS.signal, raison: "Signal d'embauche ou de besoin, sourcé" }
      : rempli(signal.texte)
        ? { points: PONDERATIONS.signal / 2, raison: "Signal sans source vérifiable" }
        : { points: 0, raison: "Aucun signal repéré" };

  const simple = (cle: "angle" | "site" | "effectif" | "secteur", valeur: string, oui: string, non: string) => ({
    points: rempli(valeur) ? PONDERATIONS[cle] : 0,
    raison: rempli(valeur) ? oui : non,
  });

  const detail: Record<CleCritere, { libelle: string; points: number; raison: string }> = {
    signal: { libelle: "Signal", ...signalPts },
    contact: { libelle: "Contact", ...critereContact(e.contacts) },
    angle: { libelle: "Angle d'approche", ...simple("angle", e.angle, "Angle d'approche défini", "Pas d'angle d'approche") },
    site: { libelle: "Site", ...simple("site", e.site, "Site web renseigné", "Site web inconnu") },
    effectif: { libelle: "Effectif", ...simple("effectif", e.effectif, "Effectif connu", "Effectif inconnu") },
    secteur: { libelle: "Secteur", ...simple("secteur", e.secteur, "Secteur connu", "Secteur inconnu") },
  };

  const criteres = (Object.keys(PONDERATIONS) as CleCritere[]).map((cle) => ({
    cle,
    max: PONDERATIONS[cle],
    ...detail[cle],
  }));
  return { total: criteres.reduce((s, c) => s + c.points, 0), criteres };
}
