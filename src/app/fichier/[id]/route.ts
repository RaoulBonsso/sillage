import { depot, session } from "@/lib/serveur";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await session();
  if (!s) return new Response("Non autorisé", { status: 401 });
  const f = await depot(s.esp).fichiers.lire((await params).id);
  if (!f) return new Response("Introuvable", { status: 404 });
  return new Response(Buffer.from(f.donnees, "base64"), {
    headers: { "Content-Type": f.type, "Content-Disposition": `inline; filename="${f.nom.replace(/"/g, "")}"`, "Cache-Control": "private, no-store" },
  });
}
