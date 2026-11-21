'use client';
import { Icon } from '@/components/ui/icon';
import { useState } from 'react';
export function GrantPicker({ label, rows, value, change, disabled }: { label: string; rows: Record<string, unknown>[]; value: string[]; change: (value: string[]) => void; disabled: boolean }) {
    const [search, setSearch] = useState('');
    return (
        <details className="crm-grants">
            <summary>
                {value.length ? value.length + ' selected' : 'Search…'} <Icon name="caret" className="size-4" />
            </summary>
            <div className="crm-grants-options">
                <input className="form-input" aria-label={'Search ' + label.toLowerCase()} placeholder="Search…" value={search} onChange={(event) => setSearch(event.target.value)} />
                <div>
                    {rows
                        .filter((row) => String(row.name).toLowerCase().includes(search.toLowerCase()))
                        .map((row) => (
                            <label key={String(row.id)}>
                                <input
                                    type="checkbox"
                                    disabled={disabled}
                                    checked={value.includes(String(row.id))}
                                    onChange={() => change(value.includes(String(row.id)) ? value.filter((id) => id !== row.id) : [...value, String(row.id)])}
                                />
                                {String(row.name)}
                            </label>
                        ))}
                    {!rows.length && <p className="muted text-sm">No available {label.toLowerCase()}.</p>}
                </div>
            </div>
        </details>
    );
}
