"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { IntranetHeader } from "@/components/intranet/IntranetHeader";
import { Sidebar } from "@/components/intranet/Sidebar";
import { useCurrentUser, useDemo } from "@/components/store";

export default function IntranetLayout({ children }: { children: ReactNode }) {
  const { hydrated } = useDemo();
  const me = useCurrentUser();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // Démo : redirection si non authentifié. En production, c'est le middleware
  // serveur qui bloque la requête AVANT tout rendu (voir docs/ARCHITECTURE.md).
  useEffect(() => {
    if (hydrated && !me) router.replace("/connexion");
  }, [hydrated, me, router]);

  if (!hydrated || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink-mute" role="status">
        Vérification de la session…
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <IntranetHeader onMenu={() => setMenuOpen(true)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main id="contenu" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto bg-surface px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
