import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import PostInput from '../posts/PostInput';

const CreatePostModal = ({ isOpen, onClose }) => {
    if (typeof document === 'undefined') return null;
    if (!isOpen) return null;

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow || '';
        };
    }, []);

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className="w-full max-w-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <PostInput variant="modal" onPostCreated={onClose} />
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default CreatePostModal;



