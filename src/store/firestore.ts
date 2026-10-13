import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import type { Collection, Depot } from "./port";

/**
 * Identifiants du compte de service : JSON encodé en base64 dans
 * FIREBASE_SERVICE_ACCOUNT_B64 (jamais commité, voir .env.example).
 */
export function appFirebase(): App {
  const existante = getApps()[0];
  if (existante) return existante;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) throw new Error("FIREBASE_SERVICE_ACCOUNT_B64 manquant");
  const compte = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  return initializeApp({ credential: cert(compte) });
}

export const db = (): Firestore => getFirestore(appFirebase());

class CollectionFirestore<T extends { id: string }> implements Collection<T> {
  constructor(private chemin: string) {}
  private ref() {
    return db().collection(this.chemin);
  }
  async lister() {
    const snap = await this.ref().get();
    return snap.docs.map((d) => d.data() as T);
  }
  async lire(id: string) {
    const d = await this.ref().doc(id).get();
    return d.exists ? (d.data() as T) : null;
  }
  async ecrire(doc: T) {
    await this.ref().doc(doc.id).set(JSON.parse(JSON.stringify(doc)));
  }
}

/** Les données d'un espace vivent sous espaces/{espace}/… : isolation multi-tenant par construction. */
export function depotFirestore(espace: string): Depot {
  const c = <T extends { id: string }>(nom: string) => new CollectionFirestore<T>(`espaces/${espace}/${nom}`);
  return {
    entreprises: c("entreprises"),
    candidatures: c("candidatures"),
    posts: c("posts"),
    rapports: c("rapports"),
    fichiers: c("fichiers"),
  };
}
