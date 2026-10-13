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
  // Sans CV adapté, on joint le CV principal de l'espace (fichier « cv-principal.pdf »).
  const cv = relance ? null : await s.depot.fichiers.lire(c.dossier.cv || "cv-principal.pdf");
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

/** Ajoute une entreprise trouvée dans les registres officiels ; les dirigeants deviennent des contacts sourcés. */
export async function ajouterDepuisRegistre(siren: string, form: FormData) {
  const s = await exigerSession();
  const { fiche } = await import("@/lib/officiel");
  const { liensOfficiels, SECTEURS } = await import("@/domaine/officiel");
  const f = await fiche(siren);
  if (!f) throw new Error("Entreprise introuvable dans le registre");
  const source = liensOfficiels(siren)[0].url;
  const secteur = SECTEURS.find((x) => x.naf === f.naf)?.libelle ?? `NAF ${f.naf}`;
  const raison = String(form.get("raison") ?? "").trim();
  const existante = await s.depot.entreprises.lire(siren);
  await s.depot.entreprises.ecrire({
    id: siren,
    nom: f.nom,
    ville: f.ville,
    secteur,
    naf: f.naf,
    effectif: f.effectif,
    site: existante?.site ?? "",
    signal: { texte: raison || `Repérée dans l'annuaire officiel : ${secteur.toLowerCase()} à ${f.ville}, ${f.effectif.toLowerCase()}.`, source },
    angle: existante?.angle ?? "",
    score: existante?.score ?? Math.min(100, Math.max(0, Number(form.get("score") ?? 50) || 50)),
    contacts: existante?.contacts.length ? existante.contacts : f.dirigeants.filter((d) => d.personne === "physique").map((d) => ({ nom: d.nom, role: d.qualite, email: "", confiance: "" as const, linkedin: "", source })),
    ajouteeLe: existante?.ajouteeLe ?? new Date().toISOString().slice(0, 10),
  });
  revalidatePath("/cibles", "layout");
}

/** Démarre une candidature à la main (sans agent) : un brouillon d'e-mail à compléter avant envoi. */
export async function demarrerCandidature(entrepriseId: string) {
  const s = await exigerSession();
  const e = await s.depot.entreprises.lire(entrepriseId);
  if (!e) throw new Error("Entreprise introuvable");
  if (!(await s.depot.candidatures.lire(entrepriseId))) {
    const { nouvelleCandidature } = await import("@/domaine/pipeline");
    const k = e.contacts[0];
    const corps = `Bonjour${k ? ` ${k.nom}` : ""},\n\n[Pourquoi ${e.nom}, en une phrase concrète.]\n\n[Ce que vous pouvez leur apporter dès les premières semaines.]\n\nPouvons-nous en parler 15 minutes, à votre convenance ?\n\nBien cordialement,\n${process.env.SILLAGE_EXPEDITEUR ?? ""}`;
    await s.depot.candidatures.ecrire(nouvelleCandidature(entrepriseId, { cv: "", lettre: "", email: { objet: "Candidature spontanée — alternance", corps }, miniProjet: "" }, new Date().toISOString(), "humain"));
  }
  redirect(`/pipeline/${entrepriseId}`);
}
