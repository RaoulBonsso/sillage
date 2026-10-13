/** Calendrier ouvré français (métropole). Les dates circulent en AAAA-MM-JJ. */

const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (jour: string) => new Date(`${jour.slice(0, 10)}T12:00:00Z`);

/** Algorithme de Meeus/Jones/Butcher. */
export function paques(annee: number): string {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return `${annee}-${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
}

function decaler(jour: string, n: number): string {
  const d = utc(jour);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
}

const cache = new Map<number, Set<string>>();

function feries(annee: number): Set<string> {
  const deja = cache.get(annee);
  if (deja) return deja;
  const p = paques(annee);
  const set = new Set([
    ...["01-01", "05-01", "05-08", "07-14", "08-15", "11-01", "11-11", "12-25"].map((md) => `${annee}-${md}`),
    decaler(p, 1), // lundi de Pâques
    decaler(p, 39), // Ascension
    decaler(p, 50), // lundi de Pentecôte
  ]);
  cache.set(annee, set);
  return set;
}

export function estFerie(jour: string): boolean {
  return feries(Number(jour.slice(0, 4))).has(jour.slice(0, 10));
}

export function estOuvre(jour: string): boolean {
  const j = utc(jour).getUTCDay();
  return j !== 0 && j !== 6 && !estFerie(jour);
}

export function ajouterJoursOuvres(depart: string, n: number): string {
  let jour = depart.slice(0, 10);
  let restants = n;
  while (restants > 0) {
    jour = decaler(jour, 1);
    if (estOuvre(jour)) restants--;
  }
  return jour;
}
