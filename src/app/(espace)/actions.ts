"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { avancer } from "@/domaine/pipeline";
import { ETAPES, type Etape } from "@/domaine/types";
import { envoyer } from "@/lib/courriel";
import { emettre } from "@/lib/jeton";
import { COOKIE, exigerSession, secret } from "@/lib/serveur";

const maintenant = () => new Date().toISOString();

export async function changerEtape(id: string, etape: Etape, note = "") {
  const s = await exigerSession();
  if (!ETAPES.includes(etape)) throw new Error("Étape inconnue");
  const c = await s.depot.candidatures.lire(id);
  if (!c) throw new Error("Candidature introuvable");
  await s.depot.candidatures.ecrire(avancer(c, etape, maintenant(), note, "humain"));
  revalidatePath("/", "layout");
}

export async function noter(id: string, form: FormData) {
  const s = await exigerSession();
  const texte = String(form.get("texte") ?? "").trim();
  if (!texte) return;
  const c = await s.depot.candidatures.lire(id);
  if (!c) throw new Error("Candidature introuvable");
  const t = maintenant();
  await s.depot.candidatures.ecrire({ ...c, historique: [...c.historique, { date: t, type: "note", texte, auteur: "humain" }], majLe: t });
  revalidatePath(`/pipeline/${id}`);
}

/**
 * Envoie l'e-mail de candidature (ou de relance) au contact choisi, CV en
 * pièce jointe, puis fait avancer la candidature. C'est le seul chemin par
 * lequel un message part : il exige une session humaine.
 */
export async function envoyerCandidature(id: string, form: FormData): Promise<{ ok: boolean; message: string }> {
  const s = await exigerSession();
  const c = await s.depot.candidatures.lire(id);
  if (!c) return { ok: false, message: "Candidature introuvable" };
  const relance = c.etape === "envoyee" || c.etape === "relancee";
  if (!relance && c.etape !== "preparee") return { ok: false, message: "Cette candidature n'est pas à envoyer." };
  const a = String(form.get("a") ?? "").trim();
  const objet = String(form.get("objet") ?? "").trim();
  const texte = String(form.get("texte") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a) || !objet || !texte) return { ok: false, message: "Destinataire, objet et message sont requis." };
  const cv = !relance && c.dossier.cv ? await s.depot.fichiers.lire(c.dossier.cv) : null;
  try {
    await envoyer({ a, objet, texte, pieces: cv ? [{ nom: cv.nom, type: cv.type, donnees: Buffer.from(cv.donnees, "base64") }] : [] });
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
  await s.depot.candidatures.ecrire(avancer(c, relance ? "relancee" : "envoyee", maintenant(), `${relance ? "Relance" : "Candidature"} envoyée à ${a} — « ${objet} »`, "humain"));
  revalidatePath("/", "layout");
  return { ok: true, message: relance ? "Relance envoyée." : "Candidature envoyée." };
}

export async function majPost(id: string, texte: string) {
  const s = await exigerSession();
  const p = await s.depot.posts.lire(id);
  if (!p) throw new Error("Post introuvable");
  await s.depot.posts.ecrire({ ...p, texte });
  revalidatePath("/linkedin");
}

export async function statutPost(id: string, statut: "a_publier" | "publie" | "ignore", url?: string) {
  const s = await exigerSession();
  const p = await s.depot.posts.lire(id);
  if (!p) throw new Error("Post introuvable");
  await s.depot.posts.ecrire({ ...p, statut, publieLe: statut === "publie" ? maintenant() : null, url: url || p.url });
  revalidatePath("/", "layout");
}

/** Clé MCP sans expiration, liée à l'espace. Affichée une seule fois. */
export async function creerCleMcp(): Promise<string> {
  const s = await exigerSession();
  return emettre({ u: "mcp", email: s.email, esp: s.esp, exp: 0 }, secret());
}

export async function deconnexion() {
  (await cookies()).delete(COOKIE);
  redirect("/");
}
