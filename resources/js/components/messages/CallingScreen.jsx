import React, { useEffect, useRef } from 'react';
import Avatar from '../common/Avatar';
import { callAPI } from '../../services/api';

export default function CallingScreen({ callee, conversationId, onCancel }) {
    const cancelledRef = useRef(false);
    const audioRef     = useRef(null);
    const isOnline     = callee?.isOnline !== false; // default to true if unknown

    // Auto-cancel: 60s if online, 6s if offline (play unavailable tone then quit)
    useEffect(() => {
        const delay = isOnline ? 60_000 : 30_000;
        const t = setTimeout(() => handleCancel(), delay);
        return () => clearTimeout(t);
    }, []);

    // Sound — both ringing and waiting loop continuously
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.loop   = true;
        audio.volume = 0.5;
        audio.play().catch(() => {});
        return () => { audio.pause(); audio.currentTime = 0; };
    }, []);

    async function handleCancel() {
        if (cancelledRef.current) return;
        cancelledRef.current = true;
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
        // Play end-call sound
        const endSound = new Audio('/sounds/endcall.wav');
        endSound.volume = 0.5;
        endSound.play().catch(() => {});
        try { await callAPI.end(conversationId, 'missed'); } catch {}
        onCancel();
    }

    return (
        <div className="fixed inset-0 z-[998] flex flex-col items-center justify-between py-16 px-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

            {/*
              ringing.wav plays when callee is online; endcall.wav plays when offline/unavailable.
            */}
            <audio ref={audioRef} src={isOnline ? '/sounds/ringing.wav' : '/sounds/waitingcall.wav'} preload="auto" />

            {/* Top section */}
            <div className="relative z-10 flex flex-col items-center gap-4 mt-8">
                <p className="text-white/70 text-sm tracking-widest uppercase">
                    {isOnline ? 'Calling' : 'Calling'}
                </p>
                <h2 className="text-white text-2xl font-semibold">{callee.name}</h2>

                {/* Avatar with pulse rings — grey rings if offline */}
                <div className="relative mt-4">
                    {isOnline && (
                        <>
                            <span className="absolute inset-0 rounded-full bg-white/10 animate-ping scale-110" />
                            <span className="absolute inset-0 rounded-full bg-white/5 animate-ping scale-125 [animation-delay:150ms]" />
                        </>
                    )}
                    <Avatar
                        src={callee.avatar}
                        alt={callee.name}
                        size="xl"
                        className="w-28 h-28 rounded-full relative z-10 border-2 border-white/20"
                    />
                </div>

                <p className={`text-sm mt-4 ${isOnline ? 'text-white/50 animate-pulse' : 'text-orange-400'}`}>
                    {isOnline ? 'Ringing…' : 'User appears to be offline'}
                </p>
            </div>

            {/* Cancel button */}
            <div className="relative z-10 flex flex-col items-center gap-2">
                <button
                    type="button"
                    onClick={handleCancel}
                    className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg shadow-red-600/40 transition-colors"
                    aria-label="Cancel call"
                >
                    <span className="material-symbols-outlined text-white text-3xl">call_end</span>
                </button>
                <span className="text-white/50 text-xs">Cancel</span>
            </div>
        </div>
    );
}
