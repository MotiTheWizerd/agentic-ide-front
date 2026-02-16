import { baseApi } from "@/lib/api";
import type { AspectRatio } from "./mock-gallery-data";

export interface GalleryImageResponse {
  id: string;
  image_url: string;
  width: number;
  height: number;
  aspect_ratio: string;
  provider_id: string | null;
  model: string | null;
  flow_id: string | null;
  run_id: string | null;
  created_at: string;
  is_public: boolean;
}

export interface GalleryImage {
  id: string;
  url: string;
  width: number;
  height: number;
  aspectRatio: AspectRatio;
  title?: string;
  createdAt: number;
  providerId?: string;
  model?: string;
  flowId?: string;
}

export interface FetchImagesParams {
  userId: string;
  providerId?: string | null;
  model?: string | null;
  flowId?: string | null;
  runId?: string | null;
  isPublic?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FetchImagesResponse {
  images: GalleryImage[];
  total: number;
}

/**
 * Map backend aspect ratio string to frontend AspectRatio type
 */
function mapAspectRatio(ratio: string): AspectRatio {
  const ratioMap: Record<string, AspectRatio> = {
    '1:1': '1:1',
    '21:9': '21:9',
    '16:9': '16:9',
    '3:2': '3:2',
    '5:4': '5:4',
    '4:5': '4:5',
    '2:3': '2:3',
    '9:16': '9:16',
    '9:21': '9:21',
    '4:3': '4:3',
    '3:4': '3:4',
  };
  return ratioMap[ratio] || '16:9';
}

/**
 * Fetch user images from backend with pagination and filters
 */
export async function fetchUserImages({
  userId,
  providerId = null,
  model = null,
  flowId = null,
  runId = null,
  isPublic = false,
  limit = 50,
  offset = 0,
  sortBy = "created_at",
  sortOrder = "desc",
}: FetchImagesParams): Promise<FetchImagesResponse> {
  try {
    const response = await baseApi.post(`api/v1/images/user/${userId}/minimal`, {
      provider_id: providerId,
      model,
      flow_id: flowId,
      run_id: runId,
      is_public: isPublic,
      limit,
      offset,
      sort_by: sortBy,
      sort_order: sortOrder,
    });

    const { images: rawImages, total } = response.data;

    // Get base URL for converting relative image URLs to absolute
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:8000";

    // Transform backend format to frontend format
    const images: GalleryImage[] = rawImages.map((img: GalleryImageResponse) => {
      // Convert relative URL to absolute URL
      const absoluteUrl = img.image_url.startsWith('http')
        ? img.image_url
        : `${baseUrl}${img.image_url.startsWith('/') ? img.image_url : '/' + img.image_url}`;

      // Validate dimensions
      const width = typeof img.width === 'number' && img.width > 0 ? img.width : 1920;
      const height = typeof img.height === 'number' && img.height > 0 ? img.height : 1080;

      if (!img.width || !img.height) {
        console.warn(`Image ${img.id} missing dimensions, using defaults:`, { width: img.width, height: img.height });
      }

      return {
        id: img.id,
        url: absoluteUrl,
        width,
        height,
        aspectRatio: mapAspectRatio(img.aspect_ratio),
        title: `Image ${img.id.slice(0, 8)}`,
        createdAt: new Date(img.created_at).getTime(),
        providerId: img.provider_id || undefined,
        model: img.model || undefined,
        flowId: img.flow_id || undefined,
      };
    });

    return { images, total };
  } catch (error) {
    console.error("Failed to fetch user images:", error);
    throw error;
  }
}
