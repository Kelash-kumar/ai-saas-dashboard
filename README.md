# Foundation Admin — Vristo + NestJS

One Next.js application with a unified Admin/User login and a shared dashboard. Navigation, pages and actions use live NestJS permissions. There is no public registration screen.

## Run locally

Use Node 22.13+ (22.x) or a supported LTS version 24.11+. PostgreSQL 17 is used locally. In the backend terminal:

```powershell
cd E:\nestjs-auth-foundation
npm ci --ignore-scripts
npm run auth:keys
npm run db:local
npm run db:migrate
npm run db:seed
npm run start:dev
```

In a second terminal:

```powershell
cd E:\nestjs-auth-admin
npm ci
# First checkout only; preserve any existing .env.local settings:
Copy-Item .env.example .env.local
npm run dev
```

Open [Login](http://localhost:3001/login). Development seed credentials: **admin@example.com / Admin@123456789!**. Choose **Login as Admin**. The seed preserves existing passwords and refuses to promote an existing regular account. Production requires explicit SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD; default credentials are rejected.

For managed-user verification mail, start `npm run mail:worker` in another backend terminal. Development messages are captured under the backend's `.local/mail`. Users created through the Users screen must verify their email before login. Admins assign access through **Users → Manage access**. A user with no grants can still open their own dashboard/account/appearance.

## Configuration

Copy `.env.example` when setting up a fresh checkout:

| Variable                | Purpose                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| APP_ORIGIN              | Canonical browser origin; local default http://localhost:3001                                |
| API_BASE_URL            | Server-only Nest URL, including /api/v1                                                      |
| API_REFRESH_COOKIE_NAME | foundation_refresh locally; __Host-foundation_refresh with the production Nest configuration |

Set backend CORS_ORIGINS and MAIL_PUBLIC_URL to the frontend origin. Use HTTPS in production, a trusted reverse proxy and private backend connectivity. Configure Nest production keys, database and SMTP using the backend working guide. No NEXT_PUBLIC token or API configuration is required.

## Shared architecture

| Location             | Responsibility                                                      |
| -------------------- | ------------------------------------------------------------------- |
| app/(dashboard)      | One protected layout, overview, account and module pages            |
| app/api              | Same-origin session handlers and allow-listed module/access proxies |
| lib/auth             | Server session validation, cookie handling and permissions          |
| lib/api              | Central browser/server HTTP clients, errors and module services     |
| config/modules.ts    | Trusted module routes, fields, columns and permission requirements  |
| config/app.ts        | Brand and permission-aware navigation                               |
| config/theme.ts      | Shared Vristo defaults and allowed preferences                      |
| config/i18n.ts       | English/Urdu dictionary                                             |
| components/providers | Theme, locale, identity and shared notifications                    |
| components/modules   | Reused tables, pagination, editors and access management            |
| hooks                | Shared cancellable option loading                                   |

Server Components load identity and data. React cache deduplicates identity validation within each server render; private requests use no-store. Client Components provide interactive controls. Editors load on demand. UI components call module services through one HTTP client.

Admin and User options share a form and session flow. Admin login additionally requires the live admin.access permission. The choice does not confer privileges. Dashboard visibility and every proxy operation check actual permissions, and NestJS independently enforces its scoped RBAC rules. Authenticated visitors leave login for the shared dashboard. Legacy /login/admin, /login/user and /user URLs redirect to the shared routes.

Tokens stay in HttpOnly cookies. Browser requests use same-origin handlers; unsafe requests validate Origin. Refresh uses the backend CSRF bootstrap and rotating refresh token. Web Locks serialize rotation across tabs in supported secure-context browsers. Safe reads can retry after renewal; mutations require explicit resubmission. Tokens are never kept in localStorage. Server-side authorization is checked even when a URL or body is edited manually.

Theme preferences are browser-local and synchronize across tabs. Language uses a non-secret cookie for server rendering and sets Urdu RTL. Core navigation, auth, dashboard and management controls have English/Urdu labels; some theme guidance remains English. Theme settings do not grant access.

Users and Companies support real CRUD (user deletion archives). Roles support catalog CRUD; Permissions support listing/creation. Manage access distinguishes inherited/effective access from direct grants. Catalog selectors on the access screen currently show the first 100 records; complex role inheritance/catalog policy operations remain available through Nest Swagger/Postman. No pretend analytics or notification data is included.

## Validate and build

```powershell
# First prepare/build the sibling backend and start its local PostgreSQL:
cd E:\nestjs-auth-foundation
npm run db:local
npm run check
cd E:\nestjs-auth-admin
npx playwright install chromium
npm run check
# Production-mode local preview:
npm start
```

Playwright runs the production frontend on port 3101 and a real backend on 3110 using a newly owned disposable database. It never resets the application database. Backend dependencies and test database privileges must be available. See the backend [working guide](../nestjs-auth-foundation/docs/WORKING-GUIDE.md) for PostgreSQL/pgAdmin, mail and API details.

Vristo assets and the original archive retain the supplied commercial license. Existing theme settings, components and styling were reused without adding authentication or data-fetching dependencies. See [Theme](docs/THEME.md) and [Upgrade notes](docs/UPGRADE.md).
