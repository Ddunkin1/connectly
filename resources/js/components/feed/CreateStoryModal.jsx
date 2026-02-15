import React, { useState, useRef, useCallback } from 'react';
import { useCreateStory } from '../../hooks/useStories';
import Modal from '../common/Modal';
import Button from '../common/Button';
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
            <div className="min-h-[70vh] flex flex-col">
                {/* Step indicators */}
                <div className="flex items-center gap-2 mb-4">
                    <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-white/20'}`} />
                    <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-white/20'}`} />
                </div>
                <div className="text-xs text-gray-400 mb-4">
                    {step === 1 ? '1. Select media' : '2. Edit'}
                </div>

                {step === 1 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-8">
                        <label
                            htmlFor="create-story-file-input"
                            className="w-full max-w-sm border-2 border-dashed border-primary/50 rounded-2xl p-16 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-4"
                        >
                            <span className="material-symbols-outlined text-5xl text-primary">add_photo_alternate</span>
                            <p className="text-white font-semibold">Click to select image or video</p>
                            <p className="text-gray-500 text-sm">Max 50MB • JPG, PNG, GIF, WebP, MP4, MOV, WebM</p>
                            <p className="text-primary/80 text-xs">Stories use 9:16 aspect ratio</p>
                        </label>
                        <input
                            id="create-story-file-input"
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                            className="sr-only"
                        />
                    </div>
                ) : (
                    <form id="create-story-form" onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                        {/* 9:16 preview container */}
                        <div className="relative w-full max-w-[280px] mx-auto aspect-[9/16] rounded-2xl overflow-hidden bg-black">
                            {mediaType === 'video' ? (
                                <>
                                    <video
                                        src={mediaPreview}
                                        controls
                                        className="absolute inset-0 w-full h-full object-contain"
                                    />
                                </>
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

                        {/* Filters - images only */}
                        {mediaType === 'image' && (
                            <div className="mt-4 p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10">
                                <p className="text-xs font-medium text-gray-400 mb-3">Filter</p>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {FILTER_PRESETS.map((f) => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => setSelectedFilter(f.id)}
                                            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                                                selectedFilter === f.id
                                                    ? 'bg-primary text-white'
                                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                            }`}
                                        >
                                            {f.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Zoom slider - images only */}
                        {mediaType === 'image' && (
                            <div className="mt-3 px-2">
                                <p className="text-xs text-gray-400 mb-2">Zoom</p>
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/20 accent-primary"
                                />
                            </div>
                        )}

                        {/* Caption */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Caption (optional)</label>
                            <textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Add a caption..."
                                rows={2}
                                maxLength={500}
                                className="w-full px-4 py-3 rounded-xl bg-black/40 backdrop-blur border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                            />
                        </div>
                    </form>
                )}

                {/* Toolbar */}
                <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-white/10">
                    <button
                        type="button"
                        onClick={step === 1 ? handleClose : goBack}
                        className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
                        aria-label={step === 1 ? 'Close' : 'Back'}
                    >
                        <span className="material-symbols-outlined">{step === 1 ? 'close' : 'arrow_back'}</span>
                    </button>
                    {step === 2 && (
                        <Button
                            type="submit"
                            form="create-story-form"
                            disabled={!mediaFile || createMutation.isPending}
                            loading={createMutation.isPending}
                            className="flex-1 max-w-[200px] min-h-[48px]"
                        >
                            Post Story
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default CreateStoryModal;
