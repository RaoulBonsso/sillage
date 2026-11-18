import { apercuSauvegarde, lireSauvegarde, type Volumes } from "@/domaine/sauvegarde";
import type { Depot } from "./port";
import { restaurer } from "./restauration";

export type ResultatImport = { ok: true; volumes: Volumes } | { ok: false; erreur: string };

/** Valide le fichier et compte les documents, sans rien écrire. */
export function apercuImport(texte: string): ResultatImport {
  const l = lireSauvegarde(texte);
  return l.ok ? { ok: true, volumes: apercuSauvegarde(l.sauvegarde) } : l;
}

/** Valide puis restaure ; un fichier invalide n'écrit rien. */
export async function importer(depot: Depot, texte: string): Promise<ResultatImport> {
  const l = lireSauvegarde(texte);
  if (!l.ok) return l;
  return { ok: true, volumes: await restaurer(depot, l.sauvegarde) };
}
