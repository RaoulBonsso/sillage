/**
 * Les outils MCP de Sillage. Un agent (Claude Code, Kimi, Gemini, n8n…) qui
 * se branche sur /api/mcp pilote la recherche avec exactement les mêmes règles
 * que l'interface : mêmes schémas, mêmes transitions, même historique.
 */
import { z } from "zod";
import { schemaCible, schemaPost, lireCibles, lirePosts } from "@/domaine/journal";
import { avancer, nouvelleCandidature, relancesDues } from "@/domaine/pipeline";
import { bilanDuJour, OBJECTIFS_DEFAUT, serie } from "@/domaine/serie";
import { ETAPES } from "@/domaine/types";
import { activiteParJour } from "@/store/lecture";
import { EFFECTIFS, liensOfficiels, type FicheOfficielle, type Filtres } from "@/domaine/officiel";
import type { Depot } from "@/store/port";

export interface Contexte {
  depot: Depot;
  maintenant: () => string;
  commits?: () => Promise<Record<string, number>>;
  /** Accès aux registres publics (injecté : réseau en production, faux en test). */
  officiel?: {
    rechercher(f: Filtres): Promise<{ total: number; fiches: FicheOfficielle[] }>;
    fiche(siren: string): Promise<FicheOfficielle | null>;
    annonces(siren: string, n?: number): Promise<{ date: string; famille: string; type: string; url: string }[]>;
  };
}

function exigerOfficiel(ctx: Contexte) {
  if (!ctx.officiel) throw new Error("Sources officielles indisponibles sur ce serveur.");
  return ctx.officiel;
}

interface Outil<S extends z.ZodType> {
  description: string;
  entree: S;
  executer: (args: z.infer<S>, ctx: Contexte) => Promise<unknown>;
}

const outil = <S extends z.ZodType>(o: Outil<S>) => o;

const dossier = z.object({
  cv: z.string().default(""),
  lettre: z.string().default(""),
  email: z.object({ objet: z.string(), corps: z.string() }),
  miniProjet: z.string().default(""),
});

