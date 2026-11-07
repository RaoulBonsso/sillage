// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { emettre, espaceDe } from "@/lib/jeton";
import { depot } from "@/lib/serveur";
import { revoquerCles } from "@/store/reglages";
import { GET, POST } from "./route";

const SECRET = "t".repeat(40);
const email = "test@exemple.invalid";
const esp = espaceDe(email);

beforeAll(() => {
  process.env.SILLAGE_SECRET = SECRET;
  delete process.env.FIREBASE_SERVICE_ACCOUNT_B64;
});

const cle = () => emettre({ u: "mcp", email, esp, exp: 0 }, SECRET);
let n = 0;
const requete = (corps: string, entetes: Record<string, string> = {}) =>
  new Request("http://localhost/api/mcp", { method: "POST", body: corps, headers: { "x-forwarded-for": `10.0.0.${++n}`, ...entetes } });
const avecCle = (corps: unknown, jeton = cle()) => requete(JSON.stringify(corps), { authorization: `Bearer ${jeton}` });
const liste = { jsonrpc: "2.0", id: 1, method: "tools/list" };

describe("POST /api/mcp", () => {
  it("refuse sans clé (401)", async () => {
    expect((await POST(requete(JSON.stringify(liste)))).status).toBe(401);
  });

  it("refuse une clé d'un autre usage ou mal signée (401)", async () => {
    const session = emettre({ u: "session", email, esp, exp: 0 }, SECRET);
    expect((await POST(avecCle(liste, session))).status).toBe(401);
    expect((await POST(avecCle(liste, cle() + "x"))).status).toBe(401);
  });

  it("répond à tools/list avec une clé valide", async () => {
    const r = await POST(avecCle(liste));
    expect(r.status).toBe(200);
    expect((await r.json()).result.tools.length).toBeGreaterThan(0);
  });

  it("refuse une clé révoquée, accepte la clé de la nouvelle version", async () => {
    const e2 = "revoque@exemple.invalid";
    const esp2 = espaceDe(e2);
    const ancienne = emettre({ u: "mcp", email: e2, esp: esp2, exp: 0, v: 0 }, SECRET);
    await revoquerCles(depot(esp2));
    expect((await POST(avecCle(liste, ancienne))).status).toBe(401);
    const nouvelle = emettre({ u: "mcp", email: e2, esp: esp2, exp: 0, v: 1 }, SECRET);
    expect((await POST(avecCle(liste, nouvelle))).status).toBe(200);
  });

  it("renvoie 400 sur un JSON invalide", async () => {
    const r = await POST(requete("{pas du json", { authorization: `Bearer ${cle()}` }));
    expect(r.status).toBe(400);
    expect((await r.json()).error.code).toBe(-32700);
  });

  it("exécute un outil dans l'espace de la clé", async () => {
    const cible = { id: "acme", nom: "Acme BTP", ville: "Nantes", secteur: "BTP", score: 80, signal: { texte: "devis papier", source: "https://acme.fr" }, contacts: [{ nom: "Jo", role: "DG" }] };
    const r = await POST(avecCle({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "sillage_ajouter_cible", arguments: cible } }));
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(JSON.parse(j.result.content[0].text).nouvelle).toBe(true);
    // un autre espace ne voit rien
    const autre = await POST(avecCle({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "sillage_ajouter_cible", arguments: cible } }, emettre({ u: "mcp", email: "b@exemple.invalid", esp: espaceDe("b@exemple.invalid"), exp: 0 }, SECRET)));
    expect(JSON.parse((await autre.json()).result.content[0].text).nouvelle).toBe(true);
  });

  it("traite un lot et renvoie un tableau", async () => {
    const r = await POST(avecCle([liste, { ...liste, id: 2 }]));
    const j = await r.json();
    expect(Array.isArray(j)).toBe(true);
    expect(j).toHaveLength(2);
  });

  it("répond 202 sans corps à une notification", async () => {
    const r = await POST(avecCle({ jsonrpc: "2.0", method: "notifications/initialized" }));
    expect(r.status).toBe(202);
    expect(await r.text()).toBe("");
  });

  it("limite le débit par IP (429 + Retry-After), avant la vérification de clé", async () => {
    const ip = { "x-forwarded-for": "192.0.2.99" };
    let dernier: Response | undefined;
    for (let i = 0; i < 121; i++) dernier = await POST(requete("{}", ip));
    expect(dernier!.status).toBe(429);
    expect(Number(dernier!.headers.get("Retry-After"))).toBeGreaterThan(0);
  });
});

describe("GET /api/mcp", () => {
  it("refuse avec 405 et Allow: POST", () => {
    const r = GET();
    expect(r.status).toBe(405);
    expect(r.headers.get("Allow")).toBe("POST");
  });
});
