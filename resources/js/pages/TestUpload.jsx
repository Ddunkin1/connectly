import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TestUpload = () => {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || '/api';

    // Test Supabase connection
    const testConnection = async () => {
        try {
            setConnectionStatus('testing');
            const response = await axios.get(`${API_URL}/test/supabase`);
            setConnectionStatus(response.data);
            if (response.data.status === 'success') {
                toast.success('Supabase connection successful!');
            } else {
                toast.error('Supabase connection failed');
            }
        } catch (error) {
            setConnectionStatus({
                status: 'error',
                message: error.response?.data?.message || 'Connection test failed',
            });
            toast.error('Failed to test connection');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        setSelectedFile(file);
        setUploadResult(null);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error('Please select a file first');
            return;
        }

        setIsUploading(true);
        setUploadResult(null);

        try {
            const formData = new FormData();
            formData.append('content', 'Test post from upload page');
            formData.append('media', selectedFile);
            formData.append('visibility', 'public');

            const token = localStorage.getItem('auth_token');
            const response = await axios.post(`${API_URL}/posts`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    // Don't set Content-Type - let browser set it with boundary
                },
            });

            setUploadResult({
                success: true,
                post: response.data.post,
                message: 'File uploaded successfully!',
            });
            toast.success('File uploaded successfully!');
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Upload failed';
            setUploadResult({
                success: false,
                error: errorMessage,
                details: error.response?.data,
            });
            toast.error(errorMessage);
        } finally {
            setIsUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Supabase Upload</h1>
                <p className="text-gray-600">Test file uploads to Supabase Storage</p>
            </div>

            {/* Connection Test */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">1. Test Supabase Connection</h2>
                <Button onClick={testConnection} disabled={connectionStatus === 'testing'}>
                    {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </Button>
                
                {connectionStatus && connectionStatus !== 'testing' && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">Connection Status:</h3>
                        <pre className="text-sm overflow-auto">
                            {JSON.stringify(connectionStatus, null, 2)}
                        </pre>
                    </div>
                )}
            </div>

            {/* File Upload Test */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4">2. Test File Upload</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Image or Video
                        </label>
                        <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#359EFF] file:text-white hover:file:bg-[#2a8eef]"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Max file size: 10MB. Supported: Images (JPEG, PNG, GIF, WebP) and Videos (MP4, MOV, AVI)
                        </p>
                    </div>

                    {selectedFile && (
                        <div>
                            <p className="text-sm text-gray-600 mb-2">
                                <strong>File:</strong> {selectedFile.name} ({formatFileSize(selectedFile.size)})
                            </p>
                            <p className="text-sm text-gray-600">
                                <strong>Type:</strong> {selectedFile.type}
                            </p>
                        </div>
                    )}

                    {preview && (
                        <div className="relative">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Preview:</h3>
                            {selectedFile?.type.startsWith('image/') ? (
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full max-w-md h-64 object-cover rounded-lg border border-gray-200"
                                />
                            ) : (
                                <video
                                    src={preview}
                                    controls
                                    className="w-full max-w-md h-64 rounded-lg border border-gray-200"
                                >
                                    Your browser does not support the video tag.
                                </video>
                            )}
                        </div>
                    )}

                    <div className="flex items-center space-x-3">
                        <Button
                            onClick={handleUpload}
                            disabled={!selectedFile || isUploading}
                            loading={isUploading}
                        >
                            {isUploading ? 'Uploading...' : 'Upload to Supabase'}
                        </Button>
                        {selectedFile && (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setSelectedFile(null);
                                    setPreview(null);
                                    setUploadResult(null);
                                }}
                            >
                                Clear
                            </Button>
                        )}
                    </div>

                    {uploadResult && (
                        <div className={`p-4 rounded-lg ${
                            uploadResult.success 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-red-50 border border-red-200'
                        }`}>
                            <h3 className={`font-semibold mb-2 ${
                                uploadResult.success ? 'text-green-800' : 'text-red-800'
                            }`}>
                                {uploadResult.success ? '✓ Upload Successful!' : '✗ Upload Failed'}
                            </h3>
                            {uploadResult.success && uploadResult.post?.media_url && (
                                <div className="space-y-2">
                                    <p className="text-sm text-green-700">
                                        <strong>Media URL:</strong>{' '}
                                        <a 
                                            href={uploadResult.post.media_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline break-all"
                                        >
                                            {uploadResult.post.media_url}
                                        </a>
                                    </p>
                                    {uploadResult.post.media_type === 'image' ? (
                                        <img
                                            src={uploadResult.post.media_url}
                                            alt="Uploaded"
                                            className="max-w-md h-64 object-cover rounded-lg border border-gray-200"
                                        />
                                    ) : (
                                        <video
                                            src={uploadResult.post.media_url}
                                            controls
                                            className="max-w-md h-64 rounded-lg border border-gray-200"
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    )}
                                </div>
                            )}
                            {!uploadResult.success && (
                                <div>
                                    <p className="text-sm text-red-700 mb-2">
                                        <strong>Error:</strong> {uploadResult.error}
                                    </p>
                                    {uploadResult.details && (
                                        <details className="text-xs text-red-600">
                                            <summary className="cursor-pointer">Error Details</summary>
                                            <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto">
                                                {JSON.stringify(uploadResult.details, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Back Button */}
            <div className="mt-6">
                <Button variant="ghost" onClick={() => navigate('/home')}>
                    ← Back to Home
                </Button>
            </div>
        </div>
    );
};

export default TestUpload;
