/**
 * Contrat d'échange avec les agents. Chaque jour, les agents déposent un
 * journal (cibles.json, linkedin.json, candidatures/<slug>/…, rapport.md).
 * Ces schémas sont la frontière : tout ce qui entre est validé ici.
 */
import { z } from "zod";
import { CRENEAUX, type Entreprise, type Post } from "./types";

const url = z.string().url();

const contact = z.object({
  nom: z.string().min(1),
  role: z.string().default(""),
  email: z.string().default(""),
  confiance: z.enum(["verifie", "devine", ""]).default(""),
  linkedin: z.string().default(""),
  source: z.string().default(""),
});

export const schemaCible = z.object({
  id: z.coerce.string().min(1),
  nom: z.string().min(1),
  ville: z.string().default(""),
  secteur: z.string().default(""),
  naf: z.string().default(""),
  effectif: z.string().default(""),
  site: z.string().default(""),
  signal: z.object({ texte: z.string().min(1), source: url }),
  angle: z.string().default(""),
  score: z.number().default(0).transform((s) => Math.max(0, Math.min(100, Math.round(s)))),
  contacts: z.array(contact).default([]),
  dossier: z.string().optional(),
});

export const schemaPost = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  creneau: z.enum(CRENEAUX),
  heure: z.string().default(""),
  titre: z.string().default(""),
  texte: z.string().min(1),
  hashtags: z.array(z.string()).default([]),
  sources: z.array(z.object({ titre: z.string().optional(), url })).default([]),
  projet: z.string().nullable().default(null),
  statut: z.enum(["a_publier", "publie", "ignore"]).default("a_publier"),
});

export function lireCibles(brut: unknown, jour: string): (Entreprise & { dossier?: string })[] {
  return z.array(schemaCible).parse(brut).map((c) => ({ ...c, ajouteeLe: jour }));
}

export function lirePosts(brut: unknown): Post[] {
  return z
    .array(schemaPost)
    .parse(brut)
    .map((p) => ({ ...p, id: `${p.date}-${p.creneau}`, publieLe: null, url: null }));
}
