import React from 'react';

class ErrorBoundaryCore extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <FallbackUI
                    error={this.state.error}
                    compact={this.props.compact}
                    onReset={() => this.setState({ hasError: false, error: null })}
                />
            );
        }
        return this.props.children;
    }
}

function FallbackUI({ error, compact, onReset }) {
    if (compact) {
        return (
            <div className="flex flex-col items-center justify-center p-6 gap-3 text-center rounded-2xl border border-red-500/20 bg-red-500/5 my-4">
                <span className="material-symbols-outlined text-3xl text-red-400">error_outline</span>
                <p className="text-sm text-slate-300 font-medium">Something went wrong in this section.</p>
                <button
                    type="button"
                    onClick={onReset}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10"
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 gap-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-red-400">error_outline</span>
            </div>
            <div className="space-y-2">
                <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
                <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                    An unexpected error occurred. Refresh the page to try again, or contact support if the problem persists.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    Refresh page
                </button>
                <button
                    type="button"
                    onClick={onReset}
                    className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}

/**
 * Page-level error boundary — wraps a full route/page.
 */
export function ErrorBoundary({ children, fallback, compact = false }) {
    return (
        <ErrorBoundaryCore fallback={fallback} compact={compact}>
            {children}
        </ErrorBoundaryCore>
    );
}

/**
 * Section-level error boundary — wraps a single widget/section.
 * Shows a compact inline fallback instead of taking over the whole page.
 */
export function SectionErrorBoundary({ children, fallback }) {
    return (
        <ErrorBoundaryCore fallback={fallback} compact>
            {children}
        </ErrorBoundaryCore>
    );
}

export default ErrorBoundary;
