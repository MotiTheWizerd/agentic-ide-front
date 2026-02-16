"use client";

import { useState } from "react";
import { Maximize2, Download, Trash2 } from "lucide-react";
import type { GalleryImage } from "../data/gallery-api";

interface GalleryImageCardProps {
  image: GalleryImage;
  onClick: () => void;
}

export function GalleryImageCard({ image, onClick }: GalleryImageCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.title || `image-${image.id}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(true);
  };

  const confirmDeleteAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement actual delete logic
    console.log('Delete image:', image.id);
    setConfirmDelete(false);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(false);
  };

  return (
    <div
      className="group relative bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden hover:border-fuchsia-700 transition-all cursor-pointer break-inside-avoid mb-4"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative">
        <img
          src={image.url}
          alt={image.title}
          className={`w-full h-auto object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />

        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-800 animate-pulse" />
        )}
      </div>

      {/* Hover overlay with metadata and actions */}
      {!confirmDelete ? (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
          {/* Metadata */}
          <div className="text-center mb-2">
            <div className="text-xs text-gray-300 font-medium">
              {image.width} × {image.height}
            </div>
            <div className="text-xs text-fuchsia-400 font-semibold mt-0.5">
              {image.aspectRatio}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={onClick}
              className="p-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 transition-colors"
              title="View full size"
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      ) : (
        /* Delete confirmation overlay */
        <div className="absolute inset-0 bg-gray-950/95 flex flex-col items-center justify-center gap-3 p-4">
          <p className="text-xs text-gray-300 text-center">
            Delete this image?
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmDeleteAction}
              className="px-3 py-1.5 text-xs rounded-md bg-red-600 hover:bg-red-500 transition-colors text-white font-medium"
            >
              Delete
            </button>
            <button
              onClick={cancelDelete}
              className="px-3 py-1.5 text-xs rounded-md border border-gray-700 hover:bg-gray-800 transition-colors text-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
