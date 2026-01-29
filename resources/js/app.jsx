import '../css/app.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { EdgeStoreProviderWrapper } from './lib/edgestoreClient.jsx';
import Header from './components/layout/Header';
import LeftSidebar from './components/layout/LeftSidebar';
import RightSidebar from './components/layout/RightSidebar';
import QuickChat from './components/layout/QuickChat';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Profile from './pages/Profile';
import PostDetail from './pages/PostDetail';
import Communities from './pages/Communities';
import CommunityDetail from './pages/CommunityDetail';
import EditProfile from './pages/EditProfile';
import Search from './pages/Search';
import useAuthStore from './store/authStore';

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
    const isPublicPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register';

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
            </>
        );
    }

    // Render protected pages with full layout
    return (
        <div className="min-h-screen bg-[#f5f7f8]">
            <Header />
            <div className="flex">
                <LeftSidebar />
                <main className="flex-1 px-4 py-6 lg:px-8">
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
                        <Route path="*" element={<Navigate to="/home" replace />} />
                    </Routes>
                </main>
                <RightSidebar />
            </div>
            <QuickChat />
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
            <EdgeStoreProviderWrapper>
                <Router>
                    <AppContent />
                </Router>
            </EdgeStoreProviderWrapper>
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

// Mount React app to DOM
const rootElement = document.getElementById('app');

console.log('app.jsx loaded');
console.log('Root element:', rootElement);

if (!rootElement) {
    console.error('Root element #app not found!');
    document.body.innerHTML = '<div style="padding: 20px;"><h1>Error: Root element #app not found!</h1><p>Make sure the Blade template has &lt;div id="app"&gt;&lt;/div&gt;</p></div>';
} else {
    try {
        console.log('Attempting to render React app...');
        const root = ReactDOM.createRoot(rootElement);
        root.render(
            <React.StrictMode>
                <ErrorBoundary>
                    <App />
                </ErrorBoundary>
            </React.StrictMode>
        );
        console.log('React app rendered successfully!');
    } catch (error) {
        console.error('Failed to render React app:', error);
        rootElement.innerHTML = `<div style="padding: 20px; font-family: sans-serif;"><h1>React Render Error</h1><pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">${error.toString()}</pre><p>Check the browser console for more details.</p></div>`;
    }
}
