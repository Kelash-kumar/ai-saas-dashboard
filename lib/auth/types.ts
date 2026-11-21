export type Portal = 'admin' | 'user';
export interface Principal {
    firstName?: string | null;
    lastName?: string | null;
    avatarData?: string | null;
    userId: string;
    sessionId: string;
    email: string;
    userType: string;
}
export interface SessionView {
    principal: Principal;
    permissions: string[];
    roles: string[];
    portal: Portal;
}
export const loginPath = () => '/login';
export function safeDestination(value: string | undefined): string {
    return value && /^\/(?:settings\/appearance|ui-kit|users(?:\/[a-f0-9-]+\/access)?|companies|roles|permissions|account)?$/.test(value) ? value : '/';
}
