import React, { useEffect, useRef, useState } from 'react';
import Avatar from '../common/Avatar';
import { callAPI } from '../../services/api';

export default function CallingScreen({ callee, conversationId, onCancel }) {
    const cancelledRef = useRef(false);
    const audioRef     = useRef(null);
    const localVidRef  = useRef(null);
    const streamRef    = useRef(null);
    const isOnline     = callee?.isOnline !== false;

    const [camReady,   setCamReady]   = useState(false);
    const [camVisible, setCamVisible] = useState(true);

    // Auto-cancel timer
    useEffect(() => {
        const t = setTimeout(() => handleCancel(), isOnline ? 60_000 : 30_000);
        return () => clearTimeout(t);
    }, []);

    // Ringing / waiting sound
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.loop   = true;
        audio.volume = 0.5;
        audio.play().catch(() => {});
        return () => { audio.pause(); audio.currentTime = 0; };
    }, []);

    // Step 1 — acquire camera stream (store in ref, don't touch the video element yet)
    useEffect(() => {
        let cancelled = false;
        navigator.mediaDevices
            ?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
            .then((stream) => {
                if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
                streamRef.current = stream;
                setCamReady(true); // triggers step 2
            })
            .catch(() => { /* permission denied — PiP stays hidden */ });

        return () => {
            cancelled = true;
            streamRef.current?.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        };
    }, []);

    // Step 2 — attach stream to the video element now that it's mounted
    useEffect(() => {
        if (!camReady) return;
        if (localVidRef.current && streamRef.current) {
            localVidRef.current.srcObject = streamRef.current;
        }
    }, [camReady]);

    async function handleCancel() {
        if (cancelledRef.current) return;
        cancelledRef.current = true;
        audioRef.current?.pause();
        streamRef.current?.getTracks().forEach(t => t.stop());
        new Audio('/sounds/endcall.wav').play().catch(() => {});
        try { await callAPI.end(conversationId, 'missed'); } catch {}
        onCancel();
    }

    return (
        <div className="fixed inset-0 z-[998] bg-black/85 backdrop-blur-md">
            <audio ref={audioRef} src={isOnline ? '/sounds/ringing.wav' : '/sounds/waitingcall.wav'} preload="auto" />

            {/* ── Callee info — top center ── */}
            <div className="flex flex-col items-center gap-3 pt-20 px-4">
                <p className="text-white/60 text-[11px] tracking-[0.3em] uppercase">
                    {isOnline ? 'Calling' : 'Calling'}
                </p>
                <h2 className="text-white text-2xl font-semibold">{callee.name}</h2>

                <div className="relative mt-2">
                    {isOnline && (
                        <>
                            <span className="absolute inset-0 rounded-full bg-white/10 animate-ping scale-110" />
                            <span className="absolute inset-0 rounded-full bg-white/5 animate-ping scale-125 [animation-delay:150ms]" />
                        </>
                    )}
                    <Avatar
                        src={callee.avatar}
                        alt={callee.name}
                        className="w-28 h-28 rounded-full relative z-10 border-2 border-white/20 object-cover"
                    />
                </div>

                <p className={`text-sm mt-1 ${isOnline ? 'text-white/40 animate-pulse' : 'text-orange-400'}`}>
                    {isOnline ? 'Ringing…' : 'User appears to be offline'}
                </p>
            </div>

            {/* ── Self-camera PiP — always in DOM so ref attaches before stream arrives ── */}
            <div
                className={`absolute top-4 right-4 z-20 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-gray-900 transition-opacity duration-300 ${camReady ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                {/* Mirrored self-preview */}
                <video
                    ref={localVidRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ transform: 'scaleX(-1)', display: camVisible ? 'block' : 'none' }}
                    className="w-full h-full object-cover"
                />

                {/* Camera-off placeholder */}
                {!camVisible && (
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white/40 text-3xl">videocam_off</span>
                    </div>
                )}

                {/* Hide / show toggle */}
                <button
                    type="button"
                    onClick={() => setCamVisible(v => !v)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                    aria-label={camVisible ? 'Hide camera' : 'Show camera'}
                >
                    <span className="material-symbols-outlined text-white text-[15px]">
                        {camVisible ? 'visibility' : 'visibility_off'}
                    </span>
                </button>
            </div>

            {/* ── Cancel button — bottom center ── */}
            <div className="absolute bottom-14 left-0 right-0 flex flex-col items-center gap-2">
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
