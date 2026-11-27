"use client";

import { useRef, useState, useTransition } from "react";
import { Upload } from "lucide-react";
import type { Volumes } from "@/domaine/sauvegarde";
import { apercuImportEspace, importerEspace } from "../actions";

const LIBELLES: Record<keyof Volumes, string> = {
  entreprises: "entreprises",
  candidatures: "candidatures",
  posts: "posts",
  rapports: "rapports",
  fichiers: "fichiers",
  modeles: "modèles de relance",
};

type Etat = { etape: "choix" } | { etape: "apercu"; volumes: Volumes } | { etape: "fait"; volumes: Volumes };

export function Import() {
  const formulaire = useRef<HTMLFormElement>(null);
  const [etat, setEtat] = useState<Etat>({ etape: "choix" });
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  const donnees = () => new FormData(formulaire.current!);
  const liste = (v: Volumes) => (Object.keys(LIBELLES) as (keyof Volumes)[]).map((c) => `${v[c]} ${LIBELLES[c]}`).join(", ");

  const analyser = () =>
    demarrer(async () => {
      setErreur(null);
      const r = await apercuImportEspace(donnees());
      if (r.ok) setEtat({ etape: "apercu", volumes: r.volumes });
      else {
        setEtat({ etape: "choix" });
        setErreur(r.erreur);
      }
    });

  const confirmer = () =>
    demarrer(async () => {
      setErreur(null);
      const r = await importerEspace(donnees());
      if (r.ok) {
        setEtat({ etape: "fait", volumes: r.volumes });
        formulaire.current?.reset();
      } else {
        setEtat({ etape: "choix" });
        setErreur(r.erreur);
      }
    });

  return (
    <form ref={formulaire} onSubmit={(e) => e.preventDefault()} className="space-y-3">
      <input
        type="file"
        name="fichier"
        accept="application/json,.json"
        onChange={() => {
          setEtat({ etape: "choix" });
          setErreur(null);
        }}
        className="block w-full text-sm text-discret file:mr-3 file:rounded-full file:border file:border-ligne-forte file:bg-transparent file:px-4 file:py-2 file:text-sm file:text-current"
        aria-label="Fichier de sauvegarde"
      />
      {etat.etape === "choix" && (
        <button type="button" disabled={enCours} onClick={analyser} className="inline-flex items-center gap-2 rounded-full border border-ligne-forte px-4 py-2 text-sm hover:border-ecume hover:text-ecume">
          <Upload className="size-4" aria-hidden /> Analyser le fichier
        </button>
      )}
      {etat.etape === "apercu" && (
        <div className="space-y-2">
          <p role="status" className="text-sm">
            Ce fichier contient : {liste(etat.volumes)}. Les documents de même identifiant seront écrasés, les autres conservés ; les modèles de relance ne sont remplacés que si le fichier en contient ; les clés MCP ne changent pas.
          </p>
          <button type="button" disabled={enCours} onClick={confirmer} className="inline-flex items-center gap-2 rounded-full bg-ecume px-5 py-2.5 font-medium text-[#00110d]">
            Confirmer l&apos;import
          </button>
        </div>
      )}
      {etat.etape === "fait" && (
        <p role="status" className="text-sm text-balise">
          Import terminé : {liste(etat.volumes)}.
        </p>
      )}
      {erreur && (
        <p role="alert" className="text-sm text-red-400">
          {erreur}
        </p>
      )}
    </form>
  );
}
