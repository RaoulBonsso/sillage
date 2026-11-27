import { apercuSauvegarde, type Sauvegarde, type Volumes } from "@/domaine/sauvegarde";
import { enregistrerModeles } from "./modeles";
import type { Depot } from "./port";

/**
 * Écrit une sauvegarde déjà validée dans l'espace : les documents de même
 * identifiant sont écrasés, les autres sont conservés. Les modèles de relance
 * ne sont remplacés que si la sauvegarde en contient ; la version des clés MCP
 * n'est jamais touchée.
 */
export async function restaurer(depot: Depot, s: Sauvegarde): Promise<Volumes> {
  const d = s.donnees;
  await Promise.all([
    ...d.entreprises.map((x) => depot.entreprises.ecrire(x)),
    ...d.candidatures.map((x) => depot.candidatures.ecrire(x)),
    ...d.posts.map((x) => depot.posts.ecrire(x)),
    ...d.rapports.map((x) => depot.rapports.ecrire(x)),
    ...d.fichiers.map((x) => depot.fichiers.ecrire(x)),
    ...(d.modeles ? [enregistrerModeles(depot, d.modeles)] : []),
  ]);
  return apercuSauvegarde(s);
}
