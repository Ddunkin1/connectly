import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Auth/Login';
import AccountBanned from './pages/Auth/AccountBanned';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import AuthCallback from './pages/Auth/AuthCallback';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Profile from './pages/Profile';
import PostDetail from './pages/PostDetail';
import Communities from './pages/Communities';
import CommunityDetail from './pages/CommunityDetail';
import EditProfileRedirect from './pages/EditProfileRedirect';
import Search from './pages/Search';
import Explore from './pages/Explore';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Bookmarks from './pages/Bookmarks';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import Connections from './pages/Connections';
import SafetyCenter from './pages/SafetyCenter';
import WarningDetail from './pages/WarningDetail';
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminReports from './pages/Admin/AdminReports';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminSettings from './pages/Admin/AdminSettings';
import AdminWarningAppeals from './pages/Admin/AdminWarningAppeals';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import ThemeCustomizer from './components/layout/ThemeCustomizer';
import RealtimeMessagesProvider from './components/realtime/RealtimeMessagesProvider';
import RealtimePostUpdatesProvider from './components/realtime/RealtimePostUpdatesProvider';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutes
        },
    },
});

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

const PublicRoute = ({ children }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);

    if (isAuthenticated) {
        return <Navigate to={user?.role === 'admin' ? '/admin' : '/home'} replace />;
    }

    return children;
};

/** Admin login: redirect if already signed in as admin; regular users go to app home. */
const AdminPublicRoute = ({ children }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    if (isAuthenticated && user?.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }
    if (isAuthenticated && user && user.role !== 'admin') {
        return <Navigate to="/home" replace />;
    }
    return children;
};

/** Only admins; others go to the member app. Unauthenticated → /admin/login */
const AdminProtectedRoute = ({ children }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }
    if (user?.role !== 'admin') {
        return <Navigate to="/home" replace />;
    }
    return children;
};

