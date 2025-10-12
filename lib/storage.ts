import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

const UPLOAD_PATH = process.env.UPLOAD_PATH ?? "./public/uploads";
const THUMBNAIL_DIR = path.join(UPLOAD_PATH, "thumbnails");

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export class UploadError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "UploadError";
    this.statusCode = statusCode;
  }
}

export async function persistImage(file: File) {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new UploadError("仅支持 JPG/PNG/GIF/WebP 图片");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError("文件大小超出限制 (10MB)");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const originalName = file.name;
  const extension = path.extname(originalName)?.toLowerCase() || getExtensionFromMime(file.type);
  const filename = `${Date.now()}-${randomUUID()}${extension}`;
  const uploadDir = path.resolve(process.cwd(), UPLOAD_PATH);
  const filePath = path.join(uploadDir, filename);

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(filePath, buffer);

  const thumbnailDir = path.resolve(process.cwd(), THUMBNAIL_DIR);
  await fs.mkdir(thumbnailDir, { recursive: true });
  const thumbName = `thumb-${filename}`;
  const thumbPath = path.join(thumbnailDir, thumbName);

  await sharp(buffer)
    .resize(400, 400, { fit: "inside", withoutEnlargement: true })
    .toFile(thumbPath);

  return {
    filename,
    originalName,
    thumbnailRelPath: `thumbnails/${thumbName}`,
  };
}

function getExtensionFromMime(mime: string) {
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/gif":
      return ".gif";
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
}
