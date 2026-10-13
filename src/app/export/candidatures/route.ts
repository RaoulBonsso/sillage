import { LIBELLES } from "@/domaine/pipeline";
import { versCsv } from "@/domaine/export";
import { depot, session } from "@/lib/serveur";

export const dynamic = "force-dynamic";

/** Réversibilité : toutes les candidatures, ouvrables dans Excel ou LibreOffice. */
export async function GET() {
  const s = await session();
  if (!s) return new Response("Non autorisé", { status: 401 });
  const d = depot(s.esp);
  const [cands, ents] = await Promise.all([d.candidatures.lister(), d.entreprises.lister()]);
  const e = new Map(ents.map((x) => [x.id, x]));
  const csv = versCsv(
    ["Entreprise", "SIREN", "Ville", "Secteur", "Score", "Contact", "Rôle", "E-mail", "Étape", "Envoyée le", "Relances", "Prochaine relance", "Dernier événement", "Signal", "Source"],
    cands.map((c) => {
      const x = e.get(c.entrepriseId);
      const k = x?.contacts[c.contactIndex];
      const der = c.historique.at(-1);
      return [x?.nom ?? c.entrepriseId, /^\d{9}$/.test(c.entrepriseId) ? c.entrepriseId : "", x?.ville, x?.secteur, x?.score, k?.nom, k?.role, k?.email, LIBELLES[c.etape], c.envoyeeLe?.slice(0, 10), c.relances, c.prochaineRelance, der ? `${der.date.slice(0, 10)} — ${der.texte}` : "", x?.signal.texte, x?.signal.source];
    }),
  );
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="sillage-candidatures-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
