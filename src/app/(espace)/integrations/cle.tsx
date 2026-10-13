"use client";

import { useState, useTransition } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { creerCleMcp } from "../actions";

export function Cle() {
  const [cle, setCle] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);
  const [enCours, demarrer] = useTransition();
  if (!cle)
    return (
      <button disabled={enCours} onClick={() => demarrer(async () => setCle(await creerCleMcp()))} className="inline-flex items-center gap-2 rounded-full bg-ecume px-5 py-2.5 font-medium text-[#00110d]">
        <KeyRound className="size-4" aria-hidden /> Générer une clé MCP
      </button>
    );
  return (
    <div className="space-y-2">
      <p className="text-sm text-balise">Copiez-la maintenant : elle ne sera plus affichée.</p>
      <div className="flex gap-2">
        <code className="min-w-0 flex-1 truncate rounded-xl border border-ligne-forte bg-fond px-3 py-2.5 font-mono text-xs">{cle}</code>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(cle);
            setCopie(true);
          }}
          className="rounded-xl border border-ligne-forte px-3"
          aria-label="Copier la clé"
        >
          {copie ? <Check className="size-4 text-ecume" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        </button>
      </div>
    </div>
  );
}
