import React, { useEffect, useRef, useState, useCallback } from 'react';
import { callAPI } from '../../services/api';

export default function VideoCall({ roomUrl, conversationId, onEnd }) {
    const callRef       = useRef(null);
    const doneRef       = useRef(false);
    const startedRef    = useRef(null);
    const localVidRef   = useRef(null);
    const remoteVidRef  = useRef(null);
    const remoteAudRef  = useRef(null);

    const [micOn,         setMicOn]         = useState(true);
    const [camOn,         setCamOn]         = useState(true);
    const [remoteJoined,  setRemoteJoined]  = useState(false);
    const [localReady,    setLocalReady]    = useState(false);

    async function finish(fromUser = false) {
        if (doneRef.current) return;
        doneRef.current = true;
        const duration = startedRef.current
            ? Math.floor((Date.now() - startedRef.current) / 1000)
            : 0;
        try { callRef.current?.destroy(); } catch {}
        callRef.current = null;
        if (fromUser) {
            try { await callAPI.end(conversationId, 'ended', duration); } catch {}
        }
        onEnd();
    }

    const syncTracks = useCallback(() => {
        const call = callRef.current;
        if (!call) return;

        const participants = call.participants();

        // ── Local ──────────────────────────────────────────────────────────
        const local = participants.local;
        if (local?.tracks?.video?.persistentTrack && localVidRef.current) {
            const t = local.tracks.video.persistentTrack;
            if (t.readyState === 'live') {
                localVidRef.current.srcObject = new MediaStream([t]);
                setLocalReady(true);
            }
        }

        // ── Remote ─────────────────────────────────────────────────────────
        const remotes = Object.values(participants).filter(p => !p.local);
        if (remotes.length === 0) {
            setRemoteJoined(false);
            return;
        }
        const remote = remotes[0];
        const tracks = [];
        const vTrack = remote?.tracks?.video?.persistentTrack;
        const aTrack = remote?.tracks?.audio?.persistentTrack;
        if (vTrack?.readyState === 'live') tracks.push(vTrack);
        if (aTrack?.readyState === 'live') {
            tracks.push(aTrack);
            if (remoteAudRef.current) {
                remoteAudRef.current.srcObject = new MediaStream([aTrack]);
                remoteAudRef.current.play().catch(() => {});
            }
        }
        if (tracks.length && remoteVidRef.current) {
            remoteVidRef.current.srcObject = new MediaStream(
                tracks.filter(t => t.kind === 'video')
            );
            remoteVidRef.current.play().catch(() => {});
            setRemoteJoined(true);
        }
    }, []);

    useEffect(() => {
        const script  = document.createElement('script');
        script.src    = 'https://unpkg.com/@daily-co/daily-js';
        script.async  = true;
        script.onload = async () => {
            if (doneRef.current) return;

            const call = window.DailyIframe.createCallObject({
                audioSource: true,
                videoSource: true,
            });
            callRef.current = call;

            call
                .on('joined-meeting',      () => { startedRef.current = Date.now(); syncTracks(); })
                .on('participant-joined',  syncTracks)
                .on('participant-updated', syncTracks)
                .on('track-started',       syncTracks)
                .on('track-stopped',       syncTracks)
                .on('participant-left',    () => { setRemoteJoined(false); syncTracks(); })
                .on('left-meeting',        () => finish(true))
                .on('error',               (e) => console.error('[Daily]', e));

            await call.join({ url: roomUrl });
        };
        document.head.appendChild(script);
        return () => { finish(false); script.remove(); };
    }, []);

    function toggleMic() {
        const next = !micOn;
        callRef.current?.setLocalAudio(next);
        setMicOn(next);
    }

    function toggleCam() {
        const next = !camOn;
        callRef.current?.setLocalVideo(next);
        setCamOn(next);
    }

    return (
        <div className="fixed inset-0 z-[999] bg-black flex flex-col select-none">
            {/* Hidden audio element for remote audio */}
            <audio ref={remoteAudRef} autoPlay playsInline className="hidden" />

            {/* ── Remote video (full screen) ── */}
            <div className="relative flex-1 overflow-hidden">
                <video
                    ref={remoteVidRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />

                {/* Waiting overlay */}
                {!remoteJoined && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-white/10 animate-pulse" />
                        <p className="text-white/50 text-sm tracking-wide">Waiting for other person…</p>
                    </div>
                )}

                {/* ── Local video (corner PiP) ── */}
                <div className="absolute top-4 right-4 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-gray-900">
                    <video
                        ref={localVidRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ transform: 'scaleX(-1)' }}
                        className="w-full h-full object-cover"
                    />
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

            {/* ── Controls ── */}
            <div className="flex items-center justify-center gap-6 py-8
                            bg-gradient-to-t from-black via-black/80 to-transparent
                            absolute bottom-0 left-0 right-0">

                {/* Mute mic */}
                <div className="flex flex-col items-center gap-1.5">
                    <button
                        type="button"
                        onClick={toggleMic}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors
                            ${micOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        <span className="material-symbols-outlined text-white text-2xl">
                            {micOn ? 'mic' : 'mic_off'}
                        </span>
                    </button>
                    <span className="text-white/50 text-[11px]">{micOn ? 'Mute' : 'Unmute'}</span>
                </div>

                {/* End call */}
                <div className="flex flex-col items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => finish(true)}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg shadow-red-600/40 transition-colors"
                    >
                        <span className="material-symbols-outlined text-white text-3xl">call_end</span>
                    </button>
                    <span className="text-white/50 text-[11px]">End</span>
                </div>

                {/* Toggle camera */}
                <div className="flex flex-col items-center gap-1.5">
                    <button
                        type="button"
                        onClick={toggleCam}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors
                            ${camOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        <span className="material-symbols-outlined text-white text-2xl">
                            {camOn ? 'videocam' : 'videocam_off'}
                        </span>
                    </button>
                    <span className="text-white/50 text-[11px]">{camOn ? 'Camera' : 'Camera off'}</span>
                </div>
            </div>
        </div>
    );
}
