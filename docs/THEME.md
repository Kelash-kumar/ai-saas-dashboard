# Theme configuration and working guide

## Single source of truth

config/theme.ts defines ThemeSettings, the allowed values, defaultTheme, the accent palette and versioned import/export functions. Both the appearance page and quick drawer use the same ThemeField component. ThemeProvider exposes useTheme to components; no component maintains a second copy of a theme preference.

```tsx
'use client';
import { useTheme } from '@/components/theme/theme-provider';

export function ColorModeButton() {
    const { resolvedMode, update } = useTheme();
    return (
        <button type="button" onClick={() => update({ mode: resolvedMode === 'dark' ? 'light' : 'dark' })}>
            Switch to {resolvedMode === 'dark' ? 'light' : 'dark'} mode
        </button>
    );
}
```

This is a complete optional integration example. The header already supplies the equivalent action.

| Key         | Values                            | Default     |
| ----------- | --------------------------------- | ----------- |
| mode        | light, dark, system               | light       |
| accent      | indigo, violet, teal, rose, amber | indigo      |
| navigation  | vertical, compact, horizontal     | vertical    |
| width       | full, boxed                       | full        |
| direction   | ltr, rtl                          | ltr         |
| header      | sticky, floating, static          | sticky      |
| sidebarTone | default, dark                     | default     |
| density     | comfortable, compact              | comfortable |
| radius      | square, soft, rounded             | soft        |
| font        | nunito, system                    | nunito      |
| motion      | system, reduced                   | system      |

Sidebar tone default follows light/dark; dark is Vristo's semi-dark sidebar style. Compact/horizontal layouts apply at desktop widths; small screens always get the accessible mobile drawer. RTL changes logical layout and reading direction; the current interface is in English, and this control does not claim to translate it. Motion system respects prefers-reduced-motion; reduced disables transitions regardless of device preference.

## Brand and navigation

Edit config/app.ts for the brand, page title and permission-aware navigation. Sidebar, horizontal navigation and page search derive from the same registry. Add a real route before adding its href. Vristo's SVG icons are wrapped by components/ui/icon.tsx so app components do not repeat import paths or accessibility handling.

Nunito is self-hosted through @fontsource-variable/nunito. Builds and page loads do not require Google Fonts. System font uses the device's UI font. Global component styles use CSS variables rather than hard-coded per-page theme colors. Shared classes include panel, btn/btn-primary/btn-secondary, form-input, form-label, section-heading, badge and table styles.

## Persistence and first paint

The origin-local storage key is foundation.theme.v1. Its document has version 1 and a settings object containing only the eleven supported fields. Unknown storage fields are dropped, invalid values fall back to defaults, malformed JSON and unsupported schema versions are ignored.

The inline head bootstrap runs before React and before the first paint, applying validated preferences, direction, accent and color-scheme to the html element. It is generated from the same defaults, choices and palette as the provider. React uses useSyncExternalStore with a stable server snapshot for hydration, without blanking server-rendered content behind a mounted/loading screen. The root suppressHydrationWarning is limited to the html attributes deliberately changed by that pre-paint script.

The external store owns DOM/storage side effects; there are no reducers that mutate localStorage or document. It listens for operating-system color-scheme changes and storage events from other tabs, and removes listeners when unsubscribed. Storage failures preserve in-memory updates and show that preferences apply to this tab. Reset clears the stored override so future configured defaults can apply.

Browser-local means settings apply to all routes on the same origin/browser. Different hosts or ports have separate preferences. No theme data is sent to NestJS in this step. An organization-wide default or per-account preference service would need a separate authorized API in a future phase.

## Import and export

Use Import theme/Export theme at the bottom of Appearance. Export contains only the schema version and allow-listed theme settings, not credentials or account data. Imports are limited to 8 KB and must contain every supported choice at version 1. Invalid documents display an error without replacing the current theme. Reset restores source defaults.

Use exportTheme(defaultTheme) to produce a baseline document programmatically. Adding new settings requires updating the schema/version deliberately and providing a migration; do not change the meaning of existing persisted values silently.

## New presets and shared styles

For another accent, update themeChoices.accent and accentColors in config/theme.ts, then its friendly label in theme-controls.tsx. TypeScript enforces that every preset has a color. The provider/bootstrap derives --accent from that map, and backgrounds/borders/shadows use color-mix from that variable. No per-page color replacement is needed.

For a new layout option, extend the settings type/choice metadata and implement its CSS selector using the resulting data attribute. Preferences should only contain validated enum values, never arbitrary CSS, HTML, scripts or URLs. UI-only state (open drawer/search, form demo values) stays separate from persisted theme settings.

## File map

```text
app/
  layout.tsx                    Server root, font, bootstrap, providers and shell
  page.tsx                      Overview and honest upcoming steps
  settings/appearance/page.tsx   Complete theme preferences
  ui-kit/page.tsx                Reusable component preview
  error.tsx / not-found.tsx / loading.tsx
components/
  layout/admin-shell.tsx        Header/sidebar/mobile drawer/page search
  theme/theme-provider.tsx      Shared React context and subscription
  theme/theme-store.ts          Validated persistence, DOM updates and cross-tab/system listeners
  theme/theme-controls.tsx       Reusable controls, reset/import/export
  theme/theme-drawer.tsx         Accessible quick preferences
  theme/theme-preview.tsx        Live sample using the actual theme tokens
  ui/icon.tsx                   Wrapper over supplied Vristo icons
  ui/foundation-demo.tsx         Working UI samples
config/
  app.ts                        Global branding and navigation
  theme.ts                      Defaults, schema, palette, codec and first-paint bootstrap
styles/globals.css              Tailwind 4, semantic tokens and Vristo-derived shared styles
tests/theme.spec.ts             Schema and production-browser checks
```

## Validation

Browser checks cover document validation and round-trip, navigation without hydration errors, every preference persisted across reload/routes, system mode, cross-tab reset, dark mode before React loads, corrupt/blocked storage, dialog focus and Escape, keyboard search, real file import/export, horizontal/boxed layout, mobile RTL, narrow-screen overflow and reduced motion. Captured screenshots are visually inspected for desktop light/dark and mobile RTL. The screenshots are review artifacts; there is no claim that screenshot capture alone performs pixel-diff regression testing.

Testing uses Chromium on this Windows machine. No claim is made for an externally deployed environment or Safari/Firefox until those environments are exercised. Tailwind 4's modern-browser requirements apply; see its official compatibility guide in UPGRADE.md.
