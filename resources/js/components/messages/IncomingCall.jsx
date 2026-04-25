import React, { useEffect, useRef, useState } from 'react';
import Avatar from '../common/Avatar';
import { callAPI } from '../../services/api';

const RING_TIMEOUT = 30_000;

/**
 * Incoming call notification overlay.
 *
 * Props:
 *   caller          – { id, name, avatar }
 *   conversationId  – number
 *   onAccept(callData) – called with { channel_name, token, app_id, uid, conversation_id }
 *   onDecline()     – called when the call is dismissed
 */
export default function IncomingCall({ caller, conversationId, onAccept, onDecline }) {
    const [accepting, setAccepting] = useState(false);
    const [declining, setDeclining] = useState(false);
    const audioRef  = useRef(null);
    const timerRef  = useRef(null);

    // Auto-dismiss after RING_TIMEOUT (treat as declined)
    useEffect(() => {
        timerRef.current = setTimeout(() => {
            handleDecline();
        }, RING_TIMEOUT);

        return () => {
            clearTimeout(timerRef.current);
            stopRing();
        };
    }, []);

    // Play ringing sound on loop
    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.loop   = true;
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch(() => { /* autoplay blocked — silent */ });
    }, []);

    function stopRing() {
        if (!audioRef.current) return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }

    async function handleAccept() {
        if (accepting) return;
        clearTimeout(timerRef.current);
        stopRing();
        setAccepting(true);
        try {
            const res = await callAPI.generateToken(conversationId);
            onAccept({
                room_url:        res.data.room_url,
                room_name:       res.data.room_name,
                conversation_id: conversationId,
            });
        } catch {
            setAccepting(false);
        }
    }

    async function handleDecline() {
        if (declining) return;
        clearTimeout(timerRef.current);
        stopRing();
        setDeclining(true);
        try {
            await callAPI.end(conversationId);
        } catch { /* ignore */ }
        onDecline();
    }

    return (
        <>
            {/* Ringing audio — a short sine-wave data URI used as a simple ring tone */}
            <audio ref={audioRef} src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAA..." preload="none" />

            <div className="fixed inset-0 z-[998] flex items-start justify-center pt-8 sm:pt-16 px-4">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                {/* Card */}
                <div className="relative z-10 w-full max-w-sm bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-3xl shadow-2xl p-6 flex flex-col items-center gap-5">

                    {/* Pulse ring around avatar */}
                    <div className="relative">
                        <span className="absolute inset-0 rounded-full bg-green-500/30 animate-ping" />
                        <Avatar
                            src={caller.avatar}
                            alt={caller.name}
                            size="xl"
                            className="w-20 h-20 rounded-full relative z-10"
                        />
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-[var(--text-secondary)] mb-1 uppercase tracking-widest">Incoming video call</p>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{caller.name}</h2>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-8 mt-2">
                        {/* Decline */}
                        <div className="flex flex-col items-center gap-2">
                            <button
                                type="button"
                                onClick={handleDecline}
                                disabled={declining || accepting}
                                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg shadow-red-600/40 transition-colors disabled:opacity-60"
                                aria-label="Decline call"
                            >
                                <span className="material-symbols-outlined text-white text-3xl">call_end</span>
                            </button>
                            <span className="text-xs text-[var(--text-secondary)]">Decline</span>
                        </div>

                        {/* Accept */}
                        <div className="flex flex-col items-center gap-2">
                            <button
                                type="button"
                                onClick={handleAccept}
                                disabled={accepting || declining}
                                className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg shadow-green-500/40 transition-colors disabled:opacity-60"
                                aria-label="Accept call"
                            >
                                {accepting ? (
                                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <span className="material-symbols-outlined text-white text-3xl">videocam</span>
                                )}
                            </button>
                            <span className="text-xs text-[var(--text-secondary)]">Accept</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
