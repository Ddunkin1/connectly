import React, { useState, useEffect } from 'react';
import AppTopBar from './AppTopBar';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import MobileBottomNav from './MobileBottomNav';

const BREAKPOINT_TABLET  = 768;
const BREAKPOINT_DESKTOP = 1024;

/**
 * MainLayout — TopBar + LeftSidebar + Main Content + (optional) RightSidebar.
 *
 * Mobile behaviour (< 768px):
 *   - LeftSidebar slides in as a fixed overlay triggered by hamburger button.
 *   - MobileBottomNav replaces sidebar for primary navigation.
 *   - RightSidebar is hidden.
 *
 * Tablet behaviour (768–1199px):
 *   - LeftSidebar is visible and uses normal flex flow.
 *   - RightSidebar is hidden.
 *
 * Desktop behaviour (≥ 1200px):
 *   - Full three-column layout with optional RightSidebar.
 */
const MainLayout = ({ children, showRightPanel = true, showLeftPanel = true }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1200
    );

    useEffect(() => {
        const onResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const isMobile  = windowWidth < BREAKPOINT_TABLET;
    const isDesktop = windowWidth >= BREAKPOINT_DESKTOP;
    const showRight = showRightPanel && isDesktop;

    // Close drawer when viewport grows past mobile breakpoint
    useEffect(() => {
        if (!isMobile) setMobileMenuOpen(false);
    }, [isMobile]);

    // Prevent body scroll when mobile drawer is open
    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    return (
        <div
            className="h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-display overflow-hidden"
            id="app-root"
        >
            {/* ── Top navigation bar ── */}
            <AppTopBar
                onMenuToggle={() => setMobileMenuOpen((o) => !o)}
                showMenuButton={isMobile && showLeftPanel}
                mobileMenuOpen={mobileMenuOpen}
            />

            {/* ── Mobile sidebar overlay + drawer ── */}
            {showLeftPanel && isMobile && (
                <>
                    {/* Scrim */}
                    <div
                        className={`fixed inset-0 top-16 bg-black/60 z-20 transition-opacity duration-300 ${
                            mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                        }`}
                        aria-hidden="true"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    {/* Drawer */}
                    <div
                        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] z-30 transition-transform duration-300 ease-in-out ${
                            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                    >
                        <LeftSidebar onNavigate={() => setMobileMenuOpen(false)} />
                    </div>
                </>
            )}

            {/* ── Three-column shell ── */}
            <div className="mt-16 h-[calc(100vh-4rem)] overflow-hidden flex justify-center">
                <div className="flex w-full max-w-[1200px] h-full gap-0 md:gap-4 md:px-2">

                    {/* Desktop / tablet sidebar (normal flex item) */}
                    {showLeftPanel && !isMobile && (
                        <LeftSidebar positionBelowNav onNavigate={() => {}} />
                    )}

                    {/* Main content */}
                    <main className="flex-1 flex flex-col min-h-0 min-w-0 h-full overflow-x-hidden">
                        <div className="flex-1 min-h-0 flex flex-col overflow-x-hidden min-w-0">
                            {children}
                        </div>
                    </main>

                    {/* Right sidebar — desktop only */}
                    {showRight && (
                        <div className="hidden lg:block w-[300px] shrink-0 h-full">
                            <RightSidebar />
                        </div>
                    )}
                </div>
            </div>

            {/* ── Mobile bottom navigation ── */}
            {showLeftPanel && <MobileBottomNav />}
        </div>
    );
};

export default MainLayout;
