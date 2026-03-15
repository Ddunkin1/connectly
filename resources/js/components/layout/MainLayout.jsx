import React, { useState, useEffect } from 'react';
import AppTopBar from './AppTopBar';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

/**
 * MainLayout - centered app shell with TopNav, LeftSidebar, Main, RightPanel.
 * The entire shell is constrained to a max width and centered in the viewport.
 */
const BREAKPOINT_TABLET = 768;
const BREAKPOINT_DESKTOP = 1200;

const MainLayout = ({ children, showRightPanel = true, showLeftPanel = true }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < BREAKPOINT_TABLET;
    const isDesktop = windowWidth >= BREAKPOINT_DESKTOP;
    const showRight = showRightPanel && isDesktop;

    useEffect(() => {
        if (!isMobile) setMobileMenuOpen(false);
    }, [isMobile]);

    return (
        <div className="h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-display overflow-hidden" id="app-root">
            <AppTopBar
                onMenuToggle={() => setMobileMenuOpen((o) => !o)}
                showMenuButton={isMobile && showLeftPanel}
            />

            <div className="pt-[60px] h-[calc(100vh-60px)] overflow-hidden flex justify-center">
                <div className="flex w-full max-w-6xl h-full gap-6 px-4">
                    {showLeftPanel && (
                        <LeftSidebar
                            positionBelowNav
                            onNavigate={() => setMobileMenuOpen(false)}
                            className={`transition-transform duration-300 ${isMobile && !mobileMenuOpen ? '-translate-x-full' : 'translate-x-0'}`}
                        />
                    )}

                    {showLeftPanel && isMobile && mobileMenuOpen && (
                        <div
                            className="fixed inset-0 top-[60px] bg-black/50 z-20"
                            onClick={() => setMobileMenuOpen(false)}
                            aria-hidden="true"
                        />
                    )}

                    <main className="flex-1 flex flex-col min-h-0 min-w-0 h-full overflow-x-hidden">
                        <div className="flex-1 bg-[var(--bg-secondary)] min-h-0 flex flex-col overflow-x-hidden min-w-0">
                            {children}
                        </div>
                    </main>

                    {showRight && (
                        <div className="hidden xl:block w-[260px] h-full">
                            <RightSidebar />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MainLayout;
