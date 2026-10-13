#!/usr/bin/env node
/**
 * Importe un journal d'agents dans Sillage via son propre serveur MCP.
 *
 *   SILLAGE_URL=https://… SILLAGE_CLE=… node scripts/importer.mjs ~/…/journal/2026-10-13
 *
 * Idempotent : une cible existante est mise à jour, une candidature existante
 * n'est pas recréée, un post est remplacé (même date + créneau).
 */
import { readFile, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import { lireEmail } from "./email.mjs";

const [dossier] = process.argv.slice(2);
const URL_BASE = (process.env.SILLAGE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const CLE = process.env.SILLAGE_CLE;
if (!dossier || !CLE) {
  console.error("Usage : SILLAGE_CLE=… [SILLAGE_URL=…] node scripts/importer.mjs <dossier-du-journal>");
  process.exit(1);
}
const jour = basename(dossier);
const auth = { Authorization: `Bearer ${CLE}` };
let n = 0;

async function outil(name, args) {
  const r = await fetch(`${URL_BASE}/api/mcp`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++n, method: "tools/call", params: { name, arguments: args } }),
  });
  const j = await r.json();
  if (j.error) throw new Error(`${name} : ${j.error.message}`);
  const texte = j.result.content[0].text;
  return { erreur: j.result.isError ? texte : null, valeur: j.result.isError ? null : JSON.parse(texte) };
}

const lire = (p) => readFile(p, "utf8").catch(() => "");
const existe = (p) => stat(p).then(() => true, () => false);

const cibles = JSON.parse((await lire(join(dossier, "cibles.json"))) || "[]");
const bilan = { cibles: 0, candidatures: 0, deja: 0, posts: 0, erreurs: [] };

for (const c of cibles) {
  const { dossier: rel, ...cible } = c;
  const r = await outil("sillage_ajouter_cible", cible);
  if (r.erreur) { bilan.erreurs.push(`${c.nom} : ${r.erreur}`); continue; }
  bilan.cibles++;
  if (!rel) continue;
  const d = join(dossier, rel);
  let cv = "";
  if (await existe(join(d, "cv.pdf"))) {
    cv = `cv-${String(c.id).replace(/[^\w.-]/g, "-")}.pdf`;
    const pdf = await readFile(join(d, "cv.pdf"));
    const u = await fetch(`${URL_BASE}/api/fichiers?id=${encodeURIComponent(cv)}&nom=${encodeURIComponent("CV_Raoul_Bonsso.pdf")}`, { method: "PUT", headers: { ...auth, "Content-Type": "application/pdf" }, body: pdf });
    if (!u.ok) { bilan.erreurs.push(`${c.nom} : CV refusé (${u.status})`); cv = ""; }
  }
  const p = await outil("sillage_preparer_candidature", {
    entrepriseId: String(c.id),
    dossier: { cv, lettre: await lire(join(d, "lettre.md")), email: lireEmail(await lire(join(d, "email.md"))), miniProjet: await lire(join(d, "mini-projet.md")) },
  });
  if (p.erreur?.includes("déjà existante")) bilan.deja++;
  else if (p.erreur) bilan.erreurs.push(`${c.nom} : ${p.erreur}`);
  else bilan.candidatures++;
}

const posts = JSON.parse((await lire(join(dossier, "linkedin.json"))) || "[]");
for (const p of posts) {
  const r = await outil("sillage_ajouter_post", p);
  if (r.erreur) bilan.erreurs.push(`post ${p.creneau} : ${r.erreur}`);
  else bilan.posts++;
}

const rapport = await lire(join(dossier, "rapport.md"));
if (rapport) await outil("sillage_ecrire_rapport", { date: jour, resume: rapport, auteur: "agents" });

console.log(JSON.stringify(bilan, null, 2));
if (bilan.erreurs.length) process.exitCode = 2;
