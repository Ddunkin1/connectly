import React from 'react';
import { encodeMediaUrl } from '../../utils/url';

/**
 * Infer MIME type from video URL for cross-browser compatibility (Edge needs explicit type).
 */
function getVideoType(url) {
    if (!url || typeof url !== 'string') return 'video/mp4';
    const lower = url.toLowerCase().split('?')[0];
    if (lower.endsWith('.mov')) return 'video/quicktime';
    if (lower.endsWith('.avi')) return 'video/x-msvideo';
    return 'video/mp4';
}

/**
 * Cross-browser video player (Chrome, Edge, Firefox, Safari).
 * - Explicit type so Edge knows format; URL encoded for spaces.
 * - background-color #000 avoids black-screen rendering issues in Edge with object-contain.
 * Backend transcodes uploads to H.264 Main + AAC MP4 for codec compatibility.
 */
const VideoPlayer = ({ src, className = '', onClick, preload = 'metadata', ...props }) => {
    const safeSrc = encodeMediaUrl(src);
    const type = getVideoType(safeSrc);
    return (
        <video
            width={640}
            height={360}
            controls
            playsInline
            preload={preload}
            className={className}
            onClick={onClick}
            {...props}
            style={{ backgroundColor: '#000', objectFit: 'contain', ...(props.style || {}) }}
        >
            <source src={safeSrc} type={type} />
            Your browser does not support the video tag.
        </video>
    );
};

export default VideoPlayer;
