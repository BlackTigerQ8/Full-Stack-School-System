"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import Image from "next/image";
import { compressImage, formatFileSize } from "@/lib/imageUtils";

interface ImageUploadProps {
  onImageSelect: (file: File, preview: string) => void;
  currentImage?: string;
  className?: string;
  maxWidth?: number;
  quality?: number;
}

const ImageUpload = ({
  onImageSelect,
  currentImage,
  className = "",
  maxWidth = 800,
  quality = 0.8,
}: ImageUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string>(currentImage || "");
  const [isCompressing, setIsCompressing] = useState(false);
  const [fileInfo, setFileInfo] = useState<{
    originalSize: string;
    compressedSize: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setIsCompressing(true);
    const originalSize = formatFileSize(file.size);

    try {
      // Compress the image
      const compressedFile = await compressImage(file, maxWidth, quality);
      const compressedSize = formatFileSize(compressedFile.size);

      setFileInfo({
        originalSize,
        compressedSize,
      });

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        onImageSelect(compressedFile, result);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Compression failed:", error);
      alert("Failed to process image");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const openFileSelector = () => {
    inputRef.current?.click();
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview("");
    setFileInfo(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200 ease-in-out
          ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
          ${preview ? "bg-gray-50" : "bg-white"}
          ${isCompressing ? "pointer-events-none opacity-75" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileSelector}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        {isCompressing ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600">Compressing image...</p>
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <div className="relative w-32 h-32 mx-auto group">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover rounded-lg"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
            {fileInfo && (
              <div className="text-xs text-gray-500 space-y-1">
                <p>Original: {fileInfo.originalSize}</p>
                <p>Compressed: {fileInfo.compressedSize}</p>
                <p className="text-green-600">✓ Optimized for storage</p>
              </div>
            )}
            <p className="text-sm text-gray-600">
              Click or drag to change image
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-gray-500">
                Any image size accepted • Auto-compressed for optimal storage
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
