import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
const root = process.env.BACKEND_ROOT || path.resolve(__dirname, '../../nestjs-auth-foundation');
const requireBackend = createRequire(path.join(root, 'package.json'));
process.chdir(root);
process.env.NODE_ENV = 'test';
requireBackend('ts-node').register({ project: path.join(root, 'tsconfig.json'), transpileOnly: true });
const { DatabaseHarness } = requireBackend('./test/database/database-harness.ts');
const { seedAdmin } = requireBackend('./src/core/database/seeds/admin.seed.ts');
const { UserEntity } = requireBackend('./src/features/users/entities/user.entity.ts');
const { ArgonPasswordHasher } = requireBackend('./src/features/auth/crypto/argon-password-hasher.ts');
let db,
    server,
    closing = false;
async function close() {
    if (closing) return;
    closing = true;
    if (server) server.kill();
    if (db) await db.close();
    if (process.connected) process.send({ stopped: true });
    process.disconnect?.();
}
process.on('message', (message) => {
    if (message === 'stop') void close();
});
process.on('disconnect', () => {
    void close();
});
(async () => {
    db = await DatabaseHarness.create();
    const suffix = randomBytes(8).toString('hex');
    const adminEmail = 'admin-' + suffix + '@example.test',
        userEmail = 'user-' + suffix + '@example.test',
        password = 'Fixture-' + randomBytes(20).toString('base64url') + '!';
    await seedAdmin(db.source, { email: adminEmail, password, environment: 'test' });
    await db.source
        .getRepository(UserEntity)
        .save({ email: userEmail, passwordHash: await new ArgonPasswordHasher().hash(password), emailVerifiedAt: new Date(), firstName: 'Test', lastName: 'Member' });
    const readerEmail = 'reader-' + suffix + '@example.test';
    const reader = await db.source.getRepository(UserEntity).save({ email: readerEmail, passwordHash: await new ArgonPasswordHasher().hash(password), emailVerifiedAt: new Date() });
    const { RoleEntity } = requireBackend('./src/features/authorization/entities/role.entity.ts');
    const { PermissionEntity } = requireBackend('./src/features/authorization/entities/permission.entity.ts');
    const { RolePermissionEntity } = requireBackend('./src/features/authorization/entities/role-permission.entity.ts');
    const { UserRoleEntity } = requireBackend('./src/features/authorization/entities/user-role.entity.ts');
    const role = await db.source.getRepository(RoleEntity).save({ name: 'read-only-staff' });
    const permission = await db.source.getRepository(PermissionEntity).findOneByOrFail({ name: 'users.read' });
    await db.source.getRepository(RolePermissionEntity).insert({ roleId: role.id, permissionId: permission.id });
    await db.source.getRepository(UserRoleEntity).insert({ userId: reader.id, roleId: role.id });
    server = spawn(process.execPath, [path.join(root, 'dist/main.js')], {
        cwd: root,
        env: {
            ...process.env,
            DATABASE_NAME: db.name,
            PORT: '3110',
            LOG_LEVEL: 'silent',
            CORS_ORIGINS: 'http://127.0.0.1:3101',
            MAIL_TRANSPORT: 'file',
            SWAGGER_ENABLED: 'false',
            RATE_LIMIT_MAX: '10000',
        },
        windowsHide: true,
        stdio: 'ignore',
    });
    let ready = false;
    for (let i = 0; i < 150; i++) {
        try {
            ready = (await fetch('http://127.0.0.1:3110/api/v1/health/ready')).status === 200;
        } catch {}
        if (ready) break;
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!ready) throw new Error('Test API unavailable');
    process.send({ ready: true, adminEmail, userEmail, readerEmail, password });
})().catch(async () => {
    console.error('Isolated authentication test backend failed to initialize.');
    await close();
    process.exitCode = 1;
});
