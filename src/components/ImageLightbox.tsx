"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useFlowStore } from "@/store/flow-store";

/**
 * Full-screen image lightbox with paging between images.
 *
 * Can work in two modes:
 * 1. Flow editor mode (default): Images are collected from node data and execution outputs
 * 2. External mode: Images are provided via props (for gallery, etc.)
 */
interface ImageLightboxProps {
  images?: string[];      // Optional external images array
  startIndex?: number;    // Optional starting index (for external mode)
  onClose?: () => void;   // Optional external close handler
}

export function ImageLightbox({ images: externalImages, startIndex = 0, onClose: externalOnClose }: ImageLightboxProps = {}) {
  // Flow editor mode state
  const lightboxImage = useFlowStore((s) => s.lightboxImage);
  const closeLightbox = useFlowStore((s) => s.closeLightbox);
  const openLightbox = useFlowStore((s) => s.openLightbox);

  // External mode state
  const [externalIndex, setExternalIndex] = useState(startIndex);

  // Determine which mode we're in
  const isExternalMode = !!externalImages;

  // Select stable references from the store (flow editor mode only)
  const nodes = useFlowStore((s) => s.flows[s.activeFlowId]?.nodes);
  const nodeOutputs = useFlowStore((s) => s.flows[s.activeFlowId]?.execution.nodeOutputs);

  // Derive image list from nodes + outputs (flow editor mode only)
  const flowImages = useMemo(() => {
    if (isExternalMode || !nodes) return [];
    const images: string[] = [];
    const seen = new Set<string>();

    const addImage = (img: string) => {
      const key = img.slice(0, 64);
      if (!seen.has(key)) {
        seen.add(key);
        images.push(img);
      }
    };

    for (const node of nodes) {
      const img = node.data?.image as string;
      if (img) addImage(img);
    }

    if (nodeOutputs) {
      for (const output of Object.values(nodeOutputs)) {
        if (output?.image) addImage(output.image);
      }
    }

    return images;
  }, [isExternalMode, nodes, nodeOutputs]);

  // Use external images or flow images
  const allImages = isExternalMode ? externalImages : flowImages;

  // Calculate current index and image
  const currentIndex = useMemo(() => {
    if (isExternalMode) return externalIndex;

    if (!lightboxImage) return -1;
    const key = lightboxImage.slice(0, 64);
    return allImages.findIndex((img) => img.slice(0, 64) === key);
  }, [isExternalMode, externalIndex, lightboxImage, allImages]);

  const currentImage = isExternalMode
    ? allImages[externalIndex]
    : lightboxImage;

  const navigate = useCallback(
    (delta: number) => {
      if (allImages.length === 0) return;
      const next = (currentIndex + delta + allImages.length) % allImages.length;

      if (isExternalMode) {
        setExternalIndex(next);
      } else {
        openLightbox(allImages[next]);
      }
    },
    [isExternalMode, currentIndex, allImages, openLightbox]
  );

  const handleClose = useCallback(() => {
    if (isExternalMode && externalOnClose) {
      externalOnClose();
    } else {
      closeLightbox();
    }
  }, [isExternalMode, externalOnClose, closeLightbox]);

  // Keyboard navigation
  useEffect(() => {
    if (!currentImage) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      else if (e.key === "ArrowLeft") navigate(-1);
      else if (e.key === "ArrowRight") navigate(1);
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [currentImage, handleClose, navigate]);

  if (!currentImage) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={handleClose}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Counter */}
      {allImages.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white/70 text-sm font-medium">
          {currentIndex + 1} / {allImages.length}
        </div>
      )}

      {/* Previous button */}
      {allImages.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(-1);
          }}
          className="absolute left-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Image */}
      <img
        src={currentImage}
        alt="Lightbox view"
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next button */}
      {allImages.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(1);
          }}
          className="absolute right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
