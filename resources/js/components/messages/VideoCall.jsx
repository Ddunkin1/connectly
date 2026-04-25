import React, { useEffect, useRef } from 'react';
import { callAPI } from '../../services/api';

export default function VideoCall({ roomName, conversationId, onEnd }) {
    const containerRef = useRef(null);
    const apiRef       = useRef(null);
    const doneRef      = useRef(false);

    async function finish() {
        if (doneRef.current) return;
        doneRef.current = true;
        try { apiRef.current?.dispose(); } catch {}
        apiRef.current = null;
        try { await callAPI.end(conversationId); } catch {}
        onEnd();
    }

    useEffect(() => {
        const script   = document.createElement('script');
        script.src     = 'https://meet.jit.si/external_api.js';
        script.async   = true;
        script.onload  = () => {
            if (doneRef.current || !containerRef.current) return;
            apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
                roomName,
                parentNode: containerRef.current,
                configOverwrite: {
                    prejoinPageEnabled: false,
                    disableDeepLinking: true,
                },
            });
            apiRef.current.addEventListeners({
                readyToClose:        finish,
                videoConferenceLeft: finish,
            });
        };
        document.head.appendChild(script);

        return () => { finish(); script.remove(); };
    }, []);

    return <div ref={containerRef} className="fixed inset-0 z-[999]" />;
}
