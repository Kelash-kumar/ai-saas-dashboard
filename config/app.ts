import type { IconName } from '@/components/ui/icon';
import { hasPermissions } from '@/lib/auth/permissions';
import { modules } from './modules';
export const appConfig = { brand: 'VRISTO', workspace: 'Foundation', title: 'Foundation Workspace', description: 'A thoughtfully configured workspace.' } as const;
export interface NavigationItem {
    label: string;
    key: string;
    href: string;
    icon: IconName;
    required?: readonly string[];
}
export const navigation: { title: string; key: string; items: NavigationItem[] }[] = [
    {
        title: 'Workspace',
        key: 'nav.workspace',
        items: [
            { label: 'Overview', key: 'nav.overview', href: '/', icon: 'dashboard' },
            { label: 'Users', key: 'nav.users', href: '/users', icon: 'users', required: modules.users.read },
            { label: 'Companies', key: 'nav.companies', href: '/companies', icon: 'company', required: modules.companies.read },
            { label: 'Roles', key: 'nav.roles', href: '/roles', icon: 'grid', required: modules.roles.read },
            { label: 'Permissions', key: 'nav.permissions', href: '/permissions', icon: 'check', required: modules.permissions.read },
        ],
    },
    {
        title: 'Configuration',
        key: 'nav.configuration',
        items: [
            { label: 'Appearance', key: 'nav.appearance', href: '/settings/appearance', icon: 'palette' },
            { label: 'UI foundations', key: 'nav.ui', href: '/ui-kit', icon: 'grid' },
            { label: 'My account', key: 'nav.account', href: '/account', icon: 'users' },
        ],
    },
];
export function visibleNavigation(permissions: readonly string[]) {
    return navigation.map((group) => ({ ...group, items: group.items.filter((item) => hasPermissions(permissions, item.required)) })).filter((group) => group.items.length);
}
