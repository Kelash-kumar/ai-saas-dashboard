import 'server-only';
const origin = new URL(process.env.APP_ORIGIN ?? 'http://localhost:3001');
const baseUrl = new URL(process.env.API_BASE_URL ?? 'http://127.0.0.1:3000/api/v1');
if (!['http:', 'https:'].includes(origin.protocol) || !['http:', 'https:'].includes(baseUrl.protocol)) throw new Error('Invalid service configuration');
if (origin.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)) throw new Error('HTTPS is required outside loopback');
export const serverConfig = { origin, baseUrl, secure: origin.protocol === 'https:', refreshName: process.env.API_REFRESH_COOKIE_NAME ?? 'foundation_refresh', timeout: 8000 };
