import Link from "next/link";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { relancesDues } from "@/domaine/pipeline";
import { aujourdhui, exigerSession } from "@/lib/serveur";
import { deconnexion } from "./actions";
import { Nav } from "./nav";

export const dynamic = "force-dynamic";

export default async function Espace({ children }: { children: React.ReactNode }) {
  const s = await exigerSession();
  const jour = aujourdhui();
  const [cands, posts] = await Promise.all([s.depot.candidatures.lister(), s.depot.posts.lister()]);
  const badges = {
    "/pipeline": relancesDues(cands, jour).length + cands.filter((c) => c.etape === "preparee").length,
    "/linkedin": posts.filter((p) => p.date <= jour && p.statut === "a_publier").length,
  };
  return (
    <div className="md:grid md:min-h-dvh md:grid-cols-[232px_1fr]">
      <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-ligne bg-fond/85 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:border-r md:border-t-0 md:px-3 md:py-5">
        <Link href="/aujourdhui" className="hidden items-center gap-2 px-3 pb-6 font-semibold md:flex">
          <Logo /> Sillage
        </Link>
        <nav aria-label="Espace" className="py-1.5 md:py-0">
          <Nav badges={badges} />
        </nav>
        <div className="mt-auto hidden px-3 md:block">
          <p className="truncate text-xs text-discret" title={s.email}>
            {s.email}
          </p>
          <form action={deconnexion}>
            <button className="mt-2 inline-flex items-center gap-1.5 text-xs text-discret hover:text-balise">
              <LogOut className="size-3.5" aria-hidden /> Se déconnecter
            </button>
          </form>
        </div>
      </aside>
      <main id="contenu" className="min-w-0 px-4 pb-28 pt-6 sm:px-8 md:pb-12 md:pt-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
