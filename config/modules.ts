type ListColumn = readonly [field: string, label: string, sortBy: string];
const accountColumns = [
    ['fullName', 'Full Name', 'firstName'],
    ['email', 'Email', 'email'],
    ['phone', 'Phone', 'phone'],
    ['notificationChannel', 'Notification', 'notificationChannel'],
    ['twoFactor', 'Two-Factor', 'twoFactor'],
    ['createdAt', 'Created At', 'createdAt'],
] as const;
export interface ModuleDefinition {
    title: string;
    path: string;
    read: string[];
    create?: string[];
    update?: string[];
    remove?: string[];
    columns?: readonly ListColumn[];
    fields: string[];
    createOnly?: string[];
}
export const modules = {
    admins: {
        columns: accountColumns,
        title: 'nav.admins',
        path: 'crm/admins',
        read: ['admins.read'],
        create: ['admins.create'],
        update: ['admins.update'],
        remove: ['admins.delete'],
        fields: [],
    },
    users: {
        columns: accountColumns,
        title: 'nav.users',
        path: 'users',
        read: ['users.read'],
        create: ['users.create'],
        update: ['users.update'],
        remove: ['users.delete'],
        fields: ['email', 'password', 'firstName', 'lastName', 'phone', 'companyId'],
        createOnly: ['email', 'password'],
    },
    companies: {
        columns: [
            ['name', 'Company', 'name'],
            ['email', 'Email', 'email'],
            ['phone', 'Phone', 'phone'],
            ['website', 'Website', ''],
            ['createdAt', 'Created At', 'createdAt'],
        ],
        title: 'nav.companies',
        path: 'companies',
        read: ['companies.read'],
        create: ['companies.create'],
        update: ['companies.update'],
        remove: ['companies.delete'],
        fields: ['name', 'email', 'phone', 'website', 'address'],
    },
    roles: {
        columns: [
            ['name', 'Name', 'name'],
            ['guard', 'Guard', ''],
            ['description', 'Description', ''],
            ['createdAt', 'Created At', 'createdAt'],
        ],
        title: 'nav.roles',
        path: 'authorization/roles',
        read: ['roles.read'],
        create: ['roles.create', 'roles.delegate'],
        update: ['roles.update'],
        remove: ['roles.delete'],
        fields: ['name', 'description'],
        createOnly: ['name'],
    },
    permissions: {
        title: 'nav.permissions',
        path: 'authorization/permissions',
        read: ['permissions.read'],
        create: ['permissions.create'],
        fields: ['resource', 'action'],
    },
} satisfies Record<string, ModuleDefinition>;
export type ModuleName = keyof typeof modules;
export function isModuleName(name: string): name is ModuleName {
    return Object.hasOwn(modules, name);
}
export function moduleDefinition(name: string): ModuleDefinition | undefined {
    return isModuleName(name) ? modules[name] : undefined;
}
export interface PageData {
    data: Record<string, unknown>[];
    meta: { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
}
