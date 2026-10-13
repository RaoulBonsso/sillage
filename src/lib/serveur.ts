import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifier, type Charge } from "./jeton";
import { depotFirestore } from "@/store/firestore";
import { depotMemoire } from "@/store/memoire";
import type { Depot } from "@/store/port";

export const COOKIE = "sillage_session";

export function secret(): string {
  const s = process.env.SILLAGE_SECRET;
  if (!s || s.length < 32) throw new Error("SILLAGE_SECRET manquant ou trop court (32 caractères minimum)");
  return s;
}

const memoire = new Map<string, Depot>();

/** Firestore en production ; mémoire en local quand aucune clé n'est configurée. */
export function depot(espace: string): Depot {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) return depotFirestore(espace);
  let d = memoire.get(espace);
  if (!d) memoire.set(espace, (d = depotMemoire()));
  return d;
}

export async function session(): Promise<Charge | null> {
  const j = (await cookies()).get(COOKIE)?.value;
  return j ? verifier(j, "session", secret()) : null;
}

/** À appeler en tête de chaque page et action de l'espace privé. */
export async function exigerSession() {
  const s = await session();
  if (!s) redirect("/connexion");
  return { ...s, depot: depot(s.esp) };
}

export async function origine(): Promise<string> {
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (hote.startsWith("localhost") ? "http" : "https");
  return `${proto}://${hote}`;
}

export const aujourdhui = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
