import { describe, expect, it } from "vitest";
import { autorise, emettre, espaceDe, verifier } from "./jeton";

const S = "secret-de-test";
const charge = { u: "session" as const, email: "a@b.fr", esp: espaceDe("a@b.fr"), exp: 2_000_000_000 };

describe("jetons", () => {
  it("vérifie un jeton bien signé", () => {
    expect(verifier(emettre(charge, S), "session", S)?.email).toBe("a@b.fr");
  });
  it("refuse une signature altérée ou un autre secret", () => {
    const j = emettre(charge, S);
    expect(verifier(j.slice(0, -2) + "xx", "session", S)).toBeNull();
    expect(verifier(j, "session", "autre")).toBeNull();
  });
  it("refuse un usage différent (un lien n'est pas une session)", () => {
    expect(verifier(emettre({ ...charge, u: "lien" }, S), "session", S)).toBeNull();
  });
  it("refuse un jeton expiré, accepte exp=0", () => {
    expect(verifier(emettre({ ...charge, exp: 10 }, S), "session", S)).toBeNull();
    expect(verifier(emettre({ ...charge, exp: 0 }, S), "session", S)).not.toBeNull();
  });
  it("refuse une charge forgée", () => {
    const faux = Buffer.from(JSON.stringify({ ...charge, email: "pirate@x.fr" })).toString("base64url");
    const [, sig] = emettre(charge, S).split(".");
    expect(verifier(`${faux}.${sig}`, "session", S)).toBeNull();
  });
});

describe("espaceDe / autorise", () => {
  it("dérive le même espace quelle que soit la casse", () => {
    expect(espaceDe(" A@B.fr ")).toBe(espaceDe("a@b.fr"));
  });
  it("applique la liste blanche", () => {
    expect(autorise("A@b.fr", "x@y.fr, a@b.fr")).toBe(true);
    expect(autorise("c@d.fr", "a@b.fr")).toBe(false);
    expect(autorise("c@d.fr", "*")).toBe(true);
    expect(autorise("c@d.fr", undefined)).toBe(false);
  });
});
