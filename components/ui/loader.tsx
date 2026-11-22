import type { CSSProperties } from 'react';

export interface LoaderProps {
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'inline' | 'section' | 'fullscreen';
    className?: string;
}

/** Presentation only: safe in server components and Suspense fallbacks. */
export function Loader({ label = 'Loading…', size = 'md', variant = 'inline', className = '' }: LoaderProps) {
    const sizes = { sm: 16, md: 28, lg: 40 };
    return (
        <div className={`app-loader app-loader--${variant} ${className}`} role="status" aria-live="polite" aria-atomic="true" style={{ '--loader-size': `${sizes[size]}px` } as CSSProperties}>
            <span className="app-loader-content">
                <svg className="app-loader-spinner" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                    <circle className="app-loader-track" cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="3" />
                    <path d="M20 3a17 17 0 0 1 17 17" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <span className="app-loader-label">{label}</span>
            </span>
        </div>
    );
}
