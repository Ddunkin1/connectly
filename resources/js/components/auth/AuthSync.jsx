import { useEffect } from 'react';
import { useCurrentUser } from '../../hooks/useAuth';
import useAuthStore from '../../store/authStore';

/**
 * Syncs auth store with fresh user data from API on app load.
 * Ensures profile_picture and cover_image use proxy URLs instead of stale raw Supabase URLs.
 * Renders nothing.
 */
export default function AuthSync() {
    const { data: freshUser, isSuccess } = useCurrentUser();
    const updateUser = useAuthStore((state) => state.updateUser);

    useEffect(() => {
        if (isSuccess && freshUser) {
            updateUser(freshUser);
        }
    }, [isSuccess, freshUser, updateUser]);

    return null;
}
