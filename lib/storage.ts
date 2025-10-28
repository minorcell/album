import "server-only";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { TosClient, TosServerCode, TosServerError } from "@volcengine/tos-sdk";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_GENERAL_FILE_SIZE = 512 * 1024 * 1024; // 512MB for general files

export class ConfigurationError extends Error {}

interface StorageConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  endpoint: string;
  bucket: string;
  uploadPrefix: string;
  thumbnailPrefix: string;
  filesPrefix: string;
  publicBaseUrl: string;
  presignExpiresSeconds?: number;
}

let cachedConfig: StorageConfig | null = null;
let cachedClient: TosClient | null = null;

export class UploadError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "UploadError";
    this.statusCode = statusCode;
  }
}

export async function persistImage(file: File) {
  const config = getConfig();
  const client = getClient();

  if (!ALLOWED_MIME.has(file.type)) {
    throw new UploadError("仅支持 JPG/PNG/GIF/WebP 图片");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError("文件大小超出限制 (10MB)");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const originalName = file.name;
  const extension = getExtensionFromFile(file);
  const filename = `${Date.now()}-${randomUUID()}${extension}`;
  const objectKey = buildObjectKey(filename, config);

  const originalUpload = client.putObject({
    bucket: config.bucket,
    key: objectKey,
    body: buffer,
    contentType: file.type,
  });

  const { data: thumbnailBuffer } = await sharp(buffer, { sequentialRead: true })
    .resize(400, 400, { fit: "inside", withoutEnlargement: true, fastShrinkOnLoad: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });

  const thumbnailKey = buildThumbnailKey(filename, config);

  await Promise.all([
    originalUpload,
    client.putObject({
      bucket: config.bucket,
      key: thumbnailKey,
      body: thumbnailBuffer,
      contentType: "image/webp",
    }),
  ]);

  return {
    filename,
    originalName,
  };
}

export async function deleteImageAssets(filename: string) {
  const config = getConfig();
  const client = getClient();

  const keys = [buildObjectKey(filename, config), buildThumbnailKey(filename, config)];

  await Promise.all(
    keys.map(async (key) => {
      try {
        await client.deleteObject({ bucket: config.bucket, key });
      } catch (error) {
        if (!isNotFoundError(error)) {
          throw error;
        }
      }
    }),
  );
}

export async function getOriginalBuffer(filename: string) {
  return getObjectBuffer(buildObjectKey(filename, getConfig()));
}

export function getPublicObjectUrl(filename: string) {
  const config = getConfig();
  return joinUrl(config.publicBaseUrl, buildObjectKey(filename, config));
}

export function getPublicThumbnailUrl(filename: string) {
  const config = getConfig();
  return joinUrl(config.publicBaseUrl, buildThumbnailKey(filename, config));
}

function getConfig(): StorageConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const accessKeyId = process.env.TOS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.TOS_SECRET_ACCESS_KEY;
  const region = process.env.TOS_REGION;
  const endpoint = process.env.TOS_ENDPOINT;
  const bucket = process.env.TOS_BUCKET;

  if (!accessKeyId || !secretAccessKey || !region || !endpoint || !bucket) {
    throw new ConfigurationError("TOS 存储配置缺失，请检查 AccessKey、SecretKey、Region、Endpoint 与 Bucket 设置");
  }

  const uploadPrefix = sanitizePrefix(
    process.env.TOS_UPLOAD_PREFIX ?? process.env.NEXT_PUBLIC_TOS_UPLOAD_PREFIX ?? "uploads/",
  );

  const thumbnailPrefix = sanitizePrefix(
    process.env.TOS_THUMBNAIL_PREFIX ?? process.env.NEXT_PUBLIC_TOS_THUMBNAIL_PREFIX ?? `${uploadPrefix}thumbnails/`,
  );

  const filesPrefix = sanitizePrefix(
    process.env.TOS_FILES_PREFIX ?? process.env.NEXT_PUBLIC_TOS_FILES_PREFIX ?? "files/",
  );

  const publicBaseUrl = sanitizeBaseUrl(
    process.env.NEXT_PUBLIC_TOS_BASE_URL ?? process.env.TOS_PUBLIC_BASE_URL ?? "",
  );

  if (!publicBaseUrl) {
    throw new ConfigurationError("未配置 NEXT_PUBLIC_TOS_BASE_URL 或 TOS_PUBLIC_BASE_URL，用于生成图片外链");
  }

  cachedConfig = {
    accessKeyId,
    secretAccessKey,
    region,
    endpoint,
    bucket,
    uploadPrefix,
    thumbnailPrefix,
    filesPrefix,
    publicBaseUrl,
    presignExpiresSeconds: Number(process.env.TOS_PRESIGN_EXPIRES ?? 900) || 900,
  };

  return cachedConfig;
}

function getClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getConfig();

  cachedClient = new TosClient({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.secretAccessKey,
    region: config.region,
    endpoint: config.endpoint,
    secure: true,
  });

  return cachedClient;
}

async function getObjectBuffer(key: string) {
  const config = getConfig();
  const client = getClient();

  const response = await client.getObjectV2({
    bucket: config.bucket,
    key,
    dataType: "buffer",
  });

  return response.data.content;
}

function buildObjectKey(filename: string, config: StorageConfig) {
  return `${config.uploadPrefix}${filename}`;
}

function buildThumbnailKey(filename: string, config: StorageConfig) {
  return `${config.thumbnailPrefix}thumb-${filename}`;
}

