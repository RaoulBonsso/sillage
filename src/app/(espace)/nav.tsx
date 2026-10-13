"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { BookOpen, Building2, KanbanSquare, Megaphone, Plug, Sun } from "lucide-react";

export const LIENS = [
  { href: "/aujourdhui", label: "Aujourd'hui", icone: Sun },
  { href: "/pipeline", label: "Candidatures", icone: KanbanSquare },
  { href: "/cibles", label: "Cibles", icone: Building2 },
  { href: "/linkedin", label: "LinkedIn", icone: Megaphone },
  { href: "/journal", label: "Journal", icone: BookOpen },
  { href: "/integrations", label: "Intégrations", icone: Plug },
];

export function Nav({ badges }: { badges: Record<string, number> }) {
  const chemin = usePathname();
  return (
    <ul className="flex gap-1 md:flex-col">
      {LIENS.map(({ href, label, icone: Icone }) => {
        const actif = chemin.startsWith(href);
        const b = badges[href];
        return (
          <li key={href} className="min-w-0 flex-1 md:flex-none">
            <Link
              href={href}
              aria-current={actif ? "page" : undefined}
              className={`relative flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] transition md:flex-row md:gap-3 md:px-3 md:py-2.5 md:text-sm ${actif ? "text-texte" : "text-discret hover:text-texte"}`}
            >
              {actif && <motion.span layoutId="nav-actif" className="absolute inset-0 rounded-xl bg-surface-2 ring-1 ring-ligne-forte" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <Icone className="relative size-5 md:size-4" aria-hidden />
              <span className="relative max-w-full truncate">{label}</span>
              {b ? (
                <span className="pulse-balise absolute right-2 top-1 grid min-w-4 place-items-center rounded-full bg-balise px-1 text-[10px] font-semibold text-black md:relative md:right-auto md:top-auto md:ml-auto">
                  {b}
                  <span className="sr-only"> en attente</span>
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
