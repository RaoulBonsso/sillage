import { lireModeles, MODELES_PAR_DEFAUT, type LectureModeles, type ModeleEmail } from "@/domaine/modeles";
import type { Depot } from "./port";

/** Les modèles de relance personnalisés de l'espace, ou null s'il n'en a pas enregistré. */
export async function modelesEnregistres(depot: Depot): Promise<ModeleEmail[] | null> {
  const r = await depot.reglages.lire("modeles");
  return r?.id === "modeles" ? r.modeles : null;
}

/** Les modèles à utiliser : ceux de l'espace, sinon ceux par défaut. */
export async function modelesDeLEspace(depot: Depot): Promise<readonly ModeleEmail[]> {
  return (await modelesEnregistres(depot)) ?? MODELES_PAR_DEFAUT;
}

/** Valide puis enregistre ; un jeu invalide n'écrit rien. */
export async function enregistrerModeles(depot: Depot, valeur: unknown): Promise<LectureModeles> {
  const l = lireModeles(valeur);
  if (l.ok) await depot.reglages.ecrire({ id: "modeles", modeles: l.modeles });
  return l;
}
