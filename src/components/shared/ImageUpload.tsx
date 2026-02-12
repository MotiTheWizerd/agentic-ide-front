import { useRef, useCallback, type ReactNode } from "react";
import { X, Maximize2, ImagePlus, ClipboardPaste } from "lucide-react";
import { useFlowStore } from "@/store/flow-store";
import { prepareImageForAPI } from "@/lib/image-utils";

interface ImageUploadProps {
  image: string;
  onImageChange: (image: string) => void;
  icon?: ReactNode;
  placeholder?: string;
  alt?: string;
  accentColor?: string; // tailwind color name e.g. "pink", "rose"
}

export function ImageUpload({
  image,
  onImageChange,
  icon,
  placeholder = "Upload Image",
  alt = "Uploaded image",
  accentColor = "pink",
}: ImageUploadProps) {
  const openLightbox = useFlowStore((s) => s.openLightbox);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const resized = await prepareImageForAPI(reader.result as string);
      onImageChange(resized);
    };
    reader.readAsDataURL(file);
  }, [onImageChange]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handlePaste = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          await processFile(new File([blob], "pasted-image", { type: imageType }));
          return;
        }
      }
    } catch {
      // Permission denied or no image — silently ignore
    }
  }, [processFile]);

  const handleKeyPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const file = Array.from(e.clipboardData.items)
        .find((item) => item.type.startsWith("image/"))
        ?.getAsFile();
      if (file) {
        e.preventDefault();
        processFile(file);
      }
    },
    [processFile]
  );

  return (
    <div onPaste={handleKeyPaste}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
      {image ? (
        <div className="relative group">
          <img
            src={image}
            alt={alt}
            className="w-full h-28 object-cover rounded-lg border border-gray-700"
          />
          <button
            onClick={() => openLightbox(image)}
            className="absolute bottom-1.5 left-1.5 p-1 rounded-md bg-gray-900/80 border border-gray-700 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onImageChange("")}
            className="absolute top-1.5 right-1.5 p-1 rounded-md bg-gray-900/80 border border-gray-700 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="flex gap-1.5">
          <button
            onClick={() => inputRef.current?.click()}
            className={`flex flex-col items-center justify-center flex-1 h-20 border border-dashed border-gray-600 rounded-lg hover:border-${accentColor}-500/50 hover:bg-${accentColor}-500/5 transition-colors cursor-pointer gap-1`}
          >
            {icon || <ImagePlus className="w-4 h-4 text-gray-500" />}
            <span className="text-[10px] text-gray-500">{placeholder}</span>
          </button>
          <button
            onClick={handlePaste}
            className={`flex flex-col items-center justify-center w-14 h-20 border border-dashed border-gray-600 rounded-lg hover:border-${accentColor}-500/50 hover:bg-${accentColor}-500/5 transition-colors cursor-pointer gap-1`}
            title="Paste image from clipboard (Ctrl+V)"
          >
            <ClipboardPaste className="w-4 h-4 text-gray-500" />
            <span className="text-[10px] text-gray-500">Paste</span>
          </button>
        </div>
      )}
    </div>
  );
}
