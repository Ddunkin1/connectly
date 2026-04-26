import React, { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { callAPI } from '../../services/api';
import Avatar from '../common/Avatar';

AgoraRTC.setLogLevel(4);

export default function VideoCall({ appId, token, channelName, uid, conversationId, callType = 'video', remoteUser: remoteUserProp, onEnd }) {
    const clientRef      = useRef(null);
    const tracksRef      = useRef([]);
    const doneRef        = useRef(false);
    const startedRef     = useRef(null);
    const localVidRef    = useRef(null);
    const remoteVidRef   = useRef(null);
    const remoteUserRef  = useRef(null); // Agora remote user object (for track re-play)

    const [micOn,        setMicOn]        = useState(true);
    const [camOn,        setCamOn]        = useState(true);
    const [remoteJoined, setRemoteJoined] = useState(false);
    const [localReady,   setLocalReady]   = useState(false);
    const [joinError,    setJoinError]    = useState(null);
    const [minimized,    setMinimized]    = useState(false);
    const [elapsed,      setElapsed]      = useState(0);

    // Draggable PiP
    const pipRef    = useRef(null);
    const dragState = useRef(null);
    const [pipPos,  setPipPos] = useState(null); // null = CSS default corner

    const isAudio = callType === 'audio';

    // Call duration ticker
    useEffect(() => {
        if (!startedRef.current) return;
        const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedRef.current) / 1000)), 1000);
        return () => clearInterval(id);
    }, [remoteJoined]);

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    async function finish(fromUser = false) {
        if (doneRef.current) return;
        doneRef.current = true;
        const duration = startedRef.current ? Math.floor((Date.now() - startedRef.current) / 1000) : 0;
        try {
            tracksRef.current.forEach(t => { try { t.stop(); t.close(); } catch {} });
            tracksRef.current = [];
            if (clientRef.current) await clientRef.current.leave();
        } catch {}
        clientRef.current = null;
        if (fromUser) { try { await callAPI.end(conversationId, 'ended', duration); } catch {} }
        onEnd();
    }

    // ── Agora setup ───────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        async function run() {
            try {
                if (!appId || !channelName || !token || !uid) throw new Error('Missing Agora credentials');

                const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
                clientRef.current = client;

                client.on('user-published', async (remote, mediaType) => {
                    await client.subscribe(remote, mediaType);
                    remoteUserRef.current = remote;

                    if (mediaType === 'video' && remoteVidRef.current) {
                        remote.videoTrack.play(remoteVidRef.current);
                        setRemoteJoined(true);
                        if (!startedRef.current) startedRef.current = Date.now();
                    }
                    if (mediaType === 'audio') {
                        remote.audioTrack.play();
                        if (!startedRef.current) startedRef.current = Date.now();
                        if (isAudio) setRemoteJoined(true);
                    }
                });

                client.on('user-unpublished', (_u, mediaType) => {
                    if (mediaType === 'video' && !isAudio) setRemoteJoined(false);
                });
                client.on('user-left', () => { remoteUserRef.current = null; setRemoteJoined(false); });

                await client.join(appId, channelName, token, uid);
                if (cancelled) { await client.leave(); return; }

                let tracks;
                if (isAudio) {
                    tracks = [await AgoraRTC.createMicrophoneAudioTrack()];
                } else {
                    tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
                    if (localVidRef.current && !cancelled) {
                        tracks[1].play(localVidRef.current);
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

    // Re-attach tracks to new DOM elements whenever minimized toggles
    useEffect(() => {
        if (isAudio) return;

        const videoTrack = tracksRef.current.find(t => t.trackMediaType === 'video');
        if (videoTrack && localVidRef.current) {
            videoTrack.play(localVidRef.current);
        }
        if (remoteUserRef.current?.videoTrack && remoteVidRef.current) {
            remoteUserRef.current.videoTrack.play(remoteVidRef.current);
        }
    }, [minimized, isAudio]);

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

    // ── Drag handlers ─────────────────────────────────────────────────────────
    const onPipPointerDown = useCallback((e) => {
        if (e.target.closest('button')) return;
        e.preventDefault();
        const rect = pipRef.current.getBoundingClientRect();
        dragState.current = { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
        setPipPos({ x: rect.left, y: rect.top }); // lock to current position immediately
        pipRef.current.setPointerCapture(e.pointerId);
    }, []);

    const onPipPointerMove = useCallback((e) => {
        if (!dragState.current) return;
        const x = e.clientX - dragState.current.offsetX;
        const y = e.clientY - dragState.current.offsetY;
        const w = pipRef.current?.offsetWidth  ?? 220;
        const h = pipRef.current?.offsetHeight ?? 200;
        setPipPos({
            x: Math.max(0, Math.min(window.innerWidth  - w, x)),
            y: Math.max(0, Math.min(window.innerHeight - h, y)),
        });
    }, []);

    const onPipPointerUp = useCallback(() => { dragState.current = null; }, []);

    const pipStyle = pipPos
        ? { left: pipPos.x, top: pipPos.y, right: 'auto', bottom: 'auto' }
        : { right: 24, bottom: 96 };

    // Single return — Fragment root never changes, so ref'd divs stay in the DOM
    return (
        <>
            {/* ── Error overlay ────────────────────────────────────────────── */}
            {joinError && (
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
            )}

            {/* ── Minimized PiP ────────────────────────────────────────────── */}
            {minimized && !joinError && (
                <div
                    ref={pipRef}
                    onPointerDown={onPipPointerDown}
                    onPointerMove={onPipPointerMove}
                    onPointerUp={onPipPointerUp}
                    style={{ ...pipStyle, width: isAudio ? 260 : 220 }}
                    className="fixed z-[999] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-gray-900 select-none cursor-grab active:cursor-grabbing touch-none"
                >
                    {isAudio ? (
                        /* Audio: simple info row */
                        <div className="flex items-center gap-3 p-3">
                            <div className="w-12 h-12 rounded-full bg-[var(--theme-accent)]/20 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[var(--theme-accent)] text-2xl">person</span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-white text-sm font-semibold truncate">Voice call</p>
                                {remoteJoined
                                    ? <p className="text-white/50 text-xs font-mono">{formatTime(elapsed)}</p>
                                    : <p className="text-white/40 text-xs animate-pulse">Connecting…</p>
                                }
                            </div>
                            <button type="button" onClick={() => setMinimized(false)}
                                className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-white text-[15px]">open_in_full</span>
                            </button>
                        </div>
                    ) : (
                        /* Video: remote as main, local inset top-right */
                        <div className="relative" style={{ height: 140 }}>
                            {/* Remote video — full background */}
                            <div ref={remoteVidRef} className="absolute inset-0 bg-gray-800" />
                            {!remoteJoined && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                    <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
                                </div>
                            )}

                            {/* Local camera — small inset top-right */}
                            <div className="absolute top-2 right-2 z-10 w-14 h-[4.5rem] rounded-xl overflow-hidden border border-white/20 shadow-lg bg-gray-900">
                                <div
                                    ref={localVidRef}
                                    style={{ transform: 'scaleX(-1)', display: (localReady && camOn) ? 'block' : 'none' }}
                                    className="w-full h-full"
                                />
                                {(!localReady || !camOn) && (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white/20 text-lg">videocam_off</span>
                                    </div>
                                )}
                            </div>

                            {/* Timer */}
                            {remoteJoined && (
                                <div className="absolute bottom-1.5 left-2 z-10 bg-black/50 rounded px-1.5 py-0.5 text-white/70 text-[10px] font-mono">
                                    {formatTime(elapsed)}
                                </div>
                            )}

                            {/* Expand button */}
                            <button type="button" onClick={() => setMinimized(false)}
                                className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[15px]">open_in_full</span>
                            </button>
                        </div>
                    )}

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
            )}

            {/* ── Full-screen call UI ──────────────────────────────────────── */}
            {!minimized && !joinError && (
                <div className="fixed inset-0 z-[999] bg-black flex flex-col select-none">

                    {/* Audio mode */}
                    {isAudio && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-5">
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
                                {remoteJoined
                                    ? <p className="text-white/70 text-base font-mono">{formatTime(elapsed)}</p>
                                    : <p className="text-white/40 text-sm animate-pulse">Connecting…</p>
                                }
                            </div>
                            {remoteJoined && (
                                <div className="flex items-end gap-1 h-8">
                                    {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8].map((h, i) => (
                                        <div key={i} className="w-1.5 rounded-full bg-[var(--theme-accent)]/60"
                                            style={{ height: `${h * 100}%`, animation: 'waveBar 0.8s ease-in-out infinite alternate', animationDelay: `${i * 0.1}s` }} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Video mode */}
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
                                <div ref={localVidRef} style={{ transform: 'scaleX(-1)', display: (localReady && camOn) ? 'block' : 'none' }} className="w-full h-full" />
                                {(!localReady && camOn) && (
                                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    </div>
                                )}
                                {!camOn && (
                                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white/50 text-3xl">videocam_off</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Controls bar */}
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-5 py-8 bg-gradient-to-t from-black via-black/80 to-transparent">
                        <div className="flex flex-col items-center gap-1.5">
                            <button type="button" onClick={() => setMinimized(true)}
                                className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined text-white text-xl">picture_in_picture_alt</span>
                            </button>
                            <span className="text-white/40 text-[10px]">Minimize</span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                            <button type="button" onClick={toggleMic}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600 hover:bg-red-700'}`}>
                                <span className="material-symbols-outlined text-white text-2xl">{micOn ? 'mic' : 'mic_off'}</span>
                            </button>
                            <span className="text-white/50 text-[11px]">{micOn ? 'Mute' : 'Unmute'}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                            <button type="button" onClick={() => finish(true)}
                                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg shadow-red-600/40 transition-colors">
                                <span className="material-symbols-outlined text-white text-3xl">call_end</span>
                            </button>
                            <span className="text-white/50 text-[11px]">End</span>
                        </div>
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

                    <style>{`@keyframes waveBar { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }`}</style>
                </div>
            )}
        </>
    );
}
