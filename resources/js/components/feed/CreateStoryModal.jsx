import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useCreateStory } from '../../hooks/useStories';
import toast from 'react-hot-toast';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../utils/cropImage';

const ASPECT = 9 / 16;

const FILTER_PRESETS = [
    { id: 'none',     name: 'Normal',        css: 'none' },
    { id: 'vintage',  name: 'Vintage',       css: 'sepia(0.5) contrast(1.1) brightness(0.9)' },
    { id: 'bw',       name: 'B&W',           css: 'grayscale(1)' },
    { id: 'cool',     name: 'Cool',          css: 'saturate(0.8) hue-rotate(10deg)' },
    { id: 'warm',     name: 'Warm',          css: 'sepia(0.3) saturate(1.2)' },
    { id: 'sepia',    name: 'Sepia',         css: 'sepia(0.8)' },
    { id: 'contrast', name: 'Hi-Contrast',   css: 'contrast(1.3) saturate(1.2)' },
];

const CreateStoryModal = ({ isOpen, onClose, onSuccess }) => {
    const createMutation = useCreateStory();
    const [step, setStep] = useState(1);
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaType, setMediaType] = useState(null);
    const [caption, setCaption] = useState('');
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState('none');
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef(null);

    const onCropComplete = useCallback((_, pixels) => setCroppedAreaPixels(pixels), []);

    // Lock body scroll
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Escape to close
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape') handleClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen]);

    const processFile = (file) => {
        if (!file) return;
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) { toast.error('File must be under 50MB'); return; }
        const isVideo = file.type.startsWith('video/');
        if (isVideo) {
            setMediaPreview(URL.createObjectURL(file));
        } else {
            const reader = new FileReader();
            reader.onloadend = () => setMediaPreview(reader.result);
            reader.readAsDataURL(file);
        }
        setMediaType(isVideo ? 'video' : 'image');
        setMediaFile(file);
        setStep(2);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setSelectedFilter('none');
    };

    const handleFileChange = (e) => processFile(e.target.files?.[0]);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        processFile(e.dataTransfer.files?.[0]);
    };

    const clearMedia = () => {
        if (mediaPreview && mediaType === 'video') URL.revokeObjectURL(mediaPreview);
        setMediaFile(null); setMediaPreview(null); setMediaType(null);
        setStep(1); setCaption(''); setSelectedFilter('none');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!mediaFile) { toast.error('Please select an image or video'); return; }
        try {
            const formData = new FormData();
            let fileToUpload = mediaFile;
            if (mediaType === 'image' && mediaPreview && croppedAreaPixels) {
                const filterCss = FILTER_PRESETS.find((f) => f.id === selectedFilter)?.css ?? 'none';
                try {
                    const blob = await getCroppedImg(mediaPreview, croppedAreaPixels, filterCss);
                    if (blob) fileToUpload = new File([blob], mediaFile.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
                } catch (err) {
                    console.warn('Crop failed, using original:', err);
                }
            }
            formData.append('media', fileToUpload);
            if (caption.trim()) formData.append('caption', caption.trim());
            await createMutation.mutateAsync(formData);
            handleClose();
            onSuccess?.();
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message;
            if (msg && !msg.includes('Failed to post story')) toast.error(msg);
        }
    };

    const handleClose = () => {
        clearMedia();
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
    };

    const filterCss = FILTER_PRESETS.find((f) => f.id === selectedFilter)?.css ?? 'none';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

            {/* Panel */}
            <div
                className="relative z-10 w-full max-w-3xl mx-4 rounded-2xl overflow-hidden shadow-2xl flex flex-col sm:flex-row"
                style={{ maxHeight: '92svh', background: '#0a0a0a' }}
            >
                {/* ── LEFT: preview ── */}
                <div className="relative flex-1 flex items-center justify-center bg-black min-h-[300px] sm:min-h-0">
                    {step === 1 ? (
                        /* Upload drop zone */
                        <label
                            htmlFor="create-story-file"
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={handleDrop}
                            className={`absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors ${dragging ? 'bg-white/5' : ''}`}
                        >
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${dragging ? 'scale-110 bg-white/15' : 'bg-white/10'}`}>
                                <span className="material-symbols-outlined text-4xl text-white/70">add_photo_alternate</span>
                            </div>
                            <div className="text-center px-6">
                                <p className="text-white font-semibold text-base">
                                    {dragging ? 'Drop it here' : 'Choose a photo or video'}
                                </p>
                                <p className="text-white/40 text-sm mt-1">Drag & drop or click to browse</p>
                            </div>
                            <div className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white text-sm font-medium border border-white/10">
                                Select from device
                            </div>
                        </label>
                    ) : (
                        /* 9:16 media preview */
                        <div
                            className="relative rounded-xl overflow-hidden"
                            style={{ aspectRatio: '9/16', maxHeight: '80svh', maxWidth: '100%', width: 'calc(80svh * 9 / 16)' }}
                        >
                            {mediaType === 'video' ? (
                                <video
                                    src={mediaPreview}
                                    controls
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            ) : mediaPreview ? (
                                <Cropper
                                    image={mediaPreview}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={ASPECT}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                    style={{
                                        containerStyle: { backgroundColor: 'black', borderRadius: 12 },
                                        cropAreaStyle: { border: '2px solid rgba(255,255,255,0.4)', borderRadius: 12 },
                                    }}
                                />
                            ) : null}

                            {/* Filter preview overlay */}
                            {mediaType === 'image' && selectedFilter !== 'none' && (
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{ mixBlendMode: 'normal', filter: filterCss, zIndex: 5 }}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* ── RIGHT: controls ── */}
                <div className="w-full sm:w-72 flex flex-col bg-[#111] border-t sm:border-t-0 sm:border-l border-white/[0.07]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.07]">
                        {step === 2 ? (
                            <button
                                type="button"
                                onClick={() => { clearMedia(); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors"
                            >
                                <span className="material-symbols-outlined text-base">arrow_back</span>
                                Back
                            </button>
                        ) : (
                            <span className="text-white font-semibold text-sm">New Story</span>
                        )}
                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>

                    {step === 1 ? (
                        /* Step 1: tips */
                        <div className="flex-1 flex flex-col justify-center px-5 py-6 gap-4">
                            <p className="text-white/80 font-semibold text-sm">Share a moment</p>
                            <div className="flex flex-col gap-3">
                                {[
                                    { icon: 'image', text: 'Photos & videos up to 50MB' },
                                    { icon: 'tune', text: 'Apply filters and crop to 9:16' },
                                    { icon: 'schedule', text: 'Disappears after 24 hours' },
                                ].map((item) => (
                                    <div key={item.icon} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-base text-white/60">{item.icon}</span>
                                        </div>
                                        <p className="text-white/50 text-sm">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Step 2: controls */
                        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
                            <div className="flex-1 px-4 py-4 flex flex-col gap-5">
                                {/* Filters */}
                                {mediaType === 'image' && (
                                    <div>
                                        <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">Filter</p>
                                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                                            {FILTER_PRESETS.map((f) => (
                                                <button
                                                    key={f.id}
                                                    type="button"
                                                    onClick={() => setSelectedFilter(f.id)}
                                                    className="flex flex-col items-center gap-1.5 shrink-0"
                                                >
                                                    {/* Filter thumbnail */}
                                                    <div
                                                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                                                            selectedFilter === f.id
                                                                ? 'border-white scale-105'
                                                                : 'border-transparent opacity-60 hover:opacity-100'
                                                        }`}
                                                    >
                                                        {mediaPreview ? (
                                                            <img
                                                                src={mediaPreview}
                                                                alt={f.name}
                                                                className="w-full h-full object-cover"
                                                                style={{ filter: f.css }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-white/10" style={{ filter: f.css }} />
                                                        )}
                                                    </div>
                                                    <span className={`text-[10px] font-medium ${selectedFilter === f.id ? 'text-white' : 'text-white/40'}`}>
                                                        {f.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Zoom */}
                                {mediaType === 'image' && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Zoom</p>
                                            <span className="text-white/30 text-xs">{zoom.toFixed(1)}×</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-base text-white/30">zoom_out</span>
                                            <input
                                                type="range"
                                                min={1}
                                                max={3}
                                                step={0.05}
                                                value={zoom}
                                                onChange={(e) => setZoom(Number(e.target.value))}
                                                className="flex-1 h-1 rounded-lg appearance-none cursor-pointer accent-white"
                                                style={{ background: `linear-gradient(to right, rgba(255,255,255,0.8) ${((zoom - 1) / 2) * 100}%, rgba(255,255,255,0.15) 0%)` }}
                                            />
                                            <span className="material-symbols-outlined text-base text-white/30">zoom_in</span>
                                        </div>
                                    </div>
                                )}

                                {/* Caption */}
                                <div>
                                    <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">Caption</p>
                                    <textarea
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        placeholder="Write a caption..."
                                        rows={3}
                                        maxLength={500}
                                        className="w-full px-3.5 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-white/30 resize-none text-sm leading-relaxed"
                                    />
                                    <p className="text-white/20 text-xs text-right mt-1">{caption.length}/500</p>
                                </div>
                            </div>

                            {/* Post button */}
                            <div className="px-4 pb-4 pt-2 border-t border-white/[0.07]">
                                <button
                                    type="submit"
                                    disabled={!mediaFile || createMutation.isPending}
                                    className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
                                    style={{ background: 'linear-gradient(135deg, #e91e8c, #9c27b0)' }}
                                >
                                    {createMutation.isPending ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            Posting...
                                        </span>
                                    ) : 'Post Story'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 1 post button (disabled) */}
                    {step === 1 && (
                        <div className="px-4 pb-4">
                            <label
                                htmlFor="create-story-file"
                                className="block w-full py-3 rounded-xl text-sm font-semibold text-center text-white cursor-pointer transition-all hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg, #e91e8c, #9c27b0)' }}
                            >
                                Choose media
                            </label>
                        </div>
                    )}
                </div>
            </div>

            <input
                id="create-story-file"
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="sr-only"
            />
        </div>
    );
};

export default CreateStoryModal;
