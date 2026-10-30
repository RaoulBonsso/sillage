import { cleActive, type Charge } from "@/lib/jeton";
import type { Depot } from "./port";

/** Version courante des clés MCP de l'espace ; 0 tant qu'aucune révocation n'a eu lieu. */
export async function versionCles(depot: Depot): Promise<number> {
  return (await depot.reglages.lire("cles"))?.version ?? 0;
}

/** Vrai si la clé MCP porte la version courante de l'espace (donc n'a pas été révoquée). */
export async function cleMcpValide(depot: Depot, c: Charge): Promise<boolean> {
  return cleActive(c, await versionCles(depot));
}

/** Incrémente la version : toute clé émise avant devient périmée. Renvoie la nouvelle version. */
export async function revoquerCles(depot: Depot): Promise<number> {
  const version = (await versionCles(depot)) + 1;
  await depot.reglages.ecrire({ id: "cles", version });
  return version;
}
