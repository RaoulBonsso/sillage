/**
 * Jetons signés HMAC-SHA256, sans état : `<payload base64url>.<signature>`.
 * Servent au lien magique (15 min), à la session (30 j) et aux clés MCP.
 * Révocation globale : changer SILLAGE_SECRET. Révocation d'une clé MCP :
 * incrémenter la version de l'espace (champ `v`).
 */
import { createHmac, timingSafeEqual, createHash } from "node:crypto";

export type Usage = "lien" | "session" | "mcp";

export interface Charge {
  u: Usage;
  email: string;
  esp: string;
  exp: number; // epoch secondes, 0 = sans expiration
  v?: number;
}

const b64 = (s: Buffer | string) => Buffer.from(s).toString("base64url");
const signer = (data: string, secret: string) => createHmac("sha256", secret).update(data).digest("base64url");

/** Identifiant d'espace stable et non réversible, dérivé de l'e-mail. */
export function espaceDe(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 20);
}

export function emettre(c: Charge, secret: string): string {
  const data = b64(JSON.stringify(c));
  return `${data}.${signer(data, secret)}`;
}

export function verifier(jeton: string, usage: Usage, secret: string, maintenant = Date.now()): Charge | null {
  const [data, sig] = jeton.split(".");
  if (!data || !sig) return null;
  const attendu = Buffer.from(signer(data, secret));
  const recu = Buffer.from(sig);
  if (attendu.length !== recu.length || !timingSafeEqual(attendu, recu)) return null;
  try {
    const c = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as Charge;
    if (c.u !== usage) return null;
    if (c.exp !== 0 && c.exp * 1000 < maintenant) return null;
    return c;
  } catch {
    return null;
  }
}

/** Liste blanche d'inscription : "*" = ouvert à tous, sinon e-mails séparés par des virgules. */
export function autorise(email: string, liste: string | undefined): boolean {
  if (!liste) return false;
  if (liste.trim() === "*") return true;
  const e = email.trim().toLowerCase();
  return liste.split(",").some((x) => x.trim().toLowerCase() === e);
}
