# Architecture & Sécurité — Portail Sentinelle

> **Cadre institutionnel inspiré de la Gendarmerie nationale & Système de Design de l'État (DSFR)**  
> *Environnement de démonstration pédagogique — Données entièrement fictives.*

---

## 1. Pile Technique Recommandée

| Composant | Solution retenue | Justification technique & sécurité |
| :--- | :--- | :--- |
| **Framework Full-stack** | **Next.js 15+ (App Router)** | Rendu hybride (SSR pour l'espace public SEO, RSC/Server Actions pour l'intranet), isolation étanche client/serveur, headers stricts natifs. |
| **Typage & Fiabilité** | **TypeScript 5.7+ (Strict)** | Typage intégral de bout en bout (front, modèles, RBAC), élimination des erreurs à l'exécution. |
| **Design System** | **Tailwind CSS 3.4+** | Jetons de design calqués sur la charte étatique (bleu Gendarmerie `#00205B`, rouge Marianne `#E1000F`, gris neutres, accessibilité RGAA/WCAG 2.1 AA). |
| **Base de Données** | **PostgreSQL 16+** | Prise en charge native du Row Level Security (RLS), intégrité relationnelle stricte, indexation JSONB & trigrammes pour les recherches de PV. |
| **ORM & Migrations** | **Prisma ORM** | Typage direct des entités, migrations reproductibles et sécurisées, conformité transactionnelle ACID. |
| **Authentification** | **NextAuth v5 / Auth.js (OIDC)** | Intégration standardisée avec les fournisseurs d'identité d'État (AgentConnect / ProConnect / FranceConnect) avec 2FA / FIDO2 (cartes agents). |
| **Audit & Intégrité** | **Chaîne de hachage cryptographique (SHA-256)** | Registre infalsifiable inspiré des normes d'archivage à valeur probante (NF Z42-013). |

---

## 2. Matrice RBAC (Rôles & Permissions)

La sécurité repose sur le principe de **moindre privilège** et la **séparation des devoirs** (*Separation of Duties*) :

* **Visiteur** : Accès au portail d'information citoyen, numéros d'urgence, consultation des offres d'incorporation et soumission d'une candidature.
* **Agent** : Consultation des procédures de sa brigade, rédaction de nouveaux PV et rapports, dépôt de demandes d'habilitation pour ses besoins de service.
* **Gradé / OPJ** : Direction d'enquête, validation légale des procès-verbaux, transmission au Parquet ou classement sans suite, instruction des habilitations de son unité (avec respect de la règle des quatre yeux).
* **Administrateur RH / DSI** : Gestion des effectifs (création, mise à jour, radiation d'agents), attribution des rôles applicatifs, pilotage des candidatures du Pôle Recrutement, supervision du journal d'audit de sécurité. **L'administrateur n'a pas accès au fond des procédures judiciaires (secret de l'instruction et de l'enquête).**

```
+------------------------------------+-----------+-------+---------+-------+
| Permission                         | Visiteur  | Agent | Officier| Admin |
+------------------------------------+-----------+-------+---------+-------+
| Lecture espace public              |    Oui    |  Oui  |   Oui   |  Oui  |
| Déposer une candidature           |    Oui    |   -   |    -    |   -   |
| Tableau de bord opérationnel       |     -     |  Oui  |   Oui   |  Oui  |
| Procédures : Lecture               |     -     | Unité |  Unité  |   -   |
| Procédures : Création & Rapports   |     -     |  Oui  |   Oui   |   -   |
| Procédures : Validation / Parquet  |     -     |   -   |   Oui   |   -   |
| Habilitations : Demande            |     -     |  Oui  |   Oui   |  Oui  |
| Habilitations : Instruction/Rejet  |     -     |   -   |  Unité* |  Tous |
| Effectifs : Annuaire               |     -     |   -   |  Unité  |  Tous |
| Effectifs : Ajout / Révocation     |     -     |   -   |    -    |  Tous |
| Recrutement : Back-office          |     -     |   -   |    -    |  Tous |
| Sécurité : Journal d'audit         |     -     |   -   |    -    |  Tous |
+------------------------------------+-----------+-------+---------+-------+
* Règle des quatre yeux : auto-validation interdite.
```

---

## 3. Schéma Relationnel PostgreSQL (Prisma)

Consultez le fichier complet [schema.prisma](file:///C:/Users/franc/.gemini/antigravity/scratch/portail-sentinelle/prisma/schema.prisma) :

* `users` : Comptes d'authentification (compatibles SSO OIDC).
* `unites` : Brigades territoriales autonomes, Brigades de Recherches, PSIG, Groupements.
* `agents` : Personnels d'active (matricule à 6 chiffres, grade, qualification judiciaire APJ/OPJ, affectation).
* `demandes_habilitation` : Demandes d'accès (fichiers confidentiels, armurerie, qualification) et leur workflow décisionnel.
* `procedures` : Dossiers judiciaires (PV d'enquête préliminaire, flagrant délit, fiches d'intervention).
* `rapports_procedure` : Pièces et actes annexés horodatés.
* `candidatures` : Dépôts publics avec suivi des étapes d'incorporation.
* `audit_logs` : Journal infalsifiable chaîné par empreintes de hachage.

---

## 4. Mesures de Sécurité Avancées Recommandées

1. **Content-Security-Policy (CSP) stricte** : Aucun script inline non-haché, désactivation des `eval()`, restriction des origines autorisées.
2. **Authentification forte & FIDO2** : Prise en charge des tokens physiques (cartes professionnelles à puce / clés de sécurité USB).
3. **Chiffrement au repos & en transit** : PostgreSQL avec TDE (Transparent Data Encryption), TLS 1.3 obligatoire avec HSTS preload.
4. **Row Level Security (RLS)** : Cloisonnement strict au niveau de la base garantissant qu'un agent ne peut requêter qu'au sein de son unité de rattachement.
5. **Traçabilité inviolable** : Chaque lecture ou modification de procédure judiciaire génère une entrée d'audit scellée par calcul de hash chaîné.
