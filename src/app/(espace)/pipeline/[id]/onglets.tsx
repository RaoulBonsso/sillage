"use client";

import { useState } from "react";
import { motion } from "motion/react";

export function Onglets({ onglets }: { onglets: { id: string; titre: string; contenu: React.ReactNode }[] }) {
  const [actif, setActif] = useState(onglets[0]?.id);
  return (
    <div>
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-ligne">
        {onglets.map((o) => (
          <button
            key={o.id}
            role="tab"
            id={`tab-${o.id}`}
            aria-selected={actif === o.id}
            aria-controls={`panneau-${o.id}`}
            onClick={() => setActif(o.id)}
            className={`relative shrink-0 px-4 py-2.5 text-sm transition ${actif === o.id ? "text-texte" : "text-discret hover:text-texte"}`}
          >
            {o.titre}
            {actif === o.id && <motion.span layoutId="onglet" className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-ecume" />}
          </button>
        ))}
      </div>
      {onglets.map((o) => (
        <div key={o.id} role="tabpanel" id={`panneau-${o.id}`} aria-labelledby={`tab-${o.id}`} hidden={actif !== o.id} className="pt-5">
          {o.contenu}
        </div>
      ))}
    </div>
  );
}
