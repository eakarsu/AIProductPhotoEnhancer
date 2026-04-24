import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadAPI } from '../services/api';

function ImageUpload({ onUpload, currentImage, className = '' }) {
  const [preview, setPreview] = useState(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  // Sync preview with currentImage prop changes (for edit mode)
  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);

  const handleFile = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload an image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const response = await uploadAPI.uploadImage(file);
      onUpload(response.data.url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const clearImage = () => {
    setPreview(null);
    onUpload('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-xl border border-slate-600"
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive
              ? 'border-sky-500 bg-sky-500/10'
              : 'border-slate-600 hover:border-slate-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
            ) : (
              <div className="p-3 bg-slate-700 rounded-xl">
                <Upload className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <div>
              <p className="text-sm text-slate-300">
                {uploading ? 'Uploading...' : 'Drop your image here or click to browse'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports JPEG, PNG, GIF, WebP (max 10MB)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
