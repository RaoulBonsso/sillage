import { apercuSauvegarde, type Sauvegarde, type Volumes } from "@/domaine/sauvegarde";
import type { Depot } from "./port";

/**
 * Écrit une sauvegarde déjà validée dans l'espace : les documents de même
 * identifiant sont écrasés, les autres sont conservés. Les réglages (version
 * des clés MCP) ne sont jamais touchés.
 */
export async function restaurer(depot: Depot, s: Sauvegarde): Promise<Volumes> {
  const d = s.donnees;
  await Promise.all([
    ...d.entreprises.map((x) => depot.entreprises.ecrire(x)),
    ...d.candidatures.map((x) => depot.candidatures.ecrire(x)),
    ...d.posts.map((x) => depot.posts.ecrire(x)),
    ...d.rapports.map((x) => depot.rapports.ecrire(x)),
    ...d.fichiers.map((x) => depot.fichiers.ecrire(x)),
  ]);
  return apercuSauvegarde(s);
}
