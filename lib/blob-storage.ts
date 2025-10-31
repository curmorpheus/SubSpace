import { put } from "@vercel/blob";

export interface BlobUploadResult {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

/**
 * Upload a base64 image to Vercel Blob storage
 * @param dataUrl - The base64 data URL of the image
 * @param filename - The filename to use for the blob
 * @returns The blob URL
 */
export async function uploadImageToBlob(
  dataUrl: string,
  filename: string
): Promise<BlobUploadResult> {
  // Extract the base64 data and content type
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid data URL format");
  }

  const contentType = matches[1];
  const base64Data = matches[2];

  // Convert base64 to Buffer
  const buffer = Buffer.from(base64Data, "base64");

  // Upload to Vercel Blob
  const blob = await put(filename, buffer, {
    access: "public",
    contentType,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType: blob.contentType || contentType,
    size: buffer.length,
  };
}

/**
 * Upload multiple images to Vercel Blob storage
 * @param images - Array of compressed images with dataUrl
 * @param prefix - Prefix for the blob filenames
 * @returns Array of blob URLs
 */
export async function uploadImagesToBlob(
  images: Array<{ dataUrl: string; size: number; width: number; height: number }>,
  prefix: string
): Promise<Array<{ url: string; width: number; height: number }>> {
  const uploadPromises = images.map(async (image, index) => {
    const filename = `${prefix}-${index + 1}-${Date.now()}.jpg`;
    const result = await uploadImageToBlob(image.dataUrl, filename);
    return {
      url: result.url,
      width: image.width,
      height: image.height,
    };
  });

  return Promise.all(uploadPromises);
}
