"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { VARIABLES, type ModeleEmail } from "@/domaine/modeles";
import { enregistrerModelesRelance } from "../actions";

const TITRES = ["Première relance", "Relances suivantes"];
const CHAMP = "mt-1 w-full rounded-xl border border-ligne-forte bg-fond px-3 py-2.5 text-sm outline-none focus:border-ecume";

type Bilan = { ok: true } | { ok: false; erreur: string } | null;

export function Modeles({ modeles }: { modeles: readonly ModeleEmail[] }) {
  const [bilan, setBilan] = useState<Bilan>(null);
  const [enCours, demarrer] = useTransition();

  return (
    <form
      // `onSubmit` plutôt que `action` : la saisie reste en place quand le modèle est refusé.
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        demarrer(async () => {
          setBilan(null);
          setBilan(await enregistrerModelesRelance(form));
        });
      }}
      className="space-y-5"
    >
      <p className="text-sm text-discret">
        Variables disponibles : <span className="font-mono text-[12px]">{VARIABLES.map((v) => `{{${v}}}`).join(" ")}</span>
      </p>
      <div className="grid gap-5 lg:grid-cols-2">
        {modeles.map((m, i) => (
          <fieldset key={i} className="min-w-0 space-y-3">
            <legend className="mb-2 text-sm font-medium">{TITRES[i]}</legend>
            <label className="block text-sm text-discret">
              Objet
              <input name={`objet-${i}`} required defaultValue={m.objet} className={CHAMP} />
            </label>
            <label className="block text-sm text-discret">
              Message
              <textarea name={`corps-${i}`} required rows={12} defaultValue={m.corps} className={`${CHAMP} resize-y leading-relaxed`} />
            </label>
          </fieldset>
        ))}
      </div>
      <button type="submit" disabled={enCours} className="inline-flex items-center gap-2 rounded-full border border-ligne-forte px-4 py-2 text-sm hover:border-ecume hover:text-ecume">
        <Save className="size-4" aria-hidden /> Enregistrer les modèles
      </button>
      {bilan?.ok && (
        <p role="status" className="text-sm text-balise">
          Modèles enregistrés.
        </p>
      )}
      {bilan && !bilan.ok && (
        <p role="alert" className="text-sm text-red-400">
          {bilan.erreur}
        </p>
      )}
    </form>
  );
}
