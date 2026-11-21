export function hasPermissions(granted: readonly string[], required: readonly string[] = []): boolean {
    return required.every((permission) => granted.includes(permission));
}
