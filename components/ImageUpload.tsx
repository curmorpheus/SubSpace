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
    <div className="space-y-2">
      {/* Compact Upload Button */}
      <div className="flex items-center gap-3">
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
          className={`flex-1 flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-all ${
            uploading || images.length >= maxImages
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          {/* Camera Icon */}
          <svg
            className="w-5 h-5 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>

          {/* Label Text */}
          <span className="text-sm text-gray-700 flex-1">
            {uploading ? "Processing..." : label}
          </span>

          {/* Count Badge */}
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            images.length >= maxImages
              ? "bg-orange-100 text-orange-700"
              : images.length > 0
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600"
          }`}>
            {images.length}/{maxImages}
          </span>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Compact Image Previews - Horizontal Scroll */}
      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden"
              style={{ width: "80px", height: "80px" }}
            >
              <img
                src={image.dataUrl}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                title="Remove photo"
              >
                <svg
                  className="w-3 h-3"
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
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 text-center">
                {formatFileSize(image.size)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
