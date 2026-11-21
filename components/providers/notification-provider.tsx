'use client';
import { createContext, useContext, useState, useCallback } from 'react';
interface Notice {
    id: number;
    message: string;
    kind: 'success' | 'error';
}
const Context = createContext<((message: string, kind?: 'success' | 'error') => void) | null>(null);
export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notices, setNotices] = useState<Notice[]>([]);
    const notify = useCallback((message: string, kind: 'success' | 'error' = 'success') => {
        const id = Date.now() + Math.random();
        setNotices((current) => [...current.slice(-2), { id, message, kind }]);
        window.setTimeout(() => setNotices((current) => current.filter((item) => item.id !== id)), 6000);
    }, []);
    return (
        <Context.Provider value={notify}>
            {children}
            <div className="notification-stack">
                {notices.map((notice) => (
                    <div className={'notification ' + notice.kind} role={notice.kind === 'error' ? 'alert' : 'status'} key={notice.id}>
                        <span>{notice.message}</span>
                        <button type="button" aria-label="Dismiss notification" onClick={() => setNotices((items) => items.filter((item) => item.id !== notice.id))}>
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </Context.Provider>
    );
}
export function useNotifications() {
    const value = useContext(Context);
    if (!value) throw new Error('NotificationProvider required');
    return value;
}
