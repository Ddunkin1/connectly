import React, { useEffect, useRef, useState, useCallback } from 'react';
import Avatar from '../common/Avatar';
import { callAPI } from '../../services/api';

export default function CallingScreen({ callee, conversationId, callType = 'video', onCancel }) {
    const cancelledRef = useRef(false);
    const audioRef     = useRef(null);
    const localVidRef  = useRef(null);
    const streamRef    = useRef(null);
    const isOnline     = callee?.isOnline !== false;

    const [camReady,   setCamReady]   = useState(false);
    const [camVisible, setCamVisible] = useState(true);
    const [minimized,  setMinimized]  = useState(false);

    // Draggable PiP
    const pipRef    = useRef(null);
    const dragState = useRef(null);
    const [pipPos, setPipPos] = useState(null); // null = CSS default (bottom-right)

    // Auto-cancel timer
    useEffect(() => {
        const t = setTimeout(() => handleCancel(), isOnline ? 60_000 : 30_000);
        return () => clearTimeout(t);
    }, []); // eslint-disable-line

    // Ringing sound — audio element is always mounted (never unmounts)
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.loop   = true;
        audio.volume = 0.5;
        audio.play().catch(() => {});
        return () => { audio.pause(); audio.currentTime = 0; };
    }, []);

    // Acquire camera stream (video calls only)
    useEffect(() => {
        if (callType !== 'video') return;
        let cancelled = false;
        navigator.mediaDevices
            ?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
            .then((stream) => {
                if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
                streamRef.current = stream;
                setCamReady(true);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
            streamRef.current?.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        };
    }, [callType]);

    // Re-attach stream when video element re-mounts (minimize ↔ maximize)
    useEffect(() => {
        if (!camReady || !streamRef.current || !localVidRef.current) return;
        localVidRef.current.srcObject = streamRef.current;
    }, [camReady, minimized]);

    async function handleCancel() {
        if (cancelledRef.current) return;
        cancelledRef.current = true;
        audioRef.current?.pause();
        streamRef.current?.getTracks().forEach(t => t.stop());
        new Audio('/sounds/endcall.wav').play().catch(() => {});
        try { await callAPI.end(conversationId, 'missed'); } catch {}
        onCancel();
    }

    // ── Drag handlers ─────────────────────────────────────────────────────────
    const onPipPointerDown = useCallback((e) => {
        if (e.target.closest('button')) return;
        e.preventDefault();
        const rect = pipRef.current.getBoundingClientRect();
        dragState.current = {
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
        };
        setPipPos({ x: rect.left, y: rect.top });
        pipRef.current.setPointerCapture(e.pointerId);
    }, []);

    const onPipPointerMove = useCallback((e) => {
        if (!dragState.current) return;
        const x = e.clientX - dragState.current.offsetX;
        const y = e.clientY - dragState.current.offsetY;
        const w = pipRef.current?.offsetWidth  ?? 260;
        const h = pipRef.current?.offsetHeight ?? 120;
        setPipPos({
            x: Math.max(0, Math.min(window.innerWidth  - w, x)),
            y: Math.max(0, Math.min(window.innerHeight - h, y)),
        });
    }, []);

    const onPipPointerUp = useCallback(() => {
        dragState.current = null;
    }, []);

    const pipStyle = pipPos
        ? { left: pipPos.x, top: pipPos.y, right: 'auto', bottom: 'auto', width: 260 }
        : { right: 24, bottom: 96, width: 260 };

    // Single return — Fragment root never changes, so <audio> is never unmounted
    return (
        <>
            {/* Audio always lives here — same position in the tree regardless of minimized state */}
            <audio
                ref={audioRef}
                src={isOnline ? '/sounds/ringing.wav' : '/sounds/waitingcall.wav'}
                preload="auto"
            />

            {/* ── Minimized PiP ──────────────────────────────────────────────── */}
            {minimized && (
                <div
                    ref={pipRef}
                    onPointerDown={onPipPointerDown}
                    onPointerMove={onPipPointerMove}
                    onPointerUp={onPipPointerUp}
                    style={pipStyle}
                    className="fixed z-[999] rounded-2xl shadow-2xl border border-white/10 bg-gray-900 select-none cursor-grab active:cursor-grabbing overflow-hidden touch-none"
                >
                    {/* Main preview area */}
                    <div className="relative w-full h-44 bg-gray-900 overflow-hidden">

                        {/* Blurred callee avatar as background */}
                        {callee.avatar && (
                            <img
                                src={callee.avatar}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover opacity-25 blur-2xl scale-110 pointer-events-none"
                            />
                        )}

                        {/* Callee avatar — centered, main focus */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                                {isOnline && (
                                    <>
                                        <span className="absolute inset-0 rounded-full bg-white/10 animate-ping scale-110" />
                                        <span className="absolute inset-0 rounded-full bg-white/5 animate-ping scale-125 [animation-delay:150ms]" />
                                    </>
                                )}
                                <Avatar
                                    src={callee.avatar}
                                    alt={callee.name}
                                    className="w-16 h-16 rounded-full border-2 border-white/20 relative z-10 object-cover"
                                />
                            </div>
                        </div>

                        {/* Self-camera inset — top-right (video calls only) */}
                        {callType === 'video' && (
                            <div className="absolute top-2 right-2 z-20 w-14 h-[4.5rem] rounded-xl overflow-hidden border border-white/25 shadow-lg bg-gray-800">
                                <video
                                    ref={localVidRef}
                                    autoPlay playsInline muted
                                    style={{ transform: 'scaleX(-1)', display: camReady ? 'block' : 'none' }}
                                    className="w-full h-full object-cover"
                                />
                                {!camReady && (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white/20 text-lg">videocam</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Expand button — top-left */}
                        <button
                            type="button"
                            onClick={() => setMinimized(false)}
                            className="absolute top-2 left-2 z-20 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                        >
                            <span className="material-symbols-outlined text-white text-[15px]">open_in_full</span>
                        </button>

                        {/* Bottom gradient overlay: name + status + end */}
                        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pt-6 pb-2.5 flex items-end justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-white text-xs font-semibold truncate">{callee.name}</p>
                                <p className={`text-[10px] ${isOnline ? 'text-white/50 animate-pulse' : 'text-orange-400'}`}>
                                    {isOnline
                                        ? `${callType === 'audio' ? 'Voice' : 'Video'} · Ringing…`
                                        : 'Appears offline'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="shrink-0 w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg"
                            >
                                <span className="material-symbols-outlined text-white text-[18px]">call_end</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Full-screen ─────────────────────────────────────────────────── */}
            {!minimized && (
                <div className="fixed inset-0 z-[998] bg-black/85 backdrop-blur-md">
                    {/* Minimize — top left */}
                    <button
                        type="button"
                        onClick={() => setMinimized(true)}
                        className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        aria-label="Minimize"
                    >
                        <span className="material-symbols-outlined text-white text-xl">picture_in_picture_alt</span>
                    </button>

                    {/* Callee info — center */}
                    <div className="flex flex-col items-center gap-3 pt-20 px-4">
                        <p className="text-white/60 text-[11px] tracking-[0.3em] uppercase">
                            {callType === 'audio' ? 'Voice call' : 'Video call'}
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

                    {/* Self-camera PiP (video only) */}
                    {callType === 'video' && (
                        <div className={`absolute top-4 right-4 z-20 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-gray-900 transition-opacity duration-300 ${camReady ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <video
                                ref={localVidRef}
                                autoPlay playsInline muted
                                style={{ transform: 'scaleX(-1)', display: camVisible ? 'block' : 'none' }}
                                className="w-full h-full object-cover"
                            />
                            {!camVisible && (
                                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white/40 text-3xl">videocam_off</span>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => setCamVisible(v => !v)}
                                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                            >
                                <span className="material-symbols-outlined text-white text-[15px]">
                                    {camVisible ? 'visibility' : 'visibility_off'}
                                </span>
                            </button>
                        </div>
                    )}

                    {/* Cancel — bottom */}
                    <div className="absolute bottom-14 left-0 right-0 flex flex-col items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg shadow-red-600/40 transition-colors"
                        >
                            <span className="material-symbols-outlined text-white text-3xl">call_end</span>
                        </button>
                        <span className="text-white/50 text-xs">Cancel</span>
                    </div>
                </div>
            )}
        </>
    );
}
