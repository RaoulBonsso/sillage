import { verifier } from "@/lib/jeton";
import { depot, secret } from "@/lib/serveur";

export const dynamic = "force-dynamic";

/** Dépôt d'un fichier (CV PDF) par un agent : PUT ?id=…&nom=… avec la clé MCP. 900 Ko maximum. */
export async function PUT(req: Request) {
  const c = verifier(req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "", "mcp", secret());
  if (!c) return new Response("Non autorisé", { status: 401 });
  const u = new URL(req.url);
  const id = u.searchParams.get("id");
  const nom = u.searchParams.get("nom") ?? "document.pdf";
  if (!id || !/^[\w.-]{1,120}$/.test(id)) return new Response("id invalide", { status: 400 });
  const donnees = Buffer.from(await req.arrayBuffer());
  if (donnees.length > 900_000) return new Response("Fichier trop lourd", { status: 413 });
  await depot(c.esp).fichiers.ecrire({ id, nom, type: req.headers.get("content-type") ?? "application/pdf", donnees: donnees.toString("base64") });
  return Response.json({ ok: true, id, octets: donnees.length });
}
