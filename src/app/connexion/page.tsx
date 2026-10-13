import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata = { title: "Connexion" };

export default async function Connexion({ searchParams }: { searchParams: Promise<{ envoye?: string; erreur?: string }> }) {
  const { envoye, erreur } = await searchParams;
  return (
    <main id="contenu" className="halo grid min-h-dvh place-items-center px-4">
      <div className="carte w-full max-w-md p-8">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo /> Sillage
        </Link>
        <h1 className="titre-display mt-8 text-4xl">Reprendre la mer.</h1>
        {envoye ? (
          <p className="mt-4 text-discret" role="status">
            Si cette adresse a accès à Sillage, un lien de connexion vient d&apos;y partir. Il est valable 15 minutes.
          </p>
        ) : (
          <form action="/api/auth/lien" method="post" className="mt-6 space-y-3">
            {erreur && (
              <p className="rounded-lg bg-balise-doux px-3 py-2 text-sm text-balise" role="alert">
                Ce lien a expiré ou n&apos;est pas valide. Demandez-en un nouveau.
              </p>
            )}
            <label htmlFor="email" className="block text-sm text-discret">
              Adresse e-mail
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" className="w-full rounded-xl border border-ligne-forte bg-fond px-4 py-3 outline-none transition focus:border-ecume" placeholder="vous@exemple.fr" />
            <button className="w-full rounded-xl bg-ecume px-4 py-3 font-medium text-[#00110d] transition hover:brightness-110">Recevoir mon lien</button>
            <p className="text-xs text-discret">Pas de mot de passe : un lien signé, valable 15 minutes.</p>
          </form>
        )}
      </div>
    </main>
  );
}
