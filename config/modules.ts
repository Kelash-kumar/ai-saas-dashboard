export interface ModuleField {
    key: string;
    type?: 'text' | 'email' | 'password' | 'textarea' | 'company';
    required?: boolean;
    max?: number;
    createOnly?: boolean;
    editOnly?: boolean;
    nullable?: boolean;
}
export interface ModuleDefinition {
    title: string;
    path: string;
    read: string[];
    create?: string[];
    update?: string[];
    remove?: string[];
    fields: ModuleField[];
    columns: string[];
    sort: string[];
}
export const modules = {
    admins: {
        title: 'nav.admins',
        path: 'crm/admins',
        read: ['admins.read'],
        create: ['admins.create'],
        update: ['admins.update'],
        remove: ['admins.delete'],
        fields: [],
        columns: ['fullName', 'email', 'phone', 'notificationChannel', 'twoFactor', 'createdAt'],
        sort: ['firstName', 'email', 'phone', 'createdAt'],
    },
    users: {
        title: 'nav.users',
        path: 'users',
        read: ['users.read'],
        create: ['users.create'],
        update: ['users.update'],
        remove: ['users.delete'],
        fields: [
            { key: 'email', type: 'email', required: true, max: 320, createOnly: true },
            { key: 'password', type: 'password', required: true, max: 128, createOnly: true },
            { key: 'firstName', required: true, max: 100 },
            { key: 'lastName', required: true, max: 100 },
            { key: 'phone', nullable: true, max: 30 },
            { key: 'companyId', type: 'company', nullable: true },
        ],
        columns: ['email', 'firstName', 'lastName', 'status', 'createdAt'],
        sort: ['email', 'firstName', 'lastName', 'createdAt', 'status'],
    },
    companies: {
        title: 'nav.companies',
        path: 'companies',
        read: ['companies.read'],
        create: ['companies.create'],
        update: ['companies.update'],
        remove: ['companies.delete'],
        fields: [
            { key: 'name', required: true, max: 160 },
            { key: 'email', type: 'email', nullable: true, max: 320 },
            { key: 'phone', nullable: true, max: 30 },
            { key: 'website', nullable: true, max: 500 },
            { key: 'address', type: 'textarea', nullable: true, max: 2000 },
        ],
        columns: ['name', 'email', 'phone', 'createdAt'],
        sort: ['name', 'email', 'createdAt'],
    },
    roles: {
        title: 'nav.roles',
        path: 'authorization/roles',
        read: ['roles.read'],
        create: ['roles.create', 'roles.delegate'],
        update: ['roles.update'],
        remove: ['roles.delete'],
        fields: [
            { key: 'name', required: true, max: 80, createOnly: true },
            { key: 'description', type: 'textarea', max: 255 },
        ],
        columns: ['name', 'description', 'createdAt'],
        sort: ['name', 'createdAt'],
    },
    permissions: {
        title: 'nav.permissions',
        path: 'authorization/permissions',
        read: ['permissions.read'],
        create: ['permissions.create'],
        fields: [
            { key: 'resource', required: true, max: 80 },
            { key: 'action', required: true, max: 80 },
        ],
        columns: ['name', 'resource', 'action', 'createdAt'],
        sort: ['name', 'createdAt'],
    },
} satisfies Record<string, ModuleDefinition>;
export type ModuleName = keyof typeof modules;
export function moduleDefinition(name: string): ModuleDefinition | undefined {
    return Object.hasOwn(modules, name) ? modules[name as ModuleName] : undefined;
}
export interface PageData {
    data: Record<string, unknown>[];
    meta: { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
}
