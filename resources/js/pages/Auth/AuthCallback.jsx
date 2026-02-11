import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { authAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const AuthCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const setAuth = useAuthStore((state) => state.setAuth);

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            toast.error(error);
            navigate('/login', { replace: true });
            return;
        }

        if (!token) {
            toast.error('Authentication failed. No token received.');
            navigate('/login', { replace: true });
            return;
        }

        localStorage.setItem('auth_token', token);

        authAPI.getUser()
            .then((res) => {
                setAuth(res.data.user, token);
                toast.success('Signed in successfully!');
                navigate('/home', { replace: true });
            })
            .catch(() => {
                localStorage.removeItem('auth_token');
                toast.error('Authentication failed.');
                navigate('/login', { replace: true });
            });
    }, [searchParams, setAuth, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center theme-bg-main">
            <div className="text-center">
                <LoadingSpinner />
                <p className="mt-4 text-gray-400">Completing sign in...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
