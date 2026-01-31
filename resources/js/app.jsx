import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import AppTopBar from './components/layout/AppTopBar';
import LeftSidebar from './components/layout/LeftSidebar';
import RightSidebar from './components/layout/RightSidebar';
import QuickChat from './components/layout/QuickChat';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Profile from './pages/Profile';
import PostDetail from './pages/PostDetail';
import Communities from './pages/Communities';
import CommunityDetail from './pages/CommunityDetail';
import EditProfile from './pages/EditProfile';
import Search from './pages/Search';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import TestUpload from './pages/TestUpload';
import Bookmarks from './pages/Bookmarks';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import EmailVerificationBanner from './components/auth/EmailVerificationBanner';
import ThemeCustomizer from './components/layout/ThemeCustomizer';

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
    
    if (isAuthenticated) {
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
    const isPublicPage = ['/', '/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname) ||
        location.pathname.startsWith('/reset-password');

    // Render public pages (Landing, Login, Register) without layout wrapper
    if (isPublicPage) {
        return (
            <>
                <Routes>
                    <Route path="/" element={<Landing />} />
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

    // Render protected pages - 3-column grid: [Sidebar 300px] | [Main flex-1] | [Messages 380px]
    return (
        <div className="min-h-screen theme-bg-main flex flex-col" id="app-root">
            <EmailVerificationBanner />
            <AppTopBar />
            <div className="flex flex-1 min-h-0 w-full justify-center overflow-auto">
                <div className="flex w-full max-w-[1280px] min-h-0 px-4 pt-4 pb-4 gap-4">
                <LeftSidebar />
                <main className="flex-1 flex justify-center min-w-0 overflow-auto py-6 px-4">
                    <div className="w-full max-w-[1200px] flex justify-center">
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
                                    <EditProfile />
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
                            path="/messages/:username?"
                            element={
                                <ProtectedRoute>
                                    <Messages />
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
                            path="/test-upload"
                            element={
                                <ProtectedRoute>
                                    <TestUpload />
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
                            path="/settings"
                            element={
                                <ProtectedRoute>
                                    <Settings />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/home" replace />} />
                        </Routes>
                    </div>
                </main>
                <RightSidebar />
                </div>
            </div>
            <QuickChat />
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
        </div>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
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
