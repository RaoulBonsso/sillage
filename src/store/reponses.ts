import { enregistrerReponse, rapprocherReponse, type MessageRecu } from "@/domaine/reponses";
import type { Depot } from "./port";

export interface BilanReponses {
  /** Messages examinés. */
  lus: number;
  enregistrees: { candidatureId: string; messageId: string }[];
  /** Messages sans candidature correspondante (ou déjà traités). */
  ignores: number;
}

/**
 * Applique la règle de rapprochement à des messages reçus : chaque réponse
 * reconnue fait passer sa candidature en « réponse ». Idempotente (le message
 * déjà consigné dans l'historique est ignoré), et le lot est traité message
 * par message : une candidature déjà en « réponse » ne reçoit pas de second passage.
 */
export async function chercherReponses(depot: Depot, messages: MessageRecu[]): Promise<BilanReponses> {
  const [entreprises, candidatures] = await Promise.all([depot.entreprises.lister(), depot.candidatures.lister()]);
  const bilan: BilanReponses = { lus: messages.length, enregistrees: [], ignores: 0 };
  const ordonnes = [...messages].sort((a, b) => a.recuLe.localeCompare(b.recuLe));

  for (const m of ordonnes) {
    const r = rapprocherReponse(m, candidatures, entreprises);
    const i = r ? candidatures.findIndex((c) => c.id === r.candidatureId) : -1;
    if (!r || i === -1) {
      bilan.ignores++;
      continue;
    }
    const maj = enregistrerReponse(candidatures[i], m);
    if (maj === candidatures[i]) {
      bilan.ignores++;
      continue;
    }
    await depot.candidatures.ecrire(maj);
    candidatures[i] = maj;
    bilan.enregistrees.push({ candidatureId: r.candidatureId, messageId: m.messageId });
  }
  return bilan;
}
