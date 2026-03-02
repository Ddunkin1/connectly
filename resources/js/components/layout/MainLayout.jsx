import React, { useState, useEffect } from 'react';
import AppTopBar from './AppTopBar';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

/**
 * MainLayout - 3-column layout with TopNav, LeftSidebar, Main, RightPanel.
 * Target proportions: left ~18%, main ~64%, right ~18% (reference layout sizes).
 * Sidebars equal width (240px) so main gets more space; inset from viewport edges.
 * Responsive: Desktop 1200+ full, Tablet 768-1199 hide right, Mobile <768 hamburger.
 */
const SIDEBAR_LEFT = 240;
const SIDEBAR_RIGHT = 240;
const SIDEBAR_INSET = 40; // px from viewport edge (left-10 / right-10)
const BREAKPOINT_TABLET = 768;
const BREAKPOINT_DESKTOP = 1200;

const MainLayout = ({ children, showRightPanel = true }) => {
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
        <div className="h-screen bg-[var(--bg-primary)] text-slate-100 font-display overflow-hidden" id="app-root">
            <AppTopBar
                onMenuToggle={() => setMobileMenuOpen((o) => !o)}
                showMenuButton={isMobile}
            />

            <div className="flex pt-[60px] h-[calc(100vh-60px)] overflow-hidden">
                <LeftSidebar
                    positionBelowNav
                    onNavigate={() => setMobileMenuOpen(false)}
                    className={`transition-transform duration-300 ${isMobile && !mobileMenuOpen ? '-translate-x-full' : 'translate-x-0'}`}
                />

                {isMobile && mobileMenuOpen && (
                    <div
                        className="fixed inset-0 top-[60px] bg-black/50 z-20"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-hidden="true"
                    />
                )}

                <main
                    className="flex-1 flex flex-col min-h-0 min-w-0 h-full"
                    style={{
                        marginLeft: isMobile ? 0 : SIDEBAR_LEFT + SIDEBAR_INSET,
                        marginRight: showRight ? SIDEBAR_RIGHT + SIDEBAR_INSET : 0,
                    }}
                >
                    <div className="flex-1 bg-[var(--bg-secondary)] min-h-0 flex flex-col">
                        {children}
                    </div>
                </main>

                {showRight && <RightSidebar />}
            </div>
        </div>
    );
};

export default MainLayout;
