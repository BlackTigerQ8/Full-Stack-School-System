import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), "public/uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.split(".")[0];
    const filename = `${timestamp}-${originalName}.jpg`; // Always save as JPG for consistency

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Server-side compression with Sharp (even better quality)
    const compressedBuffer = await sharp(buffer)
      .resize(800, 800, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
        progressive: true,
        mozjpeg: true, // Better compression algorithm
      })
      .toBuffer();

    // Save compressed image
    const path = join(uploadsDir, filename);
    await writeFile(path, compressedBuffer);

    // Calculate compression ratio
    const originalSize = buffer.length;
    const compressedSize = compressedBuffer.length;
    const compressionRatio = (
      ((originalSize - compressedSize) / originalSize) *
      100
    ).toFixed(1);

    // Return the public URL and stats
    const imageUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      imageUrl,
      stats: {
        originalSize: (originalSize / 1024).toFixed(1) + " KB",
        compressedSize: (compressedSize / 1024).toFixed(1) + " KB",
        compressionRatio: compressionRatio + "%",
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
