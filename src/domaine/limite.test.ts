import { describe, expect, it } from "vitest";
import { creerLimiteur } from "./limite";

describe("limiteur de débit (fenêtre fixe)", () => {
  it("laisse passer jusqu'à la limite puis refuse avec le délai d'attente", () => {
    let t = 1_000;
    const l = creerLimiteur({ max: 3, fenetreMs: 60_000, maintenant: () => t });
    expect(l.essayer("a").autorise).toBe(true);
    expect(l.essayer("a").autorise).toBe(true);
    expect(l.essayer("a").autorise).toBe(true);
    t += 10_000;
    const refus = l.essayer("a");
    expect(refus).toEqual({ autorise: false, reessayerDansS: 50 });
  });

  it("compte chaque clé séparément", () => {
    const l = creerLimiteur({ max: 1, fenetreMs: 1000, maintenant: () => 0 });
    expect(l.essayer("a").autorise).toBe(true);
    expect(l.essayer("b").autorise).toBe(true);
    expect(l.essayer("a").autorise).toBe(false);
  });

  it("repart à zéro quand la fenêtre est écoulée", () => {
    let t = 0;
    const l = creerLimiteur({ max: 1, fenetreMs: 1000, maintenant: () => t });
    l.essayer("a");
    expect(l.essayer("a").autorise).toBe(false);
    t = 1000;
    expect(l.essayer("a").autorise).toBe(true);
  });

  it("purge les fenêtres expirées pour ne pas grossir sans fin", () => {
    let t = 0;
    const l = creerLimiteur({ max: 1, fenetreMs: 1000, maintenant: () => t });
    l.essayer("a");
    l.essayer("b");
    t = 5000;
    l.essayer("c");
    expect(l.taille()).toBe(1);
  });
});
