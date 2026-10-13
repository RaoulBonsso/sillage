import { describe, expect, it } from "vitest";
import { ajouterJoursOuvres, estFerie, paques } from "./jours-ouvres";

describe("paques", () => {
  it("calcule le dimanche de Pâques", () => {
    expect(paques(2026)).toBe("2026-04-05");
    expect(paques(2027)).toBe("2027-03-28");
  });
});

describe("estFerie", () => {
  it("reconnaît les fériés fixes et mobiles", () => {
    expect(estFerie("2026-11-11")).toBe(true);
    expect(estFerie("2026-12-25")).toBe(true);
    expect(estFerie("2027-03-29")).toBe(true); // lundi de Pâques
    expect(estFerie("2026-11-12")).toBe(false);
  });
});

describe("ajouterJoursOuvres", () => {
  it("saute les week-ends", () => {
    // vendredi 16 oct. 2026 + 1 jour ouvré = lundi 19
    expect(ajouterJoursOuvres("2026-10-16", 1)).toBe("2026-10-19");
  });
  it("saute les jours fériés", () => {
    // mardi 10 nov. + 1 = jeudi 12 (le 11 est férié)
    expect(ajouterJoursOuvres("2026-11-10", 1)).toBe("2026-11-12");
  });
  it("accepte un horodatage complet", () => {
    expect(ajouterJoursOuvres("2026-10-13T09:12:00.000Z", 5)).toBe("2026-10-20");
  });
});
