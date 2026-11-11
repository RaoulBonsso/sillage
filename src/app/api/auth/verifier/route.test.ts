// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { emettre, espaceDe, verifier } from "@/lib/jeton";

const set = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ cookies: async () => ({ set }) }));

const SECRET = "t".repeat(40);
const email = "session@exemple.invalid";
const esp = espaceDe(email);
const now = () => Math.floor(Date.now() / 1000);

const appeler = async (t?: string) => {
  const { GET } = await import("./route");
  const query = t === undefined ? "" : "?t=" + encodeURIComponent(t);
  return GET(new Request("http://localhost/api/auth/verifier" + query));
};

beforeAll(() => {
  process.env.SILLAGE_SECRET = SECRET;
});
beforeEach(() => set.mockClear());

describe("GET /api/auth/verifier", () => {
  it("pose un cookie de session de 30 jours et redirige vers /aujourdhui", async () => {
    const r = await appeler(emettre({ u: "lien", email, esp, exp: now() + 900 }, SECRET));
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toBe("http://localhost/aujourdhui");
    expect(set).toHaveBeenCalledTimes(1);
    const [nom, valeur, options] = set.mock.calls[0];
    expect(nom).toBe("sillage_session");
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 30 * 24 * 3600 });
    expect(verifier(valeur, "session", SECRET)).toMatchObject({ email, esp });
  });

  it("refuse un lien expiré, mal signé, d'un autre usage ou absent", async () => {
    const mauvais = [
      emettre({ u: "lien", email, esp, exp: now() - 1 }, SECRET),
      emettre({ u: "lien", email, esp, exp: now() + 900 }, SECRET) + "x",
      emettre({ u: "session", email, esp, exp: now() + 900 }, SECRET),
      emettre({ u: "mcp", email, esp, exp: 0 }, SECRET),
      "n'importe quoi",
      "",
    ];
    for (const t of mauvais) {
      const r = await appeler(t);
      expect(r.status).toBe(303);
      expect(r.headers.get("location")).toBe("http://localhost/connexion?erreur=lien");
    }
    expect((await appeler()).headers.get("location")).toBe("http://localhost/connexion?erreur=lien");
    expect(set).not.toHaveBeenCalled();
  });
});
