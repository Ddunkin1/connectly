import React, { useEffect, useState, useCallback } from 'react';
import { getEcho } from '../../echo';
import useAuthStore from '../../store/authStore';
import { callAPI } from '../../services/api';
import { useHeartbeat } from '../../hooks/useHeartbeat';
import CallingScreen from '../messages/CallingScreen';
import IncomingCall from '../messages/IncomingCall';
import VideoCall from '../messages/VideoCall';

export default function RealtimeCallProvider({ children }) {
    const user = useAuthStore((s) => s.user);
    useHeartbeat();

    const [callingCall,  setCallingCall]  = useState(null); // caller waiting for answer
    const [incomingCall, setIncomingCall] = useState(null); // callee sees this
    const [activeCall,   setActiveCall]   = useState(null); // both sides in call

    // Listen for 'start-calling' dispatched by MessageChatHeader
    useEffect(() => {
        const handler = (e) => {
            setIncomingCall(null);
            setActiveCall(null);
            setCallingCall(e.detail);
        };
        window.addEventListener('start-calling', handler);
        return () => window.removeEventListener('start-calling', handler);
    }, []);

    // Subscribe to Reverb call-signaling channel
    useEffect(() => {
        if (!user?.id) return;

        const echo = getEcho();
        if (!echo) return;

        const channelName = `user.${user.id}`;
        const channel     = echo.private(channelName);

        channel.listen('.CallInitiated', (payload) => {
            setActiveCall((current) => {
                if (current) return current;
                setCallingCall((calling) => {
                    if (calling) return calling;
                    setIncomingCall({
                        caller: {
                            id:     payload.caller_id,
                            name:   payload.caller_name,
                            avatar: payload.caller_avatar,
                        },
                        channelName:    payload.channel_name,
                        conversationId: payload.conversation_id,
                    });
                    return calling;
                });
                return current;
            });
        });

        channel.listen('.CallAccepted', async (payload) => {
            try {
                const res = await callAPI.generateToken(payload.conversation_id);
                setCallingCall(null);
                setActiveCall({
                    room_url:        res.data.room_url,
                    room_name:       res.data.room_name,
                    conversation_id: payload.conversation_id,
                });
            } catch {}
        });

        channel.listen('.CallEnded', (payload) => {
            setIncomingCall((inc) =>
                inc?.conversationId === payload.conversation_id ? null : inc
            );
            setActiveCall((act) =>
                act?.conversation_id === payload.conversation_id ? null : act
            );
            setCallingCall((calling) =>
                calling?.conversation_id === payload.conversation_id ? null : calling
            );
        });

        return () => {
            channel.stopListening('.CallInitiated');
            channel.stopListening('.CallAccepted');
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

    const handleCallingCancel = useCallback(() => {
        setCallingCall(null);
    }, []);

    const handleCallEnd = useCallback(() => {
        setActiveCall(null);
    }, []);

    return (
        <>
            {children}

            {callingCall && !activeCall && (
                <CallingScreen
                    callee={callingCall.callee}
                    conversationId={callingCall.conversation_id}
                    onCancel={handleCallingCancel}
                />
            )}

            {incomingCall && !activeCall && !callingCall && (
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
