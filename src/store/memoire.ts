import type { Collection, Depot } from "./port";

class CollectionMemoire<T extends { id: string }> implements Collection<T> {
  private docs = new Map<string, T>();
  async lister() {
    return [...this.docs.values()].map((d) => structuredClone(d));
  }
  async lire(id: string) {
    const d = this.docs.get(id);
    return d ? structuredClone(d) : null;
  }
  async ecrire(doc: T) {
    this.docs.set(doc.id, structuredClone(doc));
  }
}

/** Adaptateur en mémoire : tests et démonstration hors ligne. */
export function depotMemoire(): Depot {
  return {
    entreprises: new CollectionMemoire(),
    candidatures: new CollectionMemoire(),
    posts: new CollectionMemoire(),
    rapports: new CollectionMemoire(),
    fichiers: new CollectionMemoire(),
  };
}
