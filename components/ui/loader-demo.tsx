'use client';

import { Loader } from './loader';
import { useGlobalLoader } from '@/hooks/use-global-loader';

export function LoaderDemo() {
    const { withLoading, isLoading } = useGlobalLoader();
    return (
        <section className="panel">
            <div className="section-heading">
                <div>
                    <h2>Loading & progress</h2>
                    <p>Consistent feedback for small actions and full-page work.</p>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 mb-6">
                <Loader size="sm" label="Loading details…" />
                <Loader label="Preparing your workspace…" />
            </div>
            <button
                type="button"
                className="btn btn-primary"
                disabled={isLoading}
                onClick={() => void withLoading(() => new Promise<void>((resolve) => window.setTimeout(resolve, 1500)), 'Loading your workspace…')}
            >
                Preview global loader
            </button>
        </section>
    );
}
