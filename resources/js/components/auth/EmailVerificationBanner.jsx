import React from 'react';
import { useCurrentUser, useResendVerification } from '../../hooks/useAuth';
import Button from '../common/Button';

export default function EmailVerificationBanner() {
    const { data: user, isLoading } = useCurrentUser();
    const resendMutation = useResendVerification();

    if (isLoading || !user) return null;
    if (user.email_verified_at) return null;

    return (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-amber-800">
                Please verify your email. Check your inbox for the verification link.
            </p>
            <Button
                type="button"
                onClick={() => resendMutation.mutate()}
                disabled={resendMutation.isPending}
                loading={resendMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-3 py-1.5 rounded"
            >
                Resend verification email
            </Button>
        </div>
    );
}
