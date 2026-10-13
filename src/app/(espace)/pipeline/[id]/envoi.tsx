"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Send } from "lucide-react";
import { useState, useTransition } from "react";
import { envoyerCandidature } from "../../actions";

/** Compositeur d'e-mail : un clic humain, un avion en papier qui s'envole. */
export function Envoi({ id, a, objet, texte, relance, avecCv }: { id: string; a: string; objet: string; texte: string; relance: boolean; avecCv: boolean }) {
  const [etat, setEtat] = useState<{ ok: boolean; message: string } | null>(null);
  const [envol, setEnvol] = useState(false);
  const [enCours, demarrer] = useTransition();
  const reduit = useReducedMotion();

  return (
    <form
      action={(f) =>
        demarrer(async () => {
          const r = await envoyerCandidature(id, f);
          setEtat(r);
          if (r.ok) {
            setEnvol(true);
            setTimeout(() => setEnvol(false), 1600);
          }
        })
      }
      className="relative space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
        <label className="block text-sm">
          <span className="text-discret">À</span>
          <input name="a" type="email" required defaultValue={a} className="mt-1 w-full rounded-xl border border-ligne-forte bg-fond px-3 py-2.5 outline-none focus:border-ecume" />
        </label>
        <label className="block text-sm">
          <span className="text-discret">Objet</span>
          <input name="objet" required defaultValue={objet} className="mt-1 w-full rounded-xl border border-ligne-forte bg-fond px-3 py-2.5 outline-none focus:border-ecume" />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-discret">Message</span>
        <textarea name="texte" required defaultValue={texte} rows={12} className="mt-1 w-full resize-y rounded-xl border border-ligne-forte bg-fond px-3 py-2.5 leading-relaxed outline-none focus:border-ecume" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={enCours} className="inline-flex items-center gap-2 rounded-full bg-ecume px-5 py-2.5 font-medium text-[#00110d] transition hover:brightness-110 disabled:opacity-60">
          <Send className="size-4" aria-hidden /> {enCours ? "Envoi…" : relance ? "Envoyer la relance" : "Envoyer la candidature"}
        </button>
        <span className="text-xs text-discret">{relance ? "Sans pièce jointe." : avecCv ? "CV PDF joint automatiquement." : "Aucun CV attaché à ce dossier."}</span>
        {etat && (
          <p role="status" className={`text-sm ${etat.ok ? "text-ecume" : "text-balise"}`}>
            {etat.message}
          </p>
        )}
      </div>
      <AnimatePresence>
        {envol && !reduit && (
          <motion.svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute bottom-4 left-6 size-8 text-ecume"
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: [0, 120, 420], y: [0, -80, -260], rotate: [0, -12, -24], opacity: [1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeIn" }}
            aria-hidden
          >
            <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </motion.svg>
        )}
      </AnimatePresence>
    </form>
  );
}
