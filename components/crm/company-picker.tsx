'use client';
import { useState } from 'react';
import { useModuleOptions } from '@/hooks/use-module-options';
export function CompanyPicker({ value, change, allowed, id = 'crm-company', required = false }: { value: string; change: (value: string) => void; allowed: boolean; id?: string; required?: boolean }) {
    const [search, setSearch] = useState('');
    const { rows, loading, error } = useModuleOptions('companies', search, allowed);
    return (
        <div className="crm-company-picker">
            {allowed && <input className="form-input" aria-label="Search companies" placeholder="Search companies…" value={search} onChange={(e) => setSearch(e.target.value)} />}
            <select id={id} className="form-input" value={value} onChange={(e) => change(e.target.value)} disabled={!allowed} required={required}>
                <option value="">Select…</option>
                {value && !rows.some((row) => row.id === value) && <option value={value}>Current company</option>}
                {rows.map((row) => (
                    <option key={String(row.id)} value={String(row.id)}>
                        {String(row.name)}
                    </option>
                ))}
            </select>
            {loading && <small className="muted">Loading…</small>}
            {error && <small role="alert">{error}</small>}
            {!allowed && <small className="muted">Company access is required to change this field.</small>}
        </div>
    );
}
