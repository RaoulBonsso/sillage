"use client";

import { useState } from "react";
import { Inbox } from "lucide-react";
import type { BilanReponses } from "@/store/reponses";

const pluriel = (n: number, un: string, plusieurs: string) => `${n} ${n > 1 ? plusieurs : un}`;

type Etat = { etape: "repos" } | { etape: "cours" } | { etape: "fait"; bilan: BilanReponses };

export function Reponses() {
  const [etat, setEtat] = useState<Etat>({ etape: "repos" });
  const [erreur, setErreur] = useState<string | null>(null);

  const chercher = async () => {
    setErreur(null);
    setEtat({ etape: "cours" });
    try {
      const r = await fetch("/api/reponses", { method: "POST" });
      if (!r.ok) throw new Error((await r.text()) || "Lecture de la boîte impossible");
      setEtat({ etape: "fait", bilan: (await r.json()) as BilanReponses });
    } catch (e) {
      setEtat({ etape: "repos" });
      setErreur(e instanceof Error ? e.message : "Lecture de la boîte impossible");
    }
  };

  const n = etat.etape === "fait" ? etat.bilan.enregistrees.length : 0;

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={etat.etape === "cours"}
        onClick={chercher}
        className="inline-flex items-center gap-2 rounded-full border border-ligne-forte px-4 py-2 text-sm hover:border-ecume hover:text-ecume disabled:opacity-60"
      >
        <Inbox className="size-4" aria-hidden /> Chercher les réponses
      </button>
      {etat.etape === "fait" && (
        <p role="status" className="text-sm text-balise">
          {pluriel(etat.bilan.lus, "message lu", "messages lus")},{" "}
          {n === 0 ? "aucune nouvelle réponse" : pluriel(n, "réponse enregistrée", "réponses enregistrées")}.
        </p>
      )}
      {erreur && (
        <p role="alert" className="text-sm text-red-400">
          {erreur}
        </p>
      )}
    </div>
  );
}
