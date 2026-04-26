import React, { useEffect, useRef, useState, useCallback } from 'react';

export default function ScrollIndicator({ scrollContainerRef }) {
    const trackRef  = useRef(null);
    const [thumbHeight, setThumbHeight] = useState(0);
    const [thumbTop,    setThumbTop]    = useState(0);
    const [visible,     setVisible]     = useState(false);
    const [hovered,     setHovered]     = useState(false);
    const isDragging        = useRef(false);
    const dragStartY        = useRef(0);
    const dragStartThumbTop = useRef(0);

    const update = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        if (scrollHeight <= clientHeight + 1) { setVisible(false); return; }
        setVisible(true);
        const ratio   = clientHeight / scrollHeight;
        const tHeight = Math.max(ratio * clientHeight, 36);
        const maxScroll = scrollHeight - clientHeight;
        const tTop = maxScroll > 0 ? (scrollTop / maxScroll) * (clientHeight - tHeight) : 0;
        setThumbHeight(tHeight);
        setThumbTop(tTop);
    }, [scrollContainerRef]);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        el.addEventListener('scroll', update, { passive: true });
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => { el.removeEventListener('scroll', update); ro.disconnect(); };
    }, [scrollContainerRef, update]);

    const handleTrackClick = useCallback((e) => {
        const el = scrollContainerRef.current;
        if (!el || !trackRef.current || isDragging.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const clickRatio = (e.clientY - rect.top) / rect.height;
        el.scrollTop = clickRatio * (el.scrollHeight - el.clientHeight);
    }, [scrollContainerRef]);

    const handleThumbMouseDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging.current        = true;
        dragStartY.current        = e.clientY;
        dragStartThumbTop.current = thumbTop;

        const onMove = (e) => {
            if (!isDragging.current) return;
            const el = scrollContainerRef.current;
            if (!el || !trackRef.current) return;
            const dy         = e.clientY - dragStartY.current;
            const trackH     = trackRef.current.offsetHeight;
            const maxThumbTop = trackH - thumbHeight;
            const newTop      = Math.max(0, Math.min(maxThumbTop, dragStartThumbTop.current + dy));
            el.scrollTop      = maxThumbTop > 0 ? (newTop / maxThumbTop) * (el.scrollHeight - el.clientHeight) : 0;
        };
        const onUp = () => {
            isDragging.current = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [scrollContainerRef, thumbTop, thumbHeight]);

    if (!visible) return null;

    return (
        <div
            ref={trackRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={handleTrackClick}
            className="fixed right-0 top-16 z-50 flex justify-center"
            style={{
                width:   hovered ? 10 : 6,
                height:  'calc(100vh - 4rem)',
                transition: 'width 0.2s ease',
                cursor: 'pointer',
            }}
        >
            {/* Track background — only visible on hover */}
            <div
                className="absolute inset-0 rounded-full transition-opacity duration-200"
                style={{
                    backgroundColor: 'var(--scrollbar-track, rgba(128,128,128,0.08))',
                    opacity: hovered ? 1 : 0,
                }}
            />

            {/* Thumb */}
            <div
                onMouseDown={handleThumbMouseDown}
                style={{
                    position:  'absolute',
                    top:       thumbTop,
                    left:      '50%',
                    transform: 'translateX(-50%)',
                    width:     hovered ? 8 : 4,
                    height:    thumbHeight,
                    borderRadius: 9999,
                    backgroundColor: hovered
                        ? 'var(--scrollbar-thumb-hover, rgba(128,128,128,0.55))'
                        : 'var(--scrollbar-thumb, rgba(128,128,128,0.3))',
                    transition: 'width 0.2s ease, background-color 0.15s ease',
                    cursor: 'grab',
                    userSelect: 'none',
                }}
            />
        </div>
    );
}
