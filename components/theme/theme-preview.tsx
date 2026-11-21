'use client';

import { useTheme } from './theme-provider';
import { Icon } from '@/components/ui/icon';
export function ThemePreview() {
    const { settings, storageAvailable } = useTheme();
    return (
        <aside className="preview-column" aria-label="Live theme preview">
            <div className="panel preview-panel">
                <div className="preview-title">
                    <h2>Live preview</h2>
                    <span>
                        <i /> Always up to date
                    </span>
                </div>
                <div className="workspace-preview" aria-hidden="true">
                    <div className="preview-sidebar">
                        <span className="preview-brand">V</span>
                        <i />
                        <i />
                        <i />
                        <i />
                    </div>
                    <div className="preview-canvas">
                        <div className="preview-top">
                            <b>My workspace</b>
                            <span>AJ</span>
                        </div>
                        <div className="preview-lines">
                            <strong>Good morning.</strong>
                            <i />
                            <div className="preview-metrics">
                                <span />
                                <span />
                            </div>
                            <div className="preview-chart">
                                {[35, 58, 45, 75, 55, 92, 70].map((height, index) => (
                                    <i key={index} style={{ height: `${height}%` }} />
                                ))}
                            </div>
                            <span className="preview-action">Primary action</span>
                        </div>
                    </div>
                </div>
                <p className="muted text-xs leading-5">A little glimpse of your theme. Every change also applies to the workspace around you.</p>
                <div className="preview-details">
                    <span>Active accent</span>
                    <strong className="capitalize text-primary">{settings.accent}</strong>
                </div>
                <div className="preview-details">
                    <span>Preference storage</span>
                    <strong>{storageAvailable ? 'This browser' : 'This tab'}</strong>
                </div>
            </div>
            <div className="preference-note">
                <Icon name="check" className="size-5 text-primary" />
                <div>
                    <h3>Your space, your preferences</h3>
                    <p>{storageAvailable ? 'Changes are saved automatically on this browser. No need to press save.' : 'Browser storage is unavailable. Your preferences still work in this tab.'}</p>
                </div>
            </div>
        </aside>
    );
}
