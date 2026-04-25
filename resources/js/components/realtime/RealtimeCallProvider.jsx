import React, { useEffect, useState, useCallback } from 'react';
import { getEcho } from '../../echo';
import useAuthStore from '../../store/authStore';
import IncomingCall from '../messages/IncomingCall';
import VideoCall from '../messages/VideoCall';

/**
 * Global provider that:
 *  - Subscribes to the authenticated user's private call-signaling channel
 *  - Shows an IncomingCall overlay when someone calls
 *  - Shows the VideoCall overlay when the user accepts (or initiates) a call
 *
 * Mounts once near the app root so calls work regardless of which page is open.
 */
export default function RealtimeCallProvider({ children }) {
    const user = useAuthStore((s) => s.user);

    // Incoming call from someone else
    const [incomingCall, setIncomingCall] = useState(null);
    // Active call (both initiator and acceptor end up here)
    const [activeCall, setActiveCall]     = useState(null);

    // Exposed via custom event so MessageChatHeader can trigger a call
    const openCall = useCallback((callData) => {
        setIncomingCall(null);
        setActiveCall(callData);
    }, []);

    // Listen for the custom 'open-video-call' event dispatched by MessageChatHeader
    useEffect(() => {
        const handler = (e) => openCall(e.detail);
        window.addEventListener('open-video-call', handler);
        return () => window.removeEventListener('open-video-call', handler);
    }, [openCall]);

    // Subscribe to the Reverb/Pusher call-signaling channel
    useEffect(() => {
        if (!user?.id) return;

        const echo = getEcho();
        if (!echo) return;

        const channelName = `user.${user.id}`;
        const channel     = echo.private(channelName);

        channel.listen('.CallInitiated', (payload) => {
            // Don't show incoming call if we're already in a call
            setActiveCall((current) => {
                if (current) return current;
                setIncomingCall({
                    caller: {
                        id:     payload.caller_id,
                        name:   payload.caller_name,
                        avatar: payload.caller_avatar,
                    },
                    channelName:    payload.channel_name,
                    conversationId: payload.conversation_id,
                });
                return current;
            });
        });

        channel.listen('.CallEnded', (payload) => {
            // Dismiss incoming call if it matches
            setIncomingCall((inc) =>
                inc?.conversationId === payload.conversation_id ? null : inc
            );
            // End active call if it matches
            setActiveCall((act) =>
                act?.conversation_id === payload.conversation_id ? null : act
            );
        });

        return () => {
            channel.stopListening('.CallInitiated');
            channel.stopListening('.CallEnded');
            echo.leave(channelName);
        };
    }, [user?.id]);

    const handleAccept = useCallback((callData) => {
        setIncomingCall(null);
        setActiveCall(callData);
    }, []);

    const handleDecline = useCallback(() => {
        setIncomingCall(null);
    }, []);

    const handleCallEnd = useCallback(() => {
        setActiveCall(null);
    }, []);

    return (
        <>
            {children}

            {incomingCall && !activeCall && (
                <IncomingCall
                    caller={incomingCall.caller}
                    conversationId={incomingCall.conversationId}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                />
            )}

            {activeCall && (
                <VideoCall
                    roomUrl={activeCall.room_url}
                    conversationId={activeCall.conversation_id}
                    onEnd={handleCallEnd}
                />
            )}
        </>
    );
}
