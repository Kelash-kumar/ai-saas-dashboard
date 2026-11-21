export const themeChoices = {
    mode: ['light', 'dark', 'system'],
    accent: ['indigo', 'violet', 'teal', 'rose', 'amber'],
    navigation: ['vertical', 'compact', 'horizontal'],
    width: ['full', 'boxed'],
    direction: ['ltr', 'rtl'],
    header: ['sticky', 'floating', 'static'],
    sidebarTone: ['default', 'dark'],
    density: ['comfortable', 'compact'],
    radius: ['square', 'soft', 'rounded'],
    font: ['nunito', 'system'],
    motion: ['system', 'reduced'],
} as const;

export type ThemeKey = keyof typeof themeChoices;
export type ThemeSettings = { [K in ThemeKey]: (typeof themeChoices)[K][number] };

/** Change these once to set the defaults for every route and component. */
export const defaultTheme: Readonly<ThemeSettings> = Object.freeze({
    mode: 'light',
    accent: 'indigo',
    navigation: 'vertical',
    width: 'full',
    direction: 'ltr',
    header: 'sticky',
    sidebarTone: 'default',
    density: 'comfortable',
    radius: 'soft',
    font: 'nunito',
    motion: 'system',
});
export const THEME_STORAGE_KEY = 'foundation.theme.v1';
export const THEME_VERSION = 1;

export const accentColors = {
    indigo: '#4361ee',
    violet: '#805dca',
    teal: '#0f766e',
    rose: '#be185d',
    amber: '#a16207',
} satisfies Record<ThemeSettings['accent'], string>;

export function normalizeTheme(input: unknown): ThemeSettings {
    const result = { ...defaultTheme };
    if (!input || typeof input !== 'object' || Array.isArray(input)) return result;
    for (const key of Object.keys(themeChoices) as ThemeKey[]) {
        const value: unknown = (input as Record<string, unknown>)[key];
        if (typeof value === 'string' && (themeChoices[key] as readonly string[]).includes(value)) {
            Object.assign(result, { [key]: value });
        }
    }
    return result;
}

export function readThemeDocument(raw: string | null): ThemeSettings {
    try {
        const parsed: unknown = JSON.parse(raw ?? 'null');
        if (!parsed || typeof parsed !== 'object' || !('version' in parsed) || parsed.version !== THEME_VERSION || !('settings' in parsed)) return { ...defaultTheme };
        return normalizeTheme(parsed.settings);
    } catch {
        return { ...defaultTheme };
    }
}

export function exportTheme(settings: ThemeSettings): string {
    return JSON.stringify({ version: THEME_VERSION, settings: normalizeTheme(settings) }, null, 2);
}

export function importTheme(raw: string): ThemeSettings {
    if (raw.length > 8192) throw new Error('Choose a theme file smaller than 8 KB.');
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error('This file is not valid JSON.');
    }
    if (!parsed || typeof parsed !== 'object' || !('version' in parsed) || parsed.version !== THEME_VERSION || !('settings' in parsed) || !parsed.settings || typeof parsed.settings !== 'object') {
        throw new Error('Choose a theme file exported from this workspace.');
    }
    const candidate = parsed.settings as Record<string, unknown>;
    if ((Object.keys(themeChoices) as ThemeKey[]).some((key) => !(themeChoices[key] as readonly unknown[]).includes(candidate[key]))) {
        throw new Error('This theme contains missing or unsupported settings.');
    }
    return normalizeTheme(candidate);
}

/** Runs in head before first paint; values are allow-listed before becoming DOM attributes. */
export function themeBootstrapScript(): string {
    const boot = function (defaults: ThemeSettings, choices: Record<ThemeKey, readonly string[]>, key: string, version: number, colors: Record<ThemeSettings['accent'], string>) {
        const settings = { ...defaults };
        try {
            const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
            if (saved?.version === version && saved.settings && typeof saved.settings === 'object') {
                for (const field of Object.keys(choices) as ThemeKey[]) {
                    if (choices[field].includes(saved.settings[field])) Object.assign(settings, { [field]: saved.settings[field] });
                }
            }
        } catch {
            /* Storage can be unavailable. Defaults still render immediately. */
        }
        const root = document.documentElement;
        for (const field of Object.keys(choices) as ThemeKey[]) root.dataset[field] = settings[field];
        const mode = settings.mode === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : settings.mode;
        root.dataset.mode = mode;
        root.dataset.themeMode = settings.mode;
        root.dir = settings.direction;
        root.style.colorScheme = mode;
        root.style.setProperty('--accent', colors[settings.accent]);
    };
    return `(${boot.toString()})(${JSON.stringify(defaultTheme)},${JSON.stringify(themeChoices)},${JSON.stringify(THEME_STORAGE_KEY)},${THEME_VERSION},${JSON.stringify(accentColors)});`;
}
