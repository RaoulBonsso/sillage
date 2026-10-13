/**
 * Serveur MCP minimal, sans état, transport « Streamable HTTP » en réponses
 * JSON (pas de flux SSE nécessaire : chaque outil répond en une fois).
 * Écrit à la main volontairement : ~80 lignes testées valent mieux qu'une
 * dépendance de plus sur le chemin critique.
 */
import { z } from "zod";
import { OUTILS, type Contexte, type NomOutil } from "./outils";

export const VERSION_PROTOCOLE = "2025-06-18";

type Id = string | number | null;
interface Requete {
  jsonrpc: "2.0";
  id?: Id;
  method: string;
  params?: Record<string, unknown>;
}

const ok = (id: Id, result: unknown) => ({ jsonrpc: "2.0" as const, id, result });
const erreur = (id: Id, code: number, message: string) => ({ jsonrpc: "2.0" as const, id, error: { code, message } });

export function listeOutils() {
  return Object.entries(OUTILS).map(([name, o]) => {
    const schema = z.toJSONSchema(o.entree, { io: "input" }) as Record<string, unknown>;
    delete schema.$schema;
    return { name, description: o.description, inputSchema: schema };
  });
}

/** Renvoie null pour une notification (aucune réponse attendue). */
export async function traiter(req: Requete, ctx: Contexte) {
  const id = req.id ?? null;
  if (req.id === undefined) return null;
  switch (req.method) {
    case "initialize":
      return ok(id, {
        protocolVersion: VERSION_PROTOCOLE,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "sillage", version: "0.1.0" },
        instructions:
          "Sillage pilote une recherche d'alternance/emploi. Commence par sillage_tableau. N'invente jamais un contact : chaque signal et chaque e-mail doivent être sourcés.",
      });
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, { tools: listeOutils() });
    case "tools/call": {
      const nom = String(req.params?.name ?? "");
      if (!(nom in OUTILS)) return erreur(id, -32602, `Outil inconnu : ${nom}`);
      const o = OUTILS[nom as NomOutil];
      const args = o.entree.safeParse(req.params?.arguments ?? {});
      if (!args.success) return ok(id, { isError: true, content: [{ type: "text", text: `Arguments invalides : ${z.prettifyError(args.error)}` }] });
      try {
        // @ts-expect-error — l'union des outils ne se réduit pas ici, les arguments sont validés juste au-dessus.
        const r = await o.executer(args.data, ctx);
        return ok(id, { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: { resultat: r } });
      } catch (e) {
        return ok(id, { isError: true, content: [{ type: "text", text: (e as Error).message }] });
      }
    }
    default:
      return erreur(id, -32601, `Méthode inconnue : ${req.method}`);
  }
}
