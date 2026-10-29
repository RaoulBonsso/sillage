import type { Depot } from "./port";

/** Version courante des clés MCP de l'espace ; 0 tant qu'aucune révocation n'a eu lieu. */
export async function versionCles(depot: Depot): Promise<number> {
  return (await depot.reglages.lire("cles"))?.version ?? 0;
}

/** Incrémente la version : toute clé émise avant devient périmée. Renvoie la nouvelle version. */
export async function revoquerCles(depot: Depot): Promise<number> {
  const version = (await versionCles(depot)) + 1;
  await depot.reglages.ecrire({ id: "cles", version });
  return version;
}
