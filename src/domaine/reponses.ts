import { avancer, transitionsPossibles } from "./pipeline";
import type { Candidature, Entreprise } from "./types";

/** Un message reçu, réduit à ce dont la règle a besoin (le lecteur IMAP le construit). */
export interface MessageRecu {
  messageId: string;
  /** Identifiants des en-têtes `In-Reply-To` et `References`. */
  enReponseA: string[];
  /** Expéditeur brut : « Nom <adresse> » ou simple adresse. */
  de: string;
  objet: string;
  recuLe: string; // ISO 8601
}

export interface Rapprochement {
  candidatureId: string;
  raison: "fil" | "expediteur";
}

const normaliserId = (id: string) => id.trim().replace(/^<|>$/g, "").trim().toLowerCase();

function adresse(de: string): string {
  const m = de.match(/<([^>]+)>/);
  return (m ? m[1] : de).trim().toLowerCase();
}

/** Une candidature peut recevoir une réponse si elle a été envoyée avant le message et que « réponse » est une transition permise. */
function peutRecevoir(c: Candidature, m: MessageRecu): boolean {
  return c.envoyeeLe !== null && c.envoyeeLe <= m.recuLe && transitionsPossibles(c.etape).includes("reponse");
}

/**
 * Retrouve la candidature à laquelle un message répond : d'abord par le fil
 * (identifiant d'envoi consigné dans l'historique), sinon par l'adresse du contact.
 * Retourne null si rien ne correspond ou si l'expéditeur est ambigu.
 */
export function rapprocherReponse(m: MessageRecu, candidatures: Candidature[], entreprises: Entreprise[]): Rapprochement | null {
  const eligibles = candidatures.filter((c) => peutRecevoir(c, m));

  const fil = new Set(m.enReponseA.map(normaliserId));
  if (fil.size > 0) {
    const parFil = eligibles.filter((c) => c.historique.some((e) => e.messageId && fil.has(normaliserId(e.messageId))));
    if (parFil.length === 1) return { candidatureId: parFil[0].id, raison: "fil" };
    if (parFil.length > 1) return null;
  }

  const expediteur = adresse(m.de);
  if (!expediteur) return null;
  const parExpediteur = eligibles.filter((c) => {
    const contact = entreprises.find((e) => e.id === c.entrepriseId)?.contacts[c.contactIndex];
    return !!contact?.email && contact.email.trim().toLowerCase() === expediteur;
  });
  return parExpediteur.length === 1 ? { candidatureId: parExpediteur[0].id, raison: "expediteur" } : null;
}

/** Passe la candidature en « réponse » (acteur : agent). Idempotente sur l'identifiant du message. */
export function enregistrerReponse(c: Candidature, m: MessageRecu): Candidature {
  if (c.historique.some((e) => e.messageId === m.messageId)) return c;
  return avancer(c, "reponse", m.recuLe, `Réponse reçue : « ${m.objet} »`, "agent", m.messageId);
}
