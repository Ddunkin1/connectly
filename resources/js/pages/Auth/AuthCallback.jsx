import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { authAPI } from '../../services/api';
import { SkeletonBlock } from '../../components/common/skeletons';
import toast from 'react-hot-toast';

const AuthCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const setAuth = useAuthStore((state) => state.setAuth);
    const logout = useAuthStore((state) => state.logout);

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            try {
                toast.error(decodeURIComponent(error));
            } catch {
                toast.error('An error occurred during sign in.');
            }
            navigate('/login?error=' + encodeURIComponent(error), { replace: true });
            return;
        }

        if (!token) {
            const errMsg = 'Authentication failed. No token received.';
            toast.error(errMsg);
            navigate('/login?error=' + encodeURIComponent(errMsg), { replace: true });
            return;
        }

        const finishAuth = async () => {
            try {
                setAuth({}, token);
                const res = await authAPI.getUser();
                setAuth(res.data.user, token);
                toast.success('Signed in successfully!');
                navigate('/home', { replace: true });
            } catch (err) {
                logout();
                const msg = err?.response?.data?.message || err?.message || 'Authentication failed.';
                toast.error(msg);
                navigate('/login?error=' + encodeURIComponent(msg), { replace: true });
            }
        };

        finishAuth();
    }, [searchParams, setAuth, logout, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center theme-bg-main">
            <div className="text-center flex flex-col items-center gap-4">
                <SkeletonBlock className="h-12 w-12 rounded-full mx-auto" />
                <SkeletonBlock className="h-4 w-48 mx-auto" />
                <p className="text-gray-400 text-sm">Completing sign in...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
