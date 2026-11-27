import { lireModeles, type ModeleEmail } from "./modeles";
import type { Candidature, Entreprise, Post, Rapport } from "./types";

/**
 * Sauvegarde complète d'un espace (réversibilité) : un JSON versionné.
 * La version des clés MCP n'en fait jamais partie : restaurer une sauvegarde
 * ne doit pas ressusciter des clés révoquées. Seul réglage embarqué : les
 * modèles de relance, s'ils ont été personnalisés.
 */
export const FORMAT_SAUVEGARDE = "sillage-espace";
export const VERSION_SAUVEGARDE = 1;

export interface FichierSauvegarde {
  id: string;
  nom: string;
  type: string;
  donnees: string;
}

export interface DonneesEspace {
  entreprises: Entreprise[];
  candidatures: Candidature[];
  posts: Post[];
  rapports: (Rapport & { id: string })[];
  fichiers: FichierSauvegarde[];
  /** Absent des sauvegardes antérieures et des espaces aux modèles par défaut. */
  modeles?: ModeleEmail[];
}

export interface Sauvegarde {
  format: typeof FORMAT_SAUVEGARDE;
  version: number;
  exporteLe: string;
  donnees: DonneesEspace;
}

const COLLECTIONS_SAUVEGARDEES = ["entreprises", "candidatures", "posts", "rapports", "fichiers"] as const;

export function construireSauvegarde(donnees: DonneesEspace, exporteLe: string): Sauvegarde {
  const propres = Object.fromEntries(COLLECTIONS_SAUVEGARDEES.map((c) => [c, donnees[c]])) as unknown as DonneesEspace;
  if (donnees.modeles) propres.modeles = donnees.modeles;
  return { format: FORMAT_SAUVEGARDE, version: VERSION_SAUVEGARDE, exporteLe, donnees: propres };
}

export type Volumes = Record<(typeof COLLECTIONS_SAUVEGARDEES)[number] | "modeles", number>;

/** Nombre de documents par collection (et de modèles) : l'aperçu montré avant de restaurer. */
export function apercuSauvegarde(s: Sauvegarde): Volumes {
  const collections = Object.fromEntries(COLLECTIONS_SAUVEGARDEES.map((c) => [c, s.donnees[c].length]));
  return { ...collections, modeles: s.donnees.modeles?.length ?? 0 } as Volumes;
}

export type LectureSauvegarde ={ ok: true; sauvegarde: Sauvegarde } | { ok: false; erreur: string };

const objet = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Relit et valide un fichier de sauvegarde ; ne touche à rien. */
export function lireSauvegarde(texte: string): LectureSauvegarde {
  let brut: unknown;
  try {
    brut = JSON.parse(texte);
  } catch {
    return { ok: false, erreur: "Fichier illisible : ce n'est pas du JSON." };
  }
  if (!objet(brut) || brut.format !== FORMAT_SAUVEGARDE) return { ok: false, erreur: "Ce fichier n'est pas une sauvegarde Sillage." };
  if (typeof brut.version !== "number" || brut.version < 1 || brut.version > VERSION_SAUVEGARDE) {
    return { ok: false, erreur: `Version de sauvegarde non prise en charge : ${String(brut.version)}.` };
  }
  if (!objet(brut.donnees)) return { ok: false, erreur: "Sauvegarde sans données." };
  const sortie: Record<string, unknown[]> = {};
  for (const c of COLLECTIONS_SAUVEGARDEES) {
    const docs = brut.donnees[c];
    if (!Array.isArray(docs)) return { ok: false, erreur: `Collection manquante : ${c}.` };
    const ids = new Set<string>();
    for (const d of docs) {
      if (!objet(d) || typeof d.id !== "string" || d.id === "") return { ok: false, erreur: `Document sans identifiant dans ${c}.` };
      if (ids.has(d.id)) return { ok: false, erreur: `Identifiant dupliqué dans ${c} : ${d.id}.` };
      ids.add(d.id);
    }
    sortie[c] = docs;
  }
  if (brut.donnees.modeles !== undefined) {
    const m = lireModeles(brut.donnees.modeles);
    if (!m.ok) return m;
    sortie.modeles = m.modeles;
  }
  return {
    ok: true,
    sauvegarde: {
      format: FORMAT_SAUVEGARDE,
      version: brut.version,
      exporteLe: typeof brut.exporteLe === "string" ? brut.exporteLe : "",
      donnees: sortie as unknown as DonneesEspace,
    },
  };
}
