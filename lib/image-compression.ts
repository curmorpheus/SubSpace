/**
 * Compress and resize an image file to reduce size for email attachments
 * Target: Keep total email under 20MB
 */

export interface CompressedImage {
  dataUrl: string;
  size: number; // Size in bytes
  width: number;
  height: number;
}

export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        // Create canvas and draw resized image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with compression
        const dataUrl = canvas.toDataURL("image/jpeg", quality);

        // Calculate size (base64 string length * 0.75 to get bytes)
        const base64Length = dataUrl.split(",")[1].length;
        const sizeInBytes = Math.floor((base64Length * 3) / 4);

        resolve({
          dataUrl,
          size: sizeInBytes,
          width,
          height,
        });
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Calculate total size of all images in MB
 */
export function calculateTotalImageSize(images: CompressedImage[]): number {
  const totalBytes = images.reduce((sum, img) => sum + img.size, 0);
  return totalBytes / (1024 * 1024); // Convert to MB
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
