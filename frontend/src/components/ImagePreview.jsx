import React, { useState } from 'react';
import { Image as ImageIcon, X, ZoomIn, ZoomOut, ExternalLink } from 'lucide-react';

function ImagePreview({ src, alt = 'Image', className = '', showFullscreen = true }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={`flex items-center justify-center bg-slate-800 rounded-xl border border-slate-700 ${className}`}>
        <div className="text-center p-4">
          <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No image available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`relative group ${className}`}>
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover rounded-xl border border-slate-700"
        />
        {showFullscreen && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <ZoomIn className="w-5 h-5 text-white" />
            </button>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-white" />
            </a>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-lg"
          >
            <X size={24} />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export default ImagePreview;
