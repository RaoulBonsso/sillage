// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { emettre, espaceDe } from "@/lib/jeton";
import { depot } from "@/lib/serveur";
import { revoquerCles } from "@/store/reglages";
import { PUT } from "./route";

const SECRET = "t".repeat(40);
const email = "fichiers@exemple.invalid";
const esp = espaceDe(email);

beforeAll(() => {
  process.env.SILLAGE_SECRET = SECRET;
  delete process.env.FIREBASE_SERVICE_ACCOUNT_B64;
});

const cle = (v?: number) => emettre({ u: "mcp", email, esp, exp: 0, ...(v === undefined ? {} : { v }) }, SECRET);
const depose = (query: string, corps: BodyInit = "%PDF-1.4", jeton: string | null = cle(), type = "application/pdf") =>
  PUT(new Request(`http://localhost/api/fichiers${query}`, { method: "PUT", body: corps, headers: { "content-type": type, ...(jeton ? { authorization: `Bearer ${jeton}` } : {}) } }));

describe("PUT /api/fichiers", () => {
  it("refuse sans clé (401)", async () => {
    expect((await depose("?id=cv", "x", null)).status).toBe(401);
  });

  it("refuse une clé d'un autre usage ou mal signée (401)", async () => {
    const session = emettre({ u: "session", email, esp, exp: 0 }, SECRET);
    expect((await depose("?id=cv", "x", session)).status).toBe(401);
    expect((await depose("?id=cv", "x", cle() + "x")).status).toBe(401);
  });

  it("refuse un id absent ou invalide (400)", async () => {
    expect((await depose("")).status).toBe(400);
    expect((await depose("?id=../secret")).status).toBe(400);
    expect((await depose(`?id=${"a".repeat(121)}`)).status).toBe(400);
  });

  it("refuse un fichier de plus de 900 Ko (413)", async () => {
    expect((await depose("?id=gros", Buffer.alloc(900_001))).status).toBe(413);
  });

  it("stocke le fichier en base64 dans l'espace de la clé", async () => {
    const r = await depose("?id=cv-principal&nom=cv.pdf", "%PDF-1.4");
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, id: "cv-principal", octets: 8 });
    const f = await depot(esp).fichiers.lire("cv-principal");
    expect(f).toMatchObject({ id: "cv-principal", nom: "cv.pdf", type: "application/pdf" });
    expect(Buffer.from(f!.donnees, "base64").toString()).toBe("%PDF-1.4");
  });

  it("n'écrit pas dans l'espace d'un autre", async () => {
    const autre = "autre-fichiers@exemple.invalid";
    expect(await depot(espaceDe(autre)).fichiers.lire("cv-principal")).toBeNull();
  });

  it("refuse une clé révoquée (401) et n'écrit rien", async () => {
    const e2 = "revoque-fichiers@exemple.invalid";
    const esp2 = espaceDe(e2);
    const ancienne = emettre({ u: "mcp", email: e2, esp: esp2, exp: 0, v: 0 }, SECRET);
    await revoquerCles(depot(esp2));
    expect((await depose("?id=cv", "x", ancienne)).status).toBe(401);
    expect(await depot(esp2).fichiers.lire("cv")).toBeNull();
    const nouvelle = emettre({ u: "mcp", email: e2, esp: esp2, exp: 0, v: 1 }, SECRET);
    expect((await depose("?id=cv", "x", nouvelle)).status).toBe(200);
  });
});
