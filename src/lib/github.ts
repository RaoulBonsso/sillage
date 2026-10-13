import "server-only";

/**
 * Contributions GitHub par jour (calendrier public du profil), relues au plus
 * une fois par heure. Sert l'objectif « un commit public par jour ».
 */
export async function contributions(): Promise<Record<string, number>> {
  const login = process.env.GITHUB_LOGIN;
  const token = process.env.GITHUB_TOKEN;
  if (!login || !token) return {};
  const query = `query($l:String!){user(login:$l){contributionsCollection{contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}`;
  try {
    const r = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { l: login } }),
      next: { revalidate: 3600 },
    });
    const j = await r.json();
    const semaines = j?.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? [];
    const out: Record<string, number> = {};
    for (const s of semaines) for (const d of s.contributionDays) if (d.contributionCount) out[d.date] = d.contributionCount;
    return out;
  } catch {
    return {};
  }
}
