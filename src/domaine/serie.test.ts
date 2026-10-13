import { describe, expect, it } from "vitest";
import { bilanDuJour, serie, OBJECTIFS_DEFAUT } from "./serie";

describe("bilanDuJour", () => {
  it("compte chaque objectif et calcule une progression bornée", () => {
    const b = bilanDuJour({ candidatures: 6, posts: 2, commits: 1 }, OBJECTIFS_DEFAUT);
    expect(b.atteint).toBe(false);
    expect(b.progression).toBeCloseTo((1 + 2 / 3 + 1) / 3);
    expect(b.objectifs.find((o) => o.cle === "candidatures")?.fait).toBe(true);
  });
  it("est atteint quand tout est fait", () => {
    expect(bilanDuJour({ candidatures: 5, posts: 3, commits: 4 }, OBJECTIFS_DEFAUT).atteint).toBe(true);
  });
});

describe("serie", () => {
  const ok = { candidatures: 5, posts: 3, commits: 1 };
  it("compte les jours consécutifs atteints jusqu'à hier si aujourd'hui est en cours", () => {
    const activite = { "2026-10-11": ok, "2026-10-12": ok, "2026-10-13": { candidatures: 1, posts: 0, commits: 0 } };
    expect(serie(activite, "2026-10-13", OBJECTIFS_DEFAUT)).toBe(2);
  });
  it("inclut aujourd'hui quand il est atteint", () => {
    const activite = { "2026-10-12": ok, "2026-10-13": ok };
    expect(serie(activite, "2026-10-13", OBJECTIFS_DEFAUT)).toBe(2);
  });
  it("se casse sur un jour manqué", () => {
    const activite = { "2026-10-10": ok, "2026-10-12": ok };
    expect(serie(activite, "2026-10-13", OBJECTIFS_DEFAUT)).toBe(1);
  });
});
