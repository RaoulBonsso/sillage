import { describe, expect, it } from "vitest";
import { apercuSauvegarde, construireSauvegarde, lireSauvegarde, VERSION_SAUVEGARDE } from "./sauvegarde";

const donnees = {
  entreprises: [{ id: "123456789", nom: "Acme" }],
  candidatures: [{ id: "c1", entrepriseId: "123456789" }],
  posts: [{ id: "p1" }],
  rapports: [{ id: "2026-11-14", date: "2026-11-14", resume: "ok", auteur: "rapporteur" }],
  fichiers: [{ id: "cv", nom: "cv.pdf", type: "application/pdf", donnees: "QUJD" }],
};
const enveloppe = (d: unknown, extra: object = {}) =>
  JSON.stringify({ format: "sillage-espace", version: 1, exporteLe: "2026-11-14T10:00:00.000Z", donnees: d, ...extra });

describe("sauvegarde d'un espace", () => {
  it("construit une sauvegarde versionnée et datée", () => {
    const s = construireSauvegarde(donnees as never, "2026-11-14T10:00:00.000Z");
    expect(s.format).toBe("sillage-espace");
    expect(s.version).toBe(VERSION_SAUVEGARDE);
    expect(s.exporteLe).toBe("2026-11-14T10:00:00.000Z");
    expect(s.donnees.candidatures).toHaveLength(1);
  });

  it("n'embarque jamais les réglages (version des clés MCP)", () => {
    const s = construireSauvegarde({ ...donnees, reglages: [{ id: "cles", version: 3 }] } as never, "2026-11-14T10:00:00.000Z");
    expect(JSON.stringify(s)).not.toContain("reglages");
  });

  it("relit ce qu'elle a construit (aller-retour)", () => {
    const s = construireSauvegarde(donnees as never, "2026-11-14T10:00:00.000Z");
    expect(lireSauvegarde(JSON.stringify(s))).toEqual({ ok: true, sauvegarde: s });
  });

  it("ignore les collections inconnues (dont reglages) à la relecture", () => {
    const r = lireSauvegarde(enveloppe({ ...donnees, reglages: [{ id: "cles", version: 9 }] }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(Object.keys(r.sauvegarde.donnees)).not.toContain("reglages");
  });

  it.each([
    ["JSON invalide", "{pas du json"],
    ["mauvais format", enveloppe(donnees, { format: "autre" })],
    ["version future", enveloppe(donnees, { version: 999 })],
    ["collection manquante", enveloppe({ entreprises: [] })],
    ["document sans id", enveloppe({ ...donnees, posts: [{ titre: "x" }] })],
    ["id dupliqué", enveloppe({ ...donnees, posts: [{ id: "a" }, { id: "a" }] })],
  ])("refuse : %s", (_nom, texte) => {
    const r = lireSauvegarde(texte);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreur.length).toBeGreaterThan(0);
  });
});

describe("apercuSauvegarde", () => {
  it("compte les documents de chaque collection", () => {
    const lue = lireSauvegarde(enveloppe(donnees));
    if (!lue.ok) throw new Error("lecture attendue");
    expect(apercuSauvegarde(lue.sauvegarde)).toEqual({ entreprises: 1, candidatures: 1, posts: 1, rapports: 1, fichiers: 1, modeles: 0 });
  });

  it("compte zéro pour une sauvegarde vide", () => {
    const vide = { entreprises: [], candidatures: [], posts: [], rapports: [], fichiers: [] };
    const lue = lireSauvegarde(enveloppe(vide));
    if (!lue.ok) throw new Error("lecture attendue");
    expect(apercuSauvegarde(lue.sauvegarde)).toEqual({ entreprises: 0, candidatures: 0, posts: 0, rapports: 0, fichiers: 0, modeles: 0 });
  });
});

describe("modèles de relance dans la sauvegarde", () => {
  const modeles = [{ objet: "A", corps: "a" }, { objet: "B", corps: "b" }];

  it("les conserve à l'aller-retour et les compte dans l'aperçu", () => {
    const s = construireSauvegarde({ ...donnees, modeles } as never, "2026-11-14T10:00:00.000Z");
    const lue = lireSauvegarde(JSON.stringify(s));
    if (!lue.ok) throw new Error("lecture attendue");
    expect(lue.sauvegarde.donnees.modeles).toEqual(modeles);
    expect(apercuSauvegarde(lue.sauvegarde).modeles).toBe(2);
  });

  it("reste lisible sans modèles (sauvegarde antérieure)", () => {
    const lue = lireSauvegarde(enveloppe(donnees));
    if (!lue.ok) throw new Error("lecture attendue");
    expect(lue.sauvegarde.donnees).not.toHaveProperty("modeles");
  });

  it("refuse un fichier aux modèles invalides", () => {
    const r = lireSauvegarde(enveloppe({ ...donnees, modeles: [modeles[0], { objet: "B", corps: "{{prenom}}" }] }));
    expect(r).toEqual({ ok: false, erreur: "Relance 2 : Variable inconnue : {{prenom}}." });
  });
});
