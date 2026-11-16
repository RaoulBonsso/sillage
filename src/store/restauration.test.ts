import { describe, expect, it } from "vitest";
import { construireSauvegarde, lireSauvegarde } from "@/domaine/sauvegarde";
import { depotMemoire } from "./memoire";
import { restaurer } from "./restauration";
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
    expect(await restaurer(depotMemoire(), sauvegarde())).toEqual({ entreprises: 1, candidatures: 1, posts: 1, rapports: 1, fichiers: 1 });
  });
});
