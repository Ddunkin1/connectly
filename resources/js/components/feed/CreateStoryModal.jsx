import React, { useState, useRef, useCallback } from 'react';
import { useCreateStory } from '../../hooks/useStories';
import Modal from '../common/Modal';
import toast from 'react-hot-toast';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../utils/cropImage';

const ASPECT = 9 / 16;

const FILTER_PRESETS = [
    { id: 'none', name: 'Normal', css: 'none' },
    { id: 'vintage', name: 'Vintage', css: 'sepia(0.5) contrast(1.1) brightness(0.9)' },
    { id: 'bw', name: 'B&W', css: 'grayscale(1)' },
    { id: 'cool', name: 'Cool', css: 'saturate(0.8) hue-rotate(10deg)' },
    { id: 'warm', name: 'Warm', css: 'sepia(0.3) saturate(1.2)' },
    { id: 'sepia', name: 'Sepia', css: 'sepia(0.8)' },
    { id: 'contrast', name: 'High Contrast', css: 'contrast(1.3) saturate(1.2)' },
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
    const fileInputRef = useRef(null);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixelsArg) => {
        setCroppedAreaPixels(croppedAreaPixelsArg);
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error('File must be under 50MB');
            return;
        }
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

    const clearMedia = () => {
        if (mediaPreview && mediaType === 'video') URL.revokeObjectURL(mediaPreview);
        setMediaFile(null);
        setMediaPreview(null);
        setMediaType(null);
        setStep(1);
        setCaption('');
        setSelectedFilter('none');
    };

    const goBack = () => {
        if (step === 2) {
            clearMedia();
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
        setStep(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!mediaFile) {
            toast.error('Please select an image or video');
            return;
        }
        try {
            const formData = new FormData();
            let fileToUpload = mediaFile;

            if (mediaType === 'image' && mediaPreview && croppedAreaPixels) {
                const filterCss = FILTER_PRESETS.find((f) => f.id === selectedFilter)?.css ?? 'none';
                try {
                    const blob = await getCroppedImg(mediaPreview, croppedAreaPixels, filterCss);
                    if (blob) {
                        fileToUpload = new File([blob], mediaFile.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
                    }
                } catch (err) {
                    console.warn('Crop failed, using original:', err);
                }
            }

            formData.append('media', fileToUpload);
            if (caption.trim()) formData.append('caption', caption.trim());
            await createMutation.mutateAsync(formData);
            clearMedia();
            if (fileInputRef.current) fileInputRef.current.value = '';
            onClose();
            onSuccess?.();
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message;
            if (msg && !msg.includes('Failed to post story')) {
                toast.error(msg);
            }
        }
    };

    const handleClose = () => {
        clearMedia();
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
    };

    const filterCss = FILTER_PRESETS.find((f) => f.id === selectedFilter)?.css ?? 'none';

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={null} size="xl">
            <div className="flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-semibold text-[var(--text-primary)]">Add a story</h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        Close
                    </button>
                </div>
                <div className="border-b border-[var(--theme-border)] mb-4" />

                {step === 1 ? (
                    <div className="flex flex-col gap-4">
                        <label
                            htmlFor="create-story-file-input"
                            className="w-full rounded-2xl overflow-hidden cursor-pointer min-h-[220px] flex flex-col items-center justify-center gap-3"
                            style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)' }}
                        >
                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/50 flex items-center justify-center">
                                <span className="text-white text-3xl leading-none">+</span>
                            </div>
                            <p className="text-white font-semibold text-sm">Choose photo or video</p>
                            <p className="text-white/60 text-xs">Upload to your story</p>
                        </label>
                        <input
                            id="create-story-file-input"
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                            className="sr-only"
                        />
                        <button
                            type="button"
                            disabled
                            className="w-full rounded-full py-3 text-sm font-semibold bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed"
                        >
                            Post Story
                        </button>
                    </div>
                ) : (
                    <form id="create-story-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* 9:16 preview container */}
                        <div className="relative w-full max-w-[280px] mx-auto aspect-[9/16] rounded-2xl overflow-hidden bg-black">
                            {mediaType === 'video' ? (
                                <video
                                    src={mediaPreview}
                                    controls
                                    className="absolute inset-0 w-full h-full object-contain"
                                />
                            ) : mediaPreview ? (
                                <div className="absolute inset-0 [&_.reactEasyCrop_Container]:rounded-2xl">
                                    <Cropper
                                        image={mediaPreview}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={ASPECT}
                                        onCropChange={setCrop}
                                        onCropComplete={onCropComplete}
                                        onZoomChange={setZoom}
                                        style={{
                                            containerStyle: { backgroundColor: 'black' },
                                            cropAreaStyle: { border: '2px solid rgba(255,255,255,0.5)' },
                                        }}
                                    />
                                </div>
                            ) : null}
                        </div>

                        {/* Change media */}
                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={goBack}
                                className="border border-[var(--theme-border)] text-sm text-[var(--text-primary)] rounded-full px-4 py-1.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                Change media
                            </button>
                        </div>

                        {/* Filters — images only */}
                        {mediaType === 'image' && (
                            <div className="rounded-2xl bg-[var(--theme-surface-hover)] p-3">
                                <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Filter</p>
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                    {FILTER_PRESETS.map((f) => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => setSelectedFilter(f.id)}
                                            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                                selectedFilter === f.id
                                                    ? 'bg-[var(--theme-accent)] text-white'
                                                    : 'bg-[var(--theme-surface)] text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)] border border-[var(--theme-border)]'
                                            }`}
                                        >
                                            {f.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Zoom slider — images only */}
                        {mediaType === 'image' && (
                            <div>
                                <p className="text-xs text-[var(--text-secondary)] mb-2">Zoom</p>
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-[var(--theme-surface-hover)] accent-[var(--theme-accent)]"
                                />
                            </div>
                        )}

                        {/* Caption */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Caption (optional)
                            </label>
                            <textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Add a caption..."
                                rows={2}
                                maxLength={500}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/50 resize-none text-sm"
                            />
                        </div>

                        {/* Post Story */}
                        <button
                            type="submit"
                            disabled={!mediaFile || createMutation.isPending}
                            className="w-full rounded-full py-3 text-sm font-semibold transition-all bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {createMutation.isPending ? 'Posting...' : 'Post Story'}
                        </button>
                    </form>
                )}
            </div>
        </Modal>
    );
};

export default CreateStoryModal;
