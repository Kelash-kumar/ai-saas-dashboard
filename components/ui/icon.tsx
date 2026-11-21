import IconSettings from '@/components/icon/icon-settings';
import IconSun from '@/components/icon/icon-sun';
import IconMoon from '@/components/icon/icon-moon';
import IconLaptop from '@/components/icon/icon-laptop';
import IconMenu from '@/components/icon/icon-menu';
import IconSearch from '@/components/icon/icon-search';
import IconX from '@/components/icon/icon-x';
import IconRestore from '@/components/icon/icon-restore';
import IconGrid from '@/components/icon/icon-layout-grid';
import IconCheck from '@/components/icon/icon-circle-check';
import IconDashboard from '@/components/icon/menu/icon-menu-dashboard';
import IconUsers from '@/components/icon/menu/icon-menu-users';
import IconCompany from '@/components/icon/menu/icon-menu-contacts';

const icons = {
    settings: IconSettings,
    palette: IconSettings,
    sun: IconSun,
    moon: IconMoon,
    laptop: IconLaptop,
    menu: IconMenu,
    search: IconSearch,
    close: IconX,
    reset: IconRestore,
    grid: IconGrid,
    check: IconCheck,
    dashboard: IconDashboard,
    users: IconUsers,
    company: IconCompany,
};
export type IconName = keyof typeof icons;
export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
    const Component = icons[name];
    return (
        <span aria-hidden="true" className={`inline-flex shrink-0 ${className}`}>
            <Component className="size-full" />
        </span>
    );
}
