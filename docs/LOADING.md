# Shared loading UI

`components/ui/loader.tsx` is the presentation component. It works in server
components, client components and Suspense fallbacks. Sizes are `sm`, `md` and
`lg`; variants are `inline`, `section` and `fullscreen`.

```tsx
import { Loader } from '@/components/ui/loader';

if (loading) return <Loader variant="section" label="Loading conversations…" />;
```

`LoadingProvider` is mounted once in the root layout, inside `LocaleProvider`.
It displays one global overlay for tasks tracked by
`lib/loading/loading-store.ts`. `useSyncExternalStore` follows the project's
existing theme-store pattern. Server rendering always reads an idle snapshot.

## Custom async actions

Use the client hook. `withLoading` returns the task result, preserves errors,
and always releases its loading token in `finally`.

```tsx
'use client';
import { useGlobalLoader } from '@/hooks/use-global-loader';

const { withLoading } = useGlobalLoader();
const result = await withLoading(() => generateReport(), 'Preparing your report…');
```

For a lifecycle that is not a promise, call `startLoading(message)` and retain
the returned completion function. Call it in `finally` or effect cleanup.
Calling that function twice is safe. There is deliberately no global
`hideLoading()` that could accidentally hide another task's loader.

```tsx
const { startLoading } = useGlobalLoader();
const finish = startLoading('Uploading…');
try {
    await upload();
} finally {
    finish();
}
```

For an existing transition flag, use `useGlobalLoadingEffect(pending)`.
It releases its token when the flag clears or the component unmounts.
Do not call loading actions during rendering or from server code.

## Automatic integration

All browser calls through `http` show the shared loader by default. Retries,
response parsing, errors and aborts finish within the same tracked request.
Existing form `busy` states still disable buttons and prevent duplicate writes.
The overlay gives feedback without trapping focus or blocking interaction.

```tsx
await http.post('/api/crm/users', values, { loading: 'Creating user…' });
await http.get('/api/crm/companies', { signal, loading: false });
```

Use `{ loading: false }` for background queries such as dropdown suggestions.
`http.get` and `crmApi.list` accept an options object; pass cancellation as
`{ signal }`. Authentication requests use `{ renew: false }`.
Direct `fetch` calls are not patched; wrap custom foreground work with the hook.

Next.js `app/loading.tsx` and `app/(dashboard)/loading.tsx` reuse `Loader` for
route loading. CRM and permission catalog transitions also track their pending
state, covering search, sorting and pagination while current content remains
visible. Fully prefetched routes may complete without showing a fallback.

The global overlay has a 150 ms reveal delay to avoid flashing for fast tasks.
It uses the active theme and accent, announces its label using `role="status"`,
and disables animation for reduced-motion preferences. The UI foundations page
(`/ui-kit`) includes a preview button and inline examples.
