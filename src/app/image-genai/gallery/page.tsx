"use client";

import { useState, useEffect } from "react";
import { Images, Loader2, AlertCircle } from "lucide-react";
import { GalleryGrid } from "./components/GalleryGrid";
import { GalleryPagination } from "./components/GalleryPagination";
import { ImageLightbox } from "@/components/ImageLightbox";
import { fetchUserImages, type GalleryImage } from "./data/gallery-api";
import { useUserStore } from "@/store/user-store";

const ITEMS_PER_PAGE = 30;

export default function GalleryPage() {
  const user = useUserStore((s) => s.user);
  const [currentPage, setCurrentPage] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [totalImages, setTotalImages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(totalImages / ITEMS_PER_PAGE);

  // Fetch images when page changes or component mounts
  useEffect(() => {
    if (!user?.id) return;

    const loadImages = async () => {
      setLoading(true);
      setError(null);

      try {
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        const result = await fetchUserImages({
          userId: user.id,
          limit: ITEMS_PER_PAGE,
          offset,
          sortBy: "created_at",
          sortOrder: "desc",
        });

        setImages(result.images);
        setTotalImages(result.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load images");
        console.error("Gallery fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [user?.id, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageClick = (url: string, indexInPage: number) => {
    setLightboxStartIndex(indexInPage);
    setLightboxOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-gray-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Images className="w-5 h-5 text-fuchsia-400" />
          <h1 className="text-lg font-semibold">Image Gallery</h1>
          <span className="text-xs text-gray-500">
            {loading ? "Loading..." : `${totalImages} image${totalImages !== 1 ? 's' : ''}`}
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={() => setCurrentPage(1)} />
        ) : images.length === 0 ? (
          <EmptyState />
        ) : (
          <GalleryGrid images={images} onImageClick={handleImageClick} />
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <GalleryPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <ImageLightbox
          images={images.map(img => img.url)}
          startIndex={lightboxStartIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-gray-200">
          Loading images...
        </h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Fetching your generated images from the server.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-200">
          Failed to load images
        </h2>
        <p className="text-sm text-gray-500 max-w-sm">
          {message}
        </p>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
          <Images className="w-8 h-8 text-fuchsia-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-200">
          No images yet
        </h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Your generated images will appear here. Run an Image Generator node
          in the editor to create your first image.
        </p>
      </div>
    </div>
  );
}