function AppContent() {
    const location = useLocation();
    const isCustomizerOpen = useThemeStore((s) => s.isCustomizerOpen);
    const closeCustomizer = useThemeStore((s) => s.closeCustomizer);

    useEffect(() => {
        useThemeStore.getState().applyToDom();
    }, []);
    const pathNorm = location.pathname.replace(/\/$/, '') || '/';
    const isPublicPage =
        ['/', '/login', '/register', '/forgot-password', '/auth/callback', '/admin/login', '/account-banned'].includes(
            pathNorm
        ) || location.pathname.startsWith('/reset-password');
    /** Admin portal: all /admin/* except the public admin login page — no MainLayout / user chrome */
    const isAdminPortal = pathNorm.startsWith('/admin') && pathNorm !== '/admin/login';

    // Render public pages (Landing, Login, Register) without layout wrapper
    if (isPublicPage) {
        return (
            <>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/account-banned" element={<AccountBanned />} />
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <Login />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <PublicRoute>
                                <Register />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/forgot-password"
                        element={
                            <PublicRoute>
                                <ForgotPassword />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/reset-password"
                        element={
                            <PublicRoute>
                                <ResetPassword />
                            </PublicRoute>
                        }
                    />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route
                        path="/admin/login"
                        element={
                            <AdminPublicRoute>
                                <AdminLogin />
                            </AdminPublicRoute>
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3000,
                        style: {
                            background: '#363636',
                            color: '#fff',
                        },
                        success: {
                            duration: 3000,
                            iconTheme: {
                                primary: '#8B5CF6',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            duration: 4000,
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#fff',
                            },
                        },
                    }}
                />
            </>
        );
    }

    /** Full-screen admin portal — no MainLayout, AppTopBar, or member sidebars */
    if (isAdminPortal) {
        return (
            <>
                <Routes>
                    <Route
                        path="/admin"
                        element={
                            <AdminProtectedRoute>
                                <AdminLayout />
                            </AdminProtectedRoute>
                        }
                    >
                        <Route index element={<AdminDashboard />} />
                        <Route path="reports" element={<AdminReports />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="warning-appeals" element={<AdminWarningAppeals />} />
                        <Route path="settings" element={<AdminSettings />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3000,
                        style: {
                            background: '#363636',
                            color: '#fff',
                        },
                        success: {
                            duration: 3000,
                            iconTheme: {
                                primary: '#6366f1',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            duration: 4000,
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#fff',
                            },
                        },
                    }}
                />
            </>
        );
    }

    const user = useAuthStore((state) => state.user);
    /** Admins use only the admin portal; keep member UI separate */
    if (user?.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }

    const isMessagesPage = location.pathname.startsWith('/messages');

    return (
        <RealtimeMessagesProvider>
        <RealtimePostUpdatesProvider>
        <MainLayout showRightPanel={!isMessagesPage} showLeftPanel={!isMessagesPage}>
                {isMessagesPage ? (
                    <div className={`flex-1 flex min-h-0 overflow-hidden ${isMessagesPage ? 'h-[calc(100vh-60px)]' : ''}`}>
                        <Routes>
                            <Route path="/messages/:username?" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                        </Routes>
                    </div>
                ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar min-w-0 flex justify-center bg-[var(--bg-primary)]">
                    <div className="min-w-0 flex flex-col w-full max-w-5xl pt-8 px-6 pb-6">
                        <Routes>
                        <Route
                            path="/home"
                            element={
                                <ProtectedRoute>
                                    <Home />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/onboarding"
                            element={
                                <ProtectedRoute>
                                    <Onboarding />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/profile/:username"
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/post/:id"
                            element={
                                <ProtectedRoute>
                                    <PostDetail />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/communities"
                            element={
                                <ProtectedRoute>
                                    <Communities />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/communities/:id"
                            element={
                                <ProtectedRoute>
                                    <CommunityDetail />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/edit-profile"
                            element={
                                <ProtectedRoute>
                                    <EditProfileRedirect />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/search"
                            element={
                                <ProtectedRoute>
                                    <Search />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/explore"
                            element={
                                <ProtectedRoute>
                                    <Explore />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/notifications"
                            element={
                                <ProtectedRoute>
                                    <Notifications />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/bookmarks"
                            element={
                                <ProtectedRoute>
                                    <Bookmarks />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/analytics"
                            element={
                                <ProtectedRoute>
                                    <Analytics />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/connections"
                            element={
                                <ProtectedRoute>
                                    <Connections />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/settings"
                            element={
                                <ProtectedRoute>
                                    <Settings />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/safety"
                            element={
                                <ProtectedRoute>
                                    <SafetyCenter />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/warnings/:eventId"
                            element={
                                <ProtectedRoute>
                                    <WarningDetail />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/home" replace />} />
                        </Routes>
                    </div>
                </div>
                )}
        </MainLayout>
        <ThemeCustomizer isOpen={isCustomizerOpen} onClose={closeCustomizer} />
        <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },
                    success: {
                        duration: 3000,
                        iconTheme: {
                            primary: '#359EFF',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        duration: 4000,
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
        </RealtimePostUpdatesProvider>
        </RealtimeMessagesProvider>
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

// Error boundary for debugging
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    
    componentDidCatch(error, errorInfo) {
        console.error('React Error:', error, errorInfo);
    }
    
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
                    <h1>Something went wrong</h1>
                    <pre>{this.state.error?.toString()}</pre>
                    <button onClick={() => window.location.reload()}>Reload Page</button>
                </div>
            );
        }
        return this.props.children;
    }
}

/**
 * Mount the React app. Called from main.jsx after successful import.
 */
export function mountApp() {
    const rootElement = document.getElementById('app');
    if (!rootElement) {
        document.body.innerHTML = '<div style="padding: 20px;"><h1>Error: Root element #app not found!</h1></div>';
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
    } catch (error) {
        console.error('React render error:', error);
        rootElement.innerHTML = `<div style="padding: 20px; font-family: sans-serif;"><h1>React Render Error</h1><pre style="background: #f5f5f5; padding: 10px;">${error.toString()}</pre></div>`;
    }
}
