import { construireSauvegarde } from "@/domaine/sauvegarde";
import { depot, session } from "@/lib/serveur";

export const dynamic = "force-dynamic";

/** Réversibilité : sauvegarde complète de l'espace (JSON versionné), sans les réglages ni les clés MCP. */
export async function GET() {
  const s = await session();
  if (!s) return new Response("Non autorisé", { status: 401 });
  const d = depot(s.esp);
  const [entreprises, candidatures, posts, rapports, fichiers] = await Promise.all([
    d.entreprises.lister(),
    d.candidatures.lister(),
    d.posts.lister(),
    d.rapports.lister(),
    d.fichiers.lister(),
  ]);
  const maintenant = new Date().toISOString();
  const sauvegarde = construireSauvegarde({ entreprises, candidatures, posts, rapports, fichiers }, maintenant);
  return new Response(JSON.stringify(sauvegarde, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="sillage-espace-${maintenant.slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
