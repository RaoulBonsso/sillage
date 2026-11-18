import { describe, expect, it } from "vitest";
import { construireSauvegarde } from "@/domaine/sauvegarde";
import { depotMemoire } from "./memoire";
import { apercuImport, importer } from "./importation";

const texte = JSON.stringify(
  construireSauvegarde(
    {
      entreprises: [{ id: "123456789", nom: "Acme" }],
      candidatures: [],
      posts: [{ id: "p1" }, { id: "p2" }],
      rapports: [],
      fichiers: [],
    } as never,
    "2026-11-14T10:00:00.000Z",
  ),
);

describe("import d'une sauvegarde", () => {
  it("l'aperçu donne les volumes sans rien écrire", async () => {
    const d = depotMemoire();
    const r = apercuImport(texte);
    expect(r).toMatchObject({ ok: true, volumes: { entreprises: 1, posts: 2, candidatures: 0 } });
    expect(await d.entreprises.lister()).toHaveLength(0);
  });

  it("l'aperçu refuse un fichier invalide avec la raison", () => {
    expect(apercuImport("pas du json")).toMatchObject({ ok: false, erreur: expect.stringContaining("JSON") });
  });

  it("importer écrit dans le dépôt et rend les volumes restaurés", async () => {
    const d = depotMemoire();
    const r = await importer(d, texte);
    expect(r).toMatchObject({ ok: true, volumes: { entreprises: 1, posts: 2 } });
    expect(await d.posts.lister()).toHaveLength(2);
  });

  it("importer refuse un fichier invalide sans rien écrire", async () => {
    const d = depotMemoire();
    const r = await importer(d, JSON.stringify({ format: "autre" }));
    expect(r.ok).toBe(false);
    expect(await d.entreprises.lister()).toHaveLength(0);
  });
});
