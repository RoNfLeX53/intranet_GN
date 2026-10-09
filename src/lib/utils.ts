import type { AuditLog } from "./types";

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Horodatage local sans fuseau (YYYY-MM-DDTHH:mm:ss) — évite les décalages SSR/CSR. */
export function nowLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function fmtDateTime(iso: string): string {
  return iso.length > 10 ? `${fmtDate(iso)} à ${iso.slice(11, 16)}` : fmtDate(iso);
}

/**
 * Empreinte de démonstration (FNV-1a double 32 bits → 16 hex).
 * En production : SHA-256 calculé côté serveur / base (pgcrypto digest()).
 */
export function demoHash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x5bd1e995);
  }
  return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
}

export type AuditDraft = Omit<AuditLog, "hash" | "prevHash">;

export function auditPayload(e: AuditDraft): string {
  return JSON.stringify([e.id, e.date, e.acteur, e.role, e.action, e.cible, e.ip]);
}

export const GENESIS_HASH = "0000000000000000";

/** Construit une chaîne d'audit à partir d'entrées triées de la plus ancienne à la plus récente. Retourne la plus récente en premier. */
export function chainAudit(oldestFirst: AuditDraft[]): AuditLog[] {
  const out: AuditLog[] = [];
  let prev = GENESIS_HASH;
  for (const e of oldestFirst) {
    const hash = demoHash(prev + auditPayload(e));
    out.push({ ...e, prevHash: prev, hash });
    prev = hash;
  }
  return out.reverse();
}

/** Vérifie l'intégrité de la chaîne (journal en ordre décroissant). */
export function verifyAuditChain(newestFirst: AuditLog[]): { ok: boolean; brokenAt?: string } {
  const list = [...newestFirst].reverse();
  let prev = GENESIS_HASH;
  for (const e of list) {
    if (e.prevHash !== prev || demoHash(prev + auditPayload(e)) !== e.hash) {
      return { ok: false, brokenAt: e.id };
    }
    prev = e.hash;
  }
  return { ok: true };
}
