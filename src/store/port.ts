import type { Candidature, Entreprise, Post, Rapport } from "@/domaine/types";

/** Une collection de documents identifiés, propre à un espace de travail. */
export interface Collection<T extends { id: string }> {
  lister(): Promise<T[]>;
  lire(id: string): Promise<T | null>;
  ecrire(doc: T): Promise<void>;
}

/**
 * Le port de persistance. L'application ne connaît que cette interface ;
 * Firestore et la mémoire en sont deux adaptateurs interchangeables.
 */
export interface Fichier {
  id: string;
  nom: string;
  type: string;
  donnees: string; // base64 — un CV PDF tient largement sous la limite de 1 Mo d'un document
}

export interface Depot {
  entreprises: Collection<Entreprise>;
  candidatures: Collection<Candidature>;
  posts: Collection<Post>;
  rapports: Collection<Rapport & { id: string }>;
  fichiers: Collection<Fichier>;
}

export type NomCollection = keyof Depot;
export const COLLECTIONS: NomCollection[] = ["entreprises", "candidatures", "posts", "rapports"];
