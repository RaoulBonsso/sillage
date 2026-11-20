import type { MessageRecu } from "@/domaine/reponses";

/** Décode les mots encodés RFC 2047 (`=?charset?Q|B?texte?=`) d'une valeur d'en-tête. */
function decoderMots(valeur: string): string {
  const sansEspaceEntreMots = valeur.replace(/(\?=)\s+(?==\?)/g, "$1");
  return sansEspaceEntreMots.replace(/=\?([^?]+)\?([QqBb])\?([^?]*)\?=/g, (brut, charset: string, codage: string, texte: string) => {
    try {
      const octets =
        codage.toUpperCase() === "B"
          ? Buffer.from(texte, "base64")
          : Buffer.from(
              texte.replace(/_/g, " ").replace(/=([0-9A-Fa-f]{2})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16))),
              "latin1",
            );
      return new TextDecoder(charset).decode(octets);
    } catch {
      return brut;
    }
  });
}

/** Les en-têtes (avant la première ligne vide), dépliés, indexés par nom en minuscules. */
function lireEntetes(brut: string): Map<string, string> {
  const entetes = new Map<string, string>();
  const lignes = brut.split(/\r?\n/);
  let courant: string | null = null;
  for (const ligne of lignes) {
    if (ligne === "") break;
    if (/^[ \t]/.test(ligne) && courant) {
      entetes.set(courant, `${entetes.get(courant)} ${ligne.trim()}`);
      continue;
    }
    const i = ligne.indexOf(":");
    if (i <= 0) {
      courant = null;
      continue;
    }
    courant = ligne.slice(0, i).trim().toLowerCase();
    if (!entetes.has(courant)) entetes.set(courant, ligne.slice(i + 1).trim());
    else courant = null;
  }
  return entetes;
}

const identifiants = (valeur: string | undefined) => valeur?.match(/<[^<>\s]+>/g) ?? [];

/**
 * Construit un `MessageRecu` à partir des en-têtes bruts d'un message (RFC 5322).
 * Retourne null sans `Message-ID` ou si la date est illisible : le message ne peut pas être rapproché.
 */
export function analyserEntetes(brut: string): MessageRecu | null {
  const e = lireEntetes(brut);
  const messageId = identifiants(e.get("message-id"))[0];
  if (!messageId) return null;
  const date = new Date(e.get("date") ?? "");
  if (Number.isNaN(date.getTime())) return null;
  return {
    messageId,
    enReponseA: [...new Set([...identifiants(e.get("in-reply-to")), ...identifiants(e.get("references"))])],
    de: decoderMots(e.get("from") ?? ""),
    objet: decoderMots(e.get("subject") ?? ""),
    recuLe: date.toISOString(),
  };
}
