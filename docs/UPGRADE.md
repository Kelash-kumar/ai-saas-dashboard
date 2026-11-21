# Vristo starter upgrade

Verified against the npm stable registry on 21 November 2026. Exact versions are pinned in package.json and package-lock.json. The source supplied by the user is Vristo 2.0.1's dedicated Next starter, not the full demo application.

| Component          | Supplied starter                | Prepared starter                        |
| ------------------ | ------------------------------- | --------------------------------------- |
| Next.js            | 14.2.13                         | 16.4.6                                  |
| React / React DOM  | 18.3.1                          | 19.3.1                                  |
| Tailwind           | ^3.4.1                          | 4.3.5                                   |
| Headless UI        | ^2.1.2                          | 2.2.10                                  |
| TypeScript         | ^5.3.3                          | 6.0.3 (compatible compiler line)        |
| ESLint             | 8.57.0 / next lint              | 9.39.5 / flat config, zero warnings     |
| Next ESLint config | 14.2.13                         | 16.4.6                                  |
| Nunito             | Build-time Google font download | Self-hosted variable font package 5.3.0 |

TypeScript 7.0.2 and ESLint 10.15.0 were checked, but the current Next lint dependency graph rejects them: typescript-eslint does not support the TS 7 API and some lint plugins constrain ESLint's supported major. Pinning the newest compatible TS 6/ESLint 9 releases keeps install, type checking and linting coherent. npm currently labels ESLint 9 unsupported; this compatibility hold should be revisited with the upstream Next lint/plugin releases. It is recorded explicitly rather than hidden using force, legacy-peer-deps or ignored build errors. Audit results do not substitute for support status.

## Changes needed for compatibility

- App Router and strict TypeScript remain, using bundler module resolution; obsolete baseUrl/node resolution settings are removed.
- Removed old swcMinify and ignored-lint-build configuration. Modern lint is an explicit required check, not silently bypassed.
- Tailwind 4 uses @tailwindcss/postcss, CSS-first semantic tokens, explicit source roots and a data-attribute dark variant. The original Tailwind 3 config and styles are preserved in reference/local backups rather than passed into the v4 compiler unchanged.
- Replaced the starter's effect-heavy Redux/DOM/localStorage theme reducers with one typed external store and accessible shared controls. No Redux package is needed for theme preferences.
- Removed starter-only packages that were not required for this step: old scrollbar/popper wrappers, ni18n, cookie helpers and unused animation/validation/UI dependencies. Native overflow handles scrolling; Headless UI handles focus-managed dialogs; forms use native accessible controls. Future modules can add their actual dependencies when implemented.
- Reused the provided Vristo logo/icons and its panel/button design language. This update does not import the full template demo's editors/calendars/tables/charts and their unrelated dependencies.
- Replaced demo menu links and fake profile/notification actions with the three working starter pages and explicitly upcoming modules.

## Verify or update later

```powershell
npm ci
npm ls --all
npm audit
npm outdated
npm run check
```

A clean dependency tree must have no invalid peers. Check the installed graph and rerun the full production/browser checks when upgrading; never fix a peer conflict with force. CI should use the lockfile. No new backend dependency, migration or API change is required for this frontend step.

Official migration references:

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js 16 migration](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Tailwind v4 upgrade](https://tailwindcss.com/docs/upgrade-guide)
- [Tailwind browser compatibility](https://tailwindcss.com/docs/compatibility)
- [ESLint version support](https://eslint.org/version-support/)