// ========= General File Upload (flat structure) =========

/**
 * Upload any file type (not just images) to object storage
 * Similar to persistImage but without thumbnail generation
 */
export async function persistFile(file: File) {
  const config = getConfig();
  const client = getClient();

  if (file.size > MAX_GENERAL_FILE_SIZE) {
    throw new UploadError(`文件大小超出限制 (${MAX_GENERAL_FILE_SIZE / 1024 / 1024}MB)`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const originalName = file.name;
  const extension = getExtensionFromFileName(file.name);
  const filename = `${Date.now()}-${randomUUID()}${extension}`;
  const objectKey = buildFileObjectKey(filename, config);

  await client.putObject({
    bucket: config.bucket,
    key: objectKey,
    body: buffer,
    contentType: file.type || "application/octet-stream",
  });

  return {
    filename,
    originalName,
  };
}

/**
 * Delete a general file from storage
 */
export async function deleteFileAsset(filename: string) {
  const config = getConfig();
  const client = getClient();
  const key = buildFileObjectKey(filename, config);

  try {
    await client.deleteObject({ bucket: config.bucket, key });
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }
  }
}

/**
 * Get public URL for a general file
 */
export function getPublicFileUrl(filename: string) {
  const config = getConfig();
  return joinUrl(config.publicBaseUrl, buildFileObjectKey(filename, config));
}

/**
 * Build object key for general files
 */
function buildFileObjectKey(filename: string, config: StorageConfig) {
  return `${config.filesPrefix}${filename}`;
}

/**
 * Get file extension from filename
 */
function getExtensionFromFileName(filename: string) {
  const match = /\.([^.]+)$/u.exec(filename);
  if (match?.[1]) {
    return `.${match[1].toLowerCase()}`;
  }
  return "";
}

// ========= 直传/直下签名 =========
export function buildFilesStorageKey(parts: { filesetId: number | string; fileId: number | string; name?: string }) {
  const config = getConfig();
  const base = `${config.filesPrefix}${parts.filesetId}/${parts.fileId}`;
  return parts.name ? `${base}-${sanitizeName(parts.name)}` : base;
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function getPresignedPutUrl(storageKey: string, mime: string, size?: number) {
  const config = getConfig();
  const client = getClient();
  const expires = config.presignExpiresSeconds ?? 900;
  const url = client.getPreSignedUrl({
    bucket: config.bucket,
    key: storageKey,
    method: "PUT",
    expires,
    response: { contentType: mime },
  });
  // 如果需要限制 content-length，可在前端 PUT 时设置；SDK 可能不支持 header 注入
  return url;
}

export async function getPresignedGetUrl(storageKey: string, attachmentName?: string) {
  const config = getConfig();
  const client = getClient();
  const expires = config.presignExpiresSeconds ?? 900;
  const url = client.getPreSignedUrl({
    bucket: config.bucket,
    key: storageKey,
    method: "GET",
    expires,
    response: {
      contentDisposition: attachmentName ? `attachment; filename="${attachmentName}"` : undefined,
    },
  });
  return url;
}

/**
 * Get a presigned GET url with inline content-disposition for general files.
 * Useful for previewing PDFs in-browser without triggering download.
 */
export async function getPresignedInlineFileUrl(filename: string, originalName?: string, mime?: string) {
  const config = getConfig();
  const client = getClient();
  const expires = config.presignExpiresSeconds ?? 900;
  const key = buildFileObjectKey(filename, config);
  const contentDisposition = originalName
    ? `inline; filename="${originalName}"`
    : "inline";
  const url = client.getPreSignedUrl({
    bucket: config.bucket,
    key,
    method: "GET",
    expires,
    response: {
      contentDisposition,
      contentType: mime || undefined,
    },
  });
  return url;
}

export async function getPresignedInlineUrl(storageKey: string) {
  const config = getConfig();
  const client = getClient();
  const expires = config.presignExpiresSeconds ?? 900;
  const url = client.getPreSignedUrl({
    bucket: config.bucket,
    key: storageKey,
    method: "GET",
    expires,
    response: {
      contentDisposition: "inline",
    },
  });
  return url;
}

/**
 * Fetch general file bytes from storage by filename (under filesPrefix).
 */
export async function getFileBuffer(filename: string) {
  const config = getConfig();
  const key = buildFileObjectKey(filename, config);
  return getObjectBuffer(key);
}

/**
 * Best-effort MIME guess from filename extension for preview responses.
 */
export function guessMimeFromFilename(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".md")) return "text/markdown";
  return "application/octet-stream";
}

function sanitizePrefix(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const withoutLeading = trimmed.replace(/^\/+/, "");
  return withoutLeading.endsWith("/") ? withoutLeading : `${withoutLeading}/`;
}

function sanitizeBaseUrl(input: string) {
  const trimmed = input.trim();
  return trimmed.replace(/\/+$/, "");
}

function joinUrl(base: string, path: string) {
  if (!base) return path;
  const normalizedPath = path.replace(/^\/+/, "");
  return `${base}/${normalizedPath}`;
}

function getExtensionFromFile(file: File) {
  if (file.name) {
    const match = /\.([^.]+)$/u.exec(file.name);
    if (match?.[1]) {
      return `.${match[1].toLowerCase()}`;
    }
  }
  return getExtensionFromMime(file.type);
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

export function isNotFoundError(error: unknown) {
  return error instanceof TosServerError && error.code === TosServerCode.NoSuchKey;
}
