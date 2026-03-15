import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authAPI, twoFactorAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export const useLogin = () => {
    const queryClient = useQueryClient();
    const setAuth = useAuthStore((state) => state.setAuth);

    return useMutation({
        mutationFn: (credentials) => authAPI.login(credentials),
        onSuccess: (response) => {
            const { user, token, requires_two_factor } = response.data;
            setAuth(user, token);
            queryClient.setQueryData(['user'], user);
            if (!requires_two_factor) {
                toast.success('Login successful!');
            }
        },
        onError: (error) => {
            if (!error.response) {
                toast.error("Could not reach the server. Check your connection and that the API is running.");
                return;
            }
            const data = error.response.data;
            const errors = data?.errors;
            if (errors && typeof errors === 'object') {
                Object.values(errors).flat().forEach((msg) => toast.error(msg));
            } else {
                toast.error(data?.message || 'Login failed');
            }
        },
    });
};

export const useTwoFactorChallenge = () => {
    const queryClient = useQueryClient();
    const setAuth = useAuthStore((state) => state.setAuth);

    return useMutation({
        mutationFn: (code) => twoFactorAPI.challenge(code),
        onSuccess: (response) => {
            const { user, token } = response.data;
            setAuth(user, token);
            queryClient.setQueryData(['user'], user);
            toast.success('Login successful!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Invalid verification code');
        },
    });
};

export const useRegister = () => {
    const queryClient = useQueryClient();
    const setAuth = useAuthStore((state) => state.setAuth);

    return useMutation({
        mutationFn: (data) => authAPI.register(data),
        onSuccess: (response) => {
            const { user, token } = response.data;
            setAuth(user, token);
            queryClient.setQueryData(['user'], user);
            toast.success(response.data?.message || 'Registration successful! Please verify your email.');
        },
        onError: (error) => {
            if (!error.response) {
                toast.error(
                    "Could not reach the server. If you're deploying the app, set VITE_API_URL to your API URL and redeploy."
                );
                return;
            }
            const data = error.response.data;
            const isJson = data && typeof data === 'object' && !Array.isArray(data);
            if (!isJson) {
                toast.error(
                    "Server returned an invalid response. Check that VITE_API_URL points to your API and CORS allows this origin."
                );
                return;
            }
            const message = data?.message || 'Registration failed';
            const errors = data?.errors;
            if (errors) {
                Object.values(errors).flat().forEach((err) => toast.error(err));
            } else {
                toast.error(message);
            }
        },
    });
};

export const useLogout = () => {
    const queryClient = useQueryClient();
    const logout = useAuthStore((state) => state.logout);

    return useMutation({
        mutationFn: () => authAPI.logout(),
        onSuccess: () => {
            logout();
            queryClient.clear();
            toast.success('Logged out successfully');
        },
        onError: () => {
            // Even if API call fails, logout locally
            logout();
            queryClient.clear();
        },
    });
};

export const useCurrentUser = () => {
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);

    return useQuery({
        queryKey: ['user'],
        queryFn: () => authAPI.getUser(),
        enabled: !!token,
        select: (data) => data.data.user,
        initialData: user ? { data: { user } } : undefined,
    });
};

export const useResendVerification = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => authAPI.resendVerification(),
        onSuccess: () => {
            toast.success('Verification link sent. Check your email.');
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to send verification email');
        },
    });
};

export const useForgotPassword = () => {
    return useMutation({
        mutationFn: (data) => authAPI.forgotPassword(data),
        onSuccess: () => {
            toast.success('If that email exists, we sent a password reset link. Check your inbox.');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Something went wrong. Try again.');
        },
    });
};

export const useResetPassword = () => {
    return useMutation({
        mutationFn: (data) => authAPI.resetPassword(data),
        onSuccess: () => {
            toast.success('Password has been reset. You can sign in now.');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'This link is invalid or has expired.');
        },
    });
};
