# CLAUDE.md — Renoventis

## Projet

- **Nom** : Renoventis — renoventis.fr
- **Repo** : https://github.com/Galrauchk/renoventis.git
- **Client** : Jeffrey Aldebert (jeffrey.aldebert@gmail.com)
- **Activité** : Media rénovation énergétique. Lead gen artisans RGE + affiliation simulateurs/aides.

## Stack

| Couche | Techno |
|--------|--------|
| Framework | Astro 6 (SSG) + MDX + React (islands) |
| CSS | Tailwind CSS v4 via `@tailwindcss/vite` |
| Typage | TypeScript strict |
| Hébergement | Netlify (SSG + Functions) |
| Email transactionnel | Brevo (API v3, env `BREVO_API_KEY`) |
| Fonts | Google Fonts — Urbanist (titres) + Inter (corps) |
| Images | sharp |
| Sitemap | @astrojs/sitemap |

## Architecture

```
src/
├── components/         # Composants Astro + 1 island React (SimulateurAides.tsx)
│   ├── SEOHead.astro   # Meta, OG, Twitter, JSON-LD
│   ├── Header.astro    # Nav sticky + dropdown Travaux + CTA devis
│   ├── Footer.astro    # Fond #1B4332 + disclaimer légal
│   ├── DevisForm.astro # Formulaire multi-étapes (4 steps)
│   ├── LeadGenForm.astro # Formulaire lead gen pages hub
│   ├── SimulateurAides.tsx # React island (client:load) — simulateur interactif
│   ├── FAQ.astro, Breadcrumb.astro, AideCard.astro, HubCard.astro, ArticleCard.astro
├── content/
│   └── guides/         # 15 articles .md (collection Astro Content Layer)
├── layouts/
│   └── BaseLayout.astro # HTML shell : SEOHead + Header + slot + Footer
├── pages/
│   ├── index.astro     # Homepage
│   ├── isolation/      # Hub isolation
│   ├── pompe-a-chaleur/# Hub PAC
│   ├── panneaux-solaires/
│   ├── chaudiere-biomasse/
│   ├── ventilation-vmc/
│   ├── aides-renovation/
│   ├── simulateurs/    # Index + aides-renovation.astro
│   ├── devis/          # Page lead gen principale
│   ├── guides/         # index.astro + [slug].astro (dynamic)
│   ├── contact/, a-propos/, mentions-legales/, politique-confidentialite/
├── styles/
│   └── global.css      # Tailwind v4 @theme (palette + fonts)
├── content.config.ts   # Collection "guides" avec Zod schema
public/
├── illustrations/      # 8 SVG custom (hero-maison, isolation, pac, etc.)
├── logo-renoventis.svg, logo-renoventis-light.svg, favicon.svg
├── robots.txt, manifest.webmanifest, llms.txt, llms-full.txt
netlify/
└── functions/
    └── send-contact-email.ts  # Brevo API — devis + contact → jeffrey.aldebert@gmail.com
```

## Routing

- Pages statiques : chaque `src/pages/*/index.astro` = une route
- Articles dynamiques : `src/pages/guides/[slug].astro` → collection `guides`
- Pas de SSR — tout est `output: 'static'`

## SEO

- **Meta/OG/Twitter** : `SEOHead.astro` — title auto-suffixé `| Renoventis`, canonical = URL courante
- **JSON-LD** : passé en prop `jsonLd` au layout (Organization, Service, FAQPage, LocalBusiness)
- **Sitemap** : `@astrojs/sitemap` avec priorités custom dans `astro.config.mjs` (homepage=1.0, hubs=0.9, guides=0.7)
- **robots.txt** : `public/robots.txt` — Allow /, Disallow /contact-merci/ /api/ /.netlify/
- **Canonical** : auto via `Astro.url.href`, override possible via prop

## Palette & Design tokens

Définis dans `src/styles/global.css` via `@theme` :
- `--color-primary: #1B4332` (vert forêt)
- `--color-accent: #52B788` (émeraude)
- `--color-accent-warm: #F4A261` (orange — aides/CTA)
- `--color-surface: #F0FAF4`, `--color-dark: #081C15`, `--color-text: #1B2521`
- `--font-heading: Urbanist`, `--font-body: Inter`

## Conventions

- **Nommage pages** : slug français kebab-case (`pompe-a-chaleur`, `aides-renovation`)
- **Articles** : fichiers `.md` dans `src/content/guides/`, frontmatter obligatoire : `title`, `description`, `category`, `publishDate`, `tags[]`, `aideMontant?`
- **Composants** : PascalCase `.astro` sauf `SimulateurAides.tsx` (React island)
- **Formulaires** : POST vers `/.netlify/functions/send-contact-email`
- **Ne pas toucher** : `package-lock.json` manuellement, `dist/` (généré), `.astro/` (généré)

## Déploiement

1. `npm run build` → `dist/`
2. Push sur `main` → Netlify auto-deploy
3. Variable d'environnement requise sur Netlify : `BREVO_API_KEY`

## État actuel

- **Build** : passe sans erreur
- **DNS** : pas encore configuré (renoventis.fr → Netlify)
- **Brevo** : `BREVO_API_KEY` à configurer dans Netlify env vars, domaine expéditeur `contact@renoventis.fr` à vérifier dans Brevo
- **OG images** : fallback sur `/illustrations/hero-maison.svg` — pas d'images OG spécifiques par page
- **Analytics** : aucun tracker installé (prévoir Plausible ou Matomo)
- **Formulaire devis** : front-end complet, backend Netlify Function prêt, pas encore testé en production

## Historique

- Projet créé le 2026-03-29 en un seul commit initial
- Pas de migration, pas d'ancien site — greenfield
- 15 articles SEO rédigés couvrant isolation, PAC, solaire, aides, DPE, CEE, audit
