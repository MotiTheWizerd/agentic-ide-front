import { GalleryImageCard } from "./GalleryImageCard";
import type { GalleryImage } from "../data/gallery-api";

interface GalleryGridProps {
  images: GalleryImage[];
  onImageClick: (url: string, index: number) => void;
}

export function GalleryGrid({ images, onImageClick }: GalleryGridProps) {
  return (
    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
      {images.map((image, index) => (
        <GalleryImageCard
          key={image.id}
          image={image}
          onClick={() => onImageClick(image.url, index)}
        />
      ))}
    </div>
  );
}
