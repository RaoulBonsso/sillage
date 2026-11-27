import { describe, expect, it } from "vitest";
import { construireSauvegarde, lireSauvegarde } from "@/domaine/sauvegarde";
import { depotMemoire } from "./memoire";
import { restaurer } from "./restauration";
import { enregistrerModeles, modelesEnregistres } from "./modeles";
import { revoquerCles, versionCles } from "./reglages";

const donnees = {
  entreprises: [{ id: "123456789", nom: "Acme" }],
  candidatures: [{ id: "123456789", entrepriseId: "123456789" }],
  posts: [{ id: "p1" }],
  rapports: [{ id: "2026-11-14", date: "2026-11-14", resume: "ok", auteur: "rapporteur" }],
  fichiers: [{ id: "cv", nom: "cv.pdf", type: "application/pdf", donnees: "QUJD" }],
};
const sauvegarde = () => {
  const l = lireSauvegarde(JSON.stringify(construireSauvegarde(donnees as never, "2026-11-14T10:00:00.000Z")));
  if (!l.ok) throw new Error("lecture attendue");
  return l.sauvegarde;
};

describe("restaurer une sauvegarde dans un espace", () => {
  it("écrit chaque document dans sa collection", async () => {
    const d = depotMemoire();
    await restaurer(d, sauvegarde());
    expect(await d.entreprises.lire("123456789")).toMatchObject({ nom: "Acme" });
    expect(await d.candidatures.lister()).toHaveLength(1);
    expect(await d.posts.lister()).toHaveLength(1);
    expect(await d.rapports.lister()).toHaveLength(1);
    expect(await d.fichiers.lire("cv")).toMatchObject({ nom: "cv.pdf" });
  });

  it("écrase un document de même identifiant et garde les autres", async () => {
    const d = depotMemoire();
    await d.entreprises.ecrire({ id: "123456789", nom: "Ancien" } as never);
    await d.entreprises.ecrire({ id: "autre", nom: "Autre" } as never);
    await restaurer(d, sauvegarde());
    expect((await d.entreprises.lire("123456789"))?.nom).toBe("Acme");
    expect(await d.entreprises.lire("autre")).not.toBeNull();
  });

  it("ne touche pas aux réglages : les clés révoquées le restent", async () => {
    const d = depotMemoire();
    await revoquerCles(d);
    await restaurer(d, sauvegarde());
    expect(await versionCles(d)).toBe(1);
  });

  it("renvoie le nombre de documents écrits", async () => {
    expect(await restaurer(depotMemoire(), sauvegarde())).toEqual({ entreprises: 1, candidatures: 1, posts: 1, rapports: 1, fichiers: 1, modeles: 0 });
  });

  it("restaure les modèles de relance de la sauvegarde", async () => {
    const d = depotMemoire();
    const modeles = [{ objet: "A", corps: "a" }, { objet: "B", corps: "b" }];
    const s = sauvegarde();
    await restaurer(d, { ...s, donnees: { ...s.donnees, modeles } });
    expect(await modelesEnregistres(d)).toEqual(modeles);
  });

  it("garde les modèles de l'espace si la sauvegarde n'en contient pas", async () => {
    const d = depotMemoire();
    const modeles = [{ objet: "C", corps: "c" }, { objet: "D", corps: "d" }];
    await enregistrerModeles(d, modeles);
    await restaurer(d, sauvegarde());
    expect(await modelesEnregistres(d)).toEqual(modeles);
  });
});
