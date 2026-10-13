"use client";

import { useState, useTransition } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import type { Post } from "@/domaine/types";
import { majPost, statutPost } from "../actions";

const LIMITE = 3000;
const PLI = 210; // LinkedIn replie le texte vers 210 caractères : l'accroche doit tenir avant.

export function Editeur({ post, auteur }: { post: Post; auteur: string }) {
  const [texte, setTexte] = useState(post.texte);
  const [copie, setCopie] = useState(false);
  const [url, setUrl] = useState(post.url ?? "");
  const [enCours, demarrer] = useTransition();
  const complet = `${texte}${post.hashtags.length ? `\n\n${post.hashtags.join(" ")}` : ""}`;
  const modifie = texte !== post.texte;
  const initiales = auteur.split(/\s+/).map((m) => m[0]).join("").slice(0, 2).toUpperCase();

  async function copier() {
    await navigator.clipboard.writeText(complet);
    setCopie(true);
    setTimeout(() => setCopie(false), 1800);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <label htmlFor={`t-${post.id}`} className="sr-only">Texte du post</label>
        <textarea id={`t-${post.id}`} value={texte} onChange={(e) => setTexte(e.target.value)} rows={16} className="w-full resize-y rounded-xl border border-ligne-forte bg-fond p-4 text-sm leading-relaxed outline-none focus:border-lune" />
        <p className="mt-1 flex justify-between font-mono text-xs text-discret">
          <span className={texte.split("\n")[0].length > PLI ? "text-balise" : ""}>accroche : {texte.split("\n")[0].length}/{PLI}</span>
          <span className={complet.length > LIMITE ? "text-balise" : ""}>{complet.length}/{LIMITE}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {modifie && (
            <button disabled={enCours} onClick={() => demarrer(() => majPost(post.id, texte))} className="rounded-full bg-lune px-4 py-2 text-sm font-medium text-black">
              Enregistrer
            </button>
          )}
          <button onClick={copier} className="inline-flex items-center gap-1.5 rounded-full border border-ligne-forte px-4 py-2 text-sm hover:border-lune">
            {copie ? <Check className="size-4 text-ecume" aria-hidden /> : <Copy className="size-4" aria-hidden />} {copie ? "Copié" : "Copier"}
          </button>
          <a href={`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(complet)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-ligne-forte px-4 py-2 text-sm hover:border-lune">
            Ouvrir dans LinkedIn <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ligne pt-4">
          {post.statut !== "publie" ? (
            <>
              <label htmlFor={`u-${post.id}`} className="sr-only">URL du post publié</label>
              <input id={`u-${post.id}`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL du post (facultatif)" className="min-w-0 flex-1 rounded-xl border border-ligne bg-fond px-3 py-2 text-sm outline-none focus:border-ecume" />
              <button disabled={enCours} onClick={() => demarrer(() => statutPost(post.id, "publie", url))} className="rounded-full bg-ecume px-4 py-2 text-sm font-medium text-[#00110d]">
                Marquer publié
              </button>
              {post.statut !== "ignore" && (
                <button disabled={enCours} onClick={() => demarrer(() => statutPost(post.id, "ignore"))} className="px-2 text-sm text-discret hover:text-texte">
                  Ignorer
                </button>
              )}
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm text-or">
              <Check className="size-4" aria-hidden /> Publié
              {post.url && <a href={post.url} target="_blank" rel="noreferrer" className="text-discret underline-offset-2 hover:underline">voir</a>}
              <button onClick={() => demarrer(() => statutPost(post.id, "a_publier"))} className="ml-2 text-xs text-discret hover:text-texte">annuler</button>
            </p>
          )}
        </div>
        {post.sources.length > 0 && (
          <ul className="mt-4 space-y-1 text-xs text-discret">
            {post.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer" className="hover:text-ecume">↗ {s.titre ?? s.url}</a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <figure aria-label="Aperçu LinkedIn" className="h-fit rounded-xl bg-white p-4 text-[14px] leading-[1.45] text-[#191919] shadow-2xl">
        <div className="flex items-center gap-2.5">
          <span className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-[#0a66c2] to-[#5eead4] font-semibold text-white">{initiales}</span>
          <div>
            <p className="font-semibold leading-tight">{auteur}</p>
            <p className="text-xs text-[#666]">{post.heure || "maintenant"} · 🌐</p>
          </div>
        </div>
        <Apercu texte={complet} />
      </figure>
    </div>
  );
}

function Apercu({ texte }: { texte: string }) {
  const [ouvert, setOuvert] = useState(false);
  const court = texte.length > PLI && !ouvert;
  return (
    <p className="mt-3 whitespace-pre-wrap break-words">
      {court ? texte.slice(0, PLI).trimEnd() : texte}
      {court && (
        <button onClick={() => setOuvert(true)} className="text-[#666] hover:text-[#0a66c2]">
          …voir plus
        </button>
      )}
    </p>
  );
}
