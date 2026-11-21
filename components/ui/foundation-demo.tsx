'use client';

import { useState } from 'react';
import { useTheme } from '@/components/theme/theme-provider';
import { accentColors } from '@/config/theme';
import { Icon } from './icon';
export function FoundationDemo() {
    const { settings } = useTheme();
    const [count, setCount] = useState(0);
    const [message, setMessage] = useState('');
    return (
        <div className="ui-grid">
            <section className="panel">
                <div className="section-heading">
                    <div>
                        <h2>Actions & feedback</h2>
                        <p>A shared treatment for every interaction.</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button type="button" className="btn btn-primary" onClick={() => setCount((value) => value + 1)}>
                        Try an action <Icon name="check" className="size-4" />
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setCount(0)}>
                        Clear count
                    </button>
                    <button type="button" className="btn btn-primary" disabled>
                        Disabled
                    </button>
                </div>
                <div className="demo-feedback" role="status">
                    <Icon name="check" className="size-5" /> {count ? `You’ve tried this action ${count} ${count === 1 ? 'time' : 'times'}.` : 'Try the primary action to see feedback.'}
                </div>
                <div className="flex flex-wrap gap-2 pt-5">
                    <span className="badge">Primary</span>
                    <span className="badge badge-success">Success</span>
                    <span className="badge badge-neutral">Neutral</span>
                </div>
            </section>
            <section className="panel">
                <div className="section-heading">
                    <div>
                        <h2>Color & typography</h2>
                        <p>The little details, always in sync.</p>
                    </div>
                </div>
                <button
                    type="button"
                    className="color-sample"
                    onClick={async () => {
                        try {
                            await navigator.clipboard.writeText(accentColors[settings.accent]);
                            setMessage('Accent color copied.');
                        } catch {
                            setMessage('Clipboard is unavailable in this browser.');
                        }
                    }}
                >
                    <span style={{ backgroundColor: accentColors[settings.accent] }} />
                    <span>
                        <strong className="capitalize">{settings.accent}</strong>
                        <small>{accentColors[settings.accent]} · Click to copy</small>
                    </span>
                </button>
                <p role="status" className="muted text-xs mt-2">
                    {message}
                </p>
                <div className="typography-sample">
                    <h3>A clear point of view.</h3>
                    <p>Friendly, readable and comfortable at every size.</p>
                    <span className="muted text-xs">ABCDEFGHIJKLMNOPQRSTUVWXYZ · 0123456789</span>
                </div>
            </section>
            <section className="panel">
                <div className="section-heading">
                    <div>
                        <h2>Form essentials</h2>
                        <p>Accessible labels and clear focus states.</p>
                    </div>
                </div>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        setMessage('Preview form submitted. No data was sent.');
                    }}
                >
                    <label className="form-label" htmlFor="preview-name">
                        Display name
                    </label>
                    <input className="form-input" id="preview-name" placeholder="How should we call you?" maxLength={100} required />
                    <label className="form-label mt-4" htmlFor="preview-role">
                        Workspace role
                    </label>
                    <select className="form-input" id="preview-role" defaultValue="designer">
                        <option value="designer">Designer</option>
                        <option value="developer">Developer</option>
                        <option value="manager">Manager</option>
                    </select>
                    <label className="checkbox-label">
                        <input type="checkbox" defaultChecked /> Keep this workspace comfortable
                    </label>
                    <button className="btn btn-primary" type="submit">
                        Preview submit
                    </button>
                </form>
            </section>
            <section className="panel">
                <div className="section-heading">
                    <div>
                        <h2>A well-organized table</h2>
                        <p>Responsive content that respects your density setting.</p>
                    </div>
                </div>
                <div className="table-scroll">
                    <table>
                        <caption className="sr-only">Current workspace preferences</caption>
                        <thead>
                            <tr>
                                <th>Preference</th>
                                <th>Current choice</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ['Navigation', settings.navigation],
                                ['Color scheme', settings.mode],
                                ['Density', settings.density],
                                ['Reading direction', settings.direction.toUpperCase()],
                            ].map(([label, value]) => (
                                <tr key={label}>
                                    <td>{label}</td>
                                    <td className="capitalize">{value}</td>
                                    <td>
                                        <span className="table-status">
                                            <i /> Active
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="muted text-xs mt-4">These are your actual theme preferences, updated as you change them.</p>
            </section>
        </div>
    );
}
