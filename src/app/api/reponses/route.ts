import { lireBoiteGmail } from "@/lib/imap";
import { depot, session } from "@/lib/serveur";
import { chercherReponses } from "@/store/reponses";

export const dynamic = "force-dynamic";

/** Fenêtre de lecture : les messages reçus pendant les 30 derniers jours. */
const FENETRE_JOURS = 30;

/** Lit la boîte de réception et passe en « réponse » les candidatures qui ont reçu une réponse. Réservé à la session. */
export async function POST() {
  const s = await session();
  if (!s) return new Response("Non autorisé", { status: 401 });
  let messages;
  try {
    messages = await lireBoiteGmail(new Date(Date.now() - FENETRE_JOURS * 86_400_000));
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Lecture de la boîte impossible", { status: 502 });
  }
  return Response.json(await chercherReponses(depot(s.esp), messages));
}
