import Link from "next/link";
import { Lock } from "lucide-react";
import { cx } from "@/lib/utils";

/**
 * Bloc-marque inspiré du DSFR.
 * NB : la Marianne officielle et le DSFR sont réservés aux sites de l'État ;
 * cette maquette utilise un emblème fictif. Voir docs/ARCHITECTURE.md.
 */
export function BlocMarque({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col leading-none text-ink" aria-label="République française — Liberté, Égalité, Fraternité">
      <span className="mb-1.5 flex h-[5px] w-9" aria-hidden>
        <span className="flex-1 bg-france" />
        <span className="flex-1 bg-white ring-1 ring-inset ring-line" />
        <span className="flex-1 bg-marianne" />
      </span>
      <span className={cx("font-bold uppercase tracking-tight", compact ? "text-[0.8rem] leading-[0.95rem]" : "text-[0.95rem] leading-[1.1rem]")}>
        République
        <br />
        Française
      </span>
      {!compact && (
        <span className="mt-1.5 text-[0.62rem] italic leading-[0.75rem] text-ink-soft">
          Liberté
          <br />
          Égalité
          <br />
          Fraternité
        </span>
      )}
    </div>
  );
}

/** Emblème institutionnel FICTIF (écu + flamme stylisée). */
export function EmblemeFictif({ className = "h-12 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 48" className={className} role="img" aria-label="Emblème fictif Sentinelle">
      <path d="M20 1 L38 7 V22 C38 34 30 42 20 47 C10 42 2 34 2 22 V7 Z" fill="#00205B" />
      <path d="M20 4.5 L35 9.5 V22 C35 32 28.5 39 20 43.5 C11.5 39 5 32 5 22 V9.5 Z" fill="none" stroke="#C5D1EA" strokeWidth="1" />
      <path d="M20 12 C23 17 26 19 26 24 C26 28 23.5 31 20 31 C16.5 31 14 28 14 24 C14 21 16 19.5 17 17 C17.5 19.5 18.5 20.5 19.5 20.5 C19 17.5 19 15 20 12 Z" fill="#FFFFFF" />
      <circle cx="20" cy="25.5" r="2.4" fill="#E1000F" />
      <rect x="12" y="35" width="16" height="1.6" fill="#FFFFFF" opacity="0.8" />
    </svg>
  );
}

export function DemoRibbon() {
  return (
    <div className="bg-ink px-4 py-1.5 text-center text-xs text-white">
      Maquette de démonstration — <strong>toutes les données sont fictives</strong>. Ce site n&apos;est pas un service officiel.
    </div>
  );
}

export function PublicHeader() {
  return (
    <header className="border-b border-line bg-white shadow-sm">
      <DemoRibbon />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-4 py-4">
        <Link href="/" className="flex items-center gap-5" aria-label="Accueil — Portail Sentinelle">
          <BlocMarque />
          <span className="hidden h-14 w-px bg-line sm:block" aria-hidden />
          <span className="flex items-center gap-3">
            <EmblemeFictif />
            <span>
              <span className="block text-lg font-bold text-gend-900">Sentinelle</span>
              <span className="block text-xs text-ink-mute">Portail de la Gendarmerie — démonstration</span>
            </span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/demande-acces" className="hidden px-3 py-2 text-sm font-medium text-gend-900 hover:bg-gend-50 md:inline-flex">
            Demande d&apos;accès agent
          </Link>
          <a href="#recrutement" className="hidden px-3 py-2 text-sm font-medium text-gend-900 hover:bg-gend-50 sm:inline-flex">Recrutement</a>
          <Link href="/connexion" className="inline-flex items-center gap-2 bg-gend-900 px-4 py-2 text-sm font-medium text-white hover:bg-gend-800">
            <Lock size={16} aria-hidden /> Accès intranet
          </Link>
        </div>
      </div>
      <nav aria-label="Menu principal" className="border-t border-line">
        <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 text-sm font-medium">
          {[
            ["Accueil", "/"],
            ["Pré-plainte en ligne", "/pre-plainte"],
            ["Informations pratiques", "/#infos"],
            ["Nos missions", "/#missions"],
            ["Recrutement", "/#recrutement"],
            ["Demande d'accès agent", "/demande-acces"],
          ].map(([label, href], i) => (
            <li key={href}>
              <Link href={href} className={cx("inline-block whitespace-nowrap px-4 py-3 hover:bg-gend-50", i === 0 && "border-b-2 border-gend-900 text-gend-900")}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t-2 border-gend-900 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[auto_1fr]">
        <div className="flex items-center gap-5">
          <BlocMarque />
          <EmblemeFictif />
        </div>
        <p className="text-sm text-ink-soft">
          Sentinelle est une maquette pédagogique de portail institutionnel inspirée du Système de Design de l&apos;État. Les unités, personnels,
          procédures et candidatures présentés sont imaginaires. En cas d&apos;urgence réelle, composez le <strong>17</strong> ou le <strong>112</strong>.
        </p>
      </div>
      <div className="border-t border-line">
        <ul className="mx-auto flex max-w-6xl flex-wrap gap-x-4 gap-y-1 px-4 py-3 text-xs text-ink-mute">
          <li>Accessibilité : partiellement conforme (maquette)</li>
          <li>Mentions légales</li>
          <li>Données personnelles</li>
          <li>Gestion des cookies</li>
        </ul>
      </div>
    </footer>
  );
}
