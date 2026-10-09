import Link from "next/link";
import { ArrowRight, Briefcase, Building2, Clock, Info, Lock, Phone, ShieldCheck, Users } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/OfficialHeader";
import { CandidatureForm } from "@/components/public/CandidatureForm";
import { OFFRES } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <>
      <PublicHeader />
      <main id="contenu" tabIndex={-1}>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gend-900 text-white">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-gend-700/60 to-transparent md:block" aria-hidden />
          <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-[1.4fr_1fr] md:py-20">
            <div>
              <p className="mb-3 inline-block bg-marianne px-2 py-0.5 text-xs font-bold uppercase tracking-widest">Espace public</p>
              <h1 className="text-3xl font-bold leading-tight md:text-5xl">Protéger, servir, s&apos;engager.</h1>
              <p className="mt-4 max-w-xl text-lg text-gend-100">
                Informations pratiques, missions et offres d&apos;incorporation. Les personnels disposent d&apos;un accès sécurisé à l&apos;intranet de leur unité.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#recrutement" className="inline-flex items-center gap-2 bg-white px-5 py-3 text-sm font-bold text-gend-900 hover:bg-gend-50">
                  Découvrir les offres <ArrowRight size={16} aria-hidden />
                </a>
                <Link href="/connexion" className="inline-flex items-center gap-2 border border-white px-5 py-3 text-sm font-bold text-white hover:bg-white/10">
                  <Lock size={16} aria-hidden /> Accès personnels
                </Link>
              </div>
            </div>
            <div className="self-center border-l-4 border-marianne bg-white/5 p-6 backdrop-blur">
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                <Phone size={18} aria-hidden /> Urgence
              </p>
              <p className="mt-2 text-5xl font-bold">17 <span className="text-2xl text-gend-200">ou</span> 112</p>
              <p className="mt-2 text-sm text-gend-100">Sourds et malentendants : 114 (SMS). Disponible 24 h/24, 7 j/7.</p>
            </div>
          </div>
        </section>

        {/* Infos pratiques */}
        <section id="infos" className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-bold text-gend-900">Informations pratiques</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { icon: Building2, t: "Trouver une brigade", d: "Horaires d'accueil et coordonnées des unités du département (données fictives)." },
              { icon: Clock, t: "Pré-plainte en ligne", d: "Pour les atteintes aux biens sans auteur identifié, préparez votre dépôt de plainte." },
              { icon: Info, t: "Prévention", d: "Opération tranquillité vacances, cybersécurité, prévention routière." },
            ].map(({ icon: Icon, t, d }) => (
              <article key={t} className="group border border-line border-b-4 border-b-gend-900 bg-white p-6 transition-shadow hover:shadow-md">
                <Icon className="text-gend-900" size={28} aria-hidden />
                <h3 className="mt-3 font-bold text-gend-900">{t}</h3>
                <p className="mt-1 text-sm text-ink-soft">{d}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Missions */}
        <section id="missions" className="bg-white py-12">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-2xl font-bold text-gend-900">Nos missions</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {[
                { icon: ShieldCheck, t: "Sécurité publique", d: "Surveillance générale, prévention de la délinquance et assistance aux populations." },
                { icon: Briefcase, t: "Police judiciaire", d: "Constatation des infractions, recherche des auteurs et mise à disposition de la justice." },
                { icon: Users, t: "Contact & proximité", d: "Une présence de terrain au plus près des élus, des acteurs locaux et des habitants." },
              ].map(({ icon: Icon, t, d }) => (
                <div key={t} className="flex gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-gend-100 text-gend-900" aria-hidden>
                    <Icon size={24} />
                  </span>
                  <div>
                    <h3 className="font-bold text-ink">{t}</h3>
                    <p className="mt-1 text-sm text-ink-soft">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recrutement */}
        <section id="recrutement" className="mx-auto max-w-6xl px-4 py-12">
          <p className="text-xs font-bold uppercase tracking-widest text-marianne">Pôle recrutement</p>
          <h2 className="mt-1 text-2xl font-bold text-gend-900">Offres d&apos;incorporation</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">Conditions indicatives et fictives — à des fins de démonstration uniquement.</p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {OFFRES.map((o) => (
              <article key={o.type} className="flex flex-col border border-line bg-white">
                <div className="h-2 bg-gend-900" aria-hidden />
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-mute">{o.duree}</p>
                  <h3 className="mt-1 text-lg font-bold text-gend-900">{o.titre}</h3>
                  <p className="mt-2 text-sm text-ink-soft">{o.accroche}</p>
                  <ul className="mt-4 space-y-1.5 text-sm">
                    {o.conditions.map((c) => (
                      <li key={c} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-marianne" aria-hidden />
                        {c}
                      </li>
                    ))}
                  </ul>
                  <a href="#candidature" className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-gend-900 underline-offset-4 hover:underline">
                    Candidater <ArrowRight size={16} aria-hidden />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="candidature" className="mx-auto max-w-3xl px-4">
          <CandidatureForm />
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
