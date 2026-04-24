import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC, {
    AgoraRTCProvider,
    useJoin,
    useLocalCameraTrack,
    useLocalMicrophoneTrack,
    usePublish,
    useRemoteUsers,
    LocalUser,
    RemoteUser,
} from 'agora-rtc-react';
import { callAPI } from '../../services/api';

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

// ── Inner component (rendered inside AgoraRTCProvider) ────────────────────────
function VideoCallContent({ channelName, token, appId, uid, conversationId, onEnd }) {
    const [micOn, setMicOn]     = useState(true);
    const [camOn, setCamOn]     = useState(true);
    const [ending, setEnding]   = useState(false);
    const [permError, setPermError] = useState(null);

    const { localMicrophoneTrack, error: micError } = useLocalMicrophoneTrack(micOn);
    const { localCameraTrack,     error: camError } = useLocalCameraTrack(camOn);

    const { isConnected, isLoading: joining, error: joinError } = useJoin({
        appid:   appId,
        channel: channelName,
        token:   token || null,
        uid,
    });

    usePublish([localMicrophoneTrack, localCameraTrack]);

    const remoteUsers = useRemoteUsers();

    // Surface camera/mic permission errors
    useEffect(() => {
        const err = camError || micError;
        if (!err) return;
        const msg = err?.message ?? String(err);
        if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')) {
            setPermError('Camera or microphone permission was denied. Please allow access in your browser settings.');
        } else {
            setPermError(`Device error: ${msg}`);
        }
    }, [camError, micError]);

    const handleEnd = async () => {
        if (ending) return;
        setEnding(true);
        try {
            await callAPI.end(conversationId);
        } catch {
            // Ignore end-call network errors — we still close the UI
        }
        onEnd();
    };

    const remoteUser = remoteUsers[0] ?? null;

    return (
        <div className="fixed inset-0 z-[999] bg-black flex flex-col">

            {/* Permission / join error banner */}
            {(permError || joinError) && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-red-600/90 text-white text-sm px-4 py-2 rounded-xl max-w-sm text-center">
                    {permError ?? 'Failed to join the call. Please try again.'}
                </div>
            )}

            {/* Remote video (full screen) */}
            <div className="flex-1 relative bg-[#0d0d0d] flex items-center justify-center">
                {remoteUser ? (
                    <RemoteUser
                        user={remoteUser}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-4 text-white/60">
                        {joining ? (
                            <>
                                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                <span className="text-sm">Connecting…</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-5xl text-white/30">videocam_off</span>
                                <span className="text-sm">Waiting for the other person to join…</span>
                            </>
                        )}
                    </div>
                )}

                {/* Local video (small overlay, bottom-right) */}
                <div className="absolute bottom-4 right-4 w-32 h-44 sm:w-40 sm:h-56 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl bg-[#1a1a1a]">
                    {camOn ? (
                        <LocalUser
                            cameraOn={camOn}
                            micOn={micOn}
                            videoTrack={localCameraTrack}
                            audioTrack={localMicrophoneTrack}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl text-white/40">videocam_off</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="h-20 bg-black/80 backdrop-blur flex items-center justify-center gap-4 px-4 shrink-0">
                {/* Mic toggle */}
                <button
                    type="button"
                    onClick={() => setMicOn((v) => !v)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        micOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-600/80 hover:bg-red-600'
                    }`}
                    aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
                >
                    <span className="material-symbols-outlined text-white text-2xl">
                        {micOn ? 'mic' : 'mic_off'}
                    </span>
                </button>

                {/* End call */}
                <button
                    type="button"
                    onClick={handleEnd}
                    disabled={ending}
                    className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg shadow-red-600/40 disabled:opacity-60"
                    aria-label="End call"
                >
                    <span className="material-symbols-outlined text-white text-3xl">call_end</span>
                </button>

                {/* Camera toggle */}
                <button
                    type="button"
                    onClick={() => setCamOn((v) => !v)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        camOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-600/80 hover:bg-red-600'
                    }`}
                    aria-label={camOn ? 'Turn off camera' : 'Turn on camera'}
                >
                    <span className="material-symbols-outlined text-white text-2xl">
                        {camOn ? 'videocam' : 'videocam_off'}
                    </span>
                </button>
            </div>
        </div>
    );
}

// ── Public component ───────────────────────────────────────────────────────────
export default function VideoCall({ channelName, token, appId, uid, conversationId, onEnd }) {
    return (
        <AgoraRTCProvider client={client}>
            <VideoCallContent
                channelName={channelName}
                token={token}
                appId={appId}
                uid={uid}
                conversationId={conversationId}
                onEnd={onEnd}
            />
        </AgoraRTCProvider>
    );
}
