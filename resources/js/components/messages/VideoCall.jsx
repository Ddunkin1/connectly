import React, { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { callAPI } from '../../services/api';
import Avatar from '../common/Avatar';

AgoraRTC.setLogLevel(4);

export default function VideoCall({ appId, token, channelName, uid, conversationId, callType = 'video', onEnd }) {
    const clientRef    = useRef(null);
    const tracksRef    = useRef([]);
    const doneRef      = useRef(false);
    const startedRef   = useRef(null);
    const localVidRef  = useRef(null);
    const remoteVidRef = useRef(null);

    const [micOn,         setMicOn]         = useState(true);
    const [camOn,         setCamOn]         = useState(true);
    const [remoteJoined,  setRemoteJoined]  = useState(false);
    const [localReady,    setLocalReady]    = useState(false);
    const [joinError,     setJoinError]     = useState(null);
    const [minimized,     setMinimized]     = useState(false);
    const [elapsed,       setElapsed]       = useState(0);

    // Remote user info (avatar fallback for audio calls)
    const [remoteUser,    setRemoteUser]    = useState(null);

    // Draggable PiP state
    const pipRef      = useRef(null);
    const dragState   = useRef(null);
    const [pipPos,    setPipPos]    = useState({ x: null, y: null }); // null = default corner

    const isAudio = callType === 'audio';

    // Call duration ticker
    useEffect(() => {
        if (!startedRef.current) return;
        const id = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startedRef.current) / 1000));
        }, 1000);
        return () => clearInterval(id);
    }, [remoteJoined]);

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };

    async function finish(fromUser = false) {
        if (doneRef.current) return;
        doneRef.current = true;

        const duration = startedRef.current
            ? Math.floor((Date.now() - startedRef.current) / 1000)
            : 0;

        try {
            tracksRef.current.forEach(t => { try { t.stop(); t.close(); } catch {} });
            tracksRef.current = [];
            if (clientRef.current) await clientRef.current.leave();
        } catch {}

        clientRef.current = null;

        if (fromUser) {
            try { await callAPI.end(conversationId, 'ended', duration); } catch {}
        }

        onEnd();
    }

    useEffect(() => {
        let cancelled = false;

        async function run() {
            try {
                if (!appId || !channelName || !token || !uid) {
                    throw new Error(`Missing Agora credentials`);
                }

                const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
                clientRef.current = client;

                client.on('user-published', async (remote, mediaType) => {
                    await client.subscribe(remote, mediaType);
                    setRemoteUser(remote);
                    if (mediaType === 'video' && remoteVidRef.current) {
                        remote.videoTrack.play(remoteVidRef.current);
                        setRemoteJoined(true);
                        if (!startedRef.current) { startedRef.current = Date.now(); }
                    }
                    if (mediaType === 'audio') {
                        remote.audioTrack.play();
                        if (!startedRef.current) { startedRef.current = Date.now(); }
                        if (isAudio) setRemoteJoined(true);
                    }
                });

                client.on('user-unpublished', (_u, mediaType) => {
                    if (mediaType === 'video' && !isAudio) setRemoteJoined(false);
                });
                client.on('user-left', () => setRemoteJoined(false));

                await client.join(appId, channelName, token, uid);
                if (cancelled) { await client.leave(); return; }

                let tracks;
                if (isAudio) {
                    const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                    tracks = [audioTrack];
                } else {
                    tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
                    const videoTrack = tracks[1];
                    if (localVidRef.current && !cancelled) {
                        videoTrack.play(localVidRef.current);
                        setLocalReady(true);
                    }
                }
                tracksRef.current = tracks;
                if (!cancelled) await client.publish(tracks);

            } catch (err) {
                console.error('[VideoCall] error:', err);
                if (!cancelled) setJoinError(err.message || 'Could not join call');
                if (!doneRef.current) finish(false);
            }
        }

        run();
        return () => { cancelled = true; finish(false); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleMic = useCallback(async () => {
        const audio = tracksRef.current.find(t => t.trackMediaType === 'audio');
        if (!audio) return;
        const next = !micOn;
        await audio.setEnabled(next);
        setMicOn(next);
    }, [micOn]);

    const toggleCam = useCallback(async () => {
        if (isAudio) return;
        const video = tracksRef.current.find(t => t.trackMediaType === 'video');
        if (!video) return;
        const next = !camOn;
        await video.setEnabled(next);
        setCamOn(next);
    }, [camOn, isAudio]);

    // ── PiP dragging ──────────────────────────────────────────────────────────
    const onPipPointerDown = useCallback((e) => {
        if (e.target.closest('button')) return; // don't drag when clicking buttons
        e.preventDefault();
        const rect = pipRef.current.getBoundingClientRect();
        dragState.current = {
            startX: e.clientX - rect.left,
            startY: e.clientY - rect.top,
        };
        pipRef.current.setPointerCapture(e.pointerId);
    }, []);

    const onPipPointerMove = useCallback((e) => {
        if (!dragState.current) return;
        const x = e.clientX - dragState.current.startX;
        const y = e.clientY - dragState.current.startY;
        setPipPos({ x: Math.max(0, x), y: Math.max(0, y) });
    }, []);

    const onPipPointerUp = useCallback(() => {
        dragState.current = null;
    }, []);

    // ── Error state ───────────────────────────────────────────────────────────
    if (joinError) {
        return (
            <div className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center gap-6">
                <span className="material-symbols-outlined text-red-400 text-5xl">
                    {isAudio ? 'phone_disabled' : 'videocam_off'}
                </span>
                <p className="text-white/70 text-sm text-center px-8">{joinError}</p>
                <button type="button" onClick={() => finish(true)}
                    className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-2xl">call_end</span>
                </button>
            </div>
        );
    }

    // ── Minimized PiP card ────────────────────────────────────────────────────
    if (minimized) {
        const pipStyle = pipPos.x !== null
            ? { left: pipPos.x, top: pipPos.y, right: 'auto', bottom: 'auto' }
            : { right: 24, bottom: 96 };

        return (
            <div
                ref={pipRef}
                onPointerDown={onPipPointerDown}
                onPointerMove={onPipPointerMove}
                onPointerUp={onPipPointerUp}
                style={{ ...pipStyle, width: isAudio ? 260 : 220 }}
                className="fixed z-[999] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-gray-900 select-none cursor-grab active:cursor-grabbing"
            >
                {/* Video preview or audio avatar */}
                <div className="relative" style={{ height: isAudio ? 72 : 130 }}>
                    {isAudio ? (
                        <div className="flex items-center gap-3 p-3 h-full">
                            <div className="w-12 h-12 rounded-full bg-[var(--theme-accent)]/20 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[var(--theme-accent)] text-2xl">person</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-white text-sm font-semibold truncate">On a call</p>
                                {remoteJoined && (
                                    <p className="text-white/50 text-xs">{formatTime(elapsed)}</p>
                                )}
                                {!remoteJoined && (
                                    <p className="text-white/40 text-xs animate-pulse">Connecting…</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div ref={remoteVidRef} className="w-full h-full bg-gray-800" />
                            {!remoteJoined && (
                                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                                    <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
                                </div>
                            )}
                            {remoteJoined && (
                                <div className="absolute bottom-1 left-2 text-white/60 text-[10px]">
                                    {formatTime(elapsed)}
                                </div>
                            )}
                        </>
                    )}

                    {/* Expand button */}
                    <button
                        type="button"
                        onClick={() => setMinimized(false)}
                        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined text-white text-[15px]">open_in_full</span>
                    </button>
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-around py-2.5 px-3 bg-black/60 border-t border-white/10">
                    <button type="button" onClick={toggleMic}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-white/15 hover:bg-white/25' : 'bg-red-600 hover:bg-red-700'}`}>
                        <span className="material-symbols-outlined text-white text-[18px]">{micOn ? 'mic' : 'mic_off'}</span>
                    </button>
                    {!isAudio && (
                        <button type="button" onClick={toggleCam}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${camOn ? 'bg-white/15 hover:bg-white/25' : 'bg-red-600 hover:bg-red-700'}`}>
                            <span className="material-symbols-outlined text-white text-[18px]">{camOn ? 'videocam' : 'videocam_off'}</span>
                        </button>
                    )}
                    <button type="button" onClick={() => finish(true)}
                        className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[18px]">call_end</span>
                    </button>
                </div>
            </div>
        );
    }

    // ── Full-screen call UI ───────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[999] bg-black flex flex-col select-none">

            {/* ── Audio call full-screen ── */}
            {isAudio && (
                <div className="flex-1 flex flex-col items-center justify-center gap-5">
                    {/* Pulse ring + avatar */}
                    <div className="relative">
                        {remoteJoined && (
                            <>
                                <span className="absolute inset-0 rounded-full bg-[var(--theme-accent)]/20 animate-ping scale-125" />
                                <span className="absolute inset-0 rounded-full bg-[var(--theme-accent)]/10 animate-ping scale-150 [animation-delay:200ms]" />
                            </>
                        )}
                        <div className="w-28 h-28 rounded-full bg-gray-700 flex items-center justify-center relative z-10">
                            <span className="material-symbols-outlined text-white/30 text-6xl">person</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Voice call</p>
                        {remoteJoined ? (
                            <p className="text-white/70 text-base font-mono">{formatTime(elapsed)}</p>
                        ) : (
                            <p className="text-white/40 text-sm animate-pulse">Connecting…</p>
                        )}
                    </div>

                    {/* Animated waveform when connected */}
                    {remoteJoined && (
                        <div className="flex items-end gap-1 h-8">
                            {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8].map((h, i) => (
                                <div
                                    key={i}
                                    className="w-1.5 rounded-full bg-[var(--theme-accent)]/60"
                                    style={{
                                        height: `${h * 100}%`,
                                        animation: `waveBar 0.8s ease-in-out infinite alternate`,
                                        animationDelay: `${i * 0.1}s`,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Video call full-screen ── */}
            {!isAudio && (
                <div className="relative flex-1 overflow-hidden">
                    {/* Remote video */}
                    <div ref={remoteVidRef} className="w-full h-full" />

                    {!remoteJoined && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-white/10 animate-pulse" />
                            <p className="text-white/50 text-sm tracking-wide">Waiting for other person…</p>
                        </div>
                    )}

                    {remoteJoined && (
                        <div className="absolute top-4 left-4 bg-black/40 rounded-lg px-2 py-1 text-white/70 text-xs font-mono">
                            {formatTime(elapsed)}
                        </div>
                    )}

                    {/* Local PiP — top right */}
                    <div className="absolute top-4 right-4 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-gray-900">
                        <div ref={localVidRef} style={{ transform: 'scaleX(-1)' }} className="w-full h-full" />
                        {!camOn && (
                            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white/50 text-3xl">videocam_off</span>
                            </div>
                        )}
                        {!localReady && camOn && (
                            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Controls bar ── */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-5 py-8 bg-gradient-to-t from-black via-black/80 to-transparent">
                {/* Minimize */}
                <div className="flex flex-col items-center gap-1.5">
                    <button type="button" onClick={() => setMinimized(true)}
                        className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-white text-xl">picture_in_picture_alt</span>
                    </button>
                    <span className="text-white/40 text-[10px]">Minimize</span>
                </div>

                {/* Mic */}
                <div className="flex flex-col items-center gap-1.5">
                    <button type="button" onClick={toggleMic}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600 hover:bg-red-700'}`}>
                        <span className="material-symbols-outlined text-white text-2xl">{micOn ? 'mic' : 'mic_off'}</span>
                    </button>
                    <span className="text-white/50 text-[11px]">{micOn ? 'Mute' : 'Unmute'}</span>
                </div>

                {/* End call */}
                <div className="flex flex-col items-center gap-1.5">
                    <button type="button" onClick={() => finish(true)}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg shadow-red-600/40 transition-colors">
                        <span className="material-symbols-outlined text-white text-3xl">call_end</span>
                    </button>
                    <span className="text-white/50 text-[11px]">End</span>
                </div>

                {/* Camera (video only) */}
                {!isAudio && (
                    <div className="flex flex-col items-center gap-1.5">
                        <button type="button" onClick={toggleCam}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${camOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600 hover:bg-red-700'}`}>
                            <span className="material-symbols-outlined text-white text-2xl">{camOn ? 'videocam' : 'videocam_off'}</span>
                        </button>
                        <span className="text-white/50 text-[11px]">{camOn ? 'Camera' : 'Camera off'}</span>
                    </div>
                )}
            </div>

            {/* Waveform keyframe (audio mode) */}
            <style>{`
                @keyframes waveBar {
                    from { transform: scaleY(0.3); }
                    to   { transform: scaleY(1); }
                }
            `}</style>
        </div>
    );
}
