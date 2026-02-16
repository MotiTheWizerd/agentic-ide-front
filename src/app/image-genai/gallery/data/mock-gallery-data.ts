export type AspectRatio =
  | '1:1'   // Square
  | '21:9'  // Ultra wide
  | '16:9'  // Landscape wide
  | '3:2'   // Photo landscape
  | '5:4'   // Near square landscape
  | '4:5'   // Near square portrait
  | '2:3'   // Photo portrait
  | '9:16'  // Portrait wide
  | '9:21'  // Ultra tall
  | '4:3'   // Classic landscape
  | '3:4';  // Classic portrait

export interface GalleryImage {
  id: string;
  url: string;
  width: number;
  height: number;
  aspectRatio: AspectRatio;
  title?: string;
  createdAt: number;
  tags?: string[];
}

const ASPECT_RATIOS: Array<{ ratio: AspectRatio; width: number; height: number }> = [
  { ratio: '1:1', width: 1000, height: 1000 },
  { ratio: '21:9', width: 2100, height: 900 },
  { ratio: '16:9', width: 1920, height: 1080 },
  { ratio: '3:2', width: 1500, height: 1000 },
  { ratio: '5:4', width: 1250, height: 1000 },
  { ratio: '4:5', width: 1000, height: 1250 },
  { ratio: '2:3', width: 1000, height: 1500 },
  { ratio: '9:16', width: 1080, height: 1920 },
  { ratio: '9:21', width: 900, height: 2100 },
  { ratio: '4:3', width: 1600, height: 1200 },
  { ratio: '3:4', width: 1200, height: 1600 },
];

/**
 * Calculate aspect ratio from image dimensions using GCD
 */
export function calculateAspectRatio(width: number, height: number): AspectRatio {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;

  const ratio = `${w}:${h}`;

  // Map to supported aspect ratios (with tolerance for common ratios)
  const ratioMap: Record<string, AspectRatio> = {
    '1:1': '1:1',
    '21:9': '21:9',
    '7:3': '21:9', // Approximation
    '16:9': '16:9',
    '3:2': '3:2',
    '5:4': '5:4',
    '4:5': '4:5',
    '2:3': '2:3',
    '9:16': '9:16',
    '3:7': '9:21', // Approximation
    '9:21': '9:21',
    '4:3': '4:3',
    '3:4': '3:4',
  };

  return ratioMap[ratio] || '16:9'; // Default fallback
}

/**
 * Generate mock gallery images with varied aspect ratios
 */
export function generateMockGalleryImages(count: number): GalleryImage[] {
  return Array.from({ length: count }, (_, i) => {
    const ratioData = ASPECT_RATIOS[i % ASPECT_RATIOS.length];

    return {
      id: `img-${i + 1}`,
      url: `https://picsum.photos/seed/${i + 1}/${ratioData.width}/${ratioData.height}`,
      width: ratioData.width,
      height: ratioData.height,
      aspectRatio: ratioData.ratio,
      title: `Generated Image ${i + 1}`,
      createdAt: Date.now() - (i * 3600000), // Stagger by hour
      tags: ['ai-generated', 'sample'],
    };
  });
}

// Generate 100 images for pagination demo
export const MOCK_GALLERY_DATA = generateMockGalleryImages(100);
