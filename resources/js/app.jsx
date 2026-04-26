import React, { lazy, Suspense, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Layout (always eager — needed immediately)
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/admin/AdminLayout';

// Auth pages — eager (entry point, no lazy penalty)
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import AuthCallback from './pages/Auth/AuthCallback';
import AccountBanned from './pages/Auth/AccountBanned';
import Landing from './pages/Landing';

// Error boundary + loading skeleton
import { ErrorBoundary, SectionErrorBoundary } from './components/ErrorBoundary';
import PageSkeleton from './components/PageSkeleton'; // still used for public/admin routes

// Stores + providers (always needed)
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import ThemeCustomizer from './components/layout/ThemeCustomizer';
import RealtimeMessagesProvider from './components/realtime/RealtimeMessagesProvider';
import RealtimePostUpdatesProvider from './components/realtime/RealtimePostUpdatesProvider';
import RealtimeCallProvider from './components/realtime/RealtimeCallProvider';

// ─── Lazy page imports ────────────────────────────────────────────────────────
// Member app
const Home            = lazy(() => import('./pages/Home'));
const Profile         = lazy(() => import('./pages/Profile'));
const PostDetail      = lazy(() => import('./pages/PostDetail'));
const Search          = lazy(() => import('./pages/Search'));
const Explore         = lazy(() => import('./pages/Explore'));
const Notifications   = lazy(() => import('./pages/Notifications'));
const Bookmarks       = lazy(() => import('./pages/Bookmarks'));
const Messages        = lazy(() => import('./pages/Messages'));
const Communities     = lazy(() => import('./pages/Communities'));
const CommunityDetail = lazy(() => import('./pages/CommunityDetail'));
const Connections     = lazy(() => import('./pages/Connections'));
const Analytics       = lazy(() => import('./pages/Analytics'));
const Settings        = lazy(() => import('./pages/Settings'));
const Invites         = lazy(() => import('./pages/Invites'));
const Onboarding      = lazy(() => import('./pages/Onboarding'));
const HashtagFeed     = lazy(() => import('./pages/HashtagFeed'));
const SafetyCenter    = lazy(() => import('./pages/SafetyCenter'));
const WarningDetail   = lazy(() => import('./pages/WarningDetail'));
const EditProfileRedirect = lazy(() => import('./pages/EditProfileRedirect'));

// Admin portal (separate chunk)
const AdminLogin          = lazy(() => import('./pages/Admin/AdminLogin'));
const AdminDashboard      = lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminReports        = lazy(() => import('./pages/Admin/AdminReports'));
const AdminUsers          = lazy(() => import('./pages/Admin/AdminUsers'));
const AdminSettings       = lazy(() => import('./pages/Admin/AdminSettings'));
const AdminWarningAppeals = lazy(() => import('./pages/Admin/AdminWarningAppeals'));
const AdminBanAppeals     = lazy(() => import('./pages/Admin/AdminBanAppeals'));

// ─────────────────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000,
        },
    },
});

const toastStyle = {
    base:    { background: '#363636', color: '#fff' },
    success: { duration: 3000, iconTheme: { primary: '#359EFF', secondary: '#fff' } },
    error:   { duration: 4000, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
};
const adminToastStyle = {
    ...toastStyle,
    success: { duration: 3000, iconTheme: { primary: '#6366f1', secondary: '#fff' } },
};

const ToasterShared = ({ style = toastStyle }) => (
    <Toaster
        position="top-right"
        toastOptions={{
            duration: 3000,
            style: style.base,
            success: style.success,
            error: style.error,
        }}
    />
);

// ─── Route guards ─────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const user = useAuthStore((s) => s.user);
    return isAuthenticated
        ? <Navigate to={user?.role === 'admin' ? '/admin' : '/home'} replace />
        : children;
};

