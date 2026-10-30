import { describe, expect, it } from "vitest";
import { depotMemoire } from "./memoire";
import { cleMcpValide, revoquerCles, versionCles } from "./reglages";

describe("version des clés MCP d'un espace", () => {
  it("vaut 0 tant qu'aucune révocation n'a eu lieu", async () => {
    expect(await versionCles(depotMemoire())).toBe(0);
  });

  it("est incrémentée à chaque révocation et renvoyée", async () => {
    const depot = depotMemoire();
    expect(await revoquerCles(depot)).toBe(1);
    expect(await revoquerCles(depot)).toBe(2);
    expect(await versionCles(depot)).toBe(2);
  });

  it("reste propre à chaque espace", async () => {
    const a = depotMemoire();
    const b = depotMemoire();
    await revoquerCles(a);
    expect(await versionCles(b)).toBe(0);
  });
});

describe("cleMcpValide", () => {
  const cle = { u: "mcp" as const, email: "a@b.fr", esp: "e", exp: 0 };

  it("accepte une clé de la version courante", async () => {
    const depot = depotMemoire();
    await revoquerCles(depot);
    expect(await cleMcpValide(depot, { ...cle, v: 1 })).toBe(true);
  });

  it("refuse une clé émise avant une révocation", async () => {
    const depot = depotMemoire();
    await revoquerCles(depot);
    expect(await cleMcpValide(depot, { ...cle, v: 0 })).toBe(false);
    expect(await cleMcpValide(depot, cle)).toBe(false);
  });

  it("accepte une ancienne clé sans v tant qu'aucune révocation n'a eu lieu", async () => {
    expect(await cleMcpValide(depotMemoire(), cle)).toBe(true);
  });
});
