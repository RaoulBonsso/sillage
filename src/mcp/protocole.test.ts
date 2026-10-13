import { describe, expect, it } from "vitest";
import { traiter } from "./protocole";
import { depotMemoire } from "@/store/memoire";

const ctx = () => ({ depot: depotMemoire(), maintenant: () => "2026-10-13T09:00:00.000Z" });
const appel = (name: string, args: unknown, id = 1) => ({ jsonrpc: "2.0" as const, id, method: "tools/call", params: { name, arguments: args } });
const texte = (r: unknown) => JSON.parse((r as { result: { content: { text: string }[] } }).result.content[0].text);

const cible = { id: "acme", nom: "Acme BTP", ville: "Nantes", secteur: "BTP", score: 80, signal: { texte: "devis sur papier", source: "https://acme.fr" }, contacts: [{ nom: "Jo", role: "DG" }] };

describe("protocole MCP", () => {
  it("répond à initialize et ignore les notifications", async () => {
    const c = ctx();
    const r = (await traiter({ jsonrpc: "2.0", id: 0, method: "initialize" }, c)) as { result: { serverInfo: { name: string } } };
    expect(r.result.serverInfo.name).toBe("sillage");
    expect(await traiter({ jsonrpc: "2.0", method: "notifications/initialized" }, c)).toBeNull();
  });

  it("expose des schémas JSON pour chaque outil", async () => {
    const r = (await traiter({ jsonrpc: "2.0", id: 1, method: "tools/list" }, ctx())) as { result: { tools: { name: string; inputSchema: { type: string } }[] } };
    expect(r.result.tools.length).toBeGreaterThanOrEqual(9);
    expect(r.result.tools.every((t) => t.inputSchema.type === "object")).toBe(true);
  });

  it("déroule cible → candidature → envoi avec relance planifiée", async () => {
    const c = ctx();
    expect(texte(await traiter(appel("sillage_ajouter_cible", cible), c)).nouvelle).toBe(true);
    await traiter(appel("sillage_preparer_candidature", { entrepriseId: "acme", dossier: { email: { objet: "o", corps: "c" } } }), c);
    const r = texte(await traiter(appel("sillage_avancer_candidature", { id: "acme", etape: "envoyee" }), c));
    expect(r.prochaineRelance).toBe("2026-10-20");
    const t = texte(await traiter(appel("sillage_tableau", {}), c));
    expect(t.bilan.objectifs.find((o: { cle: string }) => o.cle === "candidatures").valeur).toBe(1);
  });

  it("signale une erreur métier sans casser le protocole", async () => {
    const r = (await traiter(appel("sillage_avancer_candidature", { id: "nope", etape: "envoyee" }), ctx())) as { result: { isError: boolean } };
    expect(r.result.isError).toBe(true);
  });

  it("rejette des arguments invalides", async () => {
    const r = (await traiter(appel("sillage_ajouter_cible", { nom: "sans id" }), ctx())) as { result: { isError: boolean } };
    expect(r.result.isError).toBe(true);
  });

  it("répond -32601 à une méthode inconnue", async () => {
    const r = (await traiter({ jsonrpc: "2.0", id: 9, method: "resources/list" }, ctx())) as { error: { code: number } };
    expect(r.error.code).toBe(-32601);
  });
});
