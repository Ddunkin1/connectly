import React, { useEffect, useRef } from 'react';
import { callAPI } from '../../services/api';

export default function VideoCall({ roomUrl, conversationId, onEnd }) {
    const containerRef = useRef(null);
    const callRef      = useRef(null);
    const doneRef      = useRef(false);

    async function finish() {
        if (doneRef.current) return;
        doneRef.current = true;
        try { callRef.current?.destroy(); } catch {}
        callRef.current = null;
        try { await callAPI.end(conversationId); } catch {}
        onEnd();
    }

    useEffect(() => {
        const script   = document.createElement('script');
        script.src     = 'https://unpkg.com/@daily-co/daily-js';
        script.async   = true;
        script.onload  = async () => {
            if (doneRef.current || !containerRef.current) return;
            callRef.current = window.DailyIframe.createFrame(containerRef.current, {
                showLeaveButton:      true,
                showFullscreenButton: true,
                iframeStyle: {
                    width:  '100%',
                    height: '100%',
                    border: '0',
                },
            });
            callRef.current
                .on('left-meeting', finish)
                .on('error',        finish);
            await callRef.current.join({ url: roomUrl });
        };
        document.head.appendChild(script);

        return () => { finish(); script.remove(); };
    }, []);

    return <div ref={containerRef} className="fixed inset-0 z-[999]" />;
}
