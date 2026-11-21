'use client';
export function PermissionMatrix({
    rows,
    value,
    change,
    disabled,
    allowed,
    inherited = [],
}: {
    rows: Record<string, unknown>[];
    value: string[];
    change: (ids: string[]) => void;
    disabled: boolean;
    allowed: string[];
    inherited?: string[];
}) {
    const groups = Map.groupBy(rows, (row) => String(row.resource));
    const available = rows.filter((row) => allowed.includes(String(row.name))).map((row) => String(row.id));
    const all = available.length > 0 && available.every((id) => value.includes(id));
    return (
        <section className="crm-matrix">
            <div className="crm-matrix-heading">
                <h2>Role Permissions</h2>
                <label>
                    <input
                        type="checkbox"
                        aria-label="Select all permissions"
                        disabled={disabled || !available.length}
                        checked={all}
                        ref={(element) => {
                            if (element) element.indeterminate = !all && available.some((id) => value.includes(id));
                        }}
                        onChange={() => change(all ? value.filter((id) => !available.includes(id)) : [...new Set([...value, ...available])])}
                    />
                    Select All
                </label>
            </div>
            <p className="muted text-sm mb-6">Only permissions you hold can be delegated. Inherited access is shown separately and stays controlled by its source role.</p>
            {[...groups].map(([resource, permissions]) => (
                <div className="crm-matrix-row" key={resource}>
                    <strong>{resource === 'admin' ? 'Administrator Access' : resource.charAt(0).toUpperCase() + resource.slice(1) + ' Management'}</strong>
                    <div>
                        {permissions.map((row) => (
                            <label key={String(row.id)} title={String(row.name)}>
                                <input
                                    type="checkbox"
                                    disabled={disabled || !allowed.includes(String(row.name))}
                                    checked={value.includes(String(row.id))}
                                    onChange={() => change(value.includes(String(row.id)) ? value.filter((id) => id !== row.id) : [...value, String(row.id)])}
                                />
                                {String(row.action)
                                    .replaceAll('_', ' ')
                                    .replace(/^./, (s) => s.toUpperCase())}
                                {inherited.includes(String(row.name)) && !value.includes(String(row.id)) && <small>Inherited</small>}
                            </label>
                        ))}
                    </div>
                </div>
            ))}
        </section>
    );
}
