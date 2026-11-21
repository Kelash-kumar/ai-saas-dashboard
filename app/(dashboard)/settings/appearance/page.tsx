import type { Metadata } from 'next';
import { ThemeField, ThemeTransfer, ResetThemeButton } from '@/components/theme/theme-controls';
import { ThemePreview } from '@/components/theme/theme-preview';
import { getI18n } from '@/lib/i18n-server';
import { requireSession } from '@/lib/auth/server';
import { Icon } from '@/components/ui/icon';
export const metadata: Metadata = { title: 'Appearance' };
export default async function AppearancePage() {
    await requireSession();
    const { t } = await getI18n();
    return (
        <>
            <div className="page-heading">
                <div>
                    <span className="eyebrow">YOUR WORKSPACE, YOUR WAY</span>
                    <h1>{t('theme.title')}</h1>
                    <p>Make yourself at home. Personalize the details that matter to you.</p>
                </div>
                <ResetThemeButton />
            </div>
            <div className="appearance-layout">
                <div className="space-y-6">
                    <section className="panel settings-section">
                        <div className="section-heading">
                            <span className="section-icon">
                                <Icon name="sun" className="size-5" />
                            </span>
                            <div>
                                <h2>Look & feel</h2>
                                <p>Start with a color scheme and make it your own.</p>
                            </div>
                        </div>
                        <ThemeField field="mode" />
                        <ThemeField field="accent" />
                    </section>
                    <section className="panel settings-section">
                        <div className="section-heading">
                            <span className="section-icon">
                                <Icon name="grid" className="size-5" />
                            </span>
                            <div>
                                <h2>Layout & navigation</h2>
                                <p>A comfortable place for everything.</p>
                            </div>
                        </div>
                        <ThemeField field="navigation" />
                        <ThemeField field="width" />
                        <ThemeField field="header" />
                        <ThemeField field="sidebarTone" />
                    </section>
                    <section className="panel settings-section">
                        <div className="section-heading">
                            <span className="section-icon">
                                <Icon name="settings" className="size-5" />
                            </span>
                            <div>
                                <h2>The finer details</h2>
                                <p>Small preferences that make a big difference.</p>
                            </div>
                        </div>
                        <ThemeField field="density" />
                        <ThemeField field="radius" />
                        <ThemeField field="font" />
                        <ThemeField field="direction" />
                        <ThemeField field="motion" />
                    </section>
                    <ThemeTransfer />
                </div>
                <ThemePreview />
            </div>
        </>
    );
}
