"use client";

import { useState, useTransition } from "react";
import { Ban, Check, Copy, KeyRound } from "lucide-react";
import { creerCleMcp, revoquerClesMcp } from "../actions";

export function Cle() {
  const [cle, setCle] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);
  const [revoquees, setRevoquees] = useState(false);
  const [enCours, demarrer] = useTransition();

  const revoquer = () => {
    if (!confirm("Révoquer toutes les clés MCP de cet espace ? Les clients connectés cesseront de fonctionner.")) return;
    demarrer(async () => {
      await revoquerClesMcp();
      setCle(null);
      setCopie(false);
      setRevoquees(true);
    });
  };
  const boutonRevoquer = (
    <button disabled={enCours} onClick={revoquer} className="inline-flex items-center gap-2 rounded-full border border-ligne-forte px-5 py-2.5 text-sm text-discret">
      <Ban className="size-4" aria-hidden /> Révoquer les clés
    </button>
  );

  if (!cle)
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={enCours} onClick={() => demarrer(async () => { setCle(await creerCleMcp()); setRevoquees(false); })} className="inline-flex items-center gap-2 rounded-full bg-ecume px-5 py-2.5 font-medium text-[#00110d]">
          <KeyRound className="size-4" aria-hidden /> Générer une clé MCP
        </button>
        {boutonRevoquer}
        {revoquees && <p role="status" className="text-sm text-balise">Les clés précédentes sont révoquées.</p>}
      </div>
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
      {boutonRevoquer}
    </div>
  );
}
