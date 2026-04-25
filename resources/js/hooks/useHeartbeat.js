import { useEffect } from 'react';
import { userAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const INTERVAL_MS = 60_000;

export const useHeartbeat = () => {
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        if (!user?.id) return;

        const send = () => userAPI.heartbeat().catch(() => {});
        send();
        const id = setInterval(send, INTERVAL_MS);
        return () => clearInterval(id);
    }, [user?.id]);
};
