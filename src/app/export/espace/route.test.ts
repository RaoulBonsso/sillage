// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { emettre, espaceDe } from "@/lib/jeton";
import { depot } from "@/lib/serveur";
import { lireSauvegarde } from "@/domaine/sauvegarde";
import { revoquerCles } from "@/store/reglages";

const jeton = vi.hoisted(() => ({ valeur: undefined as string | undefined }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => (jeton.valeur ? { value: jeton.valeur } : undefined) }) }));

const SECRET = "t".repeat(40);
const email = "export@exemple.invalid";
const esp = espaceDe(email);

beforeAll(() => {
  process.env.SILLAGE_SECRET = SECRET;
  delete process.env.FIREBASE_SERVICE_ACCOUNT_B64;
});
beforeEach(() => {
  jeton.valeur = emettre({ u: "session", email, esp, exp: 0 }, SECRET);
});

const appeler = async () => (await import("./route")).GET();

describe("GET /export/espace", () => {
  it("refuse sans session (401)", async () => {
    jeton.valeur = undefined;
    expect((await appeler()).status).toBe(401);
  });

  it("refuse un jeton d'un autre usage (401)", async () => {
    jeton.valeur = emettre({ u: "mcp", email, esp, exp: 0 }, SECRET);
    expect((await appeler()).status).toBe(401);
  });

  it("renvoie une sauvegarde JSON téléchargeable, relisible, sans les réglages", async () => {
    const d = depot(esp);
    await d.fichiers.ecrire({ id: "cv", nom: "cv.pdf", type: "application/pdf", donnees: "JVBERg==" });
    await revoquerCles(d);
    const r = await appeler();
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toContain("application/json");
    expect(r.headers.get("content-disposition")).toMatch(/^attachment; filename="sillage-espace-\d{4}-\d{2}-\d{2}\.json"$/);
    expect(r.headers.get("cache-control")).toBe("no-store");
    const texte = await r.text();
    expect(texte).not.toContain("reglages");
    const lu = lireSauvegarde(texte);
    expect(lu.ok).toBe(true);
    if (lu.ok) expect(lu.sauvegarde.donnees.fichiers.map((f) => f.id)).toEqual(["cv"]);
  });
});
