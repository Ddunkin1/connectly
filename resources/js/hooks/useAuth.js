import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export const useLogin = () => {
    const queryClient = useQueryClient();
    const setAuth = useAuthStore((state) => state.setAuth);

    return useMutation({
        mutationFn: (credentials) => authAPI.login(credentials),
        onSuccess: (response) => {
            const { user, token } = response.data;
            setAuth(user, token);
            queryClient.setQueryData(['user'], user);
            toast.success('Login successful!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Login failed');
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
            toast.success('Registration successful!');
        },
        onError: (error) => {
            const message = error.response?.data?.message || 'Registration failed';
            const errors = error.response?.data?.errors;
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
