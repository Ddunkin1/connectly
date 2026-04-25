import React, { useEffect, useRef } from 'react';
import { callAPI } from '../../services/api';

export default function VideoCall({ roomUrl, conversationId, onEnd }) {
    const containerRef = useRef(null);
    const callRef      = useRef(null);
    const doneRef      = useRef(false);
    const startedRef   = useRef(null); // timestamp when Daily.co joined

    // fromUser=true  → user left themselves → save call record
    // fromUser=false → externally unmounted (CallEnded received) → skip saving
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
                .on('joined-meeting', () => { startedRef.current = Date.now(); })
                .on('left-meeting',   () => finish(true));
            await callRef.current.join({ url: roomUrl });
        };
        document.head.appendChild(script);

        return () => { finish(false); script.remove(); };
    }, []);

    return <div ref={containerRef} className="fixed inset-0 z-[999]" />;
}
