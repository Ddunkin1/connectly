import React from 'react';
import { useCurrentUser } from '../../hooks/useAuth';

export default function EmailVerificationBanner() {
    const { data: user, isLoading } = useCurrentUser();

    if (isLoading || !user) return null;
    if (user.email_verified_at) return null;

    return (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
            <p className="text-sm text-amber-800">
                Please verify your email. Check your inbox for the verification link.
            </p>
        </div>
    );
}
