"use client";

import { useState, useRef } from "react";
import { compressImage, formatFileSize, type CompressedImage } from "@/lib/image-compression";

interface ImageUploadProps {
  label: string;
  images: CompressedImage[];
  onChange: (images: CompressedImage[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

export default function ImageUpload({
  label,
  images,
  onChange,
  maxImages = 5,
  maxSizeMB = 15,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check if adding these files would exceed max images
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} photos allowed`);
      return;
    }

    setUploading(true);
    setError("");

    try {
      const compressedImages: CompressedImage[] = [];

      for (const file of files) {
        // Check file type
        if (!file.type.startsWith("image/")) {
          setError("Only image files are allowed");
          continue;
        }

        // Compress image
        const compressed = await compressImage(file, 1200, 1200, 0.8);
        compressedImages.push(compressed);
      }

      // Check total size
      const newImages = [...images, ...compressedImages];
      const totalSizeMB = newImages.reduce((sum, img) => sum + img.size, 0) / (1024 * 1024);

      if (totalSizeMB > maxSizeMB) {
        setError(`Total image size would exceed ${maxSizeMB}MB limit`);
        setUploading(false);
        return;
      }

      onChange(newImages);
    } catch (err) {
      console.error("Error compressing images:", err);
      setError("Failed to process images. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
    setError("");
  };

  const totalSize = images.reduce((sum, img) => sum + img.size, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label} ({images.length}/{maxImages})
        </label>
        {images.length > 0 && (
          <span className="text-xs text-gray-500">
            Total: {formatFileSize(totalSize)}
          </span>
        )}
      </div>

      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id={`upload-${label.replace(/\s/g, "-")}`}
        />
        <label
          htmlFor={`upload-${label.replace(/\s/g, "-")}`}
          className={`inline-flex items-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors ${
            uploading || images.length >= maxImages
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          <svg
            className="w-5 h-5 mr-2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span className="text-sm text-gray-600">
            {uploading
              ? "Processing..."
              : images.length >= maxImages
              ? "Maximum reached"
              : "Add Photos"}
          </span>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group bg-gray-100 rounded-lg overflow-hidden"
            >
              <img
                src={image.dataUrl}
                alt={`Photo ${index + 1}`}
                className="w-full h-32 object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove photo"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1">
                {formatFileSize(image.size)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
