import { verifier } from "@/lib/jeton";
import { depot, secret } from "@/lib/serveur";
import { contributions } from "@/lib/github";
import { traiter } from "@/mcp/protocole";
import { officiel } from "@/lib/officiel";

export const dynamic = "force-dynamic";

/** Point d'entrée MCP (Streamable HTTP, sans état). Authentification : `Authorization: Bearer <clé MCP>`. */
export async function POST(req: Request) {
  const cle = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const c = verifier(cle, "mcp", secret());
  if (!c) return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32001, message: "Clé MCP absente ou invalide" } }, { status: 401 });

  let corps: unknown;
  try {
    corps = await req.json();
  } catch {
    return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON invalide" } }, { status: 400 });
  }
  const ctx = { depot: depot(c.esp), maintenant: () => new Date().toISOString(), commits: contributions, officiel };
  const lot = Array.isArray(corps) ? corps : [corps];
  const reponses = (await Promise.all(lot.map((r) => traiter(r, ctx)))).filter((r) => r !== null);
  if (reponses.length === 0) return new Response(null, { status: 202 });
  return Response.json(Array.isArray(corps) ? reponses : reponses[0]);
}

export function GET() {
  return new Response("Sillage MCP : envoyez vos requêtes JSON-RPC en POST.", { status: 405, headers: { Allow: "POST" } });
}
