import { autorise, emettre, espaceDe } from "@/lib/jeton";
import { envoyer } from "@/lib/courriel";
import { creerLimiteur } from "@/domaine/limite";
import { ipClient, origine, secret, tropDeRequetes } from "@/lib/serveur";

// Meilleur effort : les compteurs vivent dans la mémoire de l'instance serveur.
const parIp = creerLimiteur({ max: 10, fenetreMs: 15 * 60_000 });
const parEmail = creerLimiteur({ max: 3, fenetreMs: 15 * 60_000 });

/** Reçoit un e-mail, envoie un lien de connexion valable 15 minutes. Réponse identique que l'e-mail soit autorisé ou non. */
export async function POST(req: Request) {
  const v = parIp.essayer(ipClient(req));
  if (!v.autorise) return tropDeRequetes(v.reessayerDansS);
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  // Au-delà de 3 demandes par adresse, on répond comme d'habitude mais sans envoyer (pas de bombardement, pas d'indice).
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && parEmail.essayer(email).autorise && autorise(email, process.env.SILLAGE_INSCRIPTIONS)) {
    const j = emettre({ u: "lien", email, esp: espaceDe(email), exp: Math.floor(Date.now() / 1000) + 900 }, secret());
    const lien = `${await origine()}/api/auth/verifier?t=${encodeURIComponent(j)}`;
    await envoyer({ a: email, objet: "Votre lien de connexion à Sillage", texte: `Bonjour,\n\nVoici votre lien de connexion (valable 15 minutes) :\n${lien}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.\n\n— Sillage` });
  }
  return Response.redirect(new URL("/connexion?envoye=1", req.url), 303);
}
