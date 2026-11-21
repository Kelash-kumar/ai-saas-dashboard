'use client';

import { useId, useRef, useState } from 'react';
import { accentColors, themeChoices, importTheme, exportTheme } from '@/config/theme';
import type { ThemeKey, ThemeSettings } from '@/config/theme';
import { useLocale } from '@/components/providers/locale-provider';
import { useTheme } from './theme-provider';
import { Icon } from '@/components/ui/icon';

const fields: Record<ThemeKey, { label: string; description: string; labels: Record<string, string> }> = {
    mode: { label: 'Color scheme', description: 'A brighter day or a quieter evening. Let your device decide, too.', labels: { light: 'Light', dark: 'Dark', system: 'System' } },
    accent: {
        label: 'Accent color',
        description: 'Your signature color for actions, links and highlights.',
        labels: { indigo: 'Indigo', violet: 'Violet', teal: 'Teal', rose: 'Rose', amber: 'Amber' },
    },
    navigation: { label: 'Navigation', description: 'Choose how you move around your workspace.', labels: { vertical: 'Sidebar', compact: 'Compact', horizontal: 'Horizontal' } },
    width: { label: 'Content width', description: 'Give your content room, or keep it comfortably centered.', labels: { full: 'Full width', boxed: 'Boxed' } },
    direction: { label: 'Reading direction', description: 'The entire workspace adapts to your preferred direction.', labels: { ltr: 'Left to right', rtl: 'Right to left' } },
    header: { label: 'Header style', description: 'Keep navigation within reach as you scroll.', labels: { sticky: 'Sticky', floating: 'Floating', static: 'Static' } },
    sidebarTone: { label: 'Sidebar tone', description: 'Match your color scheme or add a little contrast.', labels: { default: 'Match theme', dark: 'Dark sidebar' } },
    density: { label: 'Interface density', description: 'Space to breathe or more content at a glance.', labels: { comfortable: 'Comfortable', compact: 'Compact' } },
    radius: { label: 'Corner style', description: 'A small detail that changes the whole feel.', labels: { square: 'Crisp', soft: 'Soft', rounded: 'Rounded' } },
    font: { label: 'Typography', description: 'Vristo’s friendly Nunito or your device’s system font.', labels: { nunito: 'Nunito', system: 'System font' } },
    motion: { label: 'Motion', description: 'System respects your device’s reduced-motion preference.', labels: { system: 'Follow device', reduced: 'Reduce motion' } },
};

function LayoutThumbnail({ value }: { value: string }) {
    return (
        <span className={`layout-thumbnail layout-thumbnail-${value}`} aria-hidden="true">
            <i />
            <span>
                <b />
                <em />
                <em />
            </span>
        </span>
    );
}

export function ThemeField({ field, compact = false }: { field: ThemeKey; compact?: boolean }) {
    const { settings, update } = useTheme();
    const name = useId();
    const { t } = useLocale();
    const meta = fields[field];
    const illustrated = field === 'mode' || field === 'navigation';
    return (
        <fieldset className={`theme-field ${compact ? 'is-compact' : ''}`}>
            <legend>{t('theme.' + field, meta.label)}</legend>
            {!compact && <p className="field-description">{meta.description}</p>}
            <div className={`choice-group ${illustrated && !compact ? 'illustrated-choices' : ''} ${field === 'accent' ? 'accent-choices' : ''}`}>
                {themeChoices[field].map((value) => (
                    <label key={value} className={`choice ${settings[field] === value ? 'is-selected' : ''}`}>
                        <input type="radio" className="sr-only" name={name} value={value} checked={settings[field] === value} onChange={() => update({ [field]: value } as Partial<ThemeSettings>)} />
                        {field === 'accent' ? (
                            <span className="color-dot" style={{ backgroundColor: accentColors[value as ThemeSettings['accent']] }} aria-hidden="true">
                                {settings.accent === value && <span>✓</span>}
                            </span>
                        ) : illustrated && !compact ? (
                            <LayoutThumbnail value={value} />
                        ) : null}
                        <span>{t(`option.${field}.${value}`, t('option.' + value, meta.labels[value]))}</span>
                        {illustrated && !compact && <span className="radio-dot" aria-hidden="true" />}
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

export function ThemeTransfer() {
    const { settings, update } = useTheme();
    const file = useRef<HTMLInputElement>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState(false);
    function download() {
        const blob = new Blob([exportTheme(settings)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'foundation-theme.json';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setError(false);
        setMessage('Theme exported. Keep it handy for your next workspace.');
    }
    return (
        <div className="theme-transfer">
            <div>
                <h3>Take your preferences with you</h3>
                <p>Export your theme, or import one you saved earlier.</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => file.current?.click()}>
                    Import theme
                </button>
                <button type="button" className="btn btn-secondary" onClick={download}>
                    Export theme <span aria-hidden="true">↗</span>
                </button>
                <input
                    ref={file}
                    type="file"
                    accept="application/json,.json"
                    className="sr-only"
                    aria-label="Import theme file"
                    tabIndex={-1}
                    onChange={async (event) => {
                        const selected = event.currentTarget.files?.[0];
                        event.currentTarget.value = '';
                        if (!selected) return;
                        try {
                            if (selected.size > 8192) throw new Error('Choose a theme file smaller than 8 KB.');
                            update(importTheme(await selected.text()));
                            setError(false);
                            setMessage('Theme imported. Your workspace is ready.');
                        } catch (reason) {
                            setError(true);
                            setMessage(reason instanceof Error ? reason.message : 'Could not import this theme.');
                        }
                    }}
                />
            </div>
            {message && (
                <p role={error ? 'alert' : 'status'} className={error ? 'transfer-error' : 'transfer-success'}>
                    {message}
                </p>
            )}
        </div>
    );
}

export function ResetThemeButton() {
    const { t } = useLocale();
    const { reset } = useTheme();
    const [message, setMessage] = useState('');
    return (
        <>
            <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                    reset();
                    setMessage('Default theme restored.');
                }}
            >
                <Icon name="reset" className="size-4" /> {t('theme.reset')}
            </button>
            <span role="status" className="sr-only">
                {message}
            </span>
        </>
    );
}
