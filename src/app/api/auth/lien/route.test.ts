// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { verifier } from "@/lib/jeton";

const envoyer = vi.hoisted(() => vi.fn<(c: { a: string; objet: string; texte: string }) => Promise<string>>(async () => "id"));
vi.mock("@/lib/courriel", () => ({ envoyer }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ host: "sillage.exemple.invalid" }) }));

const SECRET = "t".repeat(40);
let n = 0;
const demander = async (email: string, ip = "10.1.0." + ++n) => {
  const { POST } = await import("./route");
  const corps = new FormData();
  corps.set("email", email);
  return POST(new Request("http://localhost/api/auth/lien", { method: "POST", body: corps, headers: { "x-forwarded-for": ip } }));
};

beforeAll(() => {
  process.env.SILLAGE_SECRET = SECRET;
});
beforeEach(() => {
  envoyer.mockClear();
  process.env.SILLAGE_INSCRIPTIONS = "ok@exemple.invalid";
});

describe("POST /api/auth/lien", () => {
  it("envoie un lien valable 15 min pour une adresse autorisée, et redirige vers ?envoye=1", async () => {
    const r = await demander("OK@exemple.invalid");
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toBe("http://localhost/connexion?envoye=1");
    expect(envoyer).toHaveBeenCalledTimes(1);
    const { a, texte } = envoyer.mock.calls[0][0];
    expect(a).toBe("ok@exemple.invalid");
    const t = new URL(texte.match(/https?:\/\/\S+/)![0]);
    expect(t.origin).toBe("https://sillage.exemple.invalid");
    const charge = verifier(t.searchParams.get("t")!, "lien", SECRET);
    expect(charge?.email).toBe("ok@exemple.invalid");
    expect(charge!.exp * 1000 - Date.now()).toBeLessThanOrEqual(900_000);
  });

  it("répond de la même façon, sans envoyer, pour une adresse non autorisée ou invalide", async () => {
    for (const email of ["intrus@exemple.invalid", "pas-un-email", ""]) {
      const r = await demander(email);
      expect(r.status).toBe(303);
      expect(r.headers.get("location")).toBe("http://localhost/connexion?envoye=1");
    }
    expect(envoyer).not.toHaveBeenCalled();
  });

  it("n'envoie plus au-delà de 3 demandes par adresse, sans changer la réponse", async () => {
    process.env.SILLAGE_INSCRIPTIONS = "spam@exemple.invalid";
    for (let i = 0; i < 5; i++) expect((await demander("spam@exemple.invalid")).status).toBe(303);
    expect(envoyer).toHaveBeenCalledTimes(3);
  });

  it("refuse avec 429 au-delà de 10 demandes par IP", async () => {
    const ip = "10.9.9.9";
    for (let i = 0; i < 10; i++) expect((await demander("x@exemple.invalid", ip)).status).toBe(303);
    const r = await demander("x@exemple.invalid", ip);
    expect(r.status).toBe(429);
    expect(r.headers.get("Retry-After")).toBeTruthy();
  });
});
