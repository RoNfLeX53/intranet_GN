"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useCurrentUser } from "@/components/store";
import { can, type Permission } from "@/lib/rbac";
import { ROLE_LABEL } from "@/lib/labels";

export function AccessDenied({ reason }: { reason?: string }) {
  const me = useCurrentUser();
  return (
    <div className="mx-auto max-w-xl border border-line border-t-4 border-t-marianne bg-white p-8 text-center">
      <ShieldAlert className="mx-auto text-marianne" size={40} aria-hidden />
      <h1 className="mt-4 text-xl font-bold text-gend-900">Accès non autorisé (403)</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {reason ?? "Votre profil ne dispose pas des droits nécessaires pour consulter cette ressource."}
        {me && (
          <>
            {" "}Profil actuel : <strong>{ROLE_LABEL[me.role]}</strong>.
          </>
        )}
      </p>
      <p className="mt-2 text-xs text-ink-mute">Cette tentative d&apos;accès est enregistrée dans le journal d&apos;audit.</p>
      <Link href="/intranet" className="mt-6 inline-block bg-gend-900 px-4 py-2 text-sm font-medium text-white hover:bg-gend-800">
        Retour au tableau de bord
      </Link>
    </div>
  );
}

/** Garde d'affichage. La vraie barrière est côté serveur (middleware + RLS). */
export function Guard({ perm, children }: { perm: Permission | Permission[]; children: ReactNode }) {
  const me = useCurrentUser();
  const perms = Array.isArray(perm) ? perm : [perm];
  if (!me || !perms.some((p) => can(me.role, p))) return <AccessDenied />;
  return <>{children}</>;
}
