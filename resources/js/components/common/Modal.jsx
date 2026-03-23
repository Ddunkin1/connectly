import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

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
        /** Wider layouts (e.g. admin post/comment preview + moderation sidebar). */
        '3xl': 'max-w-6xl',
        '4xl': 'max-w-7xl',
    };

    const modalUi = (
        <div className="fixed inset-0 z-50 overflow-hidden admin-fade-up" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center h-full p-4 text-center">
                <div
                    className="fixed inset-0 z-40 transition-opacity bg-black/55 backdrop-blur-[1px]"
                    aria-hidden="true"
                    onClick={onClose}
                />

                <div
                    className={`relative z-50 mx-auto bg-[var(--theme-surface)] text-[var(--text-primary)] text-left overflow-hidden rounded-3xl border border-[var(--theme-border)] shadow-[0_24px_60px_-22px_rgba(0,0,0,0.7)] transform transition-all duration-300 flex flex-col ${sizes[size]} w-full`}
                    style={{ maxHeight: '88vh', color: 'var(--text-primary)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {title && (
                        <div className="px-5 py-3 border-b border-[var(--theme-border)] shrink-0 bg-[var(--theme-surface-hover)]/65">
                            <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
                        </div>
                    )}
                    <div
                        className="px-5 py-4 overflow-y-auto overflow-x-hidden min-h-0 flex-1 pb-4 [&_input]:text-[var(--text-primary)] [&_textarea]:text-[var(--text-primary)] [&_select]:text-[var(--text-primary)]"
                        style={{ maxHeight: 'calc(88vh - 4rem)', color: 'var(--text-primary)' }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modalUi, document.body);
};

export default Modal;