export const OUTILS = {
  sillage_tableau: outil({
    description: "Bilan du jour : objectifs (candidatures, posts, commits), série en cours, relances dues, posts à publier.",
    entree: z.object({}),
    async executer(_a, ctx) {
      const jour = ctx.maintenant().slice(0, 10);
      const [cands, posts, commits] = await Promise.all([ctx.depot.candidatures.lister(), ctx.depot.posts.lister(), ctx.commits?.() ?? {}]);
      const activite = activiteParJour(cands, posts, commits);
      return {
        jour,
        bilan: bilanDuJour(activite[jour] ?? { candidatures: 0, posts: 0, commits: 0 }, OBJECTIFS_DEFAUT),
        serie: serie(activite, jour, OBJECTIFS_DEFAUT),
        relancesDues: relancesDues(cands, jour).map((c) => ({ id: c.id, prochaineRelance: c.prochaineRelance, relances: c.relances })),
        postsDuJour: posts.filter((p) => p.date === jour).map((p) => ({ id: p.id, creneau: p.creneau, statut: p.statut })),
      };
    },
  }),

  sillage_lister_cibles: outil({
    description: "Liste les entreprises ciblées, filtrables par ville, secteur et score minimal. Utile pour éviter les doublons avant d'en ajouter.",
    entree: z.object({ ville: z.string().optional(), secteur: z.string().optional(), scoreMin: z.number().optional() }),
    async executer(a, ctx) {
      const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
      return (await ctx.depot.entreprises.lister())
        .filter((e) => !a.ville || norm(e.ville).includes(norm(a.ville)))
        .filter((e) => !a.secteur || norm(e.secteur).includes(norm(a.secteur)))
        .filter((e) => a.scoreMin === undefined || e.score >= a.scoreMin)
        .map(({ id, nom, ville, secteur, score }) => ({ id, nom, ville, secteur, score }));
    },
  }),

  sillage_rechercher_entreprises: outil({
    description:
      "Cherche des entreprises ACTIVES dans les registres officiels (Sirene/INSEE + RNE/INPI, API publique). Filtres : mots-clés, département, code postal, code NAF, taille. Renvoie SIREN, effectif, dirigeants nommés et si l'entreprise est déjà ciblée.",
    entree: z.object({
      q: z.string().optional(),
      departement: z.string().regex(/^(\d{2,3}|2A|2B)$/).optional(),
      codePostal: z.string().regex(/^\d{5}$/).optional(),
      naf: z.string().regex(/^\d{2}\.\d{2}[A-Z]$/).optional().describe("Code NAF rév. 2, ex. 69.20Z (expertise comptable)"),
      taille: z.enum(EFFECTIFS.map((e) => e.cle) as [string, ...string[]]).optional().describe("tpe (1–9), pe (10–49), me (50–249), gr (250+)"),
      page: z.number().int().min(1).max(50).default(1),
    }),
    async executer(a, ctx) {
      const o = exigerOfficiel(ctx);
      const effectifs = EFFECTIFS.find((e) => e.cle === a.taille)?.codes;
      const [res, cibles] = await Promise.all([o.rechercher({ ...a, effectifs }), ctx.depot.entreprises.lister()]);
      const deja = new Set(cibles.map((c) => c.id));
      return { total: res.total, entreprises: res.fiches.map((f) => ({ ...f, dejaCiblee: deja.has(f.siren) })) };
    },
  }),

  sillage_fiche_officielle: outil({
    description: "Fiche officielle d'une entreprise par SIREN : identité, effectif, dirigeants, derniers comptes publiés, dernières annonces BODACC et liens vers les registres.",
    entree: z.object({ siren: z.string().regex(/^\d{9}$/) }),
    async executer(a, ctx) {
      const o = exigerOfficiel(ctx);
      const [f, bodacc] = await Promise.all([o.fiche(a.siren), o.annonces(a.siren)]);
      if (!f) throw new Error(`Aucune entreprise active trouvée pour le SIREN ${a.siren}`);
      return { ...f, bodacc, sources: liensOfficiels(a.siren) };
    },
  }),

  sillage_ajouter_cible: outil({
    description: "Ajoute ou met à jour une entreprise ciblée. Le signal de digitalisation doit avoir une URL source vérifiable.",
    entree: schemaCible,
    async executer(a, ctx) {
      const [e] = lireCibles([a], ctx.maintenant().slice(0, 10));
      const existante = await ctx.depot.entreprises.lire(e.id);
      await ctx.depot.entreprises.ecrire({ ...e, ajouteeLe: existante?.ajouteeLe ?? e.ajouteeLe });
      return { ok: true, id: e.id, nouvelle: !existante };
    },
  }),

  sillage_preparer_candidature: outil({
    description: "Crée la candidature d'une entreprise ciblée avec son dossier (CV, lettre, e-mail, mini-projet). Étape : préparée.",
    entree: z.object({ entrepriseId: z.string(), contactIndex: z.number().int().min(0).default(0), dossier }),
    async executer(a, ctx) {
      if (!(await ctx.depot.entreprises.lire(a.entrepriseId))) throw new Error(`Entreprise inconnue : ${a.entrepriseId}`);
      if (await ctx.depot.candidatures.lire(a.entrepriseId)) throw new Error(`Candidature déjà existante pour ${a.entrepriseId}`);
      const c = { ...nouvelleCandidature(a.entrepriseId, a.dossier, ctx.maintenant()), contactIndex: a.contactIndex };
      await ctx.depot.candidatures.ecrire(c);
      return { ok: true, id: c.id, etape: c.etape };
    },
  }),

  sillage_avancer_candidature: outil({
    description: "Fait avancer une candidature (envoyee, relancee, reponse, entretien, offre, signee, refusee, close). Les relances se planifient seules en jours ouvrés.",
    entree: z.object({ id: z.string(), etape: z.enum(ETAPES), note: z.string().default("") }),
    async executer(a, ctx) {
      const c = await ctx.depot.candidatures.lire(a.id);
      if (!c) throw new Error(`Candidature inconnue : ${a.id}`);
      const suite = avancer(c, a.etape, ctx.maintenant(), a.note, "agent");
      await ctx.depot.candidatures.ecrire(suite);
      return { ok: true, id: a.id, etape: suite.etape, prochaineRelance: suite.prochaineRelance };
    },
  }),

  sillage_noter: outil({
    description: "Ajoute une note datée à l'historique d'une candidature (appel, échange LinkedIn, info utile…).",
    entree: z.object({ id: z.string(), texte: z.string().min(1) }),
    async executer(a, ctx) {
      const c = await ctx.depot.candidatures.lire(a.id);
      if (!c) throw new Error(`Candidature inconnue : ${a.id}`);
      const t = ctx.maintenant();
      await ctx.depot.candidatures.ecrire({ ...c, historique: [...c.historique, { date: t, type: "note", texte: a.texte, auteur: "agent" }], majLe: t });
      return { ok: true };
    },
  }),

  sillage_relances_dues: outil({
    description: "Candidatures à relancer aujourd'hui (ou en retard), avec le contact et l'e-mail initial.",
    entree: z.object({}),
    async executer(_a, ctx) {
      const jour = ctx.maintenant().slice(0, 10);
      const dues = relancesDues(await ctx.depot.candidatures.lister(), jour);
      return Promise.all(
        dues.map(async (c) => {
          const e = await ctx.depot.entreprises.lire(c.entrepriseId);
          return { id: c.id, entreprise: e?.nom, contact: e?.contacts[c.contactIndex] ?? null, relances: c.relances, prochaineRelance: c.prochaineRelance, emailInitial: c.dossier.email };
        }),
      );
    },
  }),

  sillage_ajouter_post: outil({
    description: "Dépose un post LinkedIn pour un créneau (matin : actualité tech/IA ; midi : projet en cours ; soir : valeur ajoutée d'une solution).",
    entree: schemaPost,
    async executer(a, ctx) {
      const [p] = lirePosts([a]);
      await ctx.depot.posts.ecrire(p);
      return { ok: true, id: p.id };
    },
  }),

  sillage_marquer_publie: outil({
    description: "Marque un post comme publié sur LinkedIn (avec l'URL du post si connue).",
    entree: z.object({ id: z.string(), url: z.string().url().optional() }),
    async executer(a, ctx) {
      const p = await ctx.depot.posts.lire(a.id);
      if (!p) throw new Error(`Post inconnu : ${a.id}`);
      await ctx.depot.posts.ecrire({ ...p, statut: "publie", publieLe: ctx.maintenant(), url: a.url ?? p.url });
      return { ok: true };
    },
  }),

  sillage_ecrire_rapport: outil({
    description: "Écrit (ou remplace) le rapport quotidien des agents, en markdown.",
    entree: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), resume: z.string().min(1), auteur: z.string().default("agent") }),
    async executer(a, ctx) {
      await ctx.depot.rapports.ecrire({ id: a.date, ...a });
      return { ok: true };
    },
  }),
} as const;

export type NomOutil = keyof typeof OUTILS;
