import type { Metadata } from 'next';
import '@fontsource-variable/nunito';
import '@/styles/globals.css';
import { defaultTheme, themeBootstrapScript } from '@/config/theme';
import { appConfig } from '@/config/app';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { LocaleProvider } from '@/components/providers/locale-provider';
import { NotificationProvider } from '@/components/providers/notification-provider';
import { getI18n } from '@/lib/i18n-server';

export const metadata: Metadata = { title: { default: appConfig.title, template: `%s | ${appConfig.title}` }, description: appConfig.description, icons: { icon: '/favicon.png' } };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const { locale } = await getI18n();
    return (
        <html
            lang={locale}
            dir={defaultTheme.direction}
            data-mode="light"
            data-theme-mode={defaultTheme.mode}
            data-accent={defaultTheme.accent}
            data-navigation={defaultTheme.navigation}
            data-width={defaultTheme.width}
            data-header={defaultTheme.header}
            data-sidebar-tone={defaultTheme.sidebarTone}
            data-density={defaultTheme.density}
            data-radius={defaultTheme.radius}
            data-font={defaultTheme.font}
            data-motion={defaultTheme.motion}
            suppressHydrationWarning
        >
            <head>
                <script id="theme-bootstrap" dangerouslySetInnerHTML={{ __html: themeBootstrapScript() }} />
            </head>
            <body>
                <ThemeProvider>
                    <LocaleProvider initialLocale={locale}>
                        <NotificationProvider>{children}</NotificationProvider>
                    </LocaleProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
