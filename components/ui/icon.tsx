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
import IconHome from '@/components/icon/icon-home';
import IconListCheck from '@/components/icon/icon-list-check';
import IconTrash from '@/components/icon/icon-trash-lines';
import IconDownload from '@/components/icon/icon-download';
import IconPlus from '@/components/icon/icon-plus';
import IconEye from '@/components/icon/icon-eye';
import IconEdit from '@/components/icon/icon-edit';
import IconChecks from '@/components/icon/icon-checks';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconCaretsDown from '@/components/icon/icon-carets-down';
import IconDots from '@/components/icon/icon-horizontal-dots';
import IconUser from '@/components/icon/icon-user';
import IconLock from '@/components/icon/icon-lock';
import IconUsersGroup from '@/components/icon/icon-users-group';
import IconLogout from '@/components/icon/icon-logout';
import IconRefresh from '@/components/icon/icon-refresh';

const icons = {
    logout: IconLogout,
    refresh: IconRefresh,
    home: IconHome,
    filter: IconListCheck,
    trash: IconTrash,
    download: IconDownload,
    plus: IconPlus,
    view: IconEye,
    edit: IconEdit,
    confirm: IconChecks,
    back: IconArrowBackward,
    caret: IconCaretDown,
    carets: IconCaretsDown,
    dots: IconDots,
    user: IconUser,
    admin: IconLock,
    roles: IconUsersGroup,
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
