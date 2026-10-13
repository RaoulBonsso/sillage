import { describe, expect, it } from "vitest";
import { lireEmail } from "./email.mjs";

describe("lireEmail", () => {
  it("extrait l'objet et le corps après le séparateur", () => {
    const r = lireEmail("# E-mail\n\n**À :** Jo\n**Objet :** Candidature — Dev\n\n---\n\nBonjour Jo,\n\nMerci.\n");
    expect(r.objet).toBe("Candidature — Dev");
    expect(r.corps).toBe("Bonjour Jo,\n\nMerci.");
  });
  it("tolère l'absence de séparateur", () => {
    const r = lireEmail("**Objet :** Hello\nBonjour");
    expect(r.objet).toBe("Hello");
    expect(r.corps).toBe("Bonjour");
  });
});
