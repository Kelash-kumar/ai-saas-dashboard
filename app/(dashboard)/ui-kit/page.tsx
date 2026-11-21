import { requireSession } from '@/lib/auth/server';
import type { Metadata } from 'next';
import { FoundationDemo } from '@/components/ui/foundation-demo';
export const metadata: Metadata = { title: 'UI foundations' };
export default async function UiKitPage() {
    await requireSession();
    return (
        <>
            <div className="page-heading">
                <div>
                    <span className="eyebrow">CONSISTENT BY DESIGN</span>
                    <h1>UI foundations</h1>
                    <p>The building blocks of your workspace, all speaking the same language.</p>
                </div>
            </div>
            <FoundationDemo />
        </>
    );
}
