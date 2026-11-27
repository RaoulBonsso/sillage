import { describe, expect, it } from "vitest";
import { MODELES_PAR_DEFAUT } from "@/domaine/modeles";
import { depotMemoire } from "./memoire";
import { enregistrerModeles, modelesDeLEspace, modelesEnregistres } from "./modeles";
import { revoquerCles, versionCles } from "./reglages";

const perso = [{ objet: "A", corps: "a" }, { objet: "B", corps: "b" }];

describe("modèles de relance d'un espace", () => {
  it("sont ceux par défaut tant que rien n'est enregistré", async () => {
    const d = depotMemoire();
    expect(await modelesEnregistres(d)).toBeNull();
    expect(await modelesDeLEspace(d)).toEqual(MODELES_PAR_DEFAUT);
  });

  it("sont relus après enregistrement, sans toucher à la version des clés", async () => {
    const d = depotMemoire();
    await revoquerCles(d);
    expect(await enregistrerModeles(d, perso)).toEqual({ ok: true, modeles: perso });
    expect(await modelesDeLEspace(d)).toEqual(perso);
    expect(await versionCles(d)).toBe(1);
  });

  it("n'écrivent rien quand un modèle est invalide", async () => {
    const d = depotMemoire();
    expect((await enregistrerModeles(d, [perso[0], { objet: "", corps: "b" }])).ok).toBe(false);
    expect(await modelesEnregistres(d)).toBeNull();
  });
});
