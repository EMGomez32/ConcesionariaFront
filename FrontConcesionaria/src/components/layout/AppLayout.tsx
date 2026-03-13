import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Toast from '../ui/Toast';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useConfirmStore } from '../../store/confirmStore';

const AppLayout = () => {
    const confirm = useConfirmStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
            <Toast />
            <ConfirmDialog
                isOpen={confirm.isOpen}
                title={confirm.title}
                message={confirm.message}
                confirmLabel={confirm.confirmLabel}
                cancelLabel={confirm.cancelLabel}
                type={confirm.type}
                onConfirm={confirm.onConfirm || (() => { })}
                onCancel={confirm.hideConfirm}
                loading={confirm.loading}
            />
            {isSidebarOpen && (
                <div
                    className="sidebar-backdrop"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
                <main style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                    <div className="animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
            <style>{`
                .sidebar-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 1040;
                    display: none;
                }
                @media (max-width: 1024px) {
                    .sidebar-backdrop {
                        display: block;
                    }
                }
            `}</style>
        </div>
    );
};

export default AppLayout;
