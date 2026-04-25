import React, { useEffect, useRef, useState } from 'react';
import { callAPI } from '../../services/api';

export default function VideoCall({ appId, token, channelName, uid, conversationId, onEnd }) {
    const clientRef     = useRef(null);
    const doneRef       = useRef(false);
    const startedRef    = useRef(null);
    const localVidRef   = useRef(null);
    const remoteVidRef  = useRef(null);

    const [micOn,        setMicOn]        = useState(true);
    const [camOn,        setCamOn]        = useState(true);
    const [remoteJoined, setRemoteJoined] = useState(false);
    const [localReady,   setLocalReady]   = useState(false);

    async function finish(fromUser = false) {
        if (doneRef.current) return;
        doneRef.current = true;
        const duration = startedRef.current
            ? Math.floor((Date.now() - startedRef.current) / 1000)
            : 0;
        try {
            const client = clientRef.current;
            if (client) {
                client._localTracks?.forEach(t => { t.stop(); t.close(); });
                await client.leave();
            }
        } catch {}
        clientRef.current = null;
        if (fromUser) {
            try { await callAPI.end(conversationId, 'ended', duration); } catch {}
        }
        onEnd();
    }

    useEffect(() => {
        const script   = document.createElement('script');
        script.src     = 'https://unpkg.com/agora-rtc-sdk-ng@4/AgoraRTC_N-production.js';
        script.async   = true;
        script.onload  = async () => {
            if (doneRef.current) return;

            const AgoraRTC = window.AgoraRTC;
            AgoraRTC.setLogLevel(1);

            console.log('[Agora] joining with:', { appId, channelName, uid, tokenLength: token?.length });

            const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
            clientRef.current = client;

            // Remote user joined — subscribe to their tracks
            client.on('user-published', async (remoteUser, mediaType) => {
                await client.subscribe(remoteUser, mediaType);

                if (mediaType === 'video' && remoteVidRef.current) {
                    remoteUser.videoTrack.play(remoteVidRef.current);
                    setRemoteJoined(true);
                    if (!startedRef.current) startedRef.current = Date.now();
                }
                if (mediaType === 'audio') {
                    remoteUser.audioTrack.play();
                }
            });

            client.on('user-unpublished', (remoteUser, mediaType) => {
                if (mediaType === 'video') setRemoteJoined(false);
            });

            client.on('user-left', () => setRemoteJoined(false));

            // Join channel
            await client.join(appId, channelName, token, uid);

            // Create and publish local tracks
            const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
            client._localTracks = [audioTrack, videoTrack];

            if (localVidRef.current) {
                videoTrack.play(localVidRef.current);
                setLocalReady(true);
            }
            await client.publish([audioTrack, videoTrack]);
        };

        script.onerror = () => finish(false);
        document.head.appendChild(script);

        return () => { finish(false); script.remove(); };
    }, []);

    async function toggleMic() {
        const tracks = clientRef.current?._localTracks;
        const audio  = tracks?.find(t => t.trackMediaType === 'audio');
        if (!audio) return;
        const next = !micOn;
        await audio.setEnabled(next);
        setMicOn(next);
    }

    async function toggleCam() {
        const tracks = clientRef.current?._localTracks;
        const video  = tracks?.find(t => t.trackMediaType === 'video');
        if (!video) return;
        const next = !camOn;
        await video.setEnabled(next);
        setCamOn(next);
    }

    return (
        <div className="fixed inset-0 z-[999] bg-black flex flex-col select-none">
            {/* ── Remote video (full screen) ── */}
            <div className="relative flex-1 overflow-hidden">
                <div ref={remoteVidRef} className="w-full h-full" />

                {/* Waiting overlay */}
                {!remoteJoined && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-white/10 animate-pulse" />
                        <p className="text-white/50 text-sm tracking-wide">Waiting for other person…</p>
                    </div>
                )}

                {/* ── Local video (corner PiP) ── */}
                <div className="absolute top-4 right-4 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-gray-900">
                    <div
                        ref={localVidRef}
                        style={{ transform: 'scaleX(-1)' }}
                        className="w-full h-full"
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