const AdminPublicRoute = ({ children }) => {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const user = useAuthStore((s) => s.user);
    if (isAuthenticated && user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (isAuthenticated && user?.role !== 'admin') return <Navigate to="/home" replace />;
    return children;
};

const AdminProtectedRoute = ({ children }) => {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const user = useAuthStore((s) => s.user);
    if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
    if (user?.role !== 'admin') return <Navigate to="/home" replace />;
    return children;
};

// ─── App content ──────────────────────────────────────────────────────────────
function AppContent() {
    const location = useLocation();
    const isCustomizerOpen = useThemeStore((s) => s.isCustomizerOpen);
    const closeCustomizer  = useThemeStore((s) => s.closeCustomizer);
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        useThemeStore.getState().applyToDom();
    }, []);

    const pathNorm = location.pathname.replace(/\/$/, '') || '/';
    const isPublicPage =
        ['/', '/login', '/register', '/forgot-password', '/auth/callback', '/admin/login', '/account-banned'].includes(pathNorm) ||
        location.pathname.startsWith('/reset-password');
    const isAdminPortal = pathNorm.startsWith('/admin') && pathNorm !== '/admin/login';

    // Public pages — no layout wrapper
    if (isPublicPage) {
        return (
            <>
                <Suspense fallback={<PageSkeleton />}>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/account-banned" element={<AccountBanned />} />
                        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
                        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
                        <Route path="/admin/login" element={<AdminPublicRoute><AdminLogin /></AdminPublicRoute>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
                <ToasterShared />
            </>
        );
    }

    // Admin portal
    if (isAdminPortal) {
        return (
            <>
                <Suspense fallback={<PageSkeleton />}>
                    <Routes>
                        <Route
                            path="/admin"
                            element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}
                        >
                            <Route index             element={<AdminDashboard />} />
                            <Route path="reports"    element={<AdminReports />} />
                            <Route path="users"      element={<AdminUsers />} />
                            <Route path="warning-appeals" element={<AdminWarningAppeals />} />
                            <Route path="ban-appeals"     element={<AdminBanAppeals />} />
                            <Route path="settings"   element={<AdminSettings />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/admin" replace />} />
                    </Routes>
                </Suspense>
                <ToasterShared style={adminToastStyle} />
            </>
        );
    }

    if (user?.role === 'admin') return <Navigate to="/admin" replace />;

    const isMessagesPage = location.pathname.startsWith('/messages');

    return (
        <RealtimeCallProvider>
        <RealtimeMessagesProvider>
        <RealtimePostUpdatesProvider>
        <MainLayout showRightPanel={!isMessagesPage} showLeftPanel={!isMessagesPage}>
            {isMessagesPage ? (
                <div className={`flex-1 flex min-h-0 overflow-hidden h-[calc(100vh-60px)]`}>
                    <Suspense fallback={null}>
                        <Routes>
                            <Route
                                path="/messages/:username?"
                                element={<ProtectedRoute><Messages /></ProtectedRoute>}
                            />
                        </Routes>
                    </Suspense>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto scrollbar-hide min-w-0 flex justify-center bg-[var(--bg-primary)]">
                    <div className="min-w-0 flex flex-col w-full max-w-5xl pt-4 md:pt-8 px-3 md:px-6 pb-16 md:pb-6">
                        <SectionErrorBoundary>
                            <Suspense fallback={null}>
                                <Routes>
                                    <Route path="/home"              element={<ProtectedRoute><Home /></ProtectedRoute>} />
                                    <Route path="/onboarding"        element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                                    <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                                    <Route path="/post/:id"          element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
                                    <Route path="/communities"       element={<ProtectedRoute><Communities /></ProtectedRoute>} />
                                    <Route path="/communities/:id"   element={<ProtectedRoute><CommunityDetail /></ProtectedRoute>} />
                                    <Route path="/edit-profile"      element={<ProtectedRoute><EditProfileRedirect /></ProtectedRoute>} />
                                    <Route path="/search"            element={<ProtectedRoute><Search /></ProtectedRoute>} />
                                    <Route path="/explore"           element={<ProtectedRoute><Explore /></ProtectedRoute>} />
                                    <Route path="/notifications"     element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                                    <Route path="/bookmarks"         element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
                                    <Route path="/analytics"         element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                                    <Route path="/connections"       element={<ProtectedRoute><Connections /></ProtectedRoute>} />
                                    <Route path="/settings"          element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                                    <Route path="/invites"           element={<ProtectedRoute><Invites /></ProtectedRoute>} />
                                    <Route path="/hashtag/:tag"      element={<ProtectedRoute><HashtagFeed /></ProtectedRoute>} />
                                    <Route path="/safety"            element={<ProtectedRoute><SafetyCenter /></ProtectedRoute>} />
                                    <Route path="/warnings/:eventId" element={<ProtectedRoute><WarningDetail /></ProtectedRoute>} />
                                    <Route path="*" element={<Navigate to="/home" replace />} />
                                </Routes>
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </div>
            )}
        </MainLayout>
        <ThemeCustomizer isOpen={isCustomizerOpen} onClose={closeCustomizer} />
        <ToasterShared />
        </RealtimePostUpdatesProvider>
        </RealtimeMessagesProvider>
        </RealtimeCallProvider>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AppContent />
            </Router>
        </QueryClientProvider>
    );
}

export function mountApp() {
    const rootElement = document.getElementById('app');
    if (!rootElement) {
        document.body.innerHTML = '<div style="padding:20px"><h1>Error: Root element #app not found!</h1></div>';
        return;
    }
    try {
        const root = ReactDOM.createRoot(rootElement);
        root.render(
            <React.StrictMode>
                <ErrorBoundary>
                    <App />
                </ErrorBoundary>
            </React.StrictMode>
        );
        document.documentElement.setAttribute('data-react-mounted', 'true');
    } catch (error) {
        console.error('React render error:', error);
        rootElement.innerHTML = `<div style="padding:20px;font-family:sans-serif"><h1>React Render Error</h1><pre style="background:#f5f5f5;padding:10px">${error.toString()}</pre></div>`;
    }
}
