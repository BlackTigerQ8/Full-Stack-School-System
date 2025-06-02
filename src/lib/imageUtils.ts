// Client-side image compression
export const compressImage = (
  file: File,
  maxWidth = 800,
  quality = 0.8
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      const { width, height } = calculateDimensions(
        img.width,
        img.height,
        maxWidth
      );

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg", // Convert to JPEG for better compression
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback to original if compression fails
          }
        },
        "image/jpeg",
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

export const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number
) => {
  if (originalWidth <= maxWidth) {
    return { width: originalWidth, height: originalHeight };
  }

  const ratio = originalWidth / originalHeight;
  const width = maxWidth;
  const height = Math.round(maxWidth / ratio);

  return { width, height };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
