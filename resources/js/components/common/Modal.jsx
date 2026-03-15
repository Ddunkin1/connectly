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
                    className={`relative z-50 inline-block align-bottom bg-[var(--theme-surface)] text-left overflow-hidden rounded-2xl border border-[var(--theme-border)] shadow-post-card transform transition-all sm:my-8 sm:align-middle flex flex-col ${sizes[size]} w-full`}
                    style={{ maxHeight: '88vh' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {title && (
                        <div className="px-5 py-3 border-b border-[var(--theme-border)] shrink-0">
                            <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
                        </div>
                    )}
                    <div className="px-5 py-4 text-[var(--text-primary)] overflow-y-auto overflow-x-hidden min-h-0 flex-1 pb-4" style={{ maxHeight: 'calc(88vh - 4rem)' }}>{children}</div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
