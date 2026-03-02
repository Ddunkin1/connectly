import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        '2xl': 'max-w-5xl',
    };

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto"
            role="dialog"
            aria-modal="true"
        >
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 z-40 transition-opacity bg-black/70"
                    aria-hidden="true"
                    onClick={onClose}
                />

                <div
                    className={`relative z-50 inline-block align-bottom bg-[#252538] rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle border border-gray-700 ${sizes[size]} w-full`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {title && (
                        <div className="px-6 py-4 border-b border-gray-700">
                            <h3 className="text-lg font-semibold text-white">{title}</h3>
                        </div>
                    )}
                    <div className="px-6 py-4 text-gray-200">{children}</div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
