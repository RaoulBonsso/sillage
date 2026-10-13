"use client";

import { useState, useTransition } from "react";
import { Check, Plus } from "lucide-react";
import { ajouterDepuisRegistre } from "../../actions";

export function Ajout({ siren, deja }: { siren: string; deja: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  const [fait, setFait] = useState(deja);
  const [enCours, demarrer] = useTransition();
  if (fait) return <span className="inline-flex items-center gap-1 text-xs text-ecume"><Check className="size-3.5" aria-hidden /> Dans mes cibles</span>;
  if (!ouvert)
    return (
      <button onClick={() => setOuvert(true)} className="inline-flex items-center gap-1 rounded-full border border-ligne-forte px-3 py-1.5 text-xs hover:border-ecume hover:text-ecume">
        <Plus className="size-3.5" aria-hidden /> Ajouter à mes cibles
      </button>
    );
  return (
    <form action={(f) => demarrer(async () => { await ajouterDepuisRegistre(siren, f); setFait(true); })} className="w-full space-y-2">
      <label htmlFor={`r-${siren}`} className="block text-xs text-discret">Pourquoi eux ? (facultatif — un fait vérifiable vaut mieux qu&apos;une intuition)</label>
      <textarea id={`r-${siren}`} name="raison" rows={2} className="w-full rounded-xl border border-ligne-forte bg-fond px-3 py-2 text-sm outline-none focus:border-ecume" />
      <div className="flex items-center gap-2">
        <label htmlFor={`s-${siren}`} className="text-xs text-discret">Pertinence</label>
        <input id={`s-${siren}`} name="score" type="number" min={0} max={100} defaultValue={50} className="w-16 rounded-lg border border-ligne-forte bg-fond px-2 py-1 text-sm" />
        <button disabled={enCours} className="ml-auto rounded-full bg-ecume px-4 py-1.5 text-xs font-medium text-[#00110d]">{enCours ? "Ajout…" : "Ajouter"}</button>
      </div>
    </form>
  );
}
