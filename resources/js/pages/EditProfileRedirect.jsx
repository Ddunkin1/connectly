import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const EditProfileRedirect = () => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        if (user?.username) {
            navigate(`/profile/${user.username}?edit=1`, { replace: true });
        } else {
            navigate('/', { replace: true });
        }
    }, [user?.username, navigate]);

    return null;
};

export default EditProfileRedirect;
