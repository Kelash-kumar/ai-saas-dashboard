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
        items: [{ label: 'Overview', key: 'nav.overview', href: '/', icon: 'dashboard' }],
    },
    {
        title: 'User Management',
        key: 'nav.management',
        items: [
            { label: 'Admins', key: 'nav.admins', href: '/admins', icon: 'admin', required: modules.admins.read },
            { label: 'Roles', key: 'nav.roles', href: '/roles', icon: 'roles', required: modules.roles.read },
            { label: 'Users', key: 'nav.users', href: '/users', icon: 'users', required: modules.users.read },
            { label: 'Companies', key: 'nav.companies', href: '/companies', icon: 'company', required: modules.companies.read },
        ],
    },
    {
        title: 'Configuration',
        key: 'nav.configuration',
        items: [
            { label: 'Appearance', key: 'nav.appearance', href: '/settings/appearance', icon: 'palette' },
            { label: 'UI foundations', key: 'nav.ui', href: '/ui-kit', icon: 'grid' },
        ],
    },
];
export function visibleNavigation(permissions: readonly string[]) {
    return navigation.map((group) => ({ ...group, items: group.items.filter((item) => hasPermissions(permissions, item.required)) })).filter((group) => group.items.length);
}
