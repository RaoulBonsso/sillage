import { cookies } from "next/headers";
import { emettre, verifier } from "@/lib/jeton";
import { COOKIE, secret } from "@/lib/serveur";

export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  const c = verifier(t, "lien", secret());
  if (!c) return Response.redirect(new URL("/connexion?erreur=lien", req.url), 303);
  const duree = 30 * 24 * 3600;
  (await cookies()).set(COOKIE, emettre({ u: "session", email: c.email, esp: c.esp, exp: Math.floor(Date.now() / 1000) + duree }, secret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: duree,
  });
  return Response.redirect(new URL("/aujourdhui", req.url), 303);
}
