import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DemoStoreProvider } from "@/components/store";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Sentinelle — Portail interne (démonstration)", template: "%s · Sentinelle" },
  description: "Maquette fictive d'un portail institutionnel : espace public d'information et intranet sécurisé à contrôle d'accès par rôles.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <a href="#contenu" className="skip-link">
          Aller au contenu
        </a>
        <DemoStoreProvider>{children}</DemoStoreProvider>
      </body>
    </html>
  );
}
